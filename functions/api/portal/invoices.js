import { verifyToken } from '../portal/auth.js';

// GET /api/portal/invoices — Client sees their own invoices
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  const token = getToken(request);
  const payload = await verifyToken(token, env);
  if (!payload) return jsonError('غير مصرح', 401);

  if (!db) return jsonError('Database not bound', 500);

  try {
    const invoices = await db.prepare(`
      SELECT id, invoice_number, amount, currency, due_date, status, paid_at, notes, created_at
      FROM client_invoices
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).bind(payload.sub).all();

    const stats = await db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_total,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_total,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue_total,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
      FROM client_invoices WHERE client_id = ?
    `).bind(payload.sub).first();

    return jsonOk({ invoices: invoices.results || [], stats });
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
