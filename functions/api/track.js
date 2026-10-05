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
      // 1. Insert Event
      const insertEvent = db.prepare(
        'INSERT INTO events (session_id, visitor_id, event_type, event_data, page_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(session_id, visitor_id || null, event_type, eventDataStr, page_url || null, now);

      // 2. Update Session last_seen and exit_page
      const updateSession = db.prepare(
        'UPDATE sessions SET last_seen = ?, exit_page = ? WHERE id = ?'
      ).bind(now, page_url || null, session_id);

      await db.batch([insertEvent, updateSession]);

      // 3. Update Lead Scoring dynamically
      const cf = request.cf || {};
      await addLeadScore(env, {
        sessionId: session_id,
        visitorId: visitor_id,
        eventType: event_type,
        pageUrl: page_url,
        eventData: event_data,
        locationInfo: { city: cf.city, country: cf.country }
      });
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
