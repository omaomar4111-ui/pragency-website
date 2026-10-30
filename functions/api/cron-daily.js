// ── Cron: runs daily to mark overdue invoices & send Telegram alerts ──────────
// Registered in wrangler.toml as: [triggers] crons = ["0 9 * * *"]
// Route: functions/api/cron.js (already exists; merge the invoices check in)

export async function onRequestGet(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'No DB' }), { status: 500 });

  const results = { overdue_marked: 0, reminders_sent: 0, errors: [] };
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Mark overdue invoices
    const overdueResult = await db.prepare(`
      UPDATE client_invoices SET status = 'overdue'
      WHERE status = 'pending' AND due_date < ?
    `).bind(today).run();
    results.overdue_marked = overdueResult.changes || 0;

    // 2. Get all overdue invoices that haven't had a reminder in 3+ days
    const overdueInvoices = await db.prepare(`
      SELECT ci.*, pc.company_name, pc.email, pc.phone
      FROM client_invoices ci
      JOIN portal_clients pc ON pc.id = ci.client_id
      WHERE ci.status = 'overdue'
        AND (ci.reminder_sent_at IS NULL OR ci.reminder_sent_at < date('now', '-3 days'))
      LIMIT 20
    `).all();

    if (overdueInvoices.results && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      for (const inv of overdueInvoices.results) {
        const msg = `🚨 *فاتورة متأخرة — تذكير تلقائي*\n\n🏢 ${inv.company_name}\n📧 ${inv.email}\n📱 ${inv.phone || 'غير متاح'}\n\n🧾 *فاتورة:* ${inv.invoice_number}\n💰 *المبلغ:* ${inv.amount} ${inv.currency}\n📅 *كانت مستحقة في:* ${inv.due_date}`;
        try {
          await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' })
          });
          await db.prepare('UPDATE client_invoices SET reminder_sent_at = ? WHERE id = ?').bind(new Date().toISOString(), inv.id).run();
          results.reminders_sent++;
        } catch (e) {
          results.errors.push(e.message);
        }
      }
    }

    // 3. Check overdue sales followups
    const overdueFollowups = await db.prepare(`
      SELECT sl.id, sl.name, sl.phone, sl.assigned_sales_name, sl.next_followup_due
      FROM sales_leads sl
      WHERE sl.next_followup_due < date('now')
        AND sl.pipeline_stage NOT IN ('won', 'lost')
        AND sl.followup_status != 'completed'
      LIMIT 10
    `).all();

    if (overdueFollowups.results && overdueFollowups.results.length > 0 && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const lines = overdueFollowups.results.map(l =>
        `• ${l.name} (${l.phone}) — مسؤول: ${l.assigned_sales_name || 'غير محدد'} — كان المفروض يتواصل معاه في: ${l.next_followup_due}`
      ).join('\n');

      const msg = `⏰ *متابعات متأخرة — ${overdueFollowups.results.length} عميل*\n\n${lines}`;
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' })
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
