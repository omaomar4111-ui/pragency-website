import { verifyToken } from '../portal/auth.js';

// GET /api/portal/strategy — Client reads their live strategy
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  const token = getToken(request);
  const payload = await verifyToken(token, env);
  if (!payload) return jsonError('غير مصرح', 401);

  if (!db) return jsonError('Database not bound', 500);

  try {
    // Only published strategies visible to client
    const strategy = await db.prepare(`
      SELECT id, title, market_analysis, target_personas, content_pillars, quarterly_goals, created_at, updated_at
      FROM client_strategies
      WHERE client_id = ? AND status = 'published_to_client'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(payload.sub).first();

    if (!strategy) {
      return jsonOk({ strategy: null, message: 'لا توجد استراتيجية منشورة حتى الآن' });
    }

    return jsonOk({ strategy });
  } catch (e) {
    return jsonError(e.message, 500);
  }
}

function getToken(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/pr_portal_token=([^;]+)/);
  if (match) return match[1];
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}
function jsonOk(data) {
  return new Response(JSON.stringify({ success: true, ...data }), { headers: { 'Content-Type': 'application/json' } });
}
function jsonError(msg, status = 401) {
  return new Response(JSON.stringify({ success: false, error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
}
