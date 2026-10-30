import { logSystemAction } from '../../lib/audit.js';
import { sendTelegramNotification } from '../../lib/telegram.js';

// GET: Fetch all assets pending review or by client
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'under_am_review';
  const clientId = url.searchParams.get('clientId');

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let query = `SELECT * FROM portal_deliverables WHERE 1=1`;
    const params = [];

    if (status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (clientId) {
      query += ` AND client_id = ?`;
      params.push(clientId);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await db.prepare(query).bind(...params).all();
    return new Response(JSON.stringify({ success: true, assets: result.results || [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: Upload/Create new asset by creator (Initial status: under_am_review)
export async function onRequestPost(context) {
  const { request, env, data } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const authenticatedUser = data?.teamUser;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const {
      client_id,
      title,
      type, // 'video' | 'design' | 'carousel' | 'canva' | 'drive' | 'sheet' | 'pdf'
      media_url,
      caption,
      hashtags,
      scheduled_date,
      scheduled_time,
      platform,
      creator_name,
      creator_role,
      parent_asset_id // If updating to V2, V3 etc.
    } = body;

    if (!client_id || !title || !media_url) {
      return new Response(JSON.stringify({ success: false, error: 'client_id, title, and media_url are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = 'ast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const now = new Date().toISOString();

    let version = 1;
    let actualParentId = parent_asset_id || null;

    if (parent_asset_id) {
      const prev = await db.prepare(
        'SELECT MAX(version) as max_v FROM portal_deliverables WHERE id = ? OR parent_asset_id = ?'
      ).bind(parent_asset_id, parent_asset_id).first();
      version = (prev && prev.max_v) ? prev.max_v + 1 : 2;
    }

    await db.prepare(`
      INSERT INTO portal_deliverables (
        id, client_id, title, type, media_url, caption, hashtags, scheduled_date, scheduled_time, platform, status, version, parent_asset_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'under_am_review', ?, ?, ?)
    `).bind(
      id,
      client_id,
      title,
      type || 'design',
      media_url,
      caption || '',
      hashtags || '',
      scheduled_date || now.slice(0, 10),
      scheduled_time || '18:00',
      platform || 'all',
      version,
      actualParentId,
      now
    ).run();

    // Fetch client brand name for notification
    const client = await db.prepare('SELECT company_name, contact_name FROM portal_clients WHERE id = ?').bind(client_id).first();
    const brandName = client ? client.company_name : client_id;
    const authorName = creator_name || authenticatedUser?.name || 'صانع المحتوى';

    // Log the upload in Audit Trail with versioning
    await logSystemAction(db, {
      actor_id: authenticatedUser?.id || authorName,
      actor_name: authorName,
      actor_role: creator_role || authenticatedUser?.role || 'creator',
      action: version > 1 ? `asset_uploaded_v${version}` : 'asset_uploaded',
      target_type: 'deliverable',
      target_id: id,
      client_id: client_id,
      details: { title, type, scheduled_date, version, parent_asset_id: actualParentId, brandName },
      ip_address: clientIp
    });

    // 🔔 DISPATCH TELEGRAM ALERT: Creator uploaded a new asset
    const vTag = version > 1 ? `(V${version})` : '';
    const tgMsg =
      `🔔 <b>تصميم جديد محتاج مراجعتك ${vTag}</b>\n\n` +
      `🎨 <b>صانع المحتوى:</b> ${authorName}\n` +
      `🏢 <b>البراند:</b> ${brandName}\n` +
      `📌 <b>العنوان:</b> ${title}\n` +
      `📂 <b>النوع:</b> ${type || 'تصميم'}\n` +
      `📅 <b>تاريخ النشر المستهدف:</b> ${scheduled_date || 'غير محدد'}\n` +
      `🔗 <a href="${media_url}">معاينة الملف / التصميم</a>`;

    context.waitUntil(sendTelegramNotification(env, tgMsg));

    return new Response(JSON.stringify({ success: true, id, version, status: 'under_am_review' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
