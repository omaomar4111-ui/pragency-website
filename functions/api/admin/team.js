function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  try {
    const decoded = atob(auth.slice(6).trim());
    const idx = decoded.indexOf(':');
    if (idx === -1) return false;
    return decoded.slice(idx + 1) === PASS;
  } catch (e) { return false; }
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401, headers: { 'Content-Type': 'application/json' }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorizedResponse();
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM team_members ORDER BY order_index ASC, id ASC'
    ).all();
    return jsonResponse({ success: true, data: results || [] });
  } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const { name, role, bio = '', photo_url = '', linkedin_url = '', order_index = 0, is_active = 1 } = body;
    if (!name || !role) return jsonResponse({ success: false, error: 'name and role required' }, 400);

    const result = await env.DB.prepare(
      `INSERT INTO team_members (name, role, bio, photo_url, linkedin_url, order_index, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(name, role, bio, photo_url, linkedin_url, order_index, is_active).run();

    return jsonResponse({ success: true, message: 'تم الإضافة', id: result.meta?.last_row_id });
  } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorizedResponse();
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonResponse({ success: false, error: 'id required' }, 400);

    const body = await request.json();
    const updates = [];
    const params = [];

    ['name', 'role', 'bio', 'photo_url', 'linkedin_url', 'order_index', 'is_active'].forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(body[field]);
      }
    });

    if (updates.length === 0) return jsonResponse({ success: false, error: 'No fields' }, 400);
    params.push(id);

    await env.DB.prepare(`UPDATE team_members SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    return jsonResponse({ success: true, message: 'تم التحديث' });
  } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorizedResponse();
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonResponse({ success: false, error: 'id required' }, 400);

    await env.DB.prepare('DELETE FROM team_members WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'تم الحذف' });
  } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const ids = body.ids || [];
    for (let i = 0; i < ids.length; i++) {
      await env.DB.prepare('UPDATE team_members SET order_index = ? WHERE id = ?').bind(i + 1, ids[i]).run();
    }
    return jsonResponse({ success: true, message: 'تم تحديث الترتيب' });
  } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }
}
