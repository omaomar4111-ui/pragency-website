// Central Telegram Notification Dispatcher for PR Agency Ecosystem
export async function sendTelegramNotification(env, text, options = {}) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const targetChatId = options.chat_id || env.TELEGRAM_CHAT_ID;

  if (!token || !targetChatId) {
    console.warn('[Telegram Hub] Missing TELEGRAM_BOT_TOKEN or recipient chat_id');
    return false;
  }

  try {
    const payload = {
      chat_id: targetChatId,
      text: text,
      parse_mode: options.parse_mode || 'HTML',
      disable_web_page_preview: true
    };

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram Hub] API Error:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Telegram Hub] Dispatch exception:', err.message);
    return false;
  }
}
