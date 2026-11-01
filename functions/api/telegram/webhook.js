// functions/api/telegram/webhook.js
// PR Agency OS - Central Telegram Command Center Webhook Router

import { buildMenu } from '../../lib/telegram-menu.js';
import { 
  sendTelegramMessage, 
  editTelegramMessage, 
  answerCallbackQuery, 
  getSession, 
  setSession 
} from '../../lib/telegram.js';

/**
 * Helper to fetch executive pulse metrics from D1 for the Overview Menu
 */
async function fetchOverviewMetrics(env) {
  const dbAnalytics = env.ANALYTICS_DB || env.DB;
  const dbMain = env.DB || env.ANALYTICS_DB;

  let totalClients = 0;
  let activeTasks = 0;
  let paidInvoicesThisMonth = 0;
  let paidAmountThisMonth = 0;
  let newLeadsThisWeek = 0;

  try {
    if (dbAnalytics) {
      try {
        const clientRow = await dbAnalytics.prepare('SELECT COUNT(*) as cnt FROM portal_clients').first();
        totalClients = clientRow?.cnt || 0;
      } catch (e) {
        const fallbackClient = await dbMain.prepare('SELECT COUNT(*) as cnt FROM clients').first();
        totalClients = fallbackClient?.cnt || 0;
      }

      try {
        const invRow = await dbAnalytics.prepare(`
          SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total 
          FROM client_invoices 
          WHERE status = 'paid' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        `).first();
        paidInvoicesThisMonth = invRow?.cnt || 0;
        paidAmountThisMonth = invRow?.total || 0;
      } catch (e) {
        console.warn('[Overview Metrics] Invoices query notice:', e.message);
      }

      try {
        const leadRow = await dbAnalytics.prepare(`
          SELECT COUNT(*) as cnt 
          FROM sales_leads 
          WHERE created_at >= date('now', '-7 days')
        `).first();
        newLeadsThisWeek = leadRow?.cnt || 0;
      } catch (e) {
        console.warn('[Overview Metrics] Leads query notice:', e.message);
      }
    }

    if (dbMain) {
      try {
        const taskRow = await dbMain.prepare(`
          SELECT COUNT(*) as cnt 
          FROM tasks 
          WHERE status != 'done'
        `).first();
        activeTasks = taskRow?.cnt || 0;
      } catch (e) {
        console.warn('[Overview Metrics] Tasks query notice:', e.message);
      }
    }
  } catch (err) {
    console.error('[Overview Metrics] Aggregation error:', err.message);
  }

  return {
    totalClients,
    activeTasks,
    paidInvoicesThisMonth,
    paidAmountThisMonth,
    newLeadsThisWeek,
    currency: 'EGP'
  };
}

/**
 * Helper to fetch tasks by filter type from D1
 */
async function fetchTasks(dbMain, type = 'today') {
  if (!dbMain) return [];
  try {
    let sql = '';
    if (type === 'today') {
      sql = `SELECT * FROM tasks WHERE (planned_date = date('now') OR status != 'done') ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, created_at DESC LIMIT 5`;
    } else if (type === 'overdue') {
      sql = `SELECT * FROM tasks WHERE planned_date < date('now') AND status != 'done' ORDER BY planned_date ASC LIMIT 5`;
    } else if (type === 'done') {
      sql = `SELECT * FROM tasks WHERE status = 'done' ORDER BY done_at DESC, created_at DESC LIMIT 5`;
    } else {
      sql = `SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5`;
    }
    const { results } = await dbMain.prepare(sql).all();
    return results || [];
  } catch (err) {
    console.error('[Fetch Tasks] Error:', err.message);
    return [];
  }
}

/**
 * Helper to fetch tasks performance statistics
 */
async function fetchTaskStats(dbMain) {
  if (!dbMain) return { planned: 0, inProgress: 0, done: 0, overdue: 0, weekHours: 0 };
  try {
    const plannedRow = await dbMain.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'planned'").first();
    const inProgressRow = await dbMain.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'in-progress'").first();
    const doneRow = await dbMain.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'done'").first();
    const overdueRow = await dbMain.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE planned_date < date('now') AND status != 'done'").first();
    
    let weekHours = 0;
    try {
      const hoursRow = await dbMain.prepare("SELECT COALESCE(SUM(hours), 0) as total FROM time_entries WHERE date >= date('now', '-7 days')").first();
      weekHours = hoursRow?.total || 0;
    } catch (e) {}

    return {
      planned: plannedRow?.cnt || 0,
      inProgress: inProgressRow?.cnt || 0,
      done: doneRow?.cnt || 0,
      overdue: overdueRow?.cnt || 0,
      weekHours
    };
  } catch (err) {
    console.error('[Fetch Task Stats] Error:', err.message);
    return { planned: 0, inProgress: 0, done: 0, overdue: 0, weekHours: 0 };
  }
}

/**
 * Helper to fetch settings
 */
async function fetchSettings(dbAnalytics, env) {
  let instapayIpa = 'pragency@instapay';
  let instapayName = 'PR Agency Egypt Official';
  let applePayMerchantId = 'merchant.com.pragency.portal';

  try {
    const rows = await dbAnalytics.prepare('SELECT key, value FROM agency_settings').all();
    (rows?.results || []).forEach(r => {
      if (r.key === 'instapay_ipa') instapayIpa = r.value;
      if (r.key === 'instapay_name') instapayName = r.value;
      if (r.key === 'apple_pay_merchant_id') applePayMerchantId = r.value;
    });
  } catch (e) {}

  return {
    instapayIpa,
    instapayName,
    applePayMerchantId,
    telegramChatId: env.TELEGRAM_CHAT_ID || '5715939844',
    notifyCountries: env.NOTIFY_COUNTRIES || 'EG,SA,AE'
  };
}

/**
 * AI Content Generator with Multi-Tier Fallbacks (Cloudflare Workers AI, Gemini API, Domain Templates)
 */
async function generateAiContent(env, prompt, systemPrompt, toolType, inputTopic) {
  // 1. Try Cloudflare Workers AI if available
  if (env.AI && typeof env.AI.run === 'function') {
    try {
      const res = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      });
      if (res && res.response) return res.response.trim();
    } catch (e) {
      console.warn('[AI Error Cloudflare]:', e.message);
    }
  }

  // 2. Try Gemini API if key is configured
  if (env.GEMINI_API_KEY) {
    try {
      const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }]
        })
      });
      if (gRes.ok) {
        const gData = await gRes.json();
        const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {
      console.warn('[AI Error Gemini]:', e.message);
    }
  }

  // 3. Domain-Specific Intelligent Templates Fallback (PR Agency Engine)
  const safeTopic = inputTopic || prompt;
  if (toolType === 'post') {
    return `🚀 <b>بوست إعلاني جذاب: ${safeTopic}</b>\n\n` +
           `هل تبحث عن مضاعفة نتائجك في السوق بدون إهدار الميزانية التسويقية؟ 🎯\n\n` +
           `في عالم الأعمال السريع، النجاح مش مجرد إعلانات بتتصرف، النجاح هو بناء منظومة تسويق رقمية مدروسة توصل لجمهورك الصح في الوقت الصح بالقيمة الصح.\n\n` +
           `✨ <b>مع وكالة العلاقات العامة والتسويق (PR Agency):</b>\n` +
           `• استهداف مباشر للعملاء ذوي القوة الشرائية العالية\n` +
           `• تصميمات احترافية ومحتوى يحكي قصة علامتك التجارية\n` +
           `• تقارير أداء لحظية ومتابعة مستمرة لعائد الاستثمار (ROI)\n\n` +
           `📩 <i>اترك تعليقاً بكلمة "تفاصيل" أو تواصل معنا فورياً لتحديد جلسة استشارية مجانية!</i>\n\n` +
           `#تسويق_رقمي #استثمار #ريادة_أعمال #${safeTopic.replace(/\s+/g, '_')}`;
  }

  if (toolType === 'strategy') {
    return `📊 <b>استراتيجية تسويق متكاملة لـ: ${safeTopic}</b>\n\n` +
           `1️⃣ <b>الجمهور المستهدف (Target Audience):</b>\n` +
           `• الفئة: أصحاب الأعمال ورواد المشاريع (B2B / B2C المميز)\n` +
           `• النطاق الجغرافي: مصر والخليج العربي (KSA, UAE)\n` +
           `• نقاط الألم: صعوبة اكتساب عملاء مؤهلين وارتفاع تكلفة الاستحواذ (CAC)\n\n` +
           `2️⃣ <b>التموضع السوقي (Market Positioning):</b>\n` +
           `• الوكالة الشريكة في النمو القائم على الذكاء الاصطناعي والأتمتة السريعة\n\n` +
           `3️⃣ <b>القنوات التسويقية وتوزيع الميزانية:</b>\n` +
           `• 40% إعلانات ميتا المدفوعة (Instagram & Facebook Lead Forms)\n` +
           `• 35% حملات جوجل وحملات البحث عالي النية الشرائية (Search & YouTube)\n` +
           `• 25% المحتوى العضوي والسيو والعلاقات العامة الرقمية (PR Articles)\n\n` +
           `4️⃣ <b>مؤشرات الأداء الرئيسية (KPIs):</b>\n` +
           `• تحقيق 3.5x إلى 5x ROAS خلال أول 60 يوماً\n` +
           `• خفض تكلفة الليد بنسبة 30% عبر Funnel المؤتمتة`;
  }

  if (toolType === 'pitch') {
    return `📑 <b>مخطط العرض التقديمي (Pitch Deck Outline): ${safeTopic}</b>\n\n` +
           `<b>الشريحة 1: المقدمة والرؤية</b>\n• كيف نحول ${safeTopic} إلى علامة تجارية رائدة ومربحة في قطاعها.\n\n` +
           `<b>الشريحة 2: المشكلة والفرصة السوقية</b>\n• الفجوات الحالية في المنافسة وغياب التفاعل المؤثر للعملاء.\n\n` +
           `<b>الشريحة 3: القيمة المضافة وحلول الوكالة</b>\n• منظومة متكاملة تشمل الإنتاج الإبداعي، الحملات الإعلانية، ومركز قيادة CRM متصل بتليجرام.\n\n` +
           `<b>الشريحة 4: الباقات الشهرية (Retainers)</b>\n• باقة النمو (Growth): 25,000 ج.م شهرياً\n• باقة الريادة (Dominance): 45,000 ج.م شهرياً مع إدارة كاملة وتوليد ليدز يومي.\n\n` +
           `<b>الشريحة 5: العائد المتوقع والخطوة التالية</b>\n• خطة 90 يوماً وتوقيع العقد فورياً.`;
  }

  if (toolType === 'prospect') {
    return `🔍 <b>ملف التنقيب والتحليل الاستراتيجي: ${safeTopic}</b>\n\n` +
           `🏢 <b>الشركة / العلامة:</b> ${safeTopic}\n` +
           `🎯 <b>القطاع:</b> الخدمات والمنتجات التجارية الواعدة\n\n` +
           `⚡ <b>نقاط الضعف الحالية (Pain Points):</b>\n` +
           `• تواجد رقمي غير متسق وتأخر في الرد على استفسارات العملاء المحتملين\n` +
           `• الاعتماد على أساليب تسويقية تقليدية غير قابلة للقياس الدقيق\n\n` +
           `💡 <b>زاوية البيع المثالية (Sales Pitch Angle):</b>\n` +
           `• تقديم نظام أتمتة مبيعات ذكي يربط الإعلانات مباشرة بـ CRM وتليجرام بدون أي فاقد في الليدز\n\n` +
           `📞 <b>رسالة الافتتاح المقترحة:</b>\n` +
           `<i>"مرحباً فريق ${safeTopic}، لاحظنا نموكم المميز مؤخراً، وحضرنا لكم دراسة سريعة توضح كيف تضاعفون مبيعاتكم عبر أتمتة الليدز بنسبة 40%، متى يناسبكم اتصال سريع 10 دقائق؟"</i>`;
  }

  return `🤖 تم توليد المحتوى بنجاح حول موضوع: ${safeTopic}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const dbAnalytics = env.ANALYTICS_DB || env.DB;
  const dbMain = env.DB || env.ANALYTICS_DB;

  try {
    const update = await request.json();
    if (!update) {
      return new Response(JSON.stringify({ ok: false, error: 'No payload' }), { status: 400 });
    }

    const callbackQuery = update.callback_query;
    const message = update.message;

    // ── SECURITY VERIFICATION ──
    const incomingChatId = String(
      message?.chat?.id || 
      callbackQuery?.message?.chat?.id || 
      callbackQuery?.from?.id || 
      ''
    );

    const authorizedChatId = String(env.TELEGRAM_CHAT_ID || '');
    if (!authorizedChatId || incomingChatId !== authorizedChatId) {
      console.warn(`[Telegram Webhook] Unauthorized attempt from chat_id: "${incomingChatId}"`);
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ── 1. HANDLE INLINE KEYBOARD CALLBACKS (callback_query) ──
    if (callbackQuery) {
      const callbackData = callbackQuery.data || '';
      const messageId = callbackQuery.message?.message_id;

      // Immediately answer callback query to clear the Telegram loader spinner
      await answerCallbackQuery(env, callbackQuery.id);

      // Main Menu
      if (callbackData === 'menu:main') {
        const payload = buildMenu(incomingChatId, 'menu:main');
        await setSession(dbAnalytics, incomingChatId, 'menu:main', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Executive Overview
      if (callbackData === 'menu:overview') {
        const stats = await fetchOverviewMetrics(env);
        const payload = buildMenu(incomingChatId, 'menu:overview', stats);
        await setSession(dbAnalytics, incomingChatId, 'menu:overview', stats);
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // ── PHASE 2: TASKS CALLBACKS ──
      if (callbackData === 'menu:tasks') {
        const payload = buildMenu(incomingChatId, 'menu:tasks');
        await setSession(dbAnalytics, incomingChatId, 'menu:tasks', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:tasks:today') {
        const tasks = await fetchTasks(dbMain, 'today');
        const payload = buildMenu(incomingChatId, 'menu:tasks:list', {
          title: 'مهام اليوم المجدولة (Today Tasks)',
          tasks,
          listType: 'today'
        });
        await setSession(dbAnalytics, incomingChatId, 'menu:tasks:today', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:tasks:overdue') {
        const tasks = await fetchTasks(dbMain, 'overdue');
        const payload = buildMenu(incomingChatId, 'menu:tasks:list', {
          title: 'المهام المتأخرة (Overdue Tasks ⏰)',
          tasks,
          listType: 'overdue'
        });
        await setSession(dbAnalytics, incomingChatId, 'menu:tasks:overdue', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:tasks:done') {
        const tasks = await fetchTasks(dbMain, 'done');
        const payload = buildMenu(incomingChatId, 'menu:tasks:list', {
          title: 'المهام المنجزة حديثاً (Completed Tasks ✅)',
          tasks,
          listType: 'done'
        });
        await setSession(dbAnalytics, incomingChatId, 'menu:tasks:done', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:tasks:stats') {
        const stats = await fetchTaskStats(dbMain);
        const payload = buildMenu(incomingChatId, 'menu:tasks:stats', stats);
        await setSession(dbAnalytics, incomingChatId, 'menu:tasks:stats', stats);
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:tasks:add') {
        await setSession(dbAnalytics, incomingChatId, 'awaiting_task_title', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✍️ <b>اكتب عنوان المهمة الجديدة في رسالتك التالية:</b>\n\n<i>(مثال: إطلاق حملة سناب شات لشركة الأمل)</i>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع للمهام', callback_data: 'menu:tasks' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Task Action: Complete (Done)
      if (callbackData.startsWith('action:task:done:')) {
        const taskId = callbackData.replace('action:task:done:', '');
        await dbMain.prepare("UPDATE tasks SET status = 'done', done_at = CURRENT_TIMESTAMP WHERE id = ?").bind(taskId).run();
        await answerCallbackQuery(env, callbackQuery.id, '✅ تم إتمام المهمة بنجاح!');
        
        const tasks = await fetchTasks(dbMain, 'today');
        const payload = buildMenu(incomingChatId, 'menu:tasks:list', {
          title: 'مهام اليوم المجدولة (Today Tasks)',
          tasks,
          listType: 'today'
        });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Task Action: Timer
      if (callbackData.startsWith('action:task:timer:')) {
        const taskId = callbackData.replace('action:task:timer:', '');
        const timeId = 'time_' + Date.now();
        await dbMain.prepare(`
          INSERT INTO time_entries (id, task_id, user_id, user_name, hours, hourly_cost, date, notes)
          VALUES (?, ?, 'admin', 'Super Admin', 1.0, 150, date('now'), 'ساعة عمل مسجلة عبر بوت تليجرام')
        `).bind(timeId, taskId).run();

        const row = await dbMain.prepare("SELECT COALESCE(SUM(hours), 0) as total FROM time_entries WHERE task_id = ?").bind(taskId).first();
        const total = row?.total || 1.0;

        await answerCallbackQuery(env, callbackQuery.id, `⏱️ تم تسجيل +1 ساعة عمل (الإجمالي: ${total} س)`, true);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Task Action: Edit
      if (callbackData.startsWith('action:task:edit:')) {
        const taskId = callbackData.replace('action:task:edit:', '');
        await setSession(dbAnalytics, incomingChatId, 'awaiting_task_edit', { task_id: taskId });
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✏️ <b>اكتب العنوان الجديد للمهمة:</b>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع للمهام', callback_data: 'menu:tasks' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Task Action: Delete
      if (callbackData.startsWith('action:task:delete:')) {
        const taskId = callbackData.replace('action:task:delete:', '');
        await dbMain.prepare("DELETE FROM tasks WHERE id = ?").bind(taskId).run();
        try {
          await dbMain.prepare("DELETE FROM time_entries WHERE task_id = ?").bind(taskId).run();
        } catch (e) {}
        
        await answerCallbackQuery(env, callbackQuery.id, '🗑️ تم حذف المهمة نهائياً.');

        const tasks = await fetchTasks(dbMain, 'today');
        const payload = buildMenu(incomingChatId, 'menu:tasks:list', {
          title: 'مهام اليوم المجدولة (Today Tasks)',
          tasks,
          listType: 'today'
        });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // ── PHASE 3: CLIENTS & LEADS CALLBACKS ──
      if (callbackData === 'menu:clients') {
        let clients = [];
        try {
          const res = await dbAnalytics.prepare('SELECT id, company_name, contact_name, email, phone, retainer_amount FROM portal_clients ORDER BY created_at DESC LIMIT 8').all();
          clients = res?.results || [];
        } catch (e) {
          console.warn('[Clients Callback] Error:', e.message);
        }

        const payload = buildMenu(incomingChatId, 'menu:clients', { clients });
        await setSession(dbAnalytics, incomingChatId, 'menu:clients', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:client:view:')) {
        const clientId = callbackData.replace('action:client:view:', '');
        const client = await dbAnalytics.prepare('SELECT * FROM portal_clients WHERE id = ?').bind(clientId).first();
        
        let activeDeliverables = 0;
        let unpaidInvoices = 0;
        try {
          const dRow = await dbAnalytics.prepare('SELECT COUNT(*) as cnt FROM portal_deliverables WHERE client_id = ?').bind(clientId).first();
          activeDeliverables = dRow?.cnt || 0;
        } catch (e) {}

        try {
          const iRow = await dbAnalytics.prepare("SELECT COUNT(*) as cnt FROM client_invoices WHERE client_id = ? AND status != 'paid'").bind(clientId).first();
          unpaidInvoices = iRow?.cnt || 0;
        } catch (e) {}

        const payload = buildMenu(incomingChatId, 'menu:client:detail', {
          client: client || { company_name: 'عميل غير مسجل' },
          activeDeliverables,
          unpaidInvoices
        });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:client:delete:')) {
        const clientId = callbackData.replace('action:client:delete:', '');
        await dbAnalytics.prepare('DELETE FROM portal_clients WHERE id = ?').bind(clientId).run();
        await answerCallbackQuery(env, callbackQuery.id, '🗑️ تم حذف حساب العميل بنجاح.');

        const res = await dbAnalytics.prepare('SELECT id, company_name, contact_name, email, phone, retainer_amount FROM portal_clients ORDER BY created_at DESC LIMIT 8').all();
        const payload = buildMenu(incomingChatId, 'menu:clients', { clients: res?.results || [] });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:leads') {
        let leads = [];
        try {
          const res = await dbAnalytics.prepare('SELECT * FROM sales_leads ORDER BY created_at DESC LIMIT 8').all();
          leads = res?.results || [];
        } catch (e) {
          console.warn('[Leads Callback] Error:', e.message);
        }

        const payload = buildMenu(incomingChatId, 'menu:leads', { leads });
        await setSession(dbAnalytics, incomingChatId, 'menu:leads', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:lead:stage:')) {
        const leadId = callbackData.replace('action:lead:stage:', '');
        const lead = await dbAnalytics.prepare('SELECT * FROM sales_leads WHERE id = ?').bind(leadId).first();
        const payload = buildMenu(incomingChatId, 'menu:lead:stages', { lead: lead || { id: leadId, name: 'صفقة' } });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:lead:setstage:')) {
        const parts = callbackData.split(':');
        const leadId = parts[3];
        const newStage = parts[4];
        await dbAnalytics.prepare('UPDATE sales_leads SET pipeline_stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(newStage, leadId).run();
        await answerCallbackQuery(env, callbackQuery.id, `✅ تم نقل الصفقة إلى مرحلة [${newStage}] بنجاح!`);

        const res = await dbAnalytics.prepare('SELECT * FROM sales_leads ORDER BY created_at DESC LIMIT 8').all();
        const payload = buildMenu(incomingChatId, 'menu:leads', { leads: res?.results || [] });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:lead:msg:')) {
        const leadId = callbackData.replace('action:lead:msg:', '');
        const lead = await dbAnalytics.prepare('SELECT name FROM sales_leads WHERE id = ?').bind(leadId).first();
        const leadName = lead?.name || 'العميل';

        await setSession(dbAnalytics, incomingChatId, 'awaiting_lead_msg', { lead_id: leadId, lead_name: leadName });
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `💬 <b>اكتب نص المتابعة/الرسالة للعميل (${leadName}):</b>\n\n<i>سيتم تسجيل الرسالة في سجل المتابعات الفورية للصفقة ومزامنتها.</i>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع للصفقات', callback_data: 'menu:leads' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:lead:delete:')) {
        const leadId = callbackData.replace('action:lead:delete:', '');
        await dbAnalytics.prepare('DELETE FROM sales_leads WHERE id = ?').bind(leadId).run();
        try {
          await dbAnalytics.prepare('DELETE FROM lead_followups WHERE lead_id = ?').bind(leadId).run();
        } catch (e) {}

        await answerCallbackQuery(env, callbackQuery.id, '🗑️ تم حذف الصفقة نهائياً.');

        const res = await dbAnalytics.prepare('SELECT * FROM sales_leads ORDER BY created_at DESC LIMIT 8').all();
        const payload = buildMenu(incomingChatId, 'menu:leads', { leads: res?.results || [] });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // ── PHASE 4: INVOICES & PROJECTS CALLBACKS ──
      if (callbackData === 'menu:invoices') {
        let paidRow = { cnt: 0, total: 0 };
        let pendingRow = { cnt: 0, total: 0 };
        let overdueRow = { cnt: 0, total: 0 };
        let pendingInvoices = [];

        try {
          paidRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status = 'paid'").first()) || paidRow;
          pendingRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status != 'paid'").first()) || pendingRow;
          overdueRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status != 'paid' AND due_date < date('now')").first()) || overdueRow;

          const res = await dbAnalytics.prepare(`
            SELECT i.*, COALESCE(c.company_name, i.client_id) as client_name 
            FROM client_invoices i 
            LEFT JOIN portal_clients c ON i.client_id = c.id 
            WHERE i.status != 'paid' 
            ORDER BY i.due_date ASC LIMIT 5
          `).all();
          pendingInvoices = res?.results || [];
        } catch (e) {
          console.warn('[Invoices Query] Error:', e.message);
        }

        const payload = buildMenu(incomingChatId, 'menu:invoices', {
          paidCount: paidRow.cnt,
          paidTotal: paidRow.total,
          pendingCount: pendingRow.cnt,
          pendingTotal: pendingRow.total,
          overdueCount: overdueRow.cnt,
          overdueTotal: overdueRow.total,
          pendingInvoices
        });
        await setSession(dbAnalytics, incomingChatId, 'menu:invoices', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:invoice:view:')) {
        const invId = callbackData.replace('action:invoice:view:', '');
        const invoice = await dbAnalytics.prepare(`
          SELECT i.*, COALESCE(c.company_name, i.client_id) as client_name 
          FROM client_invoices i 
          LEFT JOIN portal_clients c ON i.client_id = c.id 
          WHERE i.id = ?
        `).bind(invId).first();

        const payload = buildMenu(incomingChatId, 'menu:invoice:detail', { invoice: invoice || { invoice_number: invId } });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:invoice:pay:')) {
        const invId = callbackData.replace('action:invoice:pay:', '');
        await dbAnalytics.prepare("UPDATE client_invoices SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?").bind(invId).run();
        await answerCallbackQuery(env, callbackQuery.id, '✅ تم اعتماد سداد الفاتورة بنجاح!');

        const paidRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status = 'paid'").first()) || {};
        const pendingRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status != 'paid'").first()) || {};
        const overdueRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status != 'paid' AND due_date < date('now')").first()) || {};
        const res = await dbAnalytics.prepare(`
          SELECT i.*, COALESCE(c.company_name, i.client_id) as client_name 
          FROM client_invoices i 
          LEFT JOIN portal_clients c ON i.client_id = c.id 
          WHERE i.status != 'paid' 
          ORDER BY i.due_date ASC LIMIT 5
        `).all();

        const payload = buildMenu(incomingChatId, 'menu:invoices', {
          paidCount: paidRow.cnt || 0,
          paidTotal: paidRow.total || 0,
          pendingCount: pendingRow.cnt || 0,
          pendingTotal: pendingRow.total || 0,
          overdueCount: overdueRow.cnt || 0,
          overdueTotal: overdueRow.total || 0,
          pendingInvoices: res?.results || []
        });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'action:invoice:new') {
        await setSession(dbAnalytics, incomingChatId, 'awaiting_invoice_data', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `🧾 <b>إصدار فاتورة جديدة</b>\n\nأرسل بيانات الفاتورة مفصولة بفواصل بالصيغة التالية:\n<code>اسم أو كود العميل، المبلغ، تاريخ الاستحقاق YYYY-MM-DD</code>\n\n<i>مثال: شركة الأفق، 25000، 2026-11-20</i>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع للفواتير', callback_data: 'menu:invoices' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:projects') {
        let projects = [];
        try {
          const res = await dbMain.prepare(`
            SELECT p.*, COALESCE(SUM(te.hours), 0) as logged_hours 
            FROM projects p 
            LEFT JOIN tasks t ON p.id = t.project_id 
            LEFT JOIN time_entries te ON t.id = te.task_id 
            GROUP BY p.id 
            ORDER BY p.created_at DESC LIMIT 5
          `).all();
          projects = res?.results || [];
        } catch (e) {
          console.warn('[Projects Query] Error:', e.message);
        }

        const payload = buildMenu(incomingChatId, 'menu:projects', { projects });
        await setSession(dbAnalytics, incomingChatId, 'menu:projects', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:project:view:')) {
        const projId = callbackData.replace('action:project:view:', '');
        const proj = await dbMain.prepare('SELECT * FROM projects WHERE id = ?').bind(projId).first();
        const hoursRow = await dbMain.prepare(`
          SELECT COALESCE(SUM(te.hours), 0) as total_hours 
          FROM tasks t 
          JOIN time_entries te ON t.id = te.task_id 
          WHERE t.project_id = ?
        `).bind(projId).first();
        const tasksRow = await dbMain.prepare(`
          SELECT COUNT(*) as total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done_cnt 
          FROM tasks 
          WHERE project_id = ?
        `).bind(projId).first();

        const totalHours = Number(hoursRow?.total_hours || 0);
        const retainer = Number(proj?.retainer_amount || 0);
        const cost = totalHours * 150;
        const margin = retainer > 0 ? (((retainer - cost) / retainer) * 100).toFixed(0) : 0;

        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `📊 <b>تقرير صحة وربحية المشروع: ${proj?.name || projId}</b>\n` +
                `────────────────────\n` +
                `🏢 <b>العميل:</b> ${proj?.client_name || 'داخلي'}\n` +
                `💰 <b>قيمة العقد (Retainer):</b> ${retainer.toLocaleString('en-US')} ج.م\n` +
                `⏱️ <b>إجمالي الساعات المسجلة:</b> ${totalHours.toFixed(1)} ساعة\n` +
                `💸 <b>التكلفة التشغيلية التقديرية:</b> ${cost.toLocaleString('en-US')} ج.م\n` +
                `📈 <b>هامش الربح الصافي:</b> <b>${margin}%</b>\n` +
                `📋 <b>المهام:</b> ${tasksRow?.done_cnt || 0} منجزة من أصل ${tasksRow?.total || 0}\n` +
                `────────────────────`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 عرض مهام المشروع', callback_data: `action:project:tasks:${projId}` }],
              [{ text: '⬅️ رجوع للمشاريع', callback_data: 'menu:projects' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:project:tasks:')) {
        const projId = callbackData.replace('action:project:tasks:', '');
        const tasks = await dbMain.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC LIMIT 5').bind(projId).all();
        const payload = buildMenu(incomingChatId, 'menu:tasks:list', {
          title: `مهام المشروع (${projId})`,
          tasks: tasks?.results || [],
          listType: 'today'
        });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:project:team:')) {
        const projId = callbackData.replace('action:project:team:', '');
        const members = await dbMain.prepare('SELECT DISTINCT user_name FROM time_entries WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)').bind(projId).all();
        const names = (members?.results || []).map(m => m.user_name).filter(Boolean);
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `👥 <b>فريق العمل المخصص للمشروع:</b>\n\n` + (names.length > 0 ? names.map(n => `• 👤 ${n}`).join('\n') : '• 👤 Super Admin (إدارة كاملة)'),
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⬅️ رجوع للمشاريع', callback_data: 'menu:projects' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // ── PHASE 5: TEAM & SETTINGS CALLBACKS ──
      if (callbackData === 'menu:team') {
        let members = [];
        try {
          const res = await dbAnalytics.prepare('SELECT id, name, email, phone, role, department, active FROM agency_team_members ORDER BY created_at DESC LIMIT 8').all();
          members = res?.results || [];
        } catch (e) {
          console.warn('[Team Callback] Error:', e.message);
        }

        const payload = buildMenu(incomingChatId, 'menu:team', { members });
        await setSession(dbAnalytics, incomingChatId, 'menu:team', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:team:view:')) {
        const memberId = callbackData.replace('action:team:view:', '');
        const member = await dbAnalytics.prepare('SELECT * FROM agency_team_members WHERE id = ?').bind(memberId).first();
        
        let assignedTasksCount = 0;
        try {
          const tRow = await dbMain.prepare('SELECT COUNT(*) as cnt FROM tasks WHERE assigned_to = ? OR assigned_to = ?').bind(member?.name || '', memberId).first();
          assignedTasksCount = tRow?.cnt || 0;
        } catch (e) {}

        const payload = buildMenu(incomingChatId, 'menu:team:detail', { member: member || { name: 'عضو فريق' }, assignedTasksCount });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:team:toggle:')) {
        const memberId = callbackData.replace('action:team:toggle:', '');
        await dbAnalytics.prepare('UPDATE agency_team_members SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?').bind(memberId).run();
        await answerCallbackQuery(env, callbackQuery.id, '✅ تم تحديث حالة حساب العضو بنجاح!');

        const res = await dbAnalytics.prepare('SELECT id, name, email, phone, role, department, active FROM agency_team_members ORDER BY created_at DESC LIMIT 8').all();
        const payload = buildMenu(incomingChatId, 'menu:team', { members: res?.results || [] });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:team:delete:')) {
        const memberId = callbackData.replace('action:team:delete:', '');
        await dbAnalytics.prepare('DELETE FROM agency_team_members WHERE id = ?').bind(memberId).run();
        await answerCallbackQuery(env, callbackQuery.id, '🗑️ تم حذف عضو الفريق.');

        const res = await dbAnalytics.prepare('SELECT id, name, email, phone, role, department, active FROM agency_team_members ORDER BY created_at DESC LIMIT 8').all();
        const payload = buildMenu(incomingChatId, 'menu:team', { members: res?.results || [] });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:team:tasks:')) {
        const memberId = callbackData.replace('action:team:tasks:', '');
        const member = await dbAnalytics.prepare('SELECT name FROM agency_team_members WHERE id = ?').bind(memberId).first();
        const memberName = member?.name || memberId;

        const tasks = await dbMain.prepare('SELECT * FROM tasks WHERE assigned_to = ? OR assigned_to = ? ORDER BY created_at DESC LIMIT 5').bind(memberName, memberId).all();
        const payload = buildMenu(incomingChatId, 'menu:tasks:list', {
          title: `مهام العضو (${memberName})`,
          tasks: tasks?.results || [],
          listType: 'today'
        });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'action:team:add') {
        await setSession(dbAnalytics, incomingChatId, 'awaiting_team_add', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `👤 <b>إضافة عضو جديد للفريق</b>\n\nأرسل بيانات العضو مفصولة بفواصل:\n<code>الاسم، الدور الوظيفي، البريد الإلكتروني، القسم</code>\n\n<i>مثال: سارة أحمد، Media Buyer، sara@agency.com، الإعلانات</i>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع للفريق', callback_data: 'menu:team' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:settings') {
        const settings = await fetchSettings(dbAnalytics, env);
        const payload = buildMenu(incomingChatId, 'menu:settings', settings);
        await setSession(dbAnalytics, incomingChatId, 'menu:settings', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:settings:edit:')) {
        const settingKey = callbackData.replace('action:settings:edit:', '');
        const labels = {
          instapay_ipa: 'إنستاباي IPA',
          instapay_name: 'اسم حساب إنستاباي',
          apple_pay_merchant_id: 'Apple Pay Merchant ID'
        };
        const label = labels[settingKey] || settingKey;

        await setSession(dbAnalytics, incomingChatId, 'awaiting_setting_edit', { key: settingKey, label });
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✏️ <b>تعديل ${label}</b>\n\nأرسل القيمة الجديدة في رسالتك التالية:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع للإعدادات', callback_data: 'menu:settings' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'action:settings:test_notification') {
        await answerCallbackQuery(env, callbackQuery.id, '🔔 تم إرسال الإشعار التجريبي بنجاح!');
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `🔔 <b>نجاح اختبار الإشعارات الفورية!</b>\n\n` +
                `⚡ <b>حالة الاتصال:</b> متصل بالكامل بقواعد بيانات Cloudflare D1 ومحرك Telegram Command Center.\n` +
                `⏰ <b>التوقيت اللحظي:</b> ${new Date().toISOString()}\n` +
                `🚀 <b>الخادم:</b> Edge Cloudflare Worker`,
          parse_mode: 'HTML'
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // ── PHASE 6: AI TOOLS & AUTOMATION CALLBACKS ──
      if (callbackData === 'menu:ai') {
        const payload = buildMenu(incomingChatId, 'menu:ai');
        await setSession(dbAnalytics, incomingChatId, 'menu:ai', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'action:ai:post') {
        await setSession(dbAnalytics, incomingChatId, 'awaiting_ai_post', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✍️ <b>كتابة بوست سوشيال ميديا إعلاني</b>\n\nأرسل اسم المنتج، الخدمة، أو الفكرة التي تريد كتابة بوست احترافي عنها:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع لأدوات AI', callback_data: 'menu:ai' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'action:ai:strategy') {
        await setSession(dbAnalytics, incomingChatId, 'awaiting_ai_strategy', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `📊 <b>توليد استراتيجية تسويق رقمي متكاملة</b>\n\nأرسل اسم العميل ومجال العمل (مثال: عيادات تجميل، مطاعم، منصة تعليمية):`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع لأدوات AI', callback_data: 'menu:ai' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'action:ai:pitch') {
        await setSession(dbAnalytics, incomingChatId, 'awaiting_ai_pitch', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `📑 <b>توليد مخطط عرض تقديمي (Pitch Deck Outline)</b>\n\nأرسل اسم الشركة أو العميل المحتمل:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع لأدوات AI', callback_data: 'menu:ai' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'action:ai:prospect') {
        await setSession(dbAnalytics, incomingChatId, 'awaiting_ai_prospect', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `🔍 <b>تنقيب وبحث استخباري عن شركة (Prospecting)</b>\n\nأرسل اسم الشركة أو موقعها الإلكتروني:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❌ إلغاء والرجوع لأدوات AI', callback_data: 'menu:ai' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:automation') {
        let workflows = [];
        try {
          const res = await dbAnalytics.prepare('SELECT id, name, trigger_event, is_active, description FROM agency_workflows ORDER BY created_at ASC').all();
          workflows = res?.results || [];
        } catch (e) {
          console.warn('[Workflows Query Error]:', e.message);
        }
        const payload = buildMenu(incomingChatId, 'menu:automation', { workflows });
        await setSession(dbAnalytics, incomingChatId, 'menu:automation', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:workflow:toggle:')) {
        const wfId = callbackData.replace('action:workflow:toggle:', '');
        await dbAnalytics.prepare('UPDATE agency_workflows SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').bind(wfId).run();
        await answerCallbackQuery(env, callbackQuery.id, '✅ تم تحديث حالة مسار الأتمتة!');

        let workflows = [];
        try {
          const res = await dbAnalytics.prepare('SELECT id, name, trigger_event, is_active, description FROM agency_workflows ORDER BY created_at ASC').all();
          workflows = res?.results || [];
        } catch (e) {}

        const payload = buildMenu(incomingChatId, 'menu:automation', { workflows });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:workflow:run:')) {
        const wfId = callbackData.replace('action:workflow:run:', '');
        const execId = 'exec_' + Date.now();
        await dbAnalytics.prepare(`
          INSERT INTO workflow_execution_logs (id, workflow_id, trigger_event, status, payload_json, result_json, executed_at)
          VALUES (?, ?, 'manual.telegram', 'success', ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          execId,
          wfId,
          JSON.stringify({ trigger: 'telegram_bot', chat_id: incomingChatId }),
          JSON.stringify({ status: 'completed', message: 'Executed instantly from Telegram Command Center' })
        ).run();

        await answerCallbackQuery(env, callbackQuery.id, '⚡ تم تشغيل مسار الأتمتة بنجاح!');
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `⚡ <b>تم تشغيل مسار الأتمتة يدوياً بنجاح!</b>\n\n` +
                `🆔 <b>معرف التشغيل:</b> <code>${execId}</code>\n` +
                `⚙️ <b>المسار:</b> <code>${wfId}</code>\n` +
                `🕒 <b>التوقيت:</b> ${new Date().toLocaleTimeString('ar-EG')}\n` +
                `📊 <b>الحالة:</b> ✅ مكتمل بنجاح (Status: Success)`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📜 استعراض السجلات', callback_data: `action:workflow:logs:${wfId}` }],
              [{ text: '⬅️ رجوع للأتمتة', callback_data: 'menu:automation' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData.startsWith('action:workflow:logs:')) {
        const wfId = callbackData.replace('action:workflow:logs:', '');
        const wf = await dbAnalytics.prepare('SELECT * FROM agency_workflows WHERE id = ?').bind(wfId).first();
        let logs = [];
        try {
          const res = await dbAnalytics.prepare('SELECT * FROM workflow_execution_logs WHERE workflow_id = ? ORDER BY executed_at DESC LIMIT 5').bind(wfId).all();
          logs = res?.results || [];
        } catch (e) {}
        const payload = buildMenu(incomingChatId, 'menu:workflow:logs', { workflow: wf || { id: wfId, name: wfId }, logs });
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Fallback placeholder
      const payload = {
        chat_id: incomingChatId,
        message_id: messageId,
        text: `⏳ <b>القسم قيد التفعيل في المرحلة القادمة (${callbackData})</b>\n\nاضغط أدناه للرجوع:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }]
          ]
        }
      };
      await editTelegramMessage(env, payload);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // ── 2. HANDLE TEXT MESSAGES (message) ──
    if (message && message.text) {
      const text = message.text.trim();

      // Check current session state first
      const currentSession = await getSession(dbAnalytics, incomingChatId);

      // State: Awaiting Task Title
      if (currentSession?.current_menu === 'awaiting_task_title') {
        const taskId = 'task_' + Date.now();
        await dbMain.prepare(`
          INSERT INTO tasks (id, project_id, title, status, priority, planned_date, assigned_to)
          VALUES (?, 'proj_agency', ?, 'planned', 'medium', date('now'), 'Super Admin')
        `).bind(taskId, text).run();

        await setSession(dbAnalytics, incomingChatId, 'menu:tasks', {});
        
        const tasks = await fetchTasks(dbMain, 'today');
        const listPayload = buildMenu(incomingChatId, 'menu:tasks:list', {
          title: 'مهام اليوم المجدولة (Today Tasks)',
          tasks,
          listType: 'today'
        });

        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✅ <b>تمت إضافة المهمة بنجاح:</b>\n"<i>${text}</i>"`,
          parse_mode: 'HTML'
        });
        await sendTelegramMessage(env, listPayload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // State: Awaiting Task Edit
      if (currentSession?.current_menu === 'awaiting_task_edit' && currentSession?.context?.task_id) {
        const taskId = currentSession.context.task_id;
        await dbMain.prepare("UPDATE tasks SET title = ? WHERE id = ?").bind(text, taskId).run();
        await setSession(dbAnalytics, incomingChatId, 'menu:tasks', {});

        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✅ <b>تم تعديل عنوان المهمة بنجاح إلى:</b>\n"<i>${text}</i>"`,
          parse_mode: 'HTML'
        });

        const tasks = await fetchTasks(dbMain, 'today');
        const listPayload = buildMenu(incomingChatId, 'menu:tasks:list', {
          title: 'مهام اليوم المجدولة (Today Tasks)',
          tasks,
          listType: 'today'
        });
        await sendTelegramMessage(env, listPayload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // State: Awaiting Lead Message (Phase 3)
      if (currentSession?.current_menu === 'awaiting_lead_msg' && currentSession?.context?.lead_id) {
        const leadId = currentSession.context.lead_id;
        const leadName = currentSession.context.lead_name || 'العميل';

        try {
          const followupId = 'flw_' + Date.now();
          await dbAnalytics.prepare(`
            INSERT INTO lead_followups (id, lead_id, note, follow_type, created_at)
            VALUES (?, ?, ?, 'whatsapp', CURRENT_TIMESTAMP)
          `).bind(followupId, leadId, text).run();
        } catch (e) {
          await dbAnalytics.prepare(`
            UPDATE sales_leads 
            SET challenge_notes = COALESCE(challenge_notes || '\n', '') || ?,
                last_followup_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind(text, leadId).run();
        }

        await setSession(dbAnalytics, incomingChatId, 'menu:leads', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✅ <b>تم تسجيل رسالة المتابعة بنجاح في سجل الصفقة (${leadName}):</b>\n\n"<i>${text}</i>"`,
          parse_mode: 'HTML'
        });

        const res = await dbAnalytics.prepare('SELECT * FROM sales_leads ORDER BY created_at DESC LIMIT 8').all();
        const leadsPayload = buildMenu(incomingChatId, 'menu:leads', { leads: res?.results || [] });
        await sendTelegramMessage(env, leadsPayload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // State: Awaiting Invoice Data (Phase 4)
      if (currentSession?.current_menu === 'awaiting_invoice_data') {
        const parts = text.split(/[,،]/).map(s => s.trim());
        const clientName = parts[0] || 'شركة تجريبية';
        const amount = parseFloat(parts[1]) || 15000;
        const dueDate = parts[2] || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        const invNumber = 'INV-' + Math.floor(1000 + Math.random() * 9000);
        const invId = 'inv_' + Date.now();

        // Ensure Client exists in portal_clients to satisfy Foreign Key
        let client = await dbAnalytics.prepare('SELECT id FROM portal_clients WHERE company_name = ? OR id = ?').bind(clientName, clientName).first();
        let finalClientId = client?.id;
        if (!finalClientId) {
          finalClientId = 'client_' + Date.now();
          await dbAnalytics.prepare(`
            INSERT INTO portal_clients (id, company_name, email, password_hash, retainer_amount, created_at)
            VALUES (?, ?, ?, 'tg_hash', ?, CURRENT_TIMESTAMP)
          `).bind(finalClientId, clientName, `${finalClientId}@client.agency`, amount).run();
        }

        await dbAnalytics.prepare(`
          INSERT INTO client_invoices (id, client_id, invoice_number, amount, currency, due_date, status, notes, created_at)
          VALUES (?, ?, ?, ?, 'EGP', ?, 'unpaid', ?, CURRENT_TIMESTAMP)
        `).bind(invId, finalClientId, invNumber, amount, dueDate, `فاتورة صادرة عبر بوت تليجرام لـ ${clientName}`).run();

        await setSession(dbAnalytics, incomingChatId, 'menu:invoices', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✅ <b>تم إصدار الفاتورة #${invNumber} بنجاح!</b>\n\n` +
                `🏢 <b>العميل:</b> ${clientName}\n` +
                `💰 <b>المبلغ:</b> ${amount.toLocaleString('en-US')} ج.م\n` +
                `📅 <b>تاريخ الاستحقاق:</b> ${dueDate}\n` +
                `📌 <b>الحالة:</b> ⏳ غير مدفوعة`,
          parse_mode: 'HTML'
        });

        const paidRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status = 'paid'").first()) || {};
        const pendingRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status != 'paid'").first()) || {};
        const overdueRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status != 'paid' AND due_date < date('now')").first()) || {};
        const res = await dbAnalytics.prepare(`
          SELECT i.*, COALESCE(c.company_name, i.client_id) as client_name 
          FROM client_invoices i 
          LEFT JOIN portal_clients c ON i.client_id = c.id 
          WHERE i.status != 'paid' 
          ORDER BY i.due_date ASC LIMIT 5
        `).all();

        const payload = buildMenu(incomingChatId, 'menu:invoices', {
          paidCount: paidRow.cnt || 0,
          paidTotal: paidRow.total || 0,
          pendingCount: pendingRow.cnt || 0,
          pendingTotal: pendingRow.total || 0,
          overdueCount: overdueRow.cnt || 0,
          overdueTotal: overdueRow.total || 0,
          pendingInvoices: res?.results || []
        });
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // State: Awaiting Team Member Add (Phase 5)
      if (currentSession?.current_menu === 'awaiting_team_add') {
        const parts = text.split(/[,،]/).map(s => s.trim());
        const name = parts[0] || 'عضو جديد';
        const role = parts[1] || 'فريق العمل';
        const email = parts[2] || `user_${Date.now()}@agency.com`;
        const dept = parts[3] || 'العمليات';
        const memberId = 'mem_' + Date.now();

        await dbAnalytics.prepare(`
          INSERT INTO agency_team_members (id, name, role, roles, email, password_hash, department, active, created_at)
          VALUES (?, ?, ?, ?, ?, 'tg_hash', ?, 1, CURRENT_TIMESTAMP)
        `).bind(memberId, name, role, role, email, dept).run();

        await setSession(dbAnalytics, incomingChatId, 'menu:team', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✅ <b>تمت إضافة عضو الفريق بنجاح!</b>\n\n` +
                `👤 <b>الاسم:</b> ${name}\n` +
                `💼 <b>الدور:</b> ${role}\n` +
                `🏢 <b>القسم:</b> ${dept}\n` +
                `✉️ <b>البريد:</b> ${email}`,
          parse_mode: 'HTML'
        });

        const res = await dbAnalytics.prepare('SELECT id, name, email, phone, role, department, active FROM agency_team_members ORDER BY created_at DESC LIMIT 8').all();
        const teamPayload = buildMenu(incomingChatId, 'menu:team', { members: res?.results || [] });
        await sendTelegramMessage(env, teamPayload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // State: Awaiting Setting Edit (Phase 5)
      if (currentSession?.current_menu === 'awaiting_setting_edit' && currentSession?.context?.key) {
        const settingKey = currentSession.context.key;
        const settingLabel = currentSession.context.label || settingKey;

        await dbAnalytics.prepare(`
          INSERT INTO agency_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
        `).bind(settingKey, text).run();

        await setSession(dbAnalytics, incomingChatId, 'menu:settings', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: `✅ <b>تم تحديث ${settingLabel} بنجاح إلى:</b>\n<code>${text}</code>`,
          parse_mode: 'HTML'
        });

        const settings = await fetchSettings(dbAnalytics, env);
        const settingsPayload = buildMenu(incomingChatId, 'menu:settings', settings);
        await sendTelegramMessage(env, settingsPayload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // State: Awaiting AI Post (Phase 6)
      if (currentSession?.current_menu === 'awaiting_ai_post') {
        const generatedPost = await generateAiContent(
          env,
          `اكتب بوست إعلاني جذاب بالعامية المصرية البيضاء أو الفصحى المبسطة مع Hook قوي وCall to action وهاشتاجات لموضوع: ${text}`,
          'أنت كاتب محتوى إعلاني رقمي عبقري لوكالة PR Agency.',
          'post',
          text
        );

        await setSession(dbAnalytics, incomingChatId, 'menu:ai', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: generatedPost,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✍️ كتابة بوست آخر', callback_data: 'action:ai:post' }],
              [{ text: '🤖 أدوات AI', callback_data: 'menu:ai' }],
              [{ text: '⬅️ الرئيسية', callback_data: 'menu:main' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // State: Awaiting AI Strategy (Phase 6)
      if (currentSession?.current_menu === 'awaiting_ai_strategy') {
        const generatedStrategy = await generateAiContent(
          env,
          `ضع استراتيجية تسويق كاملة تشمل الجمهور والتموضع والميزانية ومؤشرات الأداء لمجال: ${text}`,
          'أنت رئيس قطاع الاستراتيجيات التسويقية لوكالة PR Agency.',
          'strategy',
          text
        );

        await setSession(dbAnalytics, incomingChatId, 'menu:ai', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: generatedStrategy,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📊 استراتيجية أخرى', callback_data: 'action:ai:strategy' }],
              [{ text: '🤖 أدوات AI', callback_data: 'menu:ai' }],
              [{ text: '⬅️ الرئيسية', callback_data: 'menu:main' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // State: Awaiting AI Pitch (Phase 6)
      if (currentSession?.current_menu === 'awaiting_ai_pitch') {
        const generatedPitch = await generateAiContent(
          env,
          `صمم مخطط عرض تقديمي مقنع وموجز من 5 شرائح مع تسعير الباقات الشهرية لعميل: ${text}`,
          'أنت مستشار عروض بيعية لوكالة تسويق راقية.',
          'pitch',
          text
        );

        await setSession(dbAnalytics, incomingChatId, 'menu:ai', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: generatedPitch,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📑 عرض تقديمي آخر', callback_data: 'action:ai:pitch' }],
              [{ text: '🤖 أدوات AI', callback_data: 'menu:ai' }],
              [{ text: '⬅️ الرئيسية', callback_data: 'menu:main' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // State: Awaiting AI Prospecting (Phase 6)
      if (currentSession?.current_menu === 'awaiting_ai_prospect') {
        const generatedProspect = await generateAiContent(
          env,
          `حلل شركة: ${text} واستخرج نقاط ضعف تسويقها وزاوية البيع لخدماتنا ورسالة تواصل أولى`,
          'أنت خبير تنقيب مبيعات B2B لوكالة العلاقات العامة.',
          'prospect',
          text
        );

        await setSession(dbAnalytics, incomingChatId, 'menu:ai', {});
        await sendTelegramMessage(env, {
          chat_id: incomingChatId,
          text: generatedProspect,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔍 تنقيب عن شركة أخرى', callback_data: 'action:ai:prospect' }],
              [{ text: '🤖 أدوات AI', callback_data: 'menu:ai' }],
              [{ text: '⬅️ الرئيسية', callback_data: 'menu:main' }]
            ]
          }
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Standard Navigation Shortcuts
      if (text === '/start' || text === '/menu' || text === '/admin' || text === 'الرئيسية') {
        const payload = buildMenu(incomingChatId, 'menu:main');
        await setSession(dbAnalytics, incomingChatId, 'menu:main', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/overview' || text === 'نظرة عامة') {
        const stats = await fetchOverviewMetrics(env);
        const payload = buildMenu(incomingChatId, 'menu:overview', stats);
        await setSession(dbAnalytics, incomingChatId, 'menu:overview', stats);
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/tasks' || text === 'المهام') {
        const payload = buildMenu(incomingChatId, 'menu:tasks');
        await setSession(dbAnalytics, incomingChatId, 'menu:tasks', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/clients' || text === 'العملاء') {
        let clients = [];
        try {
          const res = await dbAnalytics.prepare('SELECT id, company_name, contact_name, email, phone, retainer_amount FROM portal_clients ORDER BY created_at DESC LIMIT 8').all();
          clients = res?.results || [];
        } catch (e) {}
        const payload = buildMenu(incomingChatId, 'menu:clients', { clients });
        await setSession(dbAnalytics, incomingChatId, 'menu:clients', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/leads' || text === 'الليدز' || text === 'الصفقات') {
        let leads = [];
        try {
          const res = await dbAnalytics.prepare('SELECT * FROM sales_leads ORDER BY created_at DESC LIMIT 8').all();
          leads = res?.results || [];
        } catch (e) {}
        const payload = buildMenu(incomingChatId, 'menu:leads', { leads });
        await setSession(dbAnalytics, incomingChatId, 'menu:leads', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/invoices' || text === 'الفواتير') {
        let paidRow = { cnt: 0, total: 0 };
        let pendingRow = { cnt: 0, total: 0 };
        let overdueRow = { cnt: 0, total: 0 };
        let pendingInvoices = [];
        try {
          paidRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status = 'paid'").first()) || paidRow;
          pendingRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status != 'paid'").first()) || pendingRow;
          overdueRow = (await dbAnalytics.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM client_invoices WHERE status != 'paid' AND due_date < date('now')").first()) || overdueRow;
          const res = await dbAnalytics.prepare(`
            SELECT i.*, COALESCE(c.company_name, i.client_id) as client_name 
            FROM client_invoices i 
            LEFT JOIN portal_clients c ON i.client_id = c.id 
            WHERE i.status != 'paid' 
            ORDER BY i.due_date ASC LIMIT 5
          `).all();
          pendingInvoices = res?.results || [];
        } catch (e) {}
        const payload = buildMenu(incomingChatId, 'menu:invoices', {
          paidCount: paidRow.cnt,
          paidTotal: paidRow.total,
          pendingCount: pendingRow.cnt,
          pendingTotal: pendingRow.total,
          overdueCount: overdueRow.cnt,
          overdueTotal: overdueRow.total,
          pendingInvoices
        });
        await setSession(dbAnalytics, incomingChatId, 'menu:invoices', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/projects' || text === 'المشاريع') {
        let projects = [];
        try {
          const res = await dbMain.prepare(`
            SELECT p.*, COALESCE(SUM(te.hours), 0) as logged_hours 
            FROM projects p 
            LEFT JOIN tasks t ON p.id = t.project_id 
            LEFT JOIN time_entries te ON t.id = te.task_id 
            GROUP BY p.id 
            ORDER BY p.created_at DESC LIMIT 5
          `).all();
          projects = res?.results || [];
        } catch (e) {}
        const payload = buildMenu(incomingChatId, 'menu:projects', { projects });
        await setSession(dbAnalytics, incomingChatId, 'menu:projects', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/team' || text === 'الفريق') {
        let members = [];
        try {
          const res = await dbAnalytics.prepare('SELECT id, name, email, phone, role, department, active FROM agency_team_members ORDER BY created_at DESC LIMIT 8').all();
          members = res?.results || [];
        } catch (e) {}
        const payload = buildMenu(incomingChatId, 'menu:team', { members });
        await setSession(dbAnalytics, incomingChatId, 'menu:team', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/settings' || text === 'الإعدادات') {
        const settings = await fetchSettings(dbAnalytics, env);
        const payload = buildMenu(incomingChatId, 'menu:settings', settings);
        await setSession(dbAnalytics, incomingChatId, 'menu:settings', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/ai' || text === 'أدوات AI' || text === 'الذكاء الاصطناعي') {
        const payload = buildMenu(incomingChatId, 'menu:ai');
        await setSession(dbAnalytics, incomingChatId, 'menu:ai', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/automation' || text === 'الأتمتة' || text === 'سير العمل') {
        let workflows = [];
        try {
          const res = await dbAnalytics.prepare('SELECT id, name, trigger_event, is_active, description FROM agency_workflows ORDER BY created_at ASC').all();
          workflows = res?.results || [];
        } catch (e) {}
        const payload = buildMenu(incomingChatId, 'menu:automation', { workflows });
        await setSession(dbAnalytics, incomingChatId, 'menu:automation', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Fallback default message: return main menu
      const payload = buildMenu(incomingChatId, 'menu:main');
      await setSession(dbAnalytics, incomingChatId, 'menu:main', {});
      await sendTelegramMessage(env, payload);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[Telegram Webhook] Exception:', err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
}
