// functions/api/admin/time.js
// Handles logging time entries with Hybrid Costing and Manual vs Timer status.

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { request, env, data } = context;
  const user = data?.adminUser;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: Admin authentication required' }, 401);
  }

  const url = new URL(request.url);
  const taskId = url.searchParams.get('task_id');
  const date = url.searchParams.get('date');

  try {
    let query = `
      SELECT te.*, t.title as task_title, p.name as project_name 
      FROM time_entries te
      LEFT JOIN tasks t ON te.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
    `;
    const params = [];
    const where = [];

    if (taskId) {
      where.push('te.task_id = ?');
      params.push(taskId);
    }
    if (date) {
      where.push('te.date = ?');
      params.push(date);
    }
    if (!user.isSuperAdmin) {
      where.push('te.user_id = ?');
      params.push(user.id);
    }

    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }
    query += ' ORDER BY te.created_at DESC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    return jsonResponse({ success: true, data: results || [] });
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
    const { 
      task_id, 
      hours, 
      date = new Date().toISOString().slice(0, 10), 
      notes = '',
      hourly_cost,
      is_manual = false
    } = body;

    const loggedHours = parseFloat(hours);
    if (!task_id || isNaN(loggedHours) || loggedHours <= 0) {
      return jsonResponse({ success: false, error: 'Valid task_id and hours (> 0) required' }, 400);
    }

    // Hybrid Cost Strategy:
    let rate = 150;
    if (hourly_cost && !isNaN(parseFloat(hourly_cost))) {
      rate = parseFloat(hourly_cost);
    } else {
      try {
        const member = await env.DB.prepare('SELECT hourly_rate FROM agency_team_members WHERE id = ?').bind(user.id).first();
        if (member && member.hourly_rate) {
          rate = parseFloat(member.hourly_rate);
        }
      } catch (e) {}
    }

    // PeakTime RBAC Law:
    // If entered manually by a non-admin, status is 'pending' requiring Account Manager/Admin approval.
    // If logged via live timer, status is automatically 'approved'.
    const userRole = (user.role || '').toLowerCase();
    const isSuperOrManager = user.isSuperAdmin || userRole.includes('admin') || userRole.includes('manager');
    const entryStatus = (is_manual && !isSuperOrManager) ? 'pending' : 'approved';

    const entryId = 'time_' + crypto.randomUUID().slice(0, 8);

    await env.DB.prepare(`
      INSERT INTO time_entries (id, task_id, user_id, user_name, hours, hourly_cost, date, notes, is_manual, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      entryId,
      task_id,
      user.id,
      user.name || 'Admin User',
      loggedHours,
      rate,
      date,
      notes.trim(),
      is_manual ? 1 : 0,
      entryStatus
    ).run();

    return jsonResponse({
      success: true,
      message: entryStatus === 'pending' ? 'تم تقديم طلب الوقت اليدوي وفي انتظار مراجعة الإدارة' : 'تم تسجيل ساعات العمل بنجاح',
      data: {
        id: entryId,
        task_id,
        hours: loggedHours,
        hourly_cost: rate,
        total_cost: loggedHours * rate,
        date,
        is_manual: !!is_manual,
        status: entryStatus
      }
    }, 201);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
