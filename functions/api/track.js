import { addLeadScore } from '../lib/lead_scoring.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    const payload = await request.json();
    const { session_id, visitor_id, event_type, event_data, page_url } = payload;

    if (!session_id || !event_type) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const eventDataStr = typeof event_data === 'object' ? JSON.stringify(event_data) : (event_data || null);

    if (db) {
      const cf = request.cf || {};

      // 1. Ensure Session exists (satisfies FOREIGN KEY constraint on events.session_id)
      try {
        await db.prepare(`
          INSERT INTO sessions (id, visitor_id, first_seen, last_seen, entry_page, exit_page, country, city, user_agent, page_views)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON CONFLICT(id) DO UPDATE SET
            last_seen = excluded.last_seen,
            exit_page = excluded.exit_page,
            page_views = COALESCE(sessions.page_views, 0) + 1
        `).bind(
          session_id,
          visitor_id || session_id,
          now,
          now,
          page_url || '/',
          page_url || '/',
          cf.country || null,
          cf.city || null,
          request.headers.get('user-agent') || null
        ).run();
      } catch (sessErr) {
        console.warn('[Track API] Session upsert notice:', sessErr.message);
      }

      // 2. Insert Event record
      try {
        await db.prepare(
          'INSERT INTO events (session_id, visitor_id, event_type, event_data, page_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(session_id, visitor_id || null, event_type, eventDataStr, page_url || null, now).run();
      } catch (evErr) {
        try {
          await db.prepare(
            'INSERT INTO events (session_id, event_type, event_data, page_url, timestamp) VALUES (?, ?, ?, ?, ?)'
          ).bind(session_id, event_type, eventDataStr, page_url || null, now).run();
        } catch (evFallbackErr) {
          console.warn('[Track API] Event insert notice:', evFallbackErr.message);
        }
      }

      // 3. Update Lead Scoring dynamically
      try {
        await addLeadScore(env, {
          sessionId: session_id,
          visitorId: visitor_id,
          eventType: event_type,
          pageUrl: page_url,
          eventData: event_data,
          locationInfo: { city: cf.city, country: cf.country }
        });
      } catch (scoreErr) {
        console.warn('[Track API] Lead score notice:', scoreErr.message);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200, // Return 200 with error details so analytics beacons never block the client browser
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
