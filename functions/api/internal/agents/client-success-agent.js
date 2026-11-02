// functions/api/internal/agents/client-success-agent.js
// Autonomous Client Success AI Agent — Churn Prevention & Retention Engine
import { sendTelegramNotification } from '../../../lib/telegram.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

/**
 * Core Execution Engine for Client Success Agent
 * Detects:
 * 1. Overdue invoices (> 7 days)
 * 2. Inactive clients with no tasks in > 14 days
 * 3. Low engagement clients (> 21 days)
 */
export async function runClientSuccessAgent(env) {
  const dbAnalytics = env.ANALYTICS_DB || env.DB;
  const dbMain = env.DB || env.ANALYTICS_DB;

  const alerts = [];

  try {
    // 1. Check for clients with overdue invoices (> 7 days)
    const overdueInvoices = await dbAnalytics.prepare(`
      SELECT i.id, i.invoice_number, i.amount, i.due_date, i.client_id,
             COALESCE(c.company_name, i.client_id) as client_name,
             c.contact_name, c.phone, c.email
      FROM client_invoices i
      LEFT JOIN portal_clients c ON i.client_id = c.id
      WHERE i.status != 'paid' AND i.due_date < date('now', '-7 days')
      LIMIT 5
    `).all();

    for (const inv of overdueInvoices?.results || []) {
      const actionId = 'act_churn_inv_' + inv.id;
      const clientName = inv.client_name || 'عميل الوكالة';
      const amount = Number(inv.amount || 0).toLocaleString('en-US');

      const draftContent = 
`⚠️ <b>تنبيه مخاطر تسرب العميل (Churn Risk Alert) | فاتورة متأخرة</b>
────────────────────
🏢 <b>العميل:</b> ${clientName}
🧾 <b>رقم الفاتورة:</b> ${inv.invoice_number}
💰 <b>المبلغ المستحق:</b> ${amount} ج.م
📅 <b>تاريخ الاستحقاق:</b> ${inv.due_date} (متأخرة لأكثر من 7 أيام)
👤 <b>مسؤول الاتصال:</b> ${inv.contact_name || 'غير محدد'} (${inv.phone || 'بدون هاتف'})

💡 <b>توصية وكيل نجاح العملاء (Retention Playbook):</b>
• التواصل الهاتفي الودي المباشر مع المدير المالي للعميل وتأكيد استمرارية الخدمات.
• تقديم خيار السداد الفوري عبر إنستاباي أو جدولة دفعة أولى لضمان عدم توقف الحملات.`;

      // Check if alert already exists for this invoice
      const existing = await dbAnalytics.prepare('SELECT id FROM agent_pending_actions WHERE id = ?').bind(actionId).first();
      if (!existing) {
        await dbAnalytics.prepare(`
          INSERT INTO agent_pending_actions (
            id, agent_type, lead_id, lead_name, lead_company, lead_phone, lead_email, action_type, draft_content, status, related_id, created_at, updated_at
          ) VALUES (?, 'client_success', ?, ?, ?, ?, ?, 'churn_risk', ?, 'pending_approval', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          actionId,
          inv.client_id,
          inv.contact_name || clientName,
          clientName,
          inv.phone || '',
          inv.email || '',
          draftContent,
          inv.client_id
        ).run();

        // Send Telegram Notification
        await sendTelegramNotification(env, draftContent, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📞 اتصل بالعميل', callback_data: `action:agent:call_client:${actionId}` },
                { text: '📧 إرسال تذكير سداد', callback_data: `action:agent:send_reminder:${actionId}` }
              ],
              [
                { text: '❌ تجاهل التنبيه', callback_data: `action:agent:reject:${actionId}` }
              ]
            ]
          }
        });

        alerts.push({ id: actionId, type: 'overdue_invoice', client: clientName });
      }
    }

    // 2. Check for clients with no task activity in > 14 days
    const allClients = await dbAnalytics.prepare('SELECT id, company_name, contact_name, phone, email FROM portal_clients LIMIT 20').all();
    for (const c of allClients?.results || []) {
      const recentTask = await dbMain.prepare(`
        SELECT id FROM tasks 
        WHERE (project_id = ? OR project_id LIKE ?) 
          AND created_at >= date('now', '-14 days')
        LIMIT 1
      `).bind(c.id, `%${c.company_name}%`).first();

      if (!recentTask) {
        const actionId = 'act_churn_inactivity_' + c.id;
        const draftContent = 
`⚠️ <b>تنبيه ركود النشاط (Activity Drop Alert) | لا توجد مهام جديدة</b>
────────────────────
🏢 <b>العميل:</b> ${c.company_name}
👤 <b>المسؤول:</b> ${c.contact_name || 'مسؤول الحساب'}
📱 <b>الهاتف:</b> ${c.phone || 'غير مسجل'}
⏳ <b>الحالة:</b> لا توجد أي مهام أو مخرجات إعلانية مسجلة خلال آخر 14 يوماً!

💡 <b>توصية وكيل نجاح العملاء:</b>
• إعداد تقرير إنجازات نصف شهري وعرض باقة أفكار جديدة (Upsell & Retention).
• جدولة اجتماع مراجعة أداء دوري (Quarterly Business Review) لتجديد العقد الشهري.`;

        const existing = await dbAnalytics.prepare('SELECT id FROM agent_pending_actions WHERE id = ?').bind(actionId).first();
        if (!existing) {
          await dbAnalytics.prepare(`
            INSERT INTO agent_pending_actions (
              id, agent_type, lead_id, lead_name, lead_company, lead_phone, lead_email, action_type, draft_content, status, related_id, created_at, updated_at
            ) VALUES (?, 'client_success', ?, ?, ?, ?, ?, 'churn_risk', ?, 'pending_approval', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(
            actionId,
            c.id,
            c.contact_name || c.company_name,
            c.company_name,
            c.phone || '',
            c.email || '',
            draftContent,
            c.id
          ).run();

          await sendTelegramNotification(env, draftContent, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📞 اتصل بالعميل', callback_data: `action:agent:call_client:${actionId}` },
                  { text: '📧 إرسال مقترح تنشيط', callback_data: `action:agent:send_reminder:${actionId}` }
                ],
                [
                  { text: '❌ تجاهل', callback_data: `action:agent:reject:${actionId}` }
                ]
              ]
            }
          });

          alerts.push({ id: actionId, type: 'no_task_activity', client: c.company_name });
        }
      }
    }

    return {
      success: true,
      scannedClients: allClients?.results?.length || 0,
      newAlertsCreated: alerts.length,
      alerts
    };
  } catch (err) {
    console.error('[Client Success Agent Error]:', err.message);
    return { success: false, error: err.message };
  }
}

export async function onRequestPost(context) {
  const { env } = context;
  const res = await runClientSuccessAgent(env);
  return jsonResponse(res);
}

export async function onRequestGet(context) {
  const { env } = context;
  const res = await runClientSuccessAgent(env);
  return jsonResponse(res);
}
