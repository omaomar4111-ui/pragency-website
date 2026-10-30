// functions/api/admin/projects.js
// Handles project listing with task count & visual progress metrics, plus project creation.

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
    return jsonResponse({ success: false, error: 'Unauthorized: Admin authentication required' }, 401);
  }

  try {
    // Fetch projects with aggregated progress calculation
    const query = `
      SELECT 
        p.*,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_tasks,
        SUM(CASE WHEN t.status = 'planned' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN t.status = 'backlog' THEN 1 ELSE 0 END) as backlog_tasks,
        COALESCE(SUM(te.hours), 0) as total_hours_spent
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN time_entries te ON t.id = te.task_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const { results } = await env.DB.prepare(query).all();

    const formatted = (results || []).map(p => {
      const total = p.total_tasks || 0;
      const done = p.done_tasks || 0;
      const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        ...p,
        progress_percent: progressPercent
      };
    });

    return jsonResponse({ success: true, data: formatted });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data?.adminUser;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: Admin authentication required' }, 401);
  }

  try {
    const body = await request.json();
    const { name, key, client_name = '', retainer_amount = 0 } = body;

    if (!name || !name.trim()) {
      return jsonResponse({ success: false, error: 'Project name is required' }, 400);
    }

    const projectId = 'proj_' + crypto.randomUUID().slice(0, 8);
    const projectKey = (key && key.trim()) ? key.trim().toUpperCase() : name.slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

    await env.DB.prepare(`
      INSERT INTO projects (id, name, key, client_name, retainer_amount, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(projectId, name.trim(), projectKey, client_name.trim(), parseFloat(retainer_amount) || 0).run();

    return jsonResponse({
      success: true,
      message: 'Project created successfully',
      data: { id: projectId, name: name.trim(), key: projectKey }
    }, 201);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
