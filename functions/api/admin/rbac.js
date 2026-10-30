// functions/api/admin/rbac.js
// Handles listing and updating dynamic RBAC permissions matrix

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return jsonResponse({ success: false, error: 'Database not available' }, 500);

  try {
    const list = await db.prepare('SELECT * FROM role_permissions ORDER BY role ASC').all();
    return jsonResponse({
      success: true,
      roles: list.results || []
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return jsonResponse({ success: false, error: 'Database not available' }, 500);

  try {
    const body = await request.json();
    const { role, can_approve_assets, can_view_financials, can_manage_team, can_manage_clients, can_view_audit, can_manage_tasks } = body;

    if (!role) {
      return jsonResponse({ success: false, error: 'اسم الدور الوظيفي مطلوب' }, 400);
    }

    await db.prepare(`
      INSERT INTO role_permissions (role, can_approve_assets, can_view_financials, can_manage_team, can_manage_clients, can_view_audit, can_manage_tasks, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(role) DO UPDATE SET
        can_approve_assets = excluded.can_approve_assets,
        can_view_financials = excluded.can_view_financials,
        can_manage_team = excluded.can_manage_team,
        can_manage_clients = excluded.can_manage_clients,
        can_view_audit = excluded.can_view_audit,
        can_manage_tasks = excluded.can_manage_tasks,
        updated_at = datetime('now')
    `).bind(
      role,
      can_approve_assets ? 1 : 0,
      can_view_financials ? 1 : 0,
      can_manage_team ? 1 : 0,
      can_manage_clients ? 1 : 0,
      can_view_audit ? 1 : 0,
      can_manage_tasks ? 1 : 0
    ).run();

    return jsonResponse({
      success: true,
      message: `تم تحديث مصفوفة صلاحيات (${role}) بنجاح`
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
