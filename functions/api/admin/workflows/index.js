// functions/api/admin/workflows/index.js
// Manage & Query Workflows & Execution Logs
import { ensureDefaultWorkflows } from '../../../lib/automation-engine.js';
import { logSystemAction } from '../../../lib/audit.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) return jsonResponse({ success: false, error: 'Database unavailable' }, 500);

  try {
    await ensureDefaultWorkflows(db);

    const workflowsRes = await db.prepare(`SELECT * FROM agency_workflows ORDER BY created_at ASC`).all();
    const logsRes = await db.prepare(`
      SELECT l.*, w.name as workflow_name 
      FROM workflow_execution_logs l 
      LEFT JOIN agency_workflows w ON w.id = l.workflow_id 
      ORDER BY l.executed_at DESC 
      LIMIT 20
    `).all();

    return jsonResponse({
      success: true,
      workflows: (workflowsRes.results || []).map(w => ({
        ...w,
        steps: JSON.parse(w.steps_json || '[]')
      })),
      logs: (logsRes.results || []).map(l => ({
        ...l,
        payload: JSON.parse(l.payload_json || '{}'),
        result: JSON.parse(l.result_json || '[]')
      }))
    });
  } catch (err) {
    console.error('Error fetching workflows:', err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) return jsonResponse({ success: false, error: 'Database unavailable' }, 500);

  try {
    const body = await request.json();
    const { id, name, description, trigger_event, is_active, steps } = body;

    // Toggle active status if only id and is_active provided
    if (id && is_active !== undefined && !name) {
      await db.prepare(`UPDATE agency_workflows SET is_active = ? WHERE id = ?`).bind(is_active ? 1 : 0, id).run();
      return jsonResponse({ success: true, message: 'تم تحديث حالة سير العمل' });
    }

    if (!name || !trigger_event) {
      return jsonResponse({ success: false, error: 'اسم سير العمل والحدث المشغل مطلوبان' }, 400);
    }

    const workflowId = id || ('wf_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));
    const stepsJson = JSON.stringify(steps || [
      { id: 'telegram_notify', type: 'action', title: 'إرسال إشعار تليجرام' },
      { id: 'ai_eval', type: 'ai', title: 'تقييم وتوجيه بالذكاء الاصطناعي' }
    ]);

    await db.prepare(`
      INSERT INTO agency_workflows (id, name, description, trigger_event, is_active, steps_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET 
        name = excluded.name, 
        description = excluded.description, 
        trigger_event = excluded.trigger_event, 
        is_active = excluded.is_active, 
        steps_json = excluded.steps_json
    `).bind(workflowId, name, description || '', trigger_event, is_active ? 1 : 0, stepsJson).run();

    await logSystemAction(db, {
      adminId: 'admin_root',
      adminEmail: 'admin@pragency.eg',
      action: 'workflow_saved',
      targetType: 'agency_workflows',
      targetId: workflowId,
      details: `Saved workflow "${name}" with trigger "${trigger_event}"`
    });

    return jsonResponse({
      success: true,
      message: 'تم حفظ وتفعيل سير العمل بنجاح',
      workflow_id: workflowId
    });
  } catch (err) {
    console.error('Error saving workflow:', err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
