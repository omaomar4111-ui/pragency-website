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

      // Temporary placeholder for sub-menus during subsequent sequential phases
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
