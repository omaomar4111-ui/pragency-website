import { logSystemAction } from '../../../lib/audit.js';

// POST: Account Manager Approves Asset -> Releases to Client Portal
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
    const asset_id = body.asset_id || body.deliverable_id;
    const { am_name, client_id, notes } = body;

    if (!asset_id) {
      return new Response(JSON.stringify({ success: false, error: 'asset_id or deliverable_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // Update status to 'pending' (Visible to client for approval)
    await db.prepare(`
      UPDATE portal_deliverables
      SET status = 'pending', reviewed_at = ?
      WHERE id = ?
    `).bind(now, asset_id).run();

    // Log in System Audit Trail
    await logSystemAction(db, {
      actor_id: am_name || 'account_manager',
      actor_name: am_name || 'Account Manager',
      actor_role: 'account_manager',
      action: 'internal_approve',
      target_type: 'deliverable',
      target_id: asset_id,
      client_id: client_id || null,
      details: { message: 'Approved by Account Manager and pushed to Client Portal', notes: notes || '' },
      ip_address: clientIp
    });

    return new Response(JSON.stringify({ success: true, message: 'Asset approved and released to client' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
