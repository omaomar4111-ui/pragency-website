export async function onRequestGet(context) {
  const { params, env } = context;
  const slug = params.slug;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const study = await db.prepare(
      'SELECT * FROM case_studies WHERE slug = ? AND is_published = 1'
    ).bind(slug).first();

    if (!study) {
      return new Response(JSON.stringify({ error: 'Case study not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let metrics = [];
    try { metrics = JSON.parse(study.metrics_json || '[]'); } catch (e) {}

    return new Response(JSON.stringify({ ...study, metrics }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
