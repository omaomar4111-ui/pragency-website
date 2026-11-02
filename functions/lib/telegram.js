// Central Telegram Notification Dispatcher & Session Engine for PR Agency Ecosystem

/**
 * Standard text notification dispatcher
 */
export async function sendTelegramNotification(env, text, options = {}) {
  return sendTelegramMessage(env, {
    chat_id: options.chat_id || env.TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: options.parse_mode || 'HTML',
    disable_web_page_preview: true,
    reply_markup: options.reply_markup
  });
}

/**
 * Sends a generic Telegram sendMessage payload
 */
export async function sendTelegramMessage(env, payload) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token || !payload.chat_id) {
    console.warn('[Telegram Hub] Missing TELEGRAM_BOT_TOKEN or recipient chat_id');
    return null;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('[Telegram Hub] Dispatch exception:', err.message);
    return null;
  }
}

/**
 * Edits an existing message (used for smooth in-place inline menu transitions)
 */
export async function editTelegramMessage(env, payload) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token || !payload.chat_id || !payload.message_id) {
    return sendTelegramMessage(env, payload);
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
      // Fallback: If editing fails (e.g., content unchanged), send as new message
      return sendTelegramMessage(env, payload);
    }
    return data;
  } catch (err) {
    return sendTelegramMessage(env, payload);
  }
}

/**
 * Answers a Telegram callback query to dismiss loading wheel
 */
export async function answerCallbackQuery(env, callbackQueryId, text = '', showAlert = false) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token || !callbackQueryId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert
      })
    });
  } catch (err) {
    console.error('[Telegram Hub] answerCallbackQuery error:', err.message);
  }
}

/**
 * Sends a Document (e.g. CSV / File) to Telegram
 */
export async function sendTelegramDocument(env, chatId, filename, content, caption = '') {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;

  try {
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    formData.append('document', blob, filename);
    if (caption) formData.append('caption', caption);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.ok) return true;
  } catch (err) {
    console.warn('[Telegram Hub] sendDocument error:', err.message);
  }

  // Fallback to sending as text message
  const snippet = content.slice(0, 3000);
  await sendTelegramMessage(env, {
    chat_id: chatId,
    text: `📥 <b>ملف: ${filename}</b>\n\n<pre>${snippet}</pre>\n\n<i>${caption}</i>`,
    parse_mode: 'HTML'
  });
  return true;
}

/**
 * Retrieve session state for a given chatId from D1
 */
export async function getSession(db, chatId) {
  if (!db || !chatId) return null;
  try {
    const row = await db.prepare('SELECT current_menu, context_data FROM telegram_sessions WHERE chat_id = ?')
      .bind(String(chatId))
      .first();
    if (!row) return null;
    let context = {};
    try {
      context = row.context_data ? JSON.parse(row.context_data) : {};
    } catch (e) {
      context = {};
    }
    return {
      current_menu: row.current_menu,
      context
    };
  } catch (err) {
    console.error('[Telegram Hub] getSession error:', err.message);
    return null;
  }
}

/**
 * Update or insert session state for a given chatId in D1
 */
export async function setSession(db, chatId, menu, contextData = {}) {
  if (!db || !chatId) return false;
  try {
    const serializedContext = typeof contextData === 'string' ? contextData : JSON.stringify(contextData);
    await db.prepare(`
      INSERT INTO telegram_sessions (chat_id, current_menu, context_data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(chat_id) DO UPDATE SET
        current_menu = excluded.current_menu,
        context_data = excluded.context_data,
        updated_at = CURRENT_TIMESTAMP
    `).bind(String(chatId), String(menu), serializedContext).run();
    return true;
  } catch (err) {
    console.error('[Telegram Hub] setSession error:', err.message);
    return false;
  }
}
