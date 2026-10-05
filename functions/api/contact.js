import { sendEmail } from '../lib/email.js';

// CRM Sync (Airtable)
async function syncToAirtable(env, lead) {
  if (!env.AIRTABLE_API_KEY || !env.AIRTABLE_BASE_ID) return;
  const tableName = env.AIRTABLE_TABLE_NAME || 'Leads';
  try {
    const res = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${tableName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          Name: lead.name,
          Email: lead.email || '',
          Phone: lead.phone,
          Business: lead.business || '',
          Budget: lead.budget || ''
        }
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Airtable] Sync warning:', res.status, errText);
    } else {
      console.log('[Airtable] Successfully synced lead:', lead.name);
    }
  } catch (err) {
    console.warn('[Airtable] Error syncing lead:', err.message);
  }
}

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
    const email    = String(data.email    || '').trim().slice(0, 100);
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

    const db = env.ANALYTICS_DB || env.DB;
    if (!db) {
      console.error('D1 database binding not found');
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

    let result = null;
    try {
      result = await env.DB.prepare(
        `INSERT INTO contacts (name, phone, business, budget, message, ip, user_agent, utm_source, utm_medium, utm_campaign, utm_content, lead_source, meta_lead_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(name, phone, business, budget, message, ip, userAgent, utm_source, utm_medium, utm_campaign, utm_content, lead_source, meta_lead_id).run();
    } catch (dbErr) {
      console.warn('contacts insert error, proceeding with leads table:', dbErr.message);
    }

    // Dual-write to leads table in ANALYTICS_DB / DB for CRM visibility
    let leadRowId = null;
    const nowIso = new Date().toISOString();
    const cf = request.cf || {};
    const visitorCountry = cf.country || 'Unknown';
    const visitorCity = cf.city || 'Unknown';

    try {
      const leadInsert = await db.prepare(`
        INSERT INTO leads (name, email, phone, message, source, created_at, status, country, city)
        VALUES (?, ?, ?, ?, 'contact_form', ?, 'new', ?, ?)
      `).bind(
        name,
        email || null,
        phone,
        `[نشاط: ${business || 'غير محدد'} | ميزانية: ${budget || 'غير محدد'}]\n${message || ''}`.trim(),
        nowIso,
        visitorCountry,
        visitorCity
      ).run();
      leadRowId = leadInsert.meta?.last_row_id || null;
    } catch (leadDbErr) {
      console.warn('Leads dual-write warning:', leadDbErr.message);
    }

    // -------------------------------------------------------------
    // 1. High-Priority Telegram Alert
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
          (email ? `✉️ <b>الإيميل:</b> ${email}\n` : '') +
          `🏢 <b>النشاط:</b> ${business || 'غير محدد'}\n` +
          `💰 <b>الميزانية:</b> ${budget || 'غير محدد'}\n` +
          `📝 <b>الرسالة:</b> ${message || 'لا توجد'}\n` +
          `📍 <b>الموقع:</b> ${visitorCity}, ${visitorCountry}\n\n` +
          (waLink ? `💬 <a href="${waLink}">تواصل عبر واتساب مباشرة</a>\n` : '');

        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: tgMessage,
            parse_mode: 'HTML'
          })
        });
      } catch (tgErr) {
        console.warn('Telegram notification failed:', tgErr.message);
      }
    }

    // -------------------------------------------------------------
    // 2. Email Marketing & Welcome Email (Resend)
    // -------------------------------------------------------------
    if (email) {
      try {
        await sendEmail(env, {
          to: email,
          subject: 'أهلاً بك في PR Agency 👋',
          html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
              <h2>أهلاً بك يا ${name} في PR Agency 👋</h2>
              <p>شكراً لتواصلك معنا. استلمنا طلبك وسيقوم فريقنا بمراجعته والتواصل معك خلال 24 ساعة.</p>
              <p>يسعدنا دائماً أن نكون شريكك الإبداعي للنمو ومضاعفة المبيعات.</p>
            </div>
          `
        });

        // Queue drip sequence in D1
        const day3Iso = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        const day7Iso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        await db.prepare(`
          INSERT INTO email_queue (lead_id, email, template, send_at, status)
          VALUES (?, ?, 'case_study', ?, 'pending')
        `).bind(leadRowId, email, day3Iso).run();

        await db.prepare(`
          INSERT INTO email_queue (lead_id, email, template, send_at, status)
          VALUES (?, ?, 'offer', ?, 'pending')
        `).bind(leadRowId, email, day7Iso).run();

      } catch (emQueueErr) {
        console.warn('Email queue error:', emQueueErr.message);
      }
    }

    // -------------------------------------------------------------
    // 3. CRM Sync (Airtable)
    // -------------------------------------------------------------
    await syncToAirtable(env, {
      name,
      email,
      phone,
      business,
      budget
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم استلام رسالتك بنجاح',
        id: leadRowId || result?.meta?.last_row_id || null,
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
