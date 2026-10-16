export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const brandSlug = url.searchParams.get('brand');
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database binding not available' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    let query = `
      SELECT d.*, b.name_ar AS brand_name_ar, b.name_en AS brand_name_en, b.slug AS brand_slug
      FROM portfolio_designs d
      INNER JOIN portfolio_brands b ON d.brand_id = b.id
      WHERE d.is_published = 1 AND b.is_published = 1
    `;
    const params = [];

    if (brandSlug) {
      query += ` AND b.slug = ?`;
      params.push(brandSlug);
    }

    query += ` ORDER BY d.display_order ASC, d.id DESC`;

    const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
    const { results } = await stmt.all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-maxage=120'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
