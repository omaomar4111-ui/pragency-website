/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Deliverable Single Access API (Data Isolation Enforced)
   • Strict Client Isolation: A client can ONLY access their own deliverables
   • Returns 401 for unauthenticated requests
   • Returns 403 for cross-client access attempts
   • Returns 404 for non-existent deliverables
═══════════════════════════════════════════════════════════════════════════ */
import { verifyToken } from './auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  const cookieHeader = request.headers.get('Cookie') || '';
  const authHeader = request.headers.get('Authorization') || '';
  let token = null;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_portal_token=([^;]+)/);
    if (match) token = match[1];
  }

  // 1. Authentication Check
  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Authentication token required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const auth = await verifyToken(token, env);
  if (!auth || !db) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Parameter Validation
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Missing deliverable id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Query Deliverable
  const item = await db.prepare('SELECT * FROM portal_deliverables WHERE id = ?').bind(id).first();
  if (!item) {
    return new Response(JSON.stringify({ success: false, error: 'Deliverable not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Strict Data Isolation: Must belong to authenticated client
  if (item.client_id !== auth.sub) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Forbidden: Access denied. You do not have permission to view deliverables from another organization.'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true, item }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
