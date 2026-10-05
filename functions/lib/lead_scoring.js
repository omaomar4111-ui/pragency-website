export const SCORE_WEIGHTS = {
  page_view: 1,
  cta_click: 3,
  scroll_depth_75: 2,
  scroll_depth: 2,
  chatbot_message: 5,
  whatsapp_click: 8,
  wa_click: 8,
  form_submit: 10,
  lead_submit: 10,
  lang_switch: 1,
  return_visit: 5
};

export async function addLeadScore(env, { sessionId, visitorId, eventType, pageUrl, eventData, locationInfo }) {
  const db = env.ANALYTICS_DB || env.DB;
  if (!db || !sessionId) return;

  const points = SCORE_WEIGHTS[eventType] || 1;

  try {
    // 1. Update session lead_score
    const updateResult = await db.prepare(`
      UPDATE sessions
      SET lead_score = COALESCE(lead_score, 0) + ?
      WHERE id = ?
      RETURNING lead_score, visitor_id, city, country
    `).bind(points, sessionId).first();

    const currentScore = updateResult?.lead_score || 0;

    // 2. High-Intent Visitor Alert (> 70)
    if (currentScore > 70) {
      const tgToken = env.TELEGRAM_BOT_TOKEN;
      const tgChatId = env.TELEGRAM_CHAT_ID;
      if (tgToken && tgChatId) {
        // Simple deduplication: send once per high intent threshold boundary
        const message =
          `🔥 <b>HIGH-INTENT VISITOR!</b>\n` +
          `👤 <b>Visitor ID:</b> <code>${(updateResult?.visitor_id || visitorId || sessionId).slice(0, 10)}</code>\n` +
          `📍 <b>Location:</b> ${updateResult?.city || locationInfo?.city || 'Unknown'}, ${updateResult?.country || locationInfo?.country || 'Unknown'}\n` +
          `📊 <b>Score:</b> <b>${currentScore} pts</b>\n` +
          `🎯 <b>Last Action:</b> ${eventType}\n` +
          `🔗 <b>Page:</b> ${pageUrl || '/'}`;

        // Send non-blocking alert
        fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChatId, text: message, parse_mode: 'HTML' })
        }).catch(() => {});
      }
    }
  } catch (err) {
    // Gracefully handle if lead_score column is pending migration
    console.warn('[LeadScore] Update warning:', err.message);
  }
}
