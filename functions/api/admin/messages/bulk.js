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
      'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

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
    const body = await request.json().catch(() => ({}));
    const { action, ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Array of ids is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // Limit bulk batch size to 200 items max
    const safeIds = ids.slice(0, 200).map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
    if (safeIds.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No valid numeric IDs provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const placeholders = safeIds.map(() => '?').join(',');

    if (action === 'delete') {
      const sql = `DELETE FROM contacts WHERE id IN (${placeholders})`;
      await env.DB.prepare(sql).bind(...safeIds).run();
      return new Response(JSON.stringify({
        success: true,
        message: `تم حذف ${safeIds.length} رسالة بنجاح`,
        affectedCount: safeIds.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } else if (action === 'status') {
      const validStatuses = ['new', 'contacted', 'closed'];
      const st = String(status || '').trim().toLowerCase();
      if (!validStatuses.includes(st)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid status' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
      const sql = `UPDATE contacts SET status = ? WHERE id IN (${placeholders})`;
      await env.DB.prepare(sql).bind(st, ...safeIds).run();
      return new Response(JSON.stringify({
        success: true,
        message: `تم تحديث حالة ${safeIds.length} رسالة بنجاح`,
        affectedCount: safeIds.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid action. Supported: delete, status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
