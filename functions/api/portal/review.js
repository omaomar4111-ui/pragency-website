import { verifyToken } from './auth.js';

async function sendTelegramNotification(env, text) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.warn('[Portal] Telegram notify failed:', e.message);
  }
}

// ── POST /api/portal/review (Approve / Reject / Comment) ──────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  const cookieHeader = request.headers.get('Cookie') || '';
  const authHeader = request.headers.get('Authorization') || '';
  let token = null;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_portal_token=([^;]+)/);
    if (match) token = match[1];
  }
  const secret = env.PORTAL_JWT_SECRET || 'pr-portal-secret-key-2026';
  const auth = await verifyToken(token, secret);

  if (!auth || !db) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { deliverableId, status, feedback } = body;

    if (!deliverableId || !['approved', 'rejected', 'pending'].includes(status)) {
      return new Response(JSON.stringify({ success: false, error: 'Missing or invalid parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify item belongs to this client
    const item = await db.prepare('SELECT * FROM portal_deliverables WHERE id = ? AND client_id = ?').bind(deliverableId, auth.sub).first();
    if (!item) {
      return new Response(JSON.stringify({ success: false, error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // 1. Update Deliverable Status & Feedback
    await db.prepare(`
      UPDATE portal_deliverables 
      SET status = ?, client_feedback = ?, reviewed_at = ?
      WHERE id = ? AND client_id = ?
    `).bind(status, feedback || null, now, deliverableId, auth.sub).run();

    // 2. Insert into History
    await db.prepare(`
      INSERT INTO portal_feedback_history (deliverable_id, client_id, action, comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(deliverableId, auth.sub, status, feedback || null, now).run();

    // 3. Send Instant Alert to Telegram
    const statusEmoji = status === 'approved' ? '✅ تم الاعتماد' : '❌ مطلوب تعديل';
    const tgMsg = `🔔 <b>تحديث مراجعة من العميل: ${auth.name}</b>\n\n` +
      `📌 <b>العنصر:</b> ${item.title}\n` +
      `📅 <b>تاريخ النشر:</b> ${item.scheduled_date} ${item.scheduled_time || ''}\n` +
      `📊 <b>الحالة:</b> ${statusEmoji}\n` +
      (feedback ? `💬 <b>ملاحظات العميل:</b>\n<i>"${feedback}"</i>\n` : '') +
      `⏰ <b>التوقيت:</b> ${new Date().toLocaleString('ar-EG')}`;

    context.waitUntil(sendTelegramNotification(env, tgMsg));

    return new Response(JSON.stringify({
      success: true,
      message: status === 'approved' ? 'تم اعتماد المحتوى بنجاح' : 'تم تسجيل طلب التعديل بنجاح',
      status,
      reviewedAt: now
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
