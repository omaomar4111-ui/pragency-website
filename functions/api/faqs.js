export async function onRequestGet(context) {
  try {
    const { env } = context;
    // Fetch only active FAQs, ordered by order_index
    const { results } = await env.DB.prepare(
      "SELECT * FROM faqs WHERE is_active = 1 ORDER BY order_index ASC, created_at DESC"
    ).all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
