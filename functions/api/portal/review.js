import { sendTelegramNotification } from '../../lib/telegram.js';
import { verifyToken } from './auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 1. Authenticate Client
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Bearer token required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const auth = await verifyToken(token, env);

  if (!auth || !auth.sub) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized payload' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { deliverableId, status, feedback } = body;

    if (!deliverableId || !status) {
      return new Response(JSON.stringify({ success: false, error: 'deliverableId and status are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['approved', 'rejected', 'revisions_requested'].includes(status)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify ownership
    const item = await db.prepare(
      'SELECT id, title, scheduled_date, scheduled_time, parent_asset_id FROM portal_deliverables WHERE id = ? AND client_id = ?'
    ).bind(deliverableId, auth.sub).first();

    if (!item) {
      return new Response(JSON.stringify({ success: false, error: 'Deliverable not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // 1. Update Deliverable Status & Feedback
    const normalizedStatus = status === 'rejected' ? 'revisions_requested' : status;
    await db.prepare(`
      UPDATE portal_deliverables 
      SET status = ?, client_feedback = ?, reviewed_at = ?
      WHERE id = ? AND client_id = ?
    `).bind(normalizedStatus, feedback || null, now, deliverableId, auth.sub).run();

    // 2. Insert into Legacy History
    await db.prepare(`
      INSERT INTO portal_feedback_history (deliverable_id, client_id, action, comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(deliverableId, auth.sub, normalizedStatus, feedback || null, now).run();

    // 2b. Insert into Threaded Feedback System
    if (feedback) {
      await db.prepare(`
        INSERT INTO asset_feedback (asset_id, parent_asset_id, author_role, author_name, comment, created_at)
        VALUES (?, ?, 'client', ?, ?, ?)
      `).bind(
        deliverableId,
        item.parent_asset_id || null,
        auth.name || 'العميل',
        feedback.trim(),
        now
      ).run();
    }

    // 3. Send Instant Alert to Telegram
    const clientDisplayName = auth.name || auth.sub;
    let tgMsg = '';

    if (normalizedStatus === 'revisions_requested') {
      tgMsg =
        `⚠️ <b>العميل ${clientDisplayName} طلب تعديلات على تصميم</b>\n\n` +
        `📌 <b>العنصر:</b> ${item.title}\n` +
        `💬 <b>التعليق:</b> <i>"${feedback || 'لا توجد تفاصيل إضافية'}"</i>\n` +
        `📅 <b>تاريخ النشر المستهدف:</b> ${item.scheduled_date}\n` +
        `⏰ <b>التوقيت:</b> ${new Date().toLocaleString('ar-EG')}`;
    } else {
      tgMsg =
        `✅ <b>تم اعتماد تصميم من العميل: ${clientDisplayName}</b>\n\n` +
        `📌 <b>العنصر:</b> ${item.title}\n` +
        `📅 <b>تاريخ النشر:</b> ${item.scheduled_date}\n` +
        `⏰ <b>التوقيت:</b> ${new Date().toLocaleString('ar-EG')}`;
    }

    context.waitUntil(sendTelegramNotification(env, tgMsg));

    return new Response(JSON.stringify({
      success: true,
      message: status === 'approved' ? 'تم اعتماد المحتوى بنجاح' : 'تم تسجيل طلب التعديل بنجاح',
      status: normalizedStatus,
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
