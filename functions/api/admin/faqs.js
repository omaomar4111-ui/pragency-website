function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  try {
    const decoded = atob(auth.slice(6).trim());
    const idx = decoded.indexOf(':');
    if (idx === -1) return false;
    return decoded.slice(idx + 1) === PASS;
  } catch (e) {
    return false;
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return jsonResponse({ success: false, error: 'Unauthorized' }, 401);

  try {
    const { results } = await env.DB.prepare("SELECT * FROM faqs ORDER BY order_index ASC, created_at DESC").all();
    return jsonResponse({ success: true, data: results });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return jsonResponse({ success: false, error: 'Unauthorized' }, 401);

  try {
    const data = await request.json();
    const { question, answer, category = 'general', order_index = 0, is_active = 1 } = data;
    
    if (!question || !answer) return jsonResponse({ success: false, error: 'Question and answer are required' }, 400);

    await env.DB.prepare(
      "INSERT INTO faqs (question, answer, category, order_index, is_active) VALUES (?, ?, ?, ?, ?)"
    ).bind(question, answer, category, order_index, is_active).run();

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return jsonResponse({ success: false, error: 'Unauthorized' }, 401);

  try {
    const data = await request.json();
    const { id, question, answer, category = 'general', order_index = 0, is_active = 1 } = data;
    
    if (!id || !question || !answer) return jsonResponse({ success: false, error: 'ID, question, and answer are required' }, 400);

    await env.DB.prepare(
      "UPDATE faqs SET question = ?, answer = ?, category = ?, order_index = ?, is_active = ? WHERE id = ?"
    ).bind(question, answer, category, order_index, is_active, id).run();

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return jsonResponse({ success: false, error: 'Unauthorized' }, 401);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) return jsonResponse({ success: false, error: 'ID is required' }, 400);

    await env.DB.prepare("DELETE FROM faqs WHERE id = ?").bind(id).run();

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}
