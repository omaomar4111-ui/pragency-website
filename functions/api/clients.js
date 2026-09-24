/**
 * GET /api/clients
 * Public Cloudflare Pages Function — queries D1 clients table
 * Same pattern as functions/api/team.js
 */
export async function onRequestGet(context) {
  try {
    const db = context.env.DB;

    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not configured', clients: [] }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const result = await db
      .prepare(
        `SELECT id, name, logo_url, website_url
         FROM clients
         WHERE is_active = 1
         ORDER BY order_index ASC, id ASC`
      )
      .all();

    return new Response(
      JSON.stringify({
        clients: result.results || [],
        count: (result.results || []).length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('[/api/clients] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', clients: [] }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
