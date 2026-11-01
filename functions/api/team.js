export async function onRequestGet(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  
  if (!db) {
    return new Response(JSON.stringify({ success: true, data: [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { results } = await db.prepare(
      'SELECT id, name, role, department, email FROM agency_team_members WHERE active = 1 ORDER BY id ASC'
    ).all();
    
    return new Response(JSON.stringify({ success: true, data: results || [] }), {
      status: 200, headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: true, data: [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }
}
