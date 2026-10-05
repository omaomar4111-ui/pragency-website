export async function onRequest(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const tgToken = env.TELEGRAM_BOT_TOKEN;
  const tgChatId = env.TELEGRAM_CHAT_ID;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not bound' }), { status: 500 });
  }

  try {
    // 1. Total visitors this week (last 7 days)
    const thisWeekVisitorsRow = await db.prepare(`
      SELECT COUNT(DISTINCT visitor_id) as count
      FROM sessions
      WHERE first_seen >= DATE('now', '-7 days')
    `).first();

    // 2. Total visitors previous week (7 to 14 days ago)
    const lastWeekVisitorsRow = await db.prepare(`
      SELECT COUNT(DISTINCT visitor_id) as count
      FROM sessions
      WHERE first_seen >= DATE('now', '-14 days') AND first_seen < DATE('now', '-7 days')
    `).first();

    // 3. Top 3 pages
    const { results: topPages } = await db.prepare(`
      SELECT COALESCE(page_url, '/') as page, COUNT(*) as views
      FROM events
      WHERE event_type = 'page_view' AND timestamp >= DATE('now', '-7 days')
      GROUP BY page
      ORDER BY views DESC
      LIMIT 3
    `).all();

    // 4. Total leads this week
    let leadsCount = 0;
    try {
      const leadsRow = await db.prepare(`
        SELECT COUNT(*) as count FROM leads WHERE created_at >= DATE('now', '-7 days')
      `).first();
      leadsCount = leadsRow?.count || 0;
    } catch (le) {
      try {
        const contactsRow = await db.prepare(`
          SELECT COUNT(*) as count FROM contacts WHERE created_at >= DATE('now', '-7 days')
        `).first();
        leadsCount = contactsRow?.count || 0;
      } catch (ce) {}
    }

    // 5. Top countries this week
    const { results: topCountries } = await db.prepare(`
      SELECT COALESCE(NULLIF(country, ''), 'غير محدد') as country, COUNT(*) as count
      FROM sessions
      WHERE first_seen >= DATE('now', '-7 days')
      GROUP BY country
      ORDER BY count DESC
      LIMIT 3
    `).all();

    const thisWeekV = thisWeekVisitorsRow?.count || 0;
    const lastWeekV = lastWeekVisitorsRow?.count || 0;
    const diffPercent = lastWeekV > 0
      ? (((thisWeekV - lastWeekV) / lastWeekV) * 100).toFixed(1) + '%'
      : '+100%';

    const reportMessage =
      `📊 <b>التقرير الأسبوعي — PR Agency</b>\n` +
      `📅 <b>الفترة:</b> آخر 7 أيام\n\n` +
      `👥 <b>الزوار هذا الأسبوع:</b> ${thisWeekV} (مقارنة بالسابق: ${lastWeekV} | ${diffPercent})\n` +
      `💼 <b>العملاء المحتملين (Leads):</b> ${leadsCount}\n\n` +
      `📄 <b>أعلى 3 صفحات:</b>\n` +
      (topPages || []).map((p, i) => `${i + 1}. ${p.page} (${p.views} زيارة)`).join('\n') + `\n\n` +
      `🌍 <b>أعلى البلدان:</b>\n` +
      (topCountries || []).map(c => `• ${c.country}: ${c.count}`).join('\n') + `\n\n` +
      `🚀 تابع كافة التفاصيل عبر: <a href="https://pragency.pages.dev/admin/analytics">لوحة التحليلات</a>`;

    let telegramSent = false;
    if (tgToken && tgChatId) {
      const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: reportMessage,
          parse_mode: 'HTML'
        })
      });
      telegramSent = tgRes.ok;
    }

    return new Response(JSON.stringify({
      success: true,
      telegramSent,
      stats: {
        thisWeekVisitors: thisWeekV,
        lastWeekVisitors: lastWeekV,
        leadsCount,
        topPages,
        topCountries
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
