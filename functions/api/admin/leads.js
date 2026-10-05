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
      'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorizedResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'DB not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const leads = await db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 100').all();
    const totalLeads = await db.prepare('SELECT COUNT(*) as count FROM leads').first();
    // Fetch sessions including lead_score
    let recentSessionsList = [];
    try {
      const sessRes = await db.prepare('SELECT id, visitor_id, first_seen, last_seen, country, city, entry_page, exit_page, page_views, COALESCE(lead_score, 0) as lead_score FROM sessions ORDER BY first_seen DESC LIMIT 50').all();
      recentSessionsList = sessRes.results || [];
    } catch (se) {
      const fallbackSess = await db.prepare('SELECT * FROM chat_sessions ORDER BY last_message_at DESC LIMIT 50').all();
      recentSessionsList = fallbackSess.results || [];
    }

    return new Response(JSON.stringify({
      success: true,
      totalLeads: totalLeads?.count || 0,
      leads: leads.results || [],
      recentSessions: recentSessionsList
    }, null, 2), {
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

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorizedResponse();

  const db = env.ANALYTICS_DB || env.DB;
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return new Response(JSON.stringify({ success: false, error: 'Missing id or status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.prepare('UPDATE leads SET status = ? WHERE id = ?').bind(status, id).run();
    return new Response(JSON.stringify({ success: true }), {
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
