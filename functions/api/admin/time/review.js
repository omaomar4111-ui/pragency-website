// functions/api/admin/time/review.js
// Handles listing and approving/rejecting manual time requests (PeakTime Review Manual Time Workflow)
// RBAC: Only Super Admin & Account Manager can review time. Junior/Specialist cannot approve their own time.

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { env, data } = context;
  const user = data?.adminUser;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: Admin login required' }, 401);
  }

  // RBAC Check: Junior designers cannot review time
  const role = (user.role || '').toLowerCase();
  const isManagerOrAdmin = user.isSuperAdmin || role.includes('admin') || role.includes('manager') || role.includes('lead');
  if (!isManagerOrAdmin) {
    return jsonResponse({
      success: false,
      error: 'محظور: لا تملك صلاحية مراجعة واعتماد الساعات (مخصصة للمدير ومدير الحسابات فقط)'
    }, 403);
  }

  try {
    const query = `
      SELECT 
        te.*,
        t.title as task_title,
        p.name as project_name,
        p.key as project_key
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE te.status = 'pending'
      ORDER BY te.created_at DESC
    `;
    const { results } = await env.DB.prepare(query).all();
    return jsonResponse({ success: true, data: results || [] });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data?.adminUser;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: Admin login required' }, 401);
  }

  // RBAC Check
  const role = (user.role || '').toLowerCase();
  const isManagerOrAdmin = user.isSuperAdmin || role.includes('admin') || role.includes('manager') || role.includes('lead');
  if (!isManagerOrAdmin) {
    return jsonResponse({
      success: false,
      error: 'محظور: لا يمكنك اعتماد أو رفض الساعات لنفسك أو للغير (مطلوب صلاحية مدير الحسابات أو المشرف العام)'
    }, 403);
  }

  try {
    const body = await request.json();
    const { entry_id, action } = body; // action: 'approve' | 'reject'

    if (!entry_id || !['approve', 'reject'].includes(action)) {
      return jsonResponse({ success: false, error: 'entry_id and valid action (approve/reject) required' }, 400);
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await env.DB.prepare(`
      UPDATE time_entries 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(newStatus, user.name || user.id, entry_id).run();

    return jsonResponse({
      success: true,
      message: `تم ${action === 'approve' ? 'اعتماد' : 'رفض'} ساعات العمل بنجاح`,
      data: { entry_id, status: newStatus, reviewed_by: user.name }
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
