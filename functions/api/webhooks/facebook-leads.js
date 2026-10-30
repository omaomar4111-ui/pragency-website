// functions/api/webhooks/facebook-leads.js
// Facebook Lead Ads Real-Time Webhook with Round-Robin Sales Rep Auto-Assignment
import { logSystemAction } from '../../lib/audit.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

// ── 1. GET: Handle Meta Webhook Hub Challenge ────────────────────────────────
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const EXPECTED_VERIFY_TOKEN = env.FB_VERIFY_TOKEN || 'pragency_meta_lead_ads_secret_2026';

  if (mode === 'subscribe' && token === EXPECTED_VERIFY_TOKEN) {
    console.log('[Meta Webhook] Verification successful');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return new Response('Verification failed or invalid token', { status: 403 });
}

// ── 2. POST: Ingest Facebook Lead, Round-Robin Assign, & Trigger Workflows ───
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) return jsonResponse({ success: false, error: 'Database unavailable' }, 500);

  try {
    const body = await request.json().catch(() => ({}));
    console.log('[Meta Webhook] Inbound Payload:', JSON.stringify(body));

    let fullName = 'عميل فيسبوك محتمل';
    let email = 'lead@facebook.com';
    let phone = '01000000000';
    let campaignName = 'حملة فيسبوك الممولة (Facebook Lead Ads)';
    let rawLeadId = 'fb_lead_' + Date.now();

    // Support direct JSON testing as well as standard Meta webhook wrapper
    if (body.full_name || body.name) {
      fullName = body.full_name || body.name;
      email = body.email || email;
      phone = body.phone || phone;
      campaignName = body.campaign_name || campaignName;
      rawLeadId = body.lead_id || rawLeadId;
    } else if (body.entry && Array.isArray(body.entry)) {
      // Standard Meta Graph Webhook format
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const ch of entry.changes) {
            if (ch.value) {
              const val = ch.value;
              rawLeadId = val.leadgen_id || rawLeadId;
              if (val.form_data) {
                fullName = val.form_data.full_name || val.form_data.name || fullName;
                email = val.form_data.email || email;
                phone = val.form_data.phone_number || val.form_data.phone || phone;
                campaignName = val.form_data.campaign_name || campaignName;
              }
            }
          }
        }
      }
    }

    // ── 3. Round-Robin Sales Rep Auto-Assignment ──
    let assignedSalesId = 'sales_default';
    let assignedSalesName = 'فريق المبيعات';

    try {
      // Find all active sales members
      const salesRepsRes = await db.prepare(`
        SELECT id, name, email 
        FROM agency_team_members 
        WHERE active = 1 AND (role LIKE '%Sales%' OR roles LIKE '%sales%')
      `).all();

      const salesReps = salesRepsRes.results || [];

      if (salesReps.length > 0) {
        // Query active leads count per rep to find the least busy sales rep (fair load balancing)
        const countsRes = await db.prepare(`
          SELECT assigned_sales_id, COUNT(*) as active_leads
          FROM sales_leads
          WHERE pipeline_stage NOT IN ('won', 'lost') AND assigned_sales_id IS NOT NULL
          GROUP BY assigned_sales_id
        `).all();

        const countMap = {};
        for (const row of (countsRes.results || [])) {
          countMap[row.assigned_sales_id] = row.active_leads;
        }

        // Sort reps by active leads ascending
        salesReps.sort((a, b) => {
          const countA = countMap[a.id] || 0;
          const countB = countMap[b.id] || 0;
          return countA - countB;
        });

        const selectedRep = salesReps[0];
        assignedSalesId = selectedRep.id;
        assignedSalesName = selectedRep.name;
      }
    } catch (assignErr) {
      console.warn('Error during sales assignment query:', assignErr.message);
    }

    const leadId = 'lead_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();

    // ── 4. Insert lead into sales_leads ──
    await db.prepare(`
      INSERT INTO sales_leads (
        id, name, email, phone, project_name, pipeline_stage,
        source_type, source_details, budget_tier,
        assigned_sales_id, assigned_sales_name, lead_score, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'new', 'meta_ad', ?, 'enterprise', ?, ?, 80, ?, ?)
    `).bind(
      leadId,
      fullName,
      email,
      phone,
      campaignName,
      `Facebook Lead Ads: ${campaignName}`,
      assignedSalesId,
      assignedSalesName,
      nowIso,
      nowIso
    ).run();

    // ── 5. Instant Telegram Alert to Assigned Rep and Admin ──
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const msg = `🎯 *ليد جديد من إعلانات فيسبوك (Facebook Lead Ad)*\n` +
        `👤 *العميل:* ${fullName}\n` +
        `📱 *الهاتف:* \`${phone}\`\n` +
        `📧 *البريد:* ${email}\n` +
        `📢 *الحملة:* ${campaignName}\n` +
        `💼 *مسؤول المبيعات المعين:* *${assignedSalesName}* (توزيع تلقائي)\n` +
        `🕒 *الوقت:* ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`;

      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' })
      }).catch(e => console.error('Telegram notification error:', e));
    }

    // ── 6. Trigger Automation Engine (lead.created) ──
    const origin = new URL(request.url).origin;
    fetch(`${origin}/api/internal/emit-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'lead.created',
        data: {
          lead: {
            id: leadId,
            name: fullName,
            email,
            phone,
            campaign_name: campaignName,
            assigned_sales_name: assignedSalesName
          }
        }
      })
    }).catch(e => console.warn('Automation emit error:', e));

    await logSystemAction(db, {
      adminId: 'meta_webhook',
      adminEmail: 'meta@pragency.eg',
      action: 'facebook_lead_ingested',
      targetType: 'sales_leads',
      targetId: leadId,
      details: `Lead ${fullName} captured and auto-assigned to ${assignedSalesName}`
    });

    return jsonResponse({
      success: true,
      message: 'تم استقبال الليد وتوزيعه آلياً بنجاح',
      lead_id: leadId,
      assigned_to: {
        id: assignedSalesId,
        name: assignedSalesName
      }
    });

  } catch (err) {
    console.error('Error in Facebook lead webhook:', err);
    return jsonResponse({ success: false, error: err.message || 'Internal Server Error' }, 500);
  }
}
