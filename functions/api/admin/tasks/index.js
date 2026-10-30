// functions/api/admin/tasks/index.js
// Handles daily tasks retrieval (Planned, Achievements, Backlog) and creating new tasks.

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
  const targetDate = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const filterUserId = url.searchParams.get('user_id') || (user.isSuperAdmin ? null : user.id);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  try {
    let countQuery = `SELECT COUNT(DISTINCT t.id) as total FROM tasks t`;
    let baseQuery = `
      SELECT 
        t.*,
        p.name as project_name,
        p.key as project_key,
        COALESCE(SUM(te.hours), 0) as logged_hours
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN time_entries te ON t.id = te.task_id
    `;

    const whereClauses = [];
    const params = [];

    if (filterUserId) {
      whereClauses.push('(t.assigned_to = ? OR t.assigned_to IS NULL)');
      params.push(filterUserId);
    }

    if (whereClauses.length > 0) {
      const whereStr = ' WHERE ' + whereClauses.join(' AND ');
      baseQuery += whereStr;
      countQuery += whereStr;
    }

    baseQuery += ' GROUP BY t.id ORDER BY t.created_at DESC LIMIT ? OFFSET ?';

    const countRow = await env.DB.prepare(countQuery).bind(...params).first();
    const totalRecords = countRow?.total || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    const { results } = await env.DB.prepare(baseQuery).bind(...params, limit, offset).all();
    const allTasks = results || [];

    // Organize tasks according to the PeakTime video layout
    const planned = [];
    const done = [];
    const backlog = [];

    for (const task of allTasks) {
      if (task.status === 'done') {
        if (!task.done_at || task.done_at.startsWith(targetDate)) {
          done.push(task);
        }
      } else if (task.status === 'planned') {
        if (!task.planned_date || task.planned_date === targetDate) {
          planned.push(task);
        } else {
          backlog.push(task);
        }
      } else {
        backlog.push(task);
      }
    }

    return jsonResponse({
      success: true,
      date: targetDate,
      data: {
        planned,
        done,
        backlog,
        tasks: allTasks,
        summary: {
          total: totalRecords,
          plannedCount: planned.length,
          doneCount: done.length,
          backlogCount: backlog.length
        }
      },
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages
      }
    });
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
      project_id, 
      title, 
      description = '', 
      assigned_to = user.id, 
      status = 'planned', 
      priority = 'medium', 
      flag = 'feature',
      planned_date = new Date().toISOString().slice(0, 10),
      estimated_hours = 0 
    } = body;

    if (!project_id || !title || !title.trim()) {
      return jsonResponse({ success: false, error: 'Project and Task Title are required' }, 400);
    }

    const taskId = 'task_' + crypto.randomUUID().slice(0, 8);

    await env.DB.prepare(`
      INSERT INTO tasks (
        id, project_id, title, description, assigned_to, status, priority, flag, planned_date, estimated_hours, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      taskId,
      project_id,
      title.trim(),
      description.trim(),
      assigned_to,
      status,
      priority,
      flag,
      planned_date,
      parseFloat(estimated_hours) || 0
    ).run();

    return jsonResponse({
      success: true,
      message: 'Task created successfully',
      data: { id: taskId, title: title.trim(), status }
    }, 201);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
