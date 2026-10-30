import { logSystemAction } from '../../lib/audit.js';

// GET: List all strategies for a client
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId');

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let query = `SELECT * FROM client_strategies`;
    const params = [];
    if (clientId) {
      query += ` WHERE client_id = ?`;
      params.push(clientId);
    }
    query += ` ORDER BY updated_at DESC`;

    const result = await db.prepare(query).bind(...params).all();
    return new Response(JSON.stringify({ success: true, strategies: result.results || [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: Create or Update a Strategy
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const {
      id,
      client_id,
      title,
      market_analysis,
      target_personas,
      content_pillars,
      quarterly_goals,
      created_by,
      status, // 'draft' | 'under_review' | 'published_to_client'
      approved_by_am
    } = body;

    if (!client_id || !title) {
      return new Response(JSON.stringify({ success: false, error: 'Missing client_id or title' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const strategyId = id || 'strat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

    await db.prepare(`
      INSERT INTO client_strategies (
        id, client_id, title, market_analysis, target_personas, content_pillars, quarterly_goals, created_by, status, approved_by_am, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        market_analysis = excluded.market_analysis,
        target_personas = excluded.target_personas,
        content_pillars = excluded.content_pillars,
        quarterly_goals = excluded.quarterly_goals,
        status = excluded.status,
        approved_by_am = excluded.approved_by_am,
        updated_at = excluded.updated_at
    `).bind(
      strategyId,
      client_id,
      title,
      market_analysis || '',
      target_personas || '',
      content_pillars || '',
      quarterly_goals || '',
      created_by || 'Strategist',
      status || 'draft',
      approved_by_am || null,
      now,
      now
    ).run();

    // Log the action in Audit Trail
    await logSystemAction(db, {
      actor_id: created_by || 'admin',
      actor_name: created_by || 'Admin / Strategist',
      actor_role: status === 'published_to_client' ? 'account_manager' : 'strategist',
      action: status === 'published_to_client' ? 'strategy_published' : 'strategy_saved',
      target_type: 'strategy',
      target_id: strategyId,
      client_id: client_id,
      details: { title, status },
      ip_address: clientIp
    });

    return new Response(JSON.stringify({ success: true, id: strategyId }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
