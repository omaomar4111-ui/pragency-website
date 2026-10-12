import { verifyToken } from './auth.js';

async function getAuthClient(request, env) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const authHeader = request.headers.get('Authorization') || '';
  let token = null;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_portal_token=([^;]+)/);
    if (match) token = match[1];
  }
  const secret = env.PORTAL_JWT_SECRET || 'pr-portal-secret-key-2026';
  return await verifyToken(token, secret);
}

// ── GET /api/portal/calendar?month=YYYY-MM ────────────────────────────────────
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  const auth = await getAuthClient(request, env);
  if (!auth || !db) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const month = url.searchParams.get('month'); // e.g. "2026-10"

    let query = 'SELECT * FROM portal_deliverables WHERE client_id = ?';
    let params = [auth.sub];

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      query += ' AND scheduled_date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY scheduled_date ASC, scheduled_time ASC';

    const items = await db.prepare(query).bind(...params).all();

    // Summary stats
    const stats = {
      total: (items.results || []).length,
      pending: (items.results || []).filter(i => i.status === 'pending').length,
      approved: (items.results || []).filter(i => i.status === 'approved').length,
      rejected: (items.results || []).filter(i => i.status === 'rejected').length
    };

    return new Response(JSON.stringify({
      success: true,
      stats,
      items: items.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
