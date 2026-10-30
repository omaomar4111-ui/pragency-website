// functions/api/portal/settings.js
// Handles client notification preferences (Telegram chat_id & WhatsApp number)

import { verifyToken } from './auth.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

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

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const auth = await getAuthClient(request, env);

  if (!auth || !auth.sub) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const client = await db.prepare(`
      SELECT id, company_name, contact_name, email, telegram_chat_id, whatsapp_number 
      FROM portal_clients 
      WHERE id = ?
    `).bind(auth.sub).first();

    return jsonResponse({
      success: true,
      data: {
        telegram_chat_id: client?.telegram_chat_id || '',
        whatsapp_number: client?.whatsapp_number || '',
        company_name: client?.company_name || '',
        email: client?.email || ''
      }
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const auth = await getAuthClient(request, env);

  if (!auth || !auth.sub) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { telegram_chat_id = '', whatsapp_number = '' } = body;

    await db.prepare(`
      UPDATE portal_clients 
      SET telegram_chat_id = ?, whatsapp_number = ?
      WHERE id = ?
    `).bind(telegram_chat_id.trim(), whatsapp_number.trim(), auth.sub).run();

    return jsonResponse({
      success: true,
      message: 'تم حفظ إعدادات الإشعارات بنجاح'
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
