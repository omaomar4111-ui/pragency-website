// functions/api/admin/publish-day.js
// Handles closing and publishing daily work logs (idempotent via user_id + date) and retrieving feed.

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { request, env, data } = context;
  const user = data?.adminUser;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: Admin authentication required' }, 401);
  }

  const url = new URL(request.url);
  const date = url.searchParams.get('date');

  try {
    let query = 'SELECT * FROM daily_publishes';
    const params = [];
    if (date) {
      query += ' WHERE date = ?';
      params.push(date);
    }
    query += ' ORDER BY published_at DESC LIMIT 50';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    return jsonResponse({ success: true, data: results || [] });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data?.adminUser;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: Admin authentication required' }, 401);
  }

  try {
    const body = await request.json();
    const { 
      summary = '', 
      date = new Date().toISOString().slice(0, 10) 
    } = body;

    // Calculate user's total hours logged for this specific day
    const hoursRow = await env.DB.prepare(`
      SELECT COALESCE(SUM(hours), 0) as total_hours 
      FROM time_entries 
      WHERE user_id = ? AND date = ?
    `).bind(user.id, date).first();

    const totalHours = hoursRow?.total_hours || 0;
    const publishId = 'pub_' + crypto.randomUUID().slice(0, 8);

    // Idempotent UPSERT into daily_publishes
    await env.DB.prepare(`
      INSERT INTO daily_publishes (id, user_id, user_name, date, summary, total_hours, published_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, date) DO UPDATE SET
        summary = excluded.summary,
        total_hours = excluded.total_hours,
        published_at = CURRENT_TIMESTAMP
    `).bind(
      publishId,
      user.id,
      user.name || 'Admin User',
      date,
      summary.trim(),
      totalHours
    ).run();

    return jsonResponse({
      success: true,
      message: 'Day published successfully!',
      data: {
        user_id: user.id,
        user_name: user.name,
        date,
        summary: summary.trim(),
        total_hours: totalHours
      }
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
