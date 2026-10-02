function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Basic ')) return false;
  try {
    const base64 = authHeader.slice(6).trim();
    const decoded = atob(base64);
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return false;
    return decoded.slice(colonIdx + 1) === PASS;
  } catch (e) {
    return false;
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return new Response('Unauthorized Access to Analytics', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="PR Agency Analytics", charset="UTF-8"',
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) {
    return new Response('Database not bound', { status: 500 });
  }

  try {
    // 1. Stats Summary
    const totalVisitsRow = await db.prepare('SELECT COUNT(*) as total FROM sessions').first();
    const totalEventsRow = await db.prepare('SELECT COUNT(*) as total FROM events').first();
    const uniqueVisitorsRow = await db.prepare('SELECT COUNT(DISTINCT visitor_id) as total FROM sessions').first();

    // 2. Recent Sessions
    const { results: recentSessions } = await db.prepare(`
      SELECT id, visitor_id, first_seen, country, city, entry_page, exit_page, page_views, is_bot
      FROM sessions
      ORDER BY first_seen DESC
      LIMIT 20
    `).all();

    // 3. Recent Journey Events
    const { results: recentEvents } = await db.prepare(`
      SELECT session_id, event_type, event_data, page_url, timestamp
      FROM events
      ORDER BY timestamp DESC
      LIMIT 50
    `).all();

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PR Agency — إحصائيات ورحلة الزوار</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg: #0A0014;
      --card-bg: #14001F;
      --card-border: rgba(139, 92, 246, 0.2);
      --purple: #8B5CF6;
      --text: #ffffff;
      --text-muted: rgba(255, 255, 255, 0.65);
      --font: 'Cairo', system-ui, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      padding: 30px 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    h1 { font-size: 26px; font-weight: 900; color: #fff; }
    .back-btn {
      padding: 8px 18px; border-radius: 8px; background: rgba(139, 92, 246, 0.15);
      color: #A78BFA; text-decoration: none; font-weight: 700; font-size: 14px;
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 16px; padding: 24px; text-align: center;
    }
    .stat-val { font-size: 32px; font-weight: 900; color: var(--purple); margin-bottom: 4px; }
    .stat-lbl { font-size: 13px; color: var(--text-muted); font-weight: 600; }
    .section-title { font-size: 18px; font-weight: 800; margin-bottom: 16px; color: #E9D5FF; }
    .table-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 16px; overflow-x: auto; margin-bottom: 30px;
    }
    table { width: 100%; border-collapse: collapse; text-align: right; font-size: 14px; }
    th { background: rgba(139, 92, 246, 0.1); padding: 14px 18px; color: #A78BFA; font-weight: 700; }
    td { padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: var(--text-muted); }
    tr:hover td { background: rgba(139, 92, 246, 0.04); color: #fff; }
    .badge {
      display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
    }
    .badge-pv { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .badge-cta { background: rgba(16, 185, 129, 0.2); color: #34D399; }
    .badge-wa { background: rgba(37, 211, 102, 0.2); color: #25D366; }
    .badge-scroll { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>📊 لوحة تحليلات الزوار ورحلة العميل</h1>
        <p style="color:var(--text-muted);font-size:13px;margin-top:4px;">تتبع تفصيلي لحظة بلحظة لكل زائر وتفاعلاته</p>
      </div>
      <a href="/admin" class="back-btn">لوحة التحكم الرئيسية ←</a>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${totalVisitsRow?.total || 0}</div>
        <div class="stat-lbl">إجمالي الجلسات (Sessions)</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${uniqueVisitorsRow?.total || 0}</div>
        <div class="stat-lbl">الزوار الفريدين (Unique Visitors)</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${totalEventsRow?.total || 0}</div>
        <div class="stat-lbl">إجمالي التفاعلات (Events Tracked)</div>
      </div>
    </div>

    <div class="section-title">آخر الجلسات المسجلة (Recent Sessions)</div>
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>الجلسة / الزائر</th>
            <th>الموقع الجغرافي</th>
            <th>صفحة الدخول</th>
            <th>صفحة الخروج</th>
            <th>عدد المشاهدات</th>
            <th>الوقت</th>
          </tr>
        </thead>
        <tbody>
          ${(recentSessions || []).map(s => `
            <tr>
              <td><code>${(s.visitor_id || '').slice(0, 8)}</code></td>
              <td>${s.city ? s.city + '، ' : ''}${s.country || 'غير معروف'}</td>
              <td>${s.entry_page || '/'}</td>
              <td>${s.exit_page || '/'}</td>
              <td><span style="font-weight:700;color:#fff">${s.page_views || 1}</span></td>
              <td>${new Date(s.first_seen).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section-title">أحدث رحلات وتفاعلات الزوار (Customer Journey Stream)</div>
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>الحدث (Event)</th>
            <th>الصفحة</th>
            <th>تفاصيل الحدث (Data)</th>
            <th>الجلسة</th>
            <th>التوقيت</th>
          </tr>
        </thead>
        <tbody>
          ${(recentEvents || []).map(e => {
            let bClass = 'badge-pv';
            if (e.event_type === 'cta_click') bClass = 'badge-cta';
            if (e.event_type === 'wa_click') bClass = 'badge-wa';
            if (e.event_type === 'scroll_depth') bClass = 'badge-scroll';
            return `
            <tr>
              <td><span class="badge ${bClass}">${e.event_type}</span></td>
              <td>${e.page_url || '/'}</td>
              <td><code>${e.event_data || '-'}</code></td>
              <td><code>${(e.session_id || '').slice(0, 15)}</code></td>
              <td>${new Date(e.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (err) {
    return new Response('Error loading analytics: ' + err.message, { status: 500 });
  }
}
