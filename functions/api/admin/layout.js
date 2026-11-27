function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD;
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
      'SELECT * FROM site_layout ORDER BY order_index ASC'
    ).all();
    return jsonResponse({ success: true, data: results || [] });
  } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const { section_id, order_index, is_visible } = body;
    if (!section_id) return jsonResponse({ success: false, error: 'section_id required' }, 400);

    const updates = [];
    const params = [];
    if (order_index !== undefined) { updates.push('order_index = ?'); params.push(order_index); }
    if (is_visible !== undefined) { updates.push('is_visible = ?'); params.push(is_visible ? 1 : 0); }

    if (updates.length === 0) return jsonResponse({ success: false, error: 'No fields' }, 400);
    params.push(section_id);

    await env.DB.prepare(`UPDATE site_layout SET ${updates.join(', ')} WHERE section_id = ?`).bind(...params).run();
    return jsonResponse({ success: true });
  } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }
}
