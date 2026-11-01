// functions/api/admin/agent-actions.js
// Admin Human-in-the-Loop review for Autonomous AI Agent actions
import { sendEmail } from '../../lib/email.js';
import { logSystemAction } from '../../lib/audit.js';

function jsonOk(data) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

// ── GET /api/admin/agent-actions ──
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) return jsonError('Database not available', 500);

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status');

  try {
    let query = `
      SELECT * FROM agent_pending_actions
    `;
    const params = [];

    if (statusFilter && statusFilter !== 'all') {
      query += ` WHERE status = ?`;
      params.push(statusFilter);
    }

    query += ` ORDER BY CASE WHEN status = 'pending_approval' THEN 0 ELSE 1 END, created_at DESC LIMIT 100`;

    const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
    const { results } = await stmt.all();

    // Stats count
    const statsRes = await db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        COUNT(*) as total_count
      FROM agent_pending_actions
    `).first().catch(() => ({}));

    return jsonOk({
      actions: results || [],
      stats: {
        pending: statsRes?.pending_count || 0,
        sent: statsRes?.sent_count || 0,
        rejected: statsRes?.rejected_count || 0,
        total: statsRes?.total_count || 0
      }
    });
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

// ── POST /api/admin/agent-actions (Approve or Reject via single endpoint or actions) ──
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) return jsonError('Database not available', 500);

  try {
    const body = await request.json().catch(() => ({}));
    const { id, action, draft_content } = body;

    if (!id) return jsonError('Action ID is required', 400);

    const record = await db.prepare('SELECT * FROM agent_pending_actions WHERE id = ?').bind(id).first();
    if (!record) return jsonError('Action record not found', 404);

    const nowIso = new Date().toISOString();
    const adminUser = context.data?.adminUser || { name: 'Admin', role: 'Super Admin' };

    if (action === 'reject') {
      await db.prepare(`
        UPDATE agent_pending_actions 
        SET status = 'rejected', updated_at = ?
        WHERE id = ?
      `).bind(nowIso, id).run();

      await logSystemAction(db, {
        actor_id: adminUser.id || 'admin',
        actor_name: adminUser.name || 'Admin',
        actor_role: adminUser.role || 'Super Admin',
        action: 'agent_action_rejected',
        target_type: 'agent_pending_actions',
        targetId: id,
        details: { lead_name: record.lead_name, reason: body.reason || 'Rejected by Admin' }
      });

      return jsonOk({ message: 'تم تجاهل ورفض المسودة بنجاح', status: 'rejected' });
    }

    // Default or action === 'approve'
    const finalContent = draft_content || record.draft_content;
    let dispatchResult = { channel: record.action_type, status: 'dispatched' };

    // If cold email, dispatch via Resend
    if (record.action_type === 'cold_email' && record.lead_email) {
      const emailRes = await sendEmail(env, {
        to: record.lead_email,
        subject: 'PR Agency — استفساركم الأخير وخطة نمو براندكم',
        html: `<div style="font-family:sans-serif;line-height:1.6;color:#222;white-space:pre-line;">${finalContent}</div>`
      });
      dispatchResult = { channel: 'email', ...emailRes };
    } else {
      // For WhatsApp: Log and simulate dispatch
      console.log(`[WhatsApp Dispatch Simulated] To ${record.lead_phone}: ${finalContent}`);
      dispatchResult = { channel: 'whatsapp', simulated: true, to: record.lead_phone };
    }

    await db.prepare(`
      UPDATE agent_pending_actions 
      SET status = 'sent', draft_content = ?, updated_at = ?
      WHERE id = ?
    `).bind(finalContent, nowIso, id).run();

    await logSystemAction(db, {
      actor_id: adminUser.id || 'admin',
      actor_name: adminUser.name || 'Admin',
      actor_role: adminUser.role || 'Super Admin',
      action: 'agent_action_approved_and_sent',
      target_type: 'agent_pending_actions',
      targetId: id,
      details: {
        lead_id: record.lead_id,
        lead_name: record.lead_name,
        action_type: record.action_type,
        dispatch: dispatchResult
      }
    });

    return jsonOk({
      message: 'تم اعتماد وإرسال المسودة للعميل بنجاح',
      status: 'sent',
      dispatch: dispatchResult
    });

  } catch (err) {
    console.error('[Admin Agent Action Error]:', err);
    return jsonError(err.message, 500);
  }
}
