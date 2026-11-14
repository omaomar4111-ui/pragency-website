/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Download Gate & Request Approval API
   • Client requests download permission for a master file (Video/Design/Report)
   • Generates a pending request record in DB
   • Sends immediate Telegram Alert to Agency Principal / Admin with Approval buttons
   • Allows checking request status or approving/rejecting via token
═══════════════════════════════════════════════════════════════════════════ */
import { verifyToken } from './auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    const cookieHeader = request.headers.get('Cookie') || '';
    const authHeader = request.headers.get('Authorization') || '';
    let token = null;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      const match = cookieHeader.match(/pr_portal_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const auth = await verifyToken(token, env);
    if (!auth) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid authentication session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const { deliverableId, deliverableTitle, fileUrl, fileType, fileSize } = body;

    if (!deliverableId || !fileUrl) {
      return new Response(JSON.stringify({ success: false, error: 'Missing deliverable details' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestId = 'dl_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const clientName = auth.name || auth.client_name || auth.sub || 'Client';

    // Save in Database
    if (db) {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS download_requests (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          client_name TEXT,
          deliverable_id TEXT NOT NULL,
          deliverable_title TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT,
          file_size TEXT,
          status TEXT DEFAULT 'pending',
          approved_at DATETIME,
          expires_at DATETIME,
          download_token TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run().catch(() => {});

      await db.prepare(`
        INSERT INTO download_requests 
        (id, client_id, client_name, deliverable_id, deliverable_title, file_url, file_type, fileSize)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        requestId,
        auth.sub,
        clientName,
        deliverableId,
        deliverableTitle || 'Deliverable File',
        fileUrl,
        fileType || 'media',
        fileSize || 'N/A'
      ).run().catch(() => {});
    }

    // Send Telegram Notification with Action Details
    const botToken = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID || '5715939844';

    if (botToken && chatId) {
      const msg = `📥 *طلب تصريح تحميل جديد (Download Request)*\n\n` +
        `👤 *العميل:* ${clientName} (${auth.sub})\n` +
        `📁 *الملف:* ${deliverableTitle || 'Master File'}\n` +
        `📊 *النوع / الحجم:* ${fileType || 'Media'} | ${fileSize || 'N/A'}\n` +
        `🆔 *معرف الطلب:* \`${requestId}\`\n\n` +
        `⏳ بانتظار اعتمادك للإتاحة للعميل.`;

      // Inline keyboard for approval
      const host = new URL(request.url).origin;
      const approveUrl = `${host}/api/portal/download-approve?id=${requestId}&action=approve&secret=${env.PORTAL_SECRET || 'pr2026'}`;
      const rejectUrl = `${host}/api/portal/download-approve?id=${requestId}&action=reject&secret=${env.PORTAL_SECRET || 'pr2026'}`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: "✅ موافقة على التحميل", url: approveUrl },
            { text: "❌ رفض الطلب", url: rejectUrl }
          ]
        ]
      };

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: msg,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        })
      }).catch(err => console.error('Telegram notification error:', err));
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'تم إرسال طلب تصريح التحميل للإدارة بنجاح',
      requestId: requestId,
      status: 'pending'
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

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const requestId = url.searchParams.get('id');

  if (!requestId || !db) {
    return new Response(JSON.stringify({ success: false, error: 'Missing requestId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const row = await db.prepare('SELECT * FROM download_requests WHERE id = ?').bind(requestId).first();
    if (!row) {
      return new Response(JSON.stringify({ success: false, error: 'Request not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: row.status,
      downloadUrl: row.status === 'approved' ? row.file_url : null,
      approvedAt: row.approved_at
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
