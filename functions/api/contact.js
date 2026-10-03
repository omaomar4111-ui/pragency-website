export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };

  try {
    const contentType = request.headers.get('content-type') || '';
    let data = {};

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    }

    const name     = String(data.name     || '').trim().slice(0, 100);
    const phone    = String(data.phone    || '').trim().slice(0, 30);
    const business = String(data.business || '').trim().slice(0, 100);
    const budget   = String(data.budget   || '').trim().slice(0, 50);
    const message  = String(data.message  || '').trim().slice(0, 2000);

    const errors = [];
    if (!name || name.length < 2)   errors.push('الاسم مطلوب (حرفين على الأقل)');
    if (!phone || phone.length < 8) errors.push('رقم الموبايل غير صحيح');

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ success: false, errors }),
        { status: 400, headers: corsHeaders }
      );
    }

    const ip = request.headers.get('CF-Connecting-IP')
            || request.headers.get('X-Forwarded-For')
            || 'unknown';
    const userAgent = (request.headers.get('User-Agent') || '').slice(0, 500);

    if (!env.DB) {
      console.error('D1 binding "DB" not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const url = new URL(request.url);
    const utm_source   = String(data.utm_source   || url.searchParams.get('utm_source')   || '').trim().slice(0, 100);
    const utm_medium   = String(data.utm_medium   || url.searchParams.get('utm_medium')   || '').trim().slice(0, 100);
    const utm_campaign = String(data.utm_campaign || url.searchParams.get('utm_campaign') || '').trim().slice(0, 100);
    const utm_content  = String(data.utm_content  || url.searchParams.get('utm_content')  || '').trim().slice(0, 100);
    const lead_source  = String(data.lead_source  || url.searchParams.get('lead_source')  || 'website').trim().slice(0, 50);
    const meta_lead_id = String(data.meta_lead_id || url.searchParams.get('meta_lead_id') || '').trim().slice(0, 100);

    const result = await env.DB.prepare(
      `INSERT INTO contacts (name, phone, business, budget, message, ip, user_agent, utm_source, utm_medium, utm_campaign, utm_content, lead_source, meta_lead_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(name, phone, business, budget, message, ip, userAgent, utm_source, utm_medium, utm_campaign, utm_content, lead_source, meta_lead_id).run();

    // Dual-write to leads table in ANALYTICS_DB / DB for CRM visibility
    const analyticsDb = env.ANALYTICS_DB || env.DB;
    if (analyticsDb) {
      try {
        const nowIso = new Date().toISOString();
        const cf = request.cf || {};
        const visitorCountry = cf.country || 'Unknown';
        const visitorCity = cf.city || 'Unknown';
        await analyticsDb.prepare(`
          INSERT INTO leads (name, phone, message, source, created_at, status, country, city)
          VALUES (?, ?, ?, 'contact_form', ?, 'new', ?, ?)
        `).bind(
          name,
          phone,
          `[نشاط: ${business || 'غير محدد'} | ميزانية: ${budget || 'غير محدد'}]\n${message || ''}`.trim(),
          nowIso,
          visitorCountry,
          visitorCity
        ).run();
      } catch (leadDbErr) {
        console.warn('Leads dual-write warning:', leadDbErr.message);
      }
    }

    // -------------------------------------------------------------
    // 1. High-Priority Telegram Alert (Instant Real-time Dispatch)
    // -------------------------------------------------------------
    const tgToken = env.TELEGRAM_BOT_TOKEN;
    const tgChatId = env.TELEGRAM_CHAT_ID;

    function cleanPhoneForWa(p) {
      if (!p) return '';
      let num = p.replace(/[^0-9]/g, '');
      if (num.startsWith('01')) num = '20' + num.substring(1);
      else if (!num.startsWith('20') && num.length === 10) num = '20' + num;
      return num;
    }

    const waNumber = cleanPhoneForWa(phone);
    const waLink = waNumber ? `https://wa.me/${waNumber}` : '';

    if (tgToken && tgChatId) {
      try {
        const tgMessage =
          `🚨 <b>استمارة تسجيل جديدة (Contact Form)!</b>\n\n` +
          `👤 <b>الاسم:</b> ${name}\n` +
          `📱 <b>الموبايل:</b> <code>${phone}</code>\n` +
          `💼 <b>نوع النشاط:</b> ${business || 'غير محدد'}\n` +
          `💰 <b>الميزانية:</b> ${budget || 'غير محدد'}\n` +
          (message ? `📝 <b>الرسالة:</b> ${message}\n` : '') +
          (utm_campaign ? `🎯 <b>الحملة:</b> ${utm_campaign} (${utm_source || 'direct'})\n` : '') +
          `🌐 <b>IP:</b> <code>${ip}</code>\n` +
          (waLink ? `\n👉 <a href="${waLink}">فتح محادثة واتساب فورية</a>` : '');

        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: tgMessage,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        });
      } catch (tgErr) {
        console.error('Telegram notification failed:', tgErr.message);
      }
    }

    // -------------------------------------------------------------
    // 2. Send email notification via Resend
    // -------------------------------------------------------------
    try {
      const RESEND_KEY = env.RESEND_API_KEY;
      if (!RESEND_KEY) {
        console.warn('RESEND_API_KEY not configured in env, skipping Resend dispatch');
      } else {
        function escapeHtml(str) {
          if (!str) return '';
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        }

        const egyptTime = new Intl.DateTimeFormat('ar-EG', {
          timeZone: 'Africa/Cairo',
          dateStyle: 'full',
          timeStyle: 'medium',
        }).format(new Date());

        const emailHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background-color: #0A0014; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #14001F; border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1A0827 0%, #0A0014 100%); padding: 30px 24px; text-align: center; border-bottom: 2px solid #8B5CF6; }
    .brand { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; }
    .badge { display: inline-block; background: rgba(139, 92, 246, 0.15); color: #C4B5FD; border: 1px solid #8B5CF6; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 10px; }
    .content { padding: 28px 24px; }
    .intro { font-size: 16px; color: #d1d5db; margin-bottom: 24px; line-height: 1.6; }
    .table-box { width: 100%; border-collapse: collapse; margin-bottom: 28px; background: #100018; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.20); overflow: hidden; }
    .table-box td { padding: 14px 16px; font-size: 15px; border-bottom: 1px solid rgba(139, 92, 246, 0.12); text-align: right; }
    .table-box tr:last-child td { border-bottom: none; }
    .label { color: #9ca3af; font-weight: 600; width: 32%; }
    .val { color: #ffffff; font-weight: 500; }
    .val-highlight { color: #fbbf24; font-weight: 700; }
    .btn-wrap { text-align: center; margin: 30px 0 10px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7C3AED, #8B5CF6); color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-size: 16px; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4); }
    .meta { font-size: 13px; color: #6b7280; text-align: center; margin-top: 20px; }
    .footer { background: #0A0014; padding: 20px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid rgba(139, 92, 246, 0.15); }
  </style>
</head>
<body dir="rtl">
  <div style="padding: 20px 10px; background-color: #0A0014;">
    <div class="wrapper">
      <div class="header">
        <h1 class="brand">PR Agency</h1>
        <div class="badge">🔔 رسالة جديدة من الموقع</div>
      </div>
      <div class="content">
        <p class="intro">وصلت رسالة تواصل جديدة عبر استمارة الموقع الإلكتروني، وفيما يلي تفاصيل العميل:</p>
        <table class="table-box" cellpadding="0" cellspacing="0">
          <tr>
            <td class="label">الاسم:</td>
            <td class="val"><strong>${escapeHtml(name)}</strong></td>
          </tr>
          <tr>
            <td class="label">رقم الموبايل:</td>
            <td class="val" dir="ltr" style="text-align:right;">${escapeHtml(phone)}</td>
          </tr>
          <tr>
            <td class="label">نوع النشاط:</td>
            <td class="val">${escapeHtml(business) || 'غير محدد'}</td>
          </tr>
          <tr>
            <td class="label">الميزانية المتوقعة:</td>
            <td class="val val-highlight">${escapeHtml(budget) || 'غير محدد'}</td>
          </tr>
          <tr>
            <td class="label" style="vertical-align:top;">نص الرسالة:</td>
            <td class="val" style="line-height:1.6; white-space:pre-wrap;">${escapeHtml(message) || '—'}</td>
          </tr>
          ${utm_campaign ? `
          <tr>
            <td class="label">الحملة الإعلانية:</td>
            <td class="val">${escapeHtml(utm_campaign)} (${escapeHtml(utm_source || 'direct')})</td>
          </tr>` : ''}
          ${lead_source && lead_source !== 'website' ? `
          <tr>
            <td class="label">المصدر:</td>
            <td class="val">${escapeHtml(lead_source)}</td>
          </tr>` : ''}
        </table>

        ${waLink ? `
        <div class="btn-wrap">
          <a href="${waLink}" target="_blank" class="btn">
            💬 تواصل مع العميل عبر واتساب
          </a>
        </div>` : ''}

        <p class="meta">وقت الإرسال: ${egyptTime} (بتوقيت مصر)</p>
      </div>
      <div class="footer">
        © 2026 PR Agency. جميع الحقوق محفوظة.<br>
        هذا الإشعار تلقائي من نظام إدارة العملاء في PR Agency.
      </div>
    </div>
  </div>
</body>
</html>`;

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PR Agency <onboarding@resend.dev>',
            to: 'omaomar4111@gmail.com',
            reply_to: 'omaomar4111@gmail.com',
            subject: `🔔 رسالة جديدة من ${name}`,
            html: emailHtml,
          }),
        });

        if (emailRes.ok) {
          const emailJson = await emailRes.json();
          console.log('Resend email sent successfully:', emailJson);
        } else {
          const errText = await emailRes.text();
          console.error('Resend API returned error:', emailRes.status, errText);
        }
      }
    } catch (emailErr) {
      console.error('Failed to send Resend email notification:', emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم استلام رسالتك بنجاح',
        id: result.meta?.last_row_id || null,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('Contact form error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'حدث خطأ في الخادم، حاول مرة أخرى',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
