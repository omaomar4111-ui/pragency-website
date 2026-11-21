// functions/api/internal/agents/sales-agent.js
// Autonomous Sales AI Agent Engine — Human-in-the-Loop Architecture
import { sendTelegramNotification } from '../../../lib/telegram.js';
import { logSystemAction } from '../../../lib/audit.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

// Ensure database table exists
async function ensureTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS agent_pending_actions (
        id TEXT PRIMARY KEY,
        agent_type TEXT NOT NULL,
        lead_id TEXT,
        lead_name TEXT,
        lead_company TEXT,
        lead_phone TEXT,
        lead_email TEXT,
        action_type TEXT NOT NULL,
        draft_content TEXT NOT NULL,
        status TEXT DEFAULT 'pending_approval',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `).run();
  } catch (e) {
    console.warn('[Sales Agent DB Init]:', e.message);
  }
}

// ── Intelligence Engine: Prospecting & Cold Outreach Synthesis ──
// Adheres strictly to skills/prospecting/SKILL.md & skills/cold-email/SKILL.md
function generateColdOutreach(lead) {
  const name = (lead.name || 'عزيزي العميل').trim();
  const firstName = name.split(' ')[0] || name;
  const company = (lead.company || lead.project_name || '').trim();
  const campaign = (lead.campaign_name || lead.project_name || '').trim();
  const service = (lead.service_interested || '').trim();
  const notes = (lead.notes || lead.challenge_notes || '').trim();

  // 1. Prospecting: Detect Industry & Pain Signals
  const textCorpus = `${company} ${campaign} ${service} ${notes}`.toLowerCase();

  let industry = 'عام / تجاري';
  let painSignal = 'تحسين عائد الإعلانات (ROAS) وبناء محتوى فيديو سينمائي يشد الانتباه';
  let proofPoint = 'زيادة مبيعات عملائنا بنسبة تصل لـ 3.8x وتقليل تكلفة اكتساب العميل';

  if (/عياد|طبي|دكتور|اسنان|جلدية|جراح|clinic|doctor|dental/i.test(textCorpus)) {
    industry = 'قطاع العيادات والمراكز الطبية';
    painSignal = 'جذب مرضى مؤهلين فعلياً للحجز بدل الاستفسارات غير الجادة';
    proofPoint = 'حجز أكثر من 450 استشارة شهرية لعيادات رائدة في القاهرة وخفض تكلفة الحجز المؤكد';
  } else if (/عقار|ريل استيت|فيلا|شقة|تطوير|real estate|property/i.test(textCorpus)) {
    industry = 'التطوير والتسويق العقاري';
    painSignal = 'استهداف مشتريين ومستثمرين حقيقيين برقم هاتف صحيح وقدرة شرائية عالية';
    proofPoint = 'إغلاق صفقات بقيمة تجاوزت 80 مليون جنيه من خلال حملات ميديا باينج دقيقة';
  } else if (/ملابس|فاشن|متجر|ecommerce|fashion|store|شوز|اكسسوار/i.test(textCorpus)) {
    industry = 'التجارة الإلكترونية والبراندات (E-commerce)';
    painSignal = 'تجاوز ركود الإعلانات وعلاج الإرهاق الإعلاني بمحتوى Reels سينمائي ومؤثر';
    proofPoint = 'تحقيق ROAS ثابت بين 4.2x و 6.5x لبراندات الملابس والمتاجر عبر TikTok وMeta';
  } else if (/مطعم|كافيه|food|restaurant|cafe|اكل/i.test(textCorpus)) {
    industry = 'المطاعم والضيافة';
    painSignal = 'مضاعفة الإقبال المباشر وطلبات التوصيل عبر تصوير فوتوغرافي وفيديو عالي الشهية';
    proofPoint = 'رفع متوسط الزيارات الأسبوعية بنسبة 140% عبر محتوى فيروسي ومحلي عالي الانتشار';
  } else if (/b2b|شرك|برمج|saas|software|استشار/i.test(textCorpus)) {
    industry = 'الشركات وخدمات B2B';
    painSignal = 'توليد فرص مبيعات مؤهلة (MQLs & SQLs) بدون الاعتماد على الطرق التقليدية البطيئة';
    proofPoint = 'بناء خط إنتاج صفقات B2B متكامل وجدولة اجتماعات مع صناع القرار أسبوعياً';
  }

  // 2. Cold Outreach: Peer-to-Peer, Non-Robotic, Value-First, Low-Friction CTA
  const reference = company ? `لـ "${company}"` : 'لنشاطكم';
  
  const draftWhatsApp = 
`مساء الخير يا ${firstName}، أتمنى تكون بخير 🤝

أنا بتواصل مع حضرتك مباشرة من PR Agency بخصوص استفسارك الأخير واهتمامك بتطوير التسويق ${reference}.

لاحظت من تفاصيل استفسارك تركيزكم على ${painSignal}. إحنا في PR Agency متخصصين في ${industry}، وشغالين بنظام متكامل بيجمع بين تصوير إعلاني سينمائي وإدارة حملات ميديا باينج موجهة بالبيانات، ودا ساعدنا في ${proofPoint}.

عارف إن وقت حضرتك ثمين؛ حبيت أعرف لو مناسب نشارك معاك نموذج مبسط وسريع من 3 أفكار محددة نقدر نطبقها لزيادة مبيعاتكم الشهر ده؟

تحب نحدد 10 دقائق نتناقش فيها هاتفياً في الوقت اللي يناسبك؟`;

  return {
    industry,
    painSignal,
    draftWhatsApp
  };
}

// ── Autonomous Sales Agent Core Engine & Handlers ──
/**
 * Core Execution Engine for Sales Agent
 * Can process a single lead or scan for top high-intent uncontacted leads
 */
export async function runSalesAgent(env, options = {}) {
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return { success: false, error: 'Database unavailable' };

  await ensureTable(db);

  let lead = options.lead || {};
  const leadId = options.lead_id || lead.id;

  if (lead && (lead.name || lead.phone || leadId)) {
    return processSingleLead(env, db, lead, leadId);
  }

  try {
    let uncontactedLeads = [];
    
    try {
      const foundSales = await db.prepare(
        "SELECT sl.id, sl.name, sl.phone, sl.email, sl.company, sl.project_name, sl.notes, sl.pipeline_stage " +
        "FROM sales_leads sl " +
        "WHERE sl.id NOT IN (SELECT COALESCE(lead_id, '') FROM agent_pending_actions WHERE agent_type = 'sales_agent') " +
        "ORDER BY sl.created_at DESC LIMIT 3"
      ).all();
      if (foundSales && foundSales.results && foundSales.results.length) {
        uncontactedLeads = foundSales.results;
      }
    } catch(e) {}

    if (uncontactedLeads.length === 0) {
      try {
        const foundContacts = await db.prepare(
          "SELECT c.id, c.name, c.phone, c.business as company, c.message as notes, c.created_at " +
          "FROM contacts c " +
          "WHERE c.id NOT IN (SELECT COALESCE(lead_id, '') FROM agent_pending_actions WHERE agent_type = 'sales_agent') " +
          "ORDER BY c.created_at DESC LIMIT 3"
        ).all();
        if (foundContacts && foundContacts.results && foundContacts.results.length) {
          uncontactedLeads = foundContacts.results;
        }
      } catch(e) {}
    }

    const processed = [];
    for (const item of uncontactedLeads) {
      const res = await processSingleLead(env, db, item, item.id);
      if (res && res.success) {
        processed.push(res);
      }
    }

    return {
      success: true,
      proactive_scanned: uncontactedLeads.length,
      actions_created: processed.length,
      processed
    };
  } catch(err) {
    console.error('[Sales Agent Proactive Scan Error]:', err);
    return { success: false, error: err.message };
  }
}

async function processSingleLead(env, db, lead, leadId) {
  if (leadId && (!lead.name || !lead.phone)) {
    try {
      const found = await db.prepare('SELECT * FROM sales_leads WHERE id = ?').bind(leadId).first();
      if (found) lead = { ...found, ...lead };
    } catch (err) {}
  }

  const leadName = lead.name || 'عميل محتمل';
  const leadPhone = lead.phone || '';
  const leadEmail = lead.email || '';
  const leadCompany = lead.project_name || lead.company || '';

  const synthesis = generateColdOutreach(lead);
  let finalDraft = synthesis.draftWhatsApp;

  if (env.AI && typeof env.AI.run === 'function') {
    try {
      const aiPrompt = 'أنت خبير مبيعات وتسويق تنفيذي في وكالة PR Agency بالقاهرة. اكتب رسالة واتساب افتتاحية شديدة الذكاء والاحترافية للعميل المحتمل "' + leadName + '" في مجال "' + synthesis.industry + '".\nالقواعد:\n1. عامية مصرية راقية للأعمال.\n2. ليست رسالة تسويقية مزعجة؛ بل زميل محترف يشارك ملاحظة ذكية لحل مشكلة: "' + synthesis.painSignal + '".\n3. اختصر في 60-80 كلمة.\n4. سؤال ختامي سهل الإجابة بدون ضغط بيعي.';

      const aiRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'أنت وكيل المبيعات الذكي لوكالة PR Agency المتخصصة في التسويق المتكامل والإنتاج الإعلاني.' },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      if (aiRes && aiRes.response && aiRes.response.trim().length > 30) {
        finalDraft = aiRes.response.trim();
      }
    } catch (aiErr) {}
  }

  const actionId = 'act_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const nowIso = new Date().toISOString();

  await db.prepare(
    "INSERT INTO agent_pending_actions (" +
    "  id, agent_type, lead_id, lead_name, lead_company," +
    "  lead_phone, lead_email, action_type, draft_content," +
    "  status, created_at, updated_at" +
    ") VALUES (?, 'sales_agent', ?, ?, ?, ?, ?, 'whatsapp_outreach', ?, 'pending_approval', ?, ?)"
  ).bind(
    actionId,
    leadId ? String(leadId) : null,
    leadName,
    leadCompany,
    leadPhone,
    leadEmail,
    finalDraft,
    nowIso,
    nowIso
  ).run();

  const tgMsg = 
    '🤖 <b>وكيل المبيعات الذكي جهز مسودة رسالة جديدة لـ ' + leadName + '</b>\n\n' +
    '🏢 <b>النشاط / الشركة:</b> ' + (leadCompany || 'غير محدد') + '\n' +
    '📱 <b>الهاتف:</b> <code>' + leadPhone + '</code>\n' +
    '🎯 <b>المجال المستهدف:</b> ' + synthesis.industry + '\n' +
    '⚡ <b>نوع الإجراء:</b> رسالة تواصل أولي (WhatsApp Outreach)\n\n' +
    '📝 <b>معاينة المسودة:</b>\n<i>"' + finalDraft.slice(0, 160) + '..."</i>\n\n' +
    '👉 <b>ادخل للموافقة عليها أو تعديلها من لوحة الإدارة (مركز الوكلاء):</b>\n' +
    'https://pragency.pages.dev/admin-agency.html#tab-agents';

  await sendTelegramNotification(env, tgMsg, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ اعتماد وإرسال المسودة', callback_data: 'action:agent:approve:' + actionId },
          { text: '❌ رفض وتجاهل', callback_data: 'action:agent:reject:' + actionId }
        ]
      ]
    }
  });

  await logSystemAction(db, {
    actor_id: 'sales_agent_ai',
    actor_name: 'Autonomous Sales AI',
    actor_role: 'ai_agent',
    action: 'agent_draft_created',
    target_type: 'agent_pending_actions',
    targetId: actionId,
    details: {
      lead_id: leadId,
      lead_name: leadName,
      action_type: 'whatsapp_outreach',
      industry: synthesis.industry
    }
  }).catch(() => {});

  return {
    success: true,
    action_id: actionId,
    lead_id: leadId,
    lead_name: leadName,
    status: 'pending_approval',
    draft: finalDraft
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const result = await runSalesAgent(env, body);
    return jsonResponse(result, result.success ? 200 : 500);
  } catch (err) {
    console.error('[Sales Agent Engine Error]:', err);
    return jsonResponse({ success: false, error: err.message || 'Internal Agent Error' }, 500);
  }
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const result = await runSalesAgent(env);
    return jsonResponse(result, result.success ? 200 : 500);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
