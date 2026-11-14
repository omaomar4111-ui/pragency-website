/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Client Presence & Activity Heartbeat API
   • Logs when a client enters their portal or views deliverables
   • Sends immediate real-time alert to Telegram for instant management awareness
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

    if (!token) return new Response(JSON.stringify({ ok: false }), { status: 401 });

    const auth = await verifyToken(token, env);
    if (!auth) return new Response(JSON.stringify({ ok: false }), { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { action, pageUrl, metadata } = body;
    const clientName = auth.name || auth.client_name || auth.sub || 'Client';

    // Store in DB
    if (db) {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS client_presence_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id TEXT NOT NULL,
          client_name TEXT,
          page_url TEXT,
          action TEXT,
          ip TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run().catch(() => {});

      const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await db.prepare(`
        INSERT INTO client_presence_logs (client_id, client_name, page_url, action, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(auth.sub, clientName, pageUrl || '', action || 'login_portal', clientIp, userAgent).run().catch(() => {});
    }

    // Only send telegram alert for significant actions (e.g. login or first view in session)
    if (action === 'portal_login' || action === 'viewing_deliverables') {
      const botToken = env.TELEGRAM_BOT_TOKEN;
      const chatId = env.TELEGRAM_CHAT_ID || '5715939844';

      if (botToken && chatId) {
        const actionLabel = action === 'portal_login' ? '🔑 فتح بوابته الخاصة الآن' : '👀 يستعرض مخرجات المشاريع والفيديوهات';
        const msg = `⚡ *حضور مباشر للعميل (Live Client Presence)*\n\n` +
          `👤 *العميل:* ${clientName} (${auth.sub})\n` +
          `🎯 *النشاط:* ${actionLabel}\n` +
          `⏰ *التوقيت:* ${new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo' })}`;

        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: msg,
            parse_mode: 'Markdown'
          })
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
