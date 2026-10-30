import { logSystemAction } from '../../lib/audit.js';

// GET: Retrieve all audit logs or filter by client/actor
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const clientId = url.searchParams.get('clientId');

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let query = `SELECT * FROM system_audit_logs`;
    const params = [];

    if (clientId) {
      query += ` WHERE client_id = ?`;
      params.push(clientId);
    }

    query += ` ORDER BY id DESC LIMIT ?`;
    params.push(limit);

    const result = await db.prepare(query).bind(...params).all();
    return new Response(JSON.stringify({ success: true, logs: result.results || [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
