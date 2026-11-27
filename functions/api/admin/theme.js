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
    const { results } = await env.DB.prepare('SELECT key, value, label FROM site_theme').all();
    return jsonResponse({ success: true, data: results || [] });
  } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const { key, value } = body;
    if (!key || !value) return jsonResponse({ success: false, error: 'key and value required' }, 400);

    await env.DB.prepare(
      `INSERT INTO site_theme (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`
    ).bind(key, value).run();

    return jsonResponse({ success: true });
  } catch (err) { return jsonResponse({ success: false, error: err.message }, 500); }
}
