export async function onRequestGet(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const query = `
      SELECT id, slug, client_name, client_name_en, client_logo, service_type,
             results_ar, results_en, metrics_json, cover_image, created_at
      FROM case_studies
      WHERE is_published = 1
      ORDER BY id DESC
    `;
    const result = await db.prepare(query).all();
    const rows = result.results || [];

    // Parse metrics_json for convenience
    const studies = rows.map(r => {
      let metrics = [];
      try { metrics = JSON.parse(r.metrics_json || '[]'); } catch (e) {}
      return { ...r, metrics };
    });

    return new Response(JSON.stringify(studies), {
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
