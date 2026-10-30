// functions/api/admin/tasks/[id].js
// Handles updating task status (backlog, planned, done), auto-setting done_at, and task edits.

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestPatch(context) {
  const { request, params, env, data } = context;
  const user = data?.adminUser;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: Admin authentication required' }, 401);
  }

  const taskId = params.id;
  if (!taskId) {
    return jsonResponse({ success: false, error: 'Task ID required' }, 400);
  }

  try {
    const body = await request.json();
    const existing = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first();
    if (!existing) {
      return jsonResponse({ success: false, error: 'Task not found' }, 404);
    }

    const updates = [];
    const values = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title.trim());
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
      if (body.status === 'done') {
        updates.push('done_at = CURRENT_TIMESTAMP');
      } else {
        updates.push('done_at = NULL');
      }
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      values.push(body.priority);
    }
    if (body.planned_date !== undefined) {
      updates.push('planned_date = ?');
      values.push(body.planned_date);
    }
    if (body.estimated_hours !== undefined) {
      updates.push('estimated_hours = ?');
      values.push(parseFloat(body.estimated_hours) || 0);
    }
    if (body.assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(body.assigned_to);
    }

    if (updates.length === 0) {
      return jsonResponse({ success: true, message: 'Nothing to update' });
    }

    values.push(taskId);
    await env.DB.prepare(`
      UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    const updatedTask = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first();

    return jsonResponse({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const { params, env, data } = context;
  const user = data?.adminUser;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: Admin authentication required' }, 401);
  }

  const taskId = params.id;
  try {
    await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId).run();
    return jsonResponse({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
