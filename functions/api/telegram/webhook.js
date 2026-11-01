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
      // 1. Total Clients
      try {
        const clientRow = await dbAnalytics.prepare('SELECT COUNT(*) as cnt FROM portal_clients').first();
        totalClients = clientRow?.cnt || 0;
      } catch (e) {
        const fallbackClient = await dbMain.prepare('SELECT COUNT(*) as cnt FROM clients').first();
        totalClients = fallbackClient?.cnt || 0;
      }

      // 2. Paid Invoices This Month
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

      // 3. New Leads This Week
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

    // 4. Active Tasks from DB
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

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

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

      // Route based on callback_data
      if (callbackData === 'menu:main') {
        const payload = buildMenu(incomingChatId, 'menu:main');
        await setSession(db, incomingChatId, 'menu:main', {});
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (callbackData === 'menu:overview') {
        const stats = await fetchOverviewMetrics(env);
        const payload = buildMenu(incomingChatId, 'menu:overview', stats);
        await setSession(db, incomingChatId, 'menu:overview', stats);
        await editTelegramMessage(env, { ...payload, message_id: messageId });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Temporary placeholder for sub-menus during sequential phase rollouts
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

      // Standard Navigation Shortcuts
      if (text === '/start' || text === '/menu' || text === '/admin' || text === 'الرئيسية') {
        const payload = buildMenu(incomingChatId, 'menu:main');
        await setSession(db, incomingChatId, 'menu:main', {});
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (text === '/overview' || text === 'نظرة عامة') {
        const stats = await fetchOverviewMetrics(env);
        const payload = buildMenu(incomingChatId, 'menu:overview', stats);
        await setSession(db, incomingChatId, 'menu:overview', stats);
        await sendTelegramMessage(env, payload);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Fallback default message: return main menu
      const payload = buildMenu(incomingChatId, 'menu:main');
      await setSession(db, incomingChatId, 'menu:main', {});
      await sendTelegramMessage(env, payload);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[Telegram Webhook] Exception:', err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
}
