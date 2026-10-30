// functions/_scheduled.js
// Cloudflare Pages Scheduled Worker hook for Cron Triggers:
// 1. Reminders for overdue tasks, unpaid invoices, and stale leads
// 2. Automated Recurring Invoicing for active clients whose billing cycle is due today

import { handleRemindersCron } from './api/cron-reminders.js';
import { logSystemAction } from './lib/audit.js';

export async function handleRecurringInvoices(env) {
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return { generated: 0, errors: [] };

  const today = new Date();
  const currentDayOfMonth = today.getDate(); // 1 to 31
  const dateStr = today.toISOString().slice(0, 10);
  const datePart = today.toISOString().slice(0, 7).replace('-', '');
  const dueDateStr = new Date(Date.now() + 14 * 86400 * 1000).toISOString().slice(0, 10);

  const results = { generated: 0, client_invoices: [], errors: [] };

  try {
    // 1. Query active clients whose billing_day matches today (or default to 1st of month)
    const clients = await db.prepare(`
      SELECT id, company_name, email, phone, billing_day, retainer_amount
      FROM portal_clients
      WHERE active = 1 AND (billing_day = ? OR (billing_day IS NULL AND ? = 1)) AND retainer_amount > 0
    `).bind(currentDayOfMonth, currentDayOfMonth).all();

    const clientList = clients.results || [];

    for (const client of clientList) {
      // Check if invoice already issued for this client this month
      const existing = await db.prepare(`
        SELECT id FROM client_invoices
        WHERE client_id = ? AND created_at LIKE ?
      `).bind(client.id, `${today.toISOString().slice(0, 7)}%`).first();

      if (!existing) {
        const id = 'inv_rec_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        const count = await db.prepare('SELECT COUNT(*) as count FROM client_invoices').first();
        const seq = String((count?.count || 0) + 1).padStart(4, '0');
        const invNum = `INV-${datePart}-${seq}`;
        const amount = Number(client.retainer_amount) || 15000;

        await db.prepare(`
          INSERT INTO client_invoices (id, client_id, invoice_number, amount, currency, due_date, status, notes, created_at)
          VALUES (?, ?, ?, ?, 'EGP', ?, 'pending', 'فاتورة تجديد الاشتراك الشهري التلقائي', ?)
        `).bind(id, client.id, invNum, amount, dueDateStr, new Date().toISOString()).run();

        results.generated++;
        results.client_invoices.push({ id, client: client.company_name, invoice_number: invNum, amount });

        // Log to audit
        await logSystemAction(db, {
          actor_id: 'system_cron',
          actor_name: 'Automated Billing Engine',
          actor_role: 'system',
          action: 'recurring_invoice_generated',
          target_type: 'invoice',
          target_id: id,
          client_id: client.id,
          details: { invoice_number: invNum, amount, billing_day: currentDayOfMonth }
        });

        // Notify Super Admin on Telegram
        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
          const teleMsg = `🧾 *إصدار فاتورة اشتراك شهري تلقائية (Cron Recurring Billing)*\n\n🏢 *العميل:* ${client.company_name}\n📄 *رقم الفاتورة:* #${invNum}\n💵 *المبلغ:* *${amount.toLocaleString()} EGP*\n📅 *تاريخ الاستحقاق:* \`${dueDateStr}\`\n\n🔗 تم إدراجها في لوحة تحكم العميل لسدادها أونلاين.`;
          fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: teleMsg, parse_mode: 'Markdown' })
          }).catch(() => {});
        }
      }
    }

  } catch (err) {
    results.errors.push(err.message);
  }

  return results;
}

export async function onScheduled(event, env, ctx) {
  ctx.waitUntil(Promise.all([
    handleRemindersCron(env),
    handleRecurringInvoices(env)
  ]));
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(Promise.all([
      handleRemindersCron(env),
      handleRecurringInvoices(env)
    ]));
  }
};
