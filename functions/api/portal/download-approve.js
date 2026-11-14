/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Download Approve / Reject Callback Endpoint
   • Called from Telegram Webhook / Admin Button to approve or reject client downloads
═══════════════════════════════════════════════════════════════════════════ */

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action'); // 'approve' | 'reject'
  const secret = url.searchParams.get('secret');

  if (secret !== (env.PORTAL_SECRET || 'pr2026') && secret !== env.JWT_SECRET) {
    return new Response('Unauthorized secret', { status: 401 });
  }

  if (!id || !['approve', 'reject'].includes(action)) {
    return new Response('Invalid parameters', { status: 400 });
  }

  if (!db) {
    return new Response('Database connection unavailable', { status: 500 });
  }

  try {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const now = new Date().toISOString();

    const result = await db.prepare(`
      UPDATE download_requests 
      SET status = ?, approved_at = ? 
      WHERE id = ?
    `).bind(newStatus, now, id).run();

    const row = await db.prepare('SELECT * FROM download_requests WHERE id = ?').bind(id).first();

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>اعتماد طلب التحميل</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; background: #07050d; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #120e20; border: 1px solid ${action === 'approve' ? '#10b981' : '#ef4444'}; padding: 32px; border-radius: 16px; max-width: 440px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          h2 { margin: 0 0 12px; color: ${action === 'approve' ? '#10b981' : '#ef4444'}; font-size: 22px; }
          p { color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
          .badge { display: inline-block; background: rgba(255,255,255,0.06); padding: 6px 14px; border-radius: 8px; font-size: 13px; color: #c084fc; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>${action === 'approve' ? '✅ تمت الموافقة بنجاح' : '❌ تم رفض الطلب'}</h2>
          <p>تم تحديث حالة طلب التحميل للملف: <strong>${row ? row.deliverable_title : id}</strong></p>
          <div class="badge">العميل: ${row ? row.client_name : 'Client'}</div>
          <p style="margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.4);">يمكنك إغلاق هذه الصفحة الآن.</p>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (err) {
    return new Response('Error: ' + err.message, { status: 500 });
  }
}
