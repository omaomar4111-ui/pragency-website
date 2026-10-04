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

function unauthorizedResponse() {
  return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="PR Agency Analytics", charset="UTF-8"',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return unauthorizedResponse();
  }

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    // 1. Visitors per day (last 30 days)
    const { results: visitorsPerDay } = await db.prepare(`
      SELECT 
        DATE(first_seen) as date, 
        COUNT(DISTINCT visitor_id) as visitors,
        COUNT(id) as sessions
      FROM sessions
      WHERE first_seen >= DATE('now', '-30 days')
      GROUP BY DATE(first_seen)
      ORDER BY date ASC
    `).all();

    // 2. Top pages
    const { results: topPages } = await db.prepare(`
      SELECT 
        COALESCE(page_url, entry_page, '/') as page,
        COUNT(*) as views
      FROM (
        SELECT page_url, NULL as entry_page FROM events WHERE event_type = 'page_view'
        UNION ALL
        SELECT NULL as page_url, entry_page FROM sessions WHERE entry_page IS NOT NULL
      )
      WHERE page IS NOT NULL AND page != ''
      GROUP BY page
      ORDER BY views DESC
      LIMIT 10
    `).all();

    // 3. Top countries
    const { results: topCountries } = await db.prepare(`
      SELECT 
        COALESCE(NULLIF(country, ''), 'غير محدد') as country,
        COUNT(*) as count
      FROM sessions
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `).all();

    // 4. Recent leads
    let recentLeads = [];
    try {
      const leadsRes = await db.prepare(`
        SELECT id, name, phone, email, message, source, status, created_at, country, city
        FROM leads
        ORDER BY created_at DESC
        LIMIT 20
      `).all();
      recentLeads = leadsRes.results || [];
    } catch (e) {
      try {
        const contactsRes = await db.prepare(`
          SELECT id, name, phone, email, message, lead_source as source, status, created_at
          FROM contacts
          ORDER BY created_at DESC
          LIMIT 20
        `).all();
        recentLeads = contactsRes.results || [];
      } catch (ce) {
        console.warn('Leads fetch error:', ce.message);
      }
    }

    // 5. Recent chatbot & visitor sessions
    let recentSessions = [];
    try {
      const sessRes = await db.prepare(`
        SELECT id, visitor_id, first_seen, last_seen, country, city, entry_page, exit_page, page_views, is_bot
        FROM sessions
        ORDER BY first_seen DESC
        LIMIT 20
      `).all();
      recentSessions = sessRes.results || [];
    } catch (se) {
      console.warn('Sessions fetch error:', se.message);
    }

    const payload = {
      visitors_per_day: visitorsPerDay || [],
      top_pages: topPages || [],
      top_countries: topCountries || [],
      recent_leads: recentLeads || [],
      recent_sessions: recentSessions || []
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
