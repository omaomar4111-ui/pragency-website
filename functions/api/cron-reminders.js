// functions/api/cron-reminders.js
// Cloudflare Cron Trigger / Scheduled Execution Worker for Agency OS
// Handles overdue tasks, unpaid past-due invoices, and leads without followup in 48 hours

export async function handleRemindersCron(env) {
  const dbAnalytics = env.ANALYTICS_DB || env.DB;
  const dbTasks = env.DB || env.ANALYTICS_DB;

  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const report = {
    timestamp: nowIso,
    overdue_tasks: [],
    unpaid_invoices: [],
    stale_leads: [],
    telegram_sent: false
  };

  // 1. Overdue Tasks from 2d-marketing-db (status != 'done' AND planned_date < today)
  if (dbTasks) {
    try {
      const tasksRes = await dbTasks.prepare(`
        SELECT t.id, t.title, t.priority, t.planned_date, t.assigned_to, p.name as project_name
        FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.status != 'done' AND t.planned_date IS NOT NULL AND t.planned_date < ?
        ORDER BY t.planned_date ASC
        LIMIT 15
      `).bind(today).all();
      report.overdue_tasks = tasksRes.results || [];
    } catch (e) {
      console.error('[Cron] Error querying overdue tasks:', e.message);
    }
  }

  // 2. Unpaid Past-Due Invoices from pragency-analytics
  if (dbAnalytics) {
    try {
      const invRes = await dbAnalytics.prepare(`
        SELECT ci.id, ci.invoice_number, ci.amount, ci.currency, ci.due_date, pc.company_name
        FROM client_invoices ci
        LEFT JOIN portal_clients pc ON pc.id = ci.client_id
        WHERE ci.status != 'paid' AND ci.due_date < ?
        ORDER BY ci.due_date ASC
        LIMIT 10
      `).bind(today).all();
      report.unpaid_invoices = invRes.results || [];
    } catch (e) {
      console.error('[Cron] Error querying unpaid invoices:', e.message);
    }

    // 3. Leads without follow-up in the last 48 hours
    try {
      const leadsRes = await dbAnalytics.prepare(`
        SELECT id, name, phone, project_name, pipeline_stage, assigned_sales_name, created_at, last_followup_at
        FROM sales_leads
        WHERE pipeline_stage NOT IN ('won', 'lost')
          AND (
            (last_followup_at IS NOT NULL AND last_followup_at < ?)
            OR
            (last_followup_at IS NULL AND created_at < ?)
          )
        ORDER BY created_at ASC
        LIMIT 10
      `).bind(fortyEightHoursAgo, fortyEightHoursAgo).all();
      report.stale_leads = leadsRes.results || [];
    } catch (e) {
      console.error('[Cron] Error querying stale leads:', e.message);
    }
  }

  // 4. Send Consolidated Alert via Telegram if there are items
  const totalAlerts = report.overdue_tasks.length + report.unpaid_invoices.length + report.stale_leads.length;

  if (totalAlerts > 0 && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    let msg = `🚨 *تقرير التنبيهات الدورية للنظام (Automated Agency OS Cron)*\n`;
    msg += `📅 التاريخ: \`${today}\`\n\n`;

    if (report.overdue_tasks.length > 0) {
      msg += `📌 *المهام المتأخرة (${report.overdue_tasks.length}):*\n`;
      report.overdue_tasks.slice(0, 5).forEach((t, i) => {
        msg += `${i + 1}. *${t.title}* (${t.project_name || 'بدون مشروع'})\n   الموعد: \`${t.planned_date}\` | المعين: ${t.assigned_to || 'غير محدد'}\n`;
      });
      if (report.overdue_tasks.length > 5) msg += `   ... و${report.overdue_tasks.length - 5} مهام أخرى\n`;
      msg += `\n`;
    }

    if (report.unpaid_invoices.length > 0) {
      msg += `🧾 *الفواتير المتأخرة المستحقة (${report.unpaid_invoices.length}):*\n`;
      report.unpaid_invoices.slice(0, 5).forEach((inv, i) => {
        msg += `${i + 1}. *#${inv.invoice_number}* - ${inv.company_name || 'عميل'}\n   المبلغ: *${Number(inv.amount).toLocaleString()} ${inv.currency}* | الاستحقاق: \`${inv.due_date}\`\n`;
      });
      if (report.unpaid_invoices.length > 5) msg += `   ... و${report.unpaid_invoices.length - 5} فواتير أخرى\n`;
      msg += `\n`;
    }

    if (report.stale_leads.length > 0) {
      msg += `💼 *ليدز بدون متابعة لأكثر من 48 ساعة (${report.stale_leads.length}):*\n`;
      report.stale_leads.slice(0, 5).forEach((l, i) => {
        msg += `${i + 1}. *${l.name}* (${l.phone})\n   المسؤول: ${l.assigned_sales_name || 'غير معين'} | المرحلة: ${l.pipeline_stage}\n`;
      });
      if (report.stale_leads.length > 5) msg += `   ... و${report.stale_leads.length - 5} عملاء آخرين\n`;
    }

    try {
      const teleRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: msg,
          parse_mode: 'Markdown'
        })
      });
      report.telegram_sent = teleRes.ok;
    } catch (e) {
      console.error('[Cron] Telegram notification failed:', e.message);
    }
  }

  return report;
}

// Support HTTP GET trigger as well for testing or external monitoring (e.g., UptimeRobot)
export async function onRequestGet(context) {
  const { env } = context;
  const result = await handleRemindersCron(env);
  return new Response(JSON.stringify({ success: true, result }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
