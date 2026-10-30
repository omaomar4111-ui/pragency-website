// functions/api/portal/me.js
// Returns authenticated client profile including branding (logo_url, brand_color)
import { verifyToken } from './auth.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) return jsonResponse({ success: false, error: 'Database unavailable' }, 500);

  const authHeader = request.headers.get('Authorization') || '';
  const cookieHeader = request.headers.get('Cookie') || '';
  let token = null;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_portal_token=([^;]+)/);
    if (match) token = match[1];
  }

  const auth = await verifyToken(token, env);
  if (!auth || !auth.sub) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const client = await db.prepare(`
      SELECT id, company_name, contact_name, email, phone, logo_url, brand_color, telegram_chat_id, whatsapp_number, billing_day, retainer_amount, created_at
      FROM portal_clients
      WHERE id = ? AND active = 1
    `).bind(auth.sub).first();

    if (!client) {
      return jsonResponse({ success: false, error: 'Client not found or inactive' }, 404);
    }

    return jsonResponse({
      success: true,
      client: {
        id: client.id,
        companyName: client.company_name,
        company_name: client.company_name,
        contactName: client.contact_name,
        contact_name: client.contact_name,
        email: client.email,
        phone: client.phone,
        logoUrl: client.logo_url || null,
        logo_url: client.logo_url || null,
        brandColor: client.brand_color || '#8b5cf6',
        brand_color: client.brand_color || '#8b5cf6',
        telegramChatId: client.telegram_chat_id,
        whatsappNumber: client.whatsapp_number,
        billingDay: client.billing_day,
        retainerAmount: client.retainer_amount,
        createdAt: client.created_at
      }
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
