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
  return await verifyToken(token, env);
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
    const rawItems = items.results || [];

    // Fetch all feedback threads for this client's deliverables
    const feedbackList = await db.prepare(`
      SELECT af.* FROM asset_feedback af
      JOIN portal_deliverables pd ON pd.id = af.asset_id
      WHERE pd.client_id = ?
      ORDER BY af.created_at ASC
    `).bind(auth.sub).all().catch(() => ({ results: [] }));

    const feedbackMap = {};
    (feedbackList.results || []).forEach(f => {
      const key = f.parent_asset_id || f.asset_id;
      if (!feedbackMap[key]) feedbackMap[key] = [];
      feedbackMap[key].push(f);
      if (f.asset_id !== key) {
        if (!feedbackMap[f.asset_id]) feedbackMap[f.asset_id] = [];
        feedbackMap[f.asset_id].push(f);
      }
    });

    // Attach feedback and versions to each item
    const enhancedItems = rawItems.map(item => {
      const threadKey = item.parent_asset_id || item.id;
      return {
        ...item,
        version: item.version || 1,
        feedback_thread: feedbackMap[item.id] || feedbackMap[threadKey] || []
      };
    });

    // Summary stats
    const stats = {
      total: enhancedItems.length,
      pending: enhancedItems.filter(i => i.status === 'pending').length,
      approved: enhancedItems.filter(i => i.status === 'approved').length,
      rejected: enhancedItems.filter(i => i.status === 'rejected' || i.status === 'revisions_requested').length
    };

    return new Response(JSON.stringify({
      success: true,
      stats,
      items: enhancedItems
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
