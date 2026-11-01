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
