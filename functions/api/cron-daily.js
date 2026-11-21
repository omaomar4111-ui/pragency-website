// ── Proactive Agency AI Cron: Runs Daily Orchestration & Autonomous Agents ──────────
// Registered in wrangler.toml as: [triggers] crons = ["0 9 * * *"]
// Proactively executes:
// 1. Client Invoices & Overdue Reminders
// 2. Sales Leads & Follow-ups Check
// 3. Autonomous Sales AI Agent (Scans uncontacted high-intent leads & crafts pitches)
// 4. Autonomous Client Success AI Agent (Scans churn risks, invoice delays & inactivity)
// 5. Autonomous Creative Director AI Agent (Generates proactive briefs & content ideas)

import { runSalesAgent } from './internal/agents/sales-agent.js';
import { runClientSuccessAgent } from './internal/agents/client-success-agent.js';
import { runCreativeAgentProactive } from './internal/agents/creative-agent.js';

export async function onRequestGet(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'No DB' }), { status: 500 });

  const results = {
    timestamp: new Date().toISOString(),
    overdue_marked: 0,
    reminders_sent: 0,
    sales_agent_actions: 0,
    client_success_alerts: 0,
    creative_agent_briefs: 0,
    errors: []
  };

  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Mark overdue invoices
    try {
      const overdueResult = await db.prepare(`
        UPDATE client_invoices SET status = 'overdue'
        WHERE status = 'pending' AND due_date < ?
      `).bind(today).run();
      results.overdue_marked = overdueResult.changes || 0;
    } catch (e) {
      results.errors.push('Overdue invoices update: ' + e.message);
    }

    // 2. Send reminders for overdue invoices that haven't had a reminder in 3+ days
    try {
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
    } catch (e) {
      results.errors.push('Overdue reminders: ' + e.message);
    }

    // 3. Check overdue sales followups
    try {
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
          `• ${l.name} (${l.phone}) — مسؤول: ${l.assigned_sales_name || 'غير محدد'} — موعد التواصل: ${l.next_followup_due}`
        ).join('\n');

        const msg = `⏰ *متابعات متأخرة — ${overdueFollowups.results.length} عميل محتمل*\n\n${lines}`;
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' })
        }).catch(() => {});
      }
    } catch (e) {
      results.errors.push('Followup checks: ' + e.message);
    }

    // ── 4. PROACTIVE AI AGENT 1: Autonomous Sales AI Agent ──
    try {
      const salesRes = await runSalesAgent(env);
      if (salesRes && salesRes.success) {
        results.sales_agent_actions = salesRes.actions_created || 0;
      }
    } catch (e) {
      results.errors.push('Sales Agent: ' + e.message);
    }

    // ── 5. PROACTIVE AI AGENT 2: Client Success & Retention Guardian ──
    try {
      const successRes = await runClientSuccessAgent(env);
      if (successRes && successRes.success) {
        results.client_success_alerts = successRes.newAlertsCreated || 0;
      }
    } catch (e) {
      results.errors.push('Client Success Agent: ' + e.message);
    }

    // ── 6. PROACTIVE AI AGENT 3: Creative Director AI Agent ──
    try {
      const creativeRes = await runCreativeAgentProactive(env);
      if (creativeRes && creativeRes.success) {
        results.creative_agent_briefs = creativeRes.proactive_generated || 0;
      }
    } catch (e) {
      results.errors.push('Creative Agent: ' + e.message);
    }

    // 7. Send Daily Executive Summary to Telegram if any proactive actions were generated
    const totalNewActions = results.sales_agent_actions + results.client_success_alerts + results.creative_agent_briefs;
    if (totalNewActions > 0 && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const summaryMsg = 
`🚀 <b>التقرير الصباحي للوكيل الذكي الاستباقي (AI Copilot Summary)</b>
────────────────────
🎯 <b>وكيل المبيعات:</b> جهز ${results.sales_agent_actions} مسودة تواصل جديدة
🛡️ <b>حماية العملاء (Churn):</b> رصد ${results.client_success_alerts} تنبيهات متابعة
🎨 <b>المدير الإبداعي:</b> ولد ${results.creative_agent_briefs} أفكار وبريفات إعلانية

⚡ <i>جميع الإجراءات بانتظار اعتمادك بنقرة واحدة من لوحة التحكم أو تليجرام.</i>`;

      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: summaryMsg,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💼 فتح مركز الوكلاء باللوحة', url: 'https://pragency.pages.dev/admin-agency.html#tab-agents' }]
            ]
          }
        })
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
