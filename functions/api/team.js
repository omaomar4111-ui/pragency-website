export async function onRequestGet(context) {
  const { env } = context;
  
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'DB not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, name, role, bio, photo_url, linkedin_url FROM team_members WHERE is_active = 1 ORDER BY order_index ASC, id ASC'
    ).all();
    
    return new Response(JSON.stringify({ success: true, data: results || [] }), {
      status: 200, headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
