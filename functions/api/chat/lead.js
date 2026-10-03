export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    const payload = await request.json();
    const { sessionId, visitorId, name, email, phone, message, country, city } = payload;

    if (!phone && !email) {
      return new Response(JSON.stringify({ success: false, error: 'At least phone or email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const cf = request.cf || {};
    const visitorCountry = country || cf.country || 'Unknown';
    const visitorCity = city || cf.city || 'Unknown';

    let leadId = null;

    // 1. Insert into D1 leads table
    if (db) {
      try {
        const res = await db.prepare(`
          INSERT INTO leads (session_id, name, email, phone, message, source, created_at, status, country, city)
          VALUES (?, ?, ?, ?, ?, 'chatbot', ?, 'new', ?, ?)
        `).bind(
          sessionId || null,
          name || 'Prospect',
          email || null,
          phone || null,
          message || null,
          now,
          visitorCountry,
          visitorCity
        ).run();

        leadId = res.meta?.last_row_id || 1;

        // Mark chat session as lead
        if (sessionId) {
          await db.prepare(`
            UPDATE chat_sessions SET is_lead = 1 WHERE id = ?
          `).bind(sessionId).run();
        }
      } catch (dbErr) {
        console.error('[Lead] DB insert error:', dbErr.message);
      }
    }

    // 2. Dispatch High-Priority Telegram Alert
    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (token && chatId) {
      const tgText = 
        `🎯 <b>NEW LEAD FROM CHATBOT!</b>\n\n` +
        `👤 <b>Name:</b> ${name || 'N/A'}\n` +
        `📱 <b>Phone:</b> ${phone || 'N/A'}\n` +
        `📧 <b>Email:</b> ${email || 'N/A'}\n` +
        `💬 <b>Message/Notes:</b> ${message || 'Captured in conversation'}\n` +
        `🌍 <b>Location:</b> ${visitorCity}, ${visitorCountry}\n` +
        `🕐 <b>Time:</b> ${now}\n` +
        `🆔 <b>Session:</b> <code>${sessionId || 'N/A'}</code>`;

      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: tgText,
            parse_mode: 'HTML'
          })
        });
        console.log('[Lead] Telegram alert dispatched successfully');
      } catch (tgErr) {
        console.error('[Lead] Telegram dispatch error:', tgErr.message);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      leadId
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error('[Lead] Unhandled error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
