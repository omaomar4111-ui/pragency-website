export async function onRequest(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);

    // GET: Assign or retrieve variant for visitor
    if (request.method === 'GET') {
      const visitorId = url.searchParams.get('visitorId');
      const page = url.searchParams.get('page') || '/';

      if (!visitorId) {
        return new Response(JSON.stringify({ error: 'Missing visitorId' }), { status: 400, headers: corsHeaders });
      }

      // Check existing assignment
      const existing = await db.prepare(
        'SELECT variant, clicked FROM ab_tests WHERE visitor_id = ? ORDER BY id DESC LIMIT 1'
      ).bind(visitorId).first();

      if (existing) {
        return new Response(JSON.stringify({ variant: existing.variant, clicked: existing.clicked }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Assign 50/50: Variant A ("اطلب عرض سعر") or Variant B ("احصل على استشارة مجانية")
      const variant = Math.random() < 0.5 ? 'A' : 'B';
      const now = new Date().toISOString();

      await db.prepare(
        'INSERT INTO ab_tests (visitor_id, variant, page, clicked, created_at) VALUES (?, ?, ?, 0, ?)'
      ).bind(visitorId, variant, page, now).run();

      return new Response(JSON.stringify({ variant, clicked: 0 }), { status: 200, headers: corsHeaders });
    }

    // POST: Record click on CTA
    if (request.method === 'POST') {
      const payload = await request.json();
      const { visitorId, variant, page } = payload;

      if (!visitorId) {
        return new Response(JSON.stringify({ error: 'Missing visitorId' }), { status: 400, headers: corsHeaders });
      }

      const now = new Date().toISOString();
      const existing = await db.prepare(
        'SELECT id FROM ab_tests WHERE visitor_id = ?'
      ).bind(visitorId).first();

      if (existing) {
        await db.prepare(
          'UPDATE ab_tests SET clicked = 1 WHERE id = ?'
        ).bind(existing.id).run();
      } else {
        await db.prepare(
          'INSERT INTO ab_tests (visitor_id, variant, page, clicked, created_at) VALUES (?, ?, ?, 1, ?)'
        ).bind(visitorId, variant || 'A', page || '/', now).run();
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
