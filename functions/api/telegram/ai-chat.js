// functions/api/telegram/ai-chat.js
// Autonomous Telegram AI Chat Assistant for PR Agency OS
// Understands natural language, answers system queries, executes actions, and applies marketing/sales skills.

import { sendTelegramMessage } from '../../lib/telegram.js';
import { getCombinedSkillContext, enhanceWithArena, loadSkill } from '../../lib/skill-router.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

/**
 * Fetch live system snapshot from D1 databases
 */
async function getLiveSystemSnapshot(env) {
  const dbAnalytics = env.ANALYTICS_DB || env.DB;
  const dbMain = env.DB || env.ANALYTICS_DB;

  let clientCount = 0;
  let topClients = [];
  let invoiceStats = { total: 0, paidTotal: 0, pendingTotal: 0, overdueCount: 0 };
  let taskStats = { total: 0, planned: 0, done: 0, overdue: 0, recentTasks: [] };
  let leadStats = { total: 0, weekCount: 0, recentLeads: [] };

  try {
    if (dbAnalytics) {
      // 1. Clients
      try {
        const cRow = await dbAnalytics.prepare('SELECT COUNT(*) as cnt FROM portal_clients').first();
        clientCount = cRow?.cnt || 0;
        const cList = await dbAnalytics.prepare('SELECT company_name FROM portal_clients LIMIT 5').all();
        topClients = (cList?.results || []).map(c => c.company_name).filter(Boolean);
      } catch (e) {
        try {
          const cRow = await dbMain.prepare('SELECT COUNT(*) as cnt FROM clients').first();
          clientCount = cRow?.cnt || 0;
        } catch (e2) {}
      }

      // 2. Invoices & Revenue
      try {
        const invRow = await dbAnalytics.prepare(`
          SELECT 
            COUNT(*) as total_count,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_total,
            COALESCE(SUM(CASE WHEN status != 'paid' THEN amount ELSE 0 END), 0) as pending_total,
            COUNT(CASE WHEN status != 'paid' AND due_date < date('now') THEN 1 END) as overdue_count
          FROM client_invoices
        `).first();
        if (invRow) {
          invoiceStats = {
            total: invRow.total_count || 0,
            paidTotal: invRow.paid_total || 0,
            pendingTotal: invRow.pending_total || 0,
            overdueCount: invRow.overdue_count || 0
          };
        }
      } catch (e) {}

      // 3. Leads
      try {
        const lCount = await dbAnalytics.prepare('SELECT COUNT(*) as cnt FROM sales_leads').first();
        const lWeek = await dbAnalytics.prepare("SELECT COUNT(*) as cnt FROM sales_leads WHERE created_at >= date('now', '-7 days')").first();
        const lRecent = await dbAnalytics.prepare('SELECT id, name, company, pipeline_stage FROM sales_leads ORDER BY created_at DESC LIMIT 3').all();
        leadStats = {
          total: lCount?.cnt || 0,
          weekCount: lWeek?.cnt || 0,
          recentLeads: lRecent?.results || []
        };
      } catch (e) {}
    }

    if (dbMain) {
      // 4. Tasks
      try {
        const tCount = await dbMain.prepare('SELECT COUNT(*) as cnt FROM tasks').first();
        const tPlanned = await dbMain.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'planned'").first();
        const tDone = await dbMain.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'done'").first();
        const tOverdue = await dbMain.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE planned_date < date('now') AND status != 'done'").first();
        const tRecent = await dbMain.prepare("SELECT id, title, priority, planned_date, status FROM tasks WHERE status != 'done' ORDER BY created_at DESC LIMIT 5").all();
        taskStats = {
          total: tCount?.cnt || 0,
          planned: tPlanned?.cnt || 0,
          done: tDone?.cnt || 0,
          overdue: tOverdue?.cnt || 0,
          recentTasks: tRecent?.results || []
        };
      } catch (e) {}
    }
  } catch (err) {
    console.error('[Live Snapshot Exception]:', err.message);
  }

  return { clientCount, topClients, invoiceStats, taskStats, leadStats };
}

/**
 * Execute system action requested via natural language
 */
async function executeSystemAction(env, action, params) {
  const dbMain = env.DB || env.ANALYTICS_DB;
  const dbAnalytics = env.ANALYTICS_DB || env.DB;

  if (action === 'add_task') {
    const title = (params.title || '').trim();
    if (!title) return { success: false, error: 'عنوان المهمة مطلوب' };

    const taskId = 'task_' + crypto.randomUUID().slice(0, 8);
    const priority = params.priority || (/(?:عاجل|مهم جداً|طارئ|ضروري)/i.test(title) ? 'high' : 'medium');
    const today = new Date().toISOString().slice(0, 10);
    const projectId = params.project_id || 'proj_agency';

    await dbMain.prepare(`
      INSERT INTO tasks (
        id, project_id, title, description, assigned_to, status, priority, flag, planned_date, estimated_hours, created_at
      ) VALUES (?, ?, ?, ?, 'admin', 'planned', ?, 'feature', ?, 0, CURRENT_TIMESTAMP)
    `).bind(
      taskId,
      projectId,
      title,
      params.description || 'مهمة أضيفت تلقائياً عبر مساعد تليجرام الذكي',
      priority,
      today
    ).run();

    // Trigger Creative Agent in background
    try {
      const { runCreativeAgent } = await import('../internal/agents/creative-agent.js');
      await runCreativeAgent(env, { id: taskId, title, project_id: projectId });
    } catch (e) {
      console.warn('[Creative Agent Trigger Notice]:', e.message);
    }

    return {
      success: true,
      action: 'add_task',
      task: { id: taskId, title, priority, planned_date: today }
    };
  }

  return { success: false, error: 'إجراء غير معروف' };
}

/**
 * Query LLM (OpenAI / Cloudflare Workers AI / Contextual fallback)
 */
async function queryLLM(env, userPrompt, systemPrompt) {
  // 1. Try OpenAI if configured
  if (env.OPENAI_API_KEY) {
    try {
      const oRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        })
      });
      const oData = await oRes.json();
      const text = oData.choices?.[0]?.message?.content;
      if (text) return text.trim();
    } catch (e) {
      console.warn('[OpenAI Chat Error]:', e.message);
    }
  }

  // 2. Try Cloudflare Workers AI if configured
  if (env.AI && typeof env.AI.run === 'function') {
    try {
      const aiRes = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      if (aiRes?.response) return aiRes.response.trim();
    } catch (e) {
      console.warn('[Cloudflare Workers AI Chat Error]:', e.message);
    }
  }

  return null;
}

/**
 * Main AI Assistant Chat Engine
 */
export async function handleAiChat(env, chatId, userMessage) {
  // 1. Security Check: Restrict to authorized admin chat ID
  const adminChatId = env.TELEGRAM_CHAT_ID || '5715939844';
  if (String(chatId) !== String(adminChatId)) {
    return {
      success: false,
      text: '⚠️ <b>تنبيه أمني:</b> عذراً، هذا المساعد الذكي مخصص حصرياً للمدير العام المصرح له فقط.',
      reply_markup: null
    };
  }

  const prompt = (userMessage || '').trim();
  if (!prompt) {
    return {
      success: true,
      text: 'أهلاً بك يا فندم! كيف يمكنني مساعدتك في إدارة الوكالة اليوم؟ يمكنك سؤالي عن العملاء، الفواتير، المهام، أو طلب صياغة بوستات وسيناريوهات إعلانية.',
      reply_markup: {
        inline_keyboard: [[{ text: '📊 نظرة عامة', callback_data: 'menu:overview' }]]
      }
    };
  }

  // 2. Pull real-time system metrics
  const snapshot = await getLiveSystemSnapshot(env);

  // 3. Fast Intent Analysis for Commands & Direct Questions
  // A. Command: Add Task
  const addTaskMatch = prompt.match(/^(?:أضف|ضيف|سجل|انشئ|إضافة|اضافة|جدول|add task|create task)\s+(?:مهمة\s+|task\s+)?(.+)/i);
  if (addTaskMatch) {
    const rawTitle = addTaskMatch[1].replace(/^(?:بعنوان|باسم)\s+/, '').trim();
    const result = await executeSystemAction(env, 'add_task', { title: rawTitle });

    if (result.success) {
      return {
        success: true,
        text: `✅ <b>تم إضافة المهمة بنجاح إلى جدول المهام اليومية!</b>\n\n📌 <b>المهمة:</b> ${result.task.title}\n⚡ <b>الأولوية:</b> ${result.task.priority}\n📅 <b>التاريخ:</b> ${result.task.planned_date}\n\n🎨 <i>تم تشغيل الوكيل الإبداعي المستقل في الخلفية لصياغة البريف الإعلاني وسيعرض عليك للاعتماد فور جهوزه.</i>`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 عرض مهام اليوم', callback_data: 'menu:tasks:today' }],
            [{ text: '⬅️ القائمة الرئيسية', callback_data: 'menu:main' }]
          ]
        }
      };
    }
  }

  // B. Question: Clients Count & Info
  if (/(?:عندي كام عميل|كم عميل|عدد العملاء|العملاء|اعرض العملاء|من هم العملاء|قائمة العملاء|how many clients)/i.test(prompt)) {
    const namesList = snapshot.topClients.length > 0
      ? snapshot.topClients.map(c => `• ${c}`).join('\n')
      : '• لا توجد تفاصيل إضافية مسجلة';

    return {
      success: true,
      text: `👥 <b>إحصائيات عملاء الوكالة (Client Intelligence):</b>\n\n• إجمالي العملاء المسجلين: <b>${snapshot.clientCount} عميل</b>\n\n🏢 <b>أبرز العملاء النشطين:</b>\n${namesList}\n\nيمكنك الضغط أدناه للاطلاع على التفاصيل الكاملة:`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '👥 استعراض قائمة العملاء', callback_data: 'menu:clients' }],
          [{ text: '⬅️ القائمة الرئيسية', callback_data: 'menu:main' }]
        ]
      }
    };
  }

  // C. Question: Invoices & Revenue
  if (/(?:الفواتير|فواتير|ارباح|الأرباح|المستحقات|كام فلوس|كام المحصل|invoices|revenue)/i.test(prompt)) {
    const paidFmt = Number(snapshot.invoiceStats.paidTotal).toLocaleString('en-US');
    const pendingFmt = Number(snapshot.invoiceStats.pendingTotal).toLocaleString('en-US');

    return {
      success: true,
      text: `🧾 <b>التقرير المالي والمستحقات (Financial Pulse):</b>\n\n• إجمالي الفواتير: <b>${snapshot.invoiceStats.total}</b>\n• المحصل بالكامل: <b>${paidFmt} ج.م</b> 🟢\n• الفواتير المعلقة: <b>${pendingFmt} ج.م</b> 🟡\n• فواتير متأخرة: <b>${snapshot.invoiceStats.overdueCount} فواتير</b> 🔴`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🧾 استعراض الفواتير', callback_data: 'menu:invoices' }],
          [{ text: '📊 تقرير الإيرادات', callback_data: 'action:report:revenue' }]
        ]
      }
    };
  }

  // D. Question: Tasks status
  if (/(?:مهام|المهام|عندي إيه|عندي ايه|جدول اليوم|tasks)/i.test(prompt)) {
    const tasksList = snapshot.taskStats.recentTasks.length > 0
      ? snapshot.taskStats.recentTasks.map(t => `• ${t.title} [${t.priority}]`).join('\n')
      : '• لا توجد مهام نشطة حالياً';

    return {
      success: true,
      text: `📋 <b>حالة المهام وسير العمل (Daily Tasks):</b>\n\n• المهام المجدولة: <b>${snapshot.taskStats.planned}</b>\n• المهام المكتملة: <b>${snapshot.taskStats.done}</b>\n• المهام المتأخرة: <b>${snapshot.taskStats.overdue}</b>\n\n📌 <b>المهام الحالية:</b>\n${tasksList}`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 مهام اليوم', callback_data: 'menu:tasks:today' }],
          [{ text: '➕ إضافة مهمة', callback_data: 'action:task:add' }]
        ]
      }
    };
  }

  // E. Question: Leads & CRM
  if (/(?:الليدز|ليدز|الصفقات|العملاء المحتملين|leads)/i.test(prompt)) {
    return {
      success: true,
      text: `💼 <b>إحصائيات المبيعات والليدز (CRM Pipeline):</b>\n\n• إجمالي الليدز في المنظومة: <b>${snapshot.leadStats.total}</b>\n• ليدز جديدة خلال آخر 7 أيام: <b>${snapshot.leadStats.weekCount}</b>`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '💼 عرض الصفقات والليدز', callback_data: 'menu:leads' }],
          [{ text: '📊 تقرير مسار المبيعات', callback_data: 'action:report:leads' }]
        ]
      }
    };
  }

  // 4. Content Generation & Marketing Skills
  let skillAction = 'copywriting';
  if (/(?:فيديو|ريلز|يوتيوب|تيك توك|سكريبت|script|video|yt)/i.test(prompt)) {
    skillAction = 'youtube_script';
  } else if (/(?:ايميل|إيميل|رسالة|واتساب|outreach|cold|رساله)/i.test(prompt)) {
    skillAction = 'generate_outreach';
  } else if (/(?:استراتيجية|خطة|عرض|pitch|proposal|مقارنة)/i.test(prompt)) {
    skillAction = 'generate_presentation';
  }

  const { skillNames, contextPrompt } = getCombinedSkillContext(skillAction);

  const systemInstructions = `أنت المساعد الذكي الشخصي للمدير التنفيذي لوكالة التسويق PR Agency (مقرها القاهرة).
تتحدث بالعامية المصرية الراقية والمهنية جداً الموجهة لرجال الأعمال وأصحاب الشركات، مع إمكانية استخدام الإنجليزية إذا سأل المستخدم بالإنجليزية.
لديك وصول كامل ومباشر لقاعدة بيانات الوكالة الحالية:
- عدد العملاء: ${snapshot.clientCount} عميل (أبرزهم: ${snapshot.topClients.join('، ')})
- الفواتير: محصل ${snapshot.invoiceStats.paidTotal} ج.م، معلق ${snapshot.invoiceStats.pendingTotal} ج.م، متأخرات ${snapshot.invoiceStats.overdueCount} فواتير.
- المهام: مجدول ${snapshot.taskStats.planned}، مكتمل ${snapshot.taskStats.done}، متأخر ${snapshot.taskStats.overdue}.
- الليدز: إجمالي ${snapshot.leadStats.total}.

${contextPrompt}

قواعد الإجابة:
1. كن عملياً ومباشراً وذكياً جداً في التسويق والمبيعات وإدارة الأعمال.
2. إذا طلب المستخدم كتابة بوست، اكتب بوست إعلاني جذاب وقوي يعتمد أسلوب Hook + Problem + Solution + Social Proof + Call to Action واضح مع إيموجيز احترافية.
3. نسق الإجابة بأسلوب HTML مدعوم في Telegram (استخدم <b> للخط العريض و <code> و <i>).
4. اختتم الرد باقتراح خطوة تالية عملية.`;

  const aiReply = await queryLLM(env, prompt, systemInstructions);

  if (aiReply) {
    return {
      success: true,
      text: aiReply,
      reply_markup: {
        inline_keyboard: [
          [{ text: '✨ طلب تعديل أو فكرة أخرى', callback_data: 'action:ai:post' }],
          [{ text: '⬅️ القائمة الرئيسية', callback_data: 'menu:main' }]
        ]
      }
    };
  }

  // 5. High-Converting Fallback Engine (when external LLM is offline)
  let fallbackText = '';
  if (skillAction === 'youtube_script') {
    fallbackText = `🎬 <b>سيناريو فيديو إعلاني قصير (Reels / Shorts Script 9:16)</b>\n────────────────────\n\n⚡ <b>الخطاف (0-3 ثوانٍ):</b>\n"لو بتصرف فلوس على الإعلانات والنتيجة مش مرضية.. المشكلة مش في ميزانيتك، المشكلة في المنظومة!"\n\n🎯 <b>المشهد الأول (3-10 ثوانٍ):</b>\nالتركيز على أكثر خطأ بيقع فيه أصحاب البيزنس: الاعتماد على بوستات عشوائية بدون Funnel واضح.\n\n💡 <b>الحل من PR Agency (10-22 ثانية):</b>\nاستعراض سريع لطريقة عملنا: تصوير سينمائي عالي الجودة + استهداف دقيق لجمهورك المهتم + متابعة ذكية للعميل حتى إتمام الشراء.\n\n📣 <b>الدعوة لاتخاذ إجراء (CTA):</b>\n"اضغط على الرابط في البايو واحجز استشارتك المجانية لمشروعك النهاردة!"`;
  } else if (skillAction === 'generate_outreach') {
    fallbackText = `💬 <b>مسودة رسالة تواصل احترافية (WhatsApp Outreach):</b>\n────────────────────\n"أهلاً بحضرتك يا فندم، أنا متابع نشاطكم المميز جداً الفترة الأخيرة في السوق..\n\nلاحظنا وجود فرصة كبيرة لمضاعفة نتائج مبيعاتكم عبر تحسين زوايا المحتوى الإعلاني واستهداف العملاء الأكثر جاهزية للشراء.\n\nفي PR Agency حققنا لعملائنا في نفس المجال نمو تجاوز 3X في العائد الإعلاني. يسعدني نحدد مكالمة سريعة لمدة 10 دقائق نستعرض لحضرتك دراسة حالة تفصيلية. يناسبك الغد الساعة 2 ظهراً؟"`;
  } else {
    // Default copywriting post
    fallbackText = `✍️ <b>بوست إعلاني تسويقي متكامل لـ PR Agency:</b>\n────────────────────\n\nليه معظم الشركات بتصرف آلاف في التسويق وتطلع بنتايج متواضعة؟ 🤔\n\nالحقيقة البسيطة: التسويق مش مجرد "تصميم شكله حلو" وخلاص..\nالتسويق الحقيقي هو <b>منظومة نمو متكاملة</b> بتحول كل زائر لعميل حقيقي بيدفع.\n\nمع <b>PR Agency</b>، بنشتغل معاك خطوة بخطوة:\n✅ استراتيجية نمو مخصصة لنشاطك التجاري\n✅ إنتاج محتوى وتصوير إعلاني بمستوى سينمائي\n✅ إدارة حملات إعلانية ممولة باستهداف عالي الدقة\n✅ تحويل الليدز لمبيعات فعلية تزيد ربحيتك\n\nجاهز تنقل البراند بتاعك للمستوى اللي يستحقه؟ 🚀\n\n📲 <b>تواصل معانا دلوقتي عبر رسائل الصفحة واحجز جلستك الاستشارية المجانية!</b>\n\n#PR_Agency #تسويق_إلكتروني #نمو_المبيعات #ميديا_باينج #بيزنس_مصر`;
  }

  return {
    success: true,
    text: fallbackText,
    reply_markup: {
      inline_keyboard: [
        [{ text: '✍️ صياغة بوست آخر', callback_data: 'action:ai:post' }],
        [{ text: '⬅️ القائمة الرئيسية', callback_data: 'menu:main' }]
      ]
    }
  };
}

// ── HTTP Endpoint Handler (POST /api/telegram/ai-chat) ──
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const chatId = body.chat_id || env.TELEGRAM_CHAT_ID;
    const message = body.message || body.text || '';

    const result = await handleAiChat(env, chatId, message);

    if (body.dispatch !== false) {
      await sendTelegramMessage(env, {
        chat_id: chatId,
        text: result.text,
        parse_mode: 'HTML',
        reply_markup: result.reply_markup
      });
    }

    return jsonResponse(result);
  } catch (err) {
    console.error('[AI Chat API Exception]:', err.message);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
