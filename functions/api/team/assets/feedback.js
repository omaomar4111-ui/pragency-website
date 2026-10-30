import { logSystemAction } from '../../../lib/audit.js';

// Handler for adding replies/feedback to an asset thread
// POST: /api/team/assets/feedback
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
    const { asset_id, parent_asset_id, author_role, author_name, comment } = body;

    if (!asset_id || !comment) {
      return new Response(JSON.stringify({ success: false, error: 'asset_id and comment are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // 1. Insert into asset_feedback table
    await db.prepare(`
      INSERT INTO asset_feedback (asset_id, parent_asset_id, author_role, author_name, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      asset_id,
      parent_asset_id || null,
      author_role || 'team',
      author_name || 'Creative Team',
      comment.trim(),
      now
    ).run();

    // 2. Fetch asset to find client_id for audit logging
    const asset = await db.prepare('SELECT client_id, title FROM portal_deliverables WHERE id = ?').bind(asset_id).first();

    // 3. Log action in Audit Trail
    await logSystemAction(db, {
      actor_id: author_name || 'team',
      actor_name: author_name || 'Creative Team',
      actor_role: author_role || 'team',
      action: 'feedback_reply_added',
      target_type: 'deliverable',
      target_id: asset_id,
      client_id: asset?.client_id || null,
      details: { comment: comment.slice(0, 100) },
      ip_address: clientIp
    });

    return new Response(JSON.stringify({ success: true, message: 'Reply posted to feedback thread' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET: Retrieve feedback thread for an asset
// GET: /api/team/assets/feedback?asset_id=xxx
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const assetId = url.searchParams.get('asset_id');

  if (!db || !assetId) {
    return new Response(JSON.stringify({ success: false, error: 'Database or asset_id missing' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get all comments for this asset or linked parent
    const asset = await db.prepare('SELECT parent_asset_id FROM portal_deliverables WHERE id = ?').bind(assetId).first();
    const parentId = asset?.parent_asset_id || assetId;

    const thread = await db.prepare(`
      SELECT * FROM asset_feedback
      WHERE asset_id = ? OR parent_asset_id = ? OR asset_id = ?
      ORDER BY created_at ASC
    `).bind(assetId, parentId, parentId).all();

    return new Response(JSON.stringify({ success: true, thread: thread.results || [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
