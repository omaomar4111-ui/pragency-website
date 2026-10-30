function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanPhoneForWa(p) {
  if (!p) return '';
  let num = p.replace(/[^0-9]/g, '');
  if (num.startsWith('01')) num = '20' + num.substring(1);
  else if (!num.startsWith('20') && num.length === 10) num = '20' + num;
  return num;
}

// -------------------------------------------------------------
// GET /api/leads/webhook — Meta Webhook Verification
// -------------------------------------------------------------
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const expectedToken = env.META_WEBHOOK_TOKEN || 'pr_agency_webhook_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return new Response('Forbidden: verify_token mismatch', {
    status: 403,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

// -------------------------------------------------------------
// POST /api/leads/webhook — Meta Lead Ads Ingestion
// -------------------------------------------------------------
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    console.error('D1 binding DB not found in webhook');
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const pageAccessToken = env.PAGE_ACCESS_TOKEN || env.META_PAGE_ACCESS_TOKEN || '';

    const entries = Array.isArray(payload.entry) ? payload.entry : [];
    let processedCount = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        if (change.field !== 'leadgen' && change.field !== 'leadgen_feed') continue;

        const val = change.value || {};
        const leadgenId = String(val.leadgen_id || val.id || '').trim();
        const formId = String(val.form_id || '').trim();
        const adId = String(val.ad_id || '').trim();

        if (!leadgenId) continue;

        let name = '';
        let phone = '';
        let business = '';
        let budget = '';
        let campaignName = 'meta_lead_ads';

        // 1. Fetch lead details from Meta Graph API if access token is available
        if (pageAccessToken) {
          try {
            const graphUrl = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${encodeURIComponent(pageAccessToken)}`;
            const graphRes = await fetch(graphUrl);
            if (graphRes.ok) {
              const leadData = await graphRes.json();
              const fields = Array.isArray(leadData.field_data) ? leadData.field_data : [];

              for (const f of fields) {
                const key = String(f.name || '').toLowerCase();
                const valStr = Array.isArray(f.values) ? f.values[0] || '' : String(f.values || '');

                if (key.includes('name') || key.includes('اسم')) {
                  name = valStr;
                } else if (key.includes('phone') || key.includes('موبايل') || key.includes('هاتف')) {
                  phone = valStr;
                } else if (key.includes('business') || key.includes('company') || key.includes('نشاط')) {
                  business = valStr;
                } else if (key.includes('budget') || key.includes('ميزانية')) {
                  budget = valStr;
                }
              }

              if (leadData.campaign_name) campaignName = leadData.campaign_name;
            } else {
              console.warn('Meta Graph API fetch failed:', graphRes.status, await graphRes.text());
            }
          } catch (graphErr) {
            console.error('Error fetching lead from Meta Graph API:', graphErr);
          }
        }

        // Fallback or direct testing payload mapping
        if (!name && val.name) name = val.name;
        if (!phone && val.phone) phone = val.phone;
        if (!business && val.business) business = val.business;
        if (!budget && val.budget) budget = val.budget;
        if (!name) name = `Meta Lead #${leadgenId.slice(-6)}`;
        if (!phone) phone = '—';

        const message = `تم استلام هذا العميل تلقائيًا عبر إعلانات Meta Lead Ads. (Lead ID: ${leadgenId}, Form: ${formId || 'N/A'}, Ad: ${adId || 'N/A'})`;
        const ip = 'meta_webhook';
        const userAgent = 'Meta Lead Ads Webhook';
        const leadSource = 'meta_lead_ads';
        const utmSource = 'meta';
        const utmMedium = 'lead_ads';

        // 2. Insert into Cloudflare D1
        try {
          await env.DB.prepare(
            `INSERT INTO contacts (name, phone, business, budget, message, ip, user_agent, utm_source, utm_medium, utm_campaign, utm_content, lead_source, meta_lead_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            name,
            phone,
            business || 'غير محدد',
            budget || 'غير محدد',
            message,
            ip,
            userAgent,
            utmSource,
            utmMedium,
            campaignName,
            formId ? `form_${formId}` : '',
            leadSource,
            leadgenId
          ).run();
          processedCount++;
        } catch (dbErr) {
          console.error('D1 insert failed for lead:', leadgenId, dbErr);
        }

        // 3. Send email notification via Resend
        try {
          const RESEND_KEY = env.RESEND_API_KEY;
          if (RESEND_KEY && phone && phone !== '—') {
            const waNumber = cleanPhoneForWa(phone);
            const waLink = waNumber ? `https://wa.me/${waNumber}` : 'https://wa.me/';
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
    .brand { font-size: 26px; font-weight: 800; color: #ffffff; margin: 0; }
    .badge { display: inline-block; background: rgba(139, 92, 246, 0.2); color: #C4B5FD; border: 1px solid #8B5CF6; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 10px; }
    .content { padding: 28px 24px; }
    .intro { font-size: 16px; color: #d1d5db; margin-bottom: 24px; line-height: 1.6; }
    .table-box { width: 100%; border-collapse: collapse; margin-bottom: 28px; background: #100018; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.20); overflow: hidden; }
    .table-box td { padding: 14px 16px; font-size: 15px; border-bottom: 1px solid rgba(139, 92, 246, 0.12); text-align: right; }
    .table-box tr:last-child td { border-bottom: none; }
    .label { color: #9ca3af; font-weight: 600; width: 32%; }
    .val { color: #ffffff; font-weight: 500; }
    .btn-wrap { text-align: center; margin: 30px 0 10px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7C3AED, #8B5CF6); color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-size: 16px; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4); }
    .footer { background: #0A0014; padding: 20px; text-align: center; font-size: 12px; color: #52525b; border-top: 1px solid rgba(139, 92, 246, 0.15); }
  </style>
</head>
<body dir="rtl">
  <div style="padding: 20px 10px; background-color: #0A0014;">
    <div class="wrapper">
      <div class="header">
        <h1 class="brand">PR Agency</h1>
        <div class="badge">📱 عميل جديد من إعلانات Meta Lead Ads</div>
      </div>
      <div class="content">
        <p class="intro">تم استلام بيانات عميل جديد فوريًا عبر حملة Meta Ads:</p>
        <table class="table-box" cellpadding="0" cellspacing="0">
          <tr><td class="label">الاسم:</td><td class="val"><strong>${escapeHtml(name)}</strong></td></tr>
          <tr><td class="label">الموبايل:</td><td class="val" dir="ltr" style="text-align:right;">${escapeHtml(phone)}</td></tr>
          <tr><td class="label">النشاط:</td><td class="val">${escapeHtml(business) || 'غير محدد'}</td></tr>
          <tr><td class="label">الميزانية:</td><td class="val">${escapeHtml(budget) || 'غير محدد'}</td></tr>
          <tr><td class="label">الحملة:</td><td class="val">${escapeHtml(campaignName)}</td></tr>
          <tr><td class="label">Lead ID:</td><td class="val" style="font-family:monospace">${escapeHtml(leadgenId)}</td></tr>
        </table>
        <div class="btn-wrap">
          <a href="${waLink}" target="_blank" class="btn">💬 تواصل مع العميل عبر واتساب</a>
        </div>
        <p style="font-size:13px;color:#6b7280;text-align:center;margin-top:20px;">وقت الوصول: ${egyptTime}</p>
      </div>
      <div class="footer">PR Agency CRM Auto Notification</div>
    </div>
  </div>
</body>
</html>`;

            const targetEmail = env.ADMIN_NOTIFICATION_EMAIL || 'admin@pragency.eg';
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'PR Agency <onboarding@resend.dev>',
                to: targetEmail,
                reply_to: targetEmail,
                subject: `📱 عميل جديد من Meta Ads: ${name}`,
                html: emailHtml,
              }),
            });
          }
        } catch (mailErr) {
          console.error('Failed to send Resend email for Meta lead:', mailErr);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    console.error('Webhook error:', err);
    // Always return 200 to Meta to acknowledge receipt
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
