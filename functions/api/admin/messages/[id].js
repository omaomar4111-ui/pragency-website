function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Basic ')) return false;
  try {
    const base64 = authHeader.slice(6).trim();
    const decoded = atob(base64);
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return false;
    return decoded.slice(colonIdx + 1) === PASS;
  } catch (e) {
    return false;
  }
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: {
      // 'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export async function onRequestGet(context) {
  const { request, env, params } = context;

  if (!checkAuth(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const id = params.id;
    const row = await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ success: false, error: 'Message not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...row,
        status: row.status || 'new',
        notes: row.notes || '',
        starred: Number(row.starred || 0)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

export async function onRequestPatch(context) {
  const { request, env, params } = context;

  if (!checkAuth(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Message ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    let body = {};
    if (request.headers.get('content-type')?.includes('application/json')) {
      body = await request.json().catch(() => ({}));
    }

    const updates = [];
    const sqlParams = [];

    if (body.status !== undefined) {
      const st = String(body.status).trim().toLowerCase();
      if (!['new', 'contacted', 'closed'].includes(st)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid status value. Must be new, contacted, or closed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
      updates.push('status = ?');
      sqlParams.push(st);
    }

    if (body.notes !== undefined) {
      const notes = String(body.notes || '').slice(0, 5000);
      updates.push('notes = ?');
      sqlParams.push(notes);
    }

    if (body.starred !== undefined) {
      const starred = (body.starred === 1 || body.starred === true || body.starred === '1') ? 1 : 0;
      updates.push('starred = ?');
      sqlParams.push(starred);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No valid fields provided to update (status, notes, starred)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    sqlParams.push(id);
    const sql = `UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(sql).bind(...sqlParams).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'تم تحديث الرسالة بنجاح',
      updatedId: id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  if (!checkAuth(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Message ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    await env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'تم حذف الرسالة بنجاح',
      deletedId: id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
