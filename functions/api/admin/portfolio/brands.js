function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Basic ')) return false;
  try {
    const base64 = authHeader.slice(6).trim();
    const decoded = atob(base64);
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return false;
    return decoded.slice(colonIdx + 1) === PASS;
  } catch (e) {
    return false;
  }
}

function unauthResponse() {
  return new Response('Unauthorized Access to PR Agency Admin API', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

// GET /api/admin/portfolio/brands - list all brands
export async function onRequestGet(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const query = `
      SELECT b.*, COUNT(d.id) AS design_count
      FROM portfolio_brands b
      LEFT JOIN portfolio_designs d ON b.id = d.brand_id
      GROUP BY b.id
      ORDER BY b.display_order ASC, b.id DESC
    `;
    const { results } = await db.prepare(query).all();
    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST /api/admin/portfolio/brands - create new brand
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const body = await request.json();
    const {
      slug,
      name_ar,
      name_en,
      description_ar,
      description_en,
      logo_url,
      category,
      display_order,
      is_published
    } = body;

    if (!slug || !name_ar) {
      return new Response(JSON.stringify({ error: 'الاسم بالعربي والـ Slug مطلوبان' }), { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const now = new Date().toISOString();

    const result = await db.prepare(`
      INSERT INTO portfolio_brands (
        slug, name_ar, name_en, description_ar, description_en,
        logo_url, category, display_order, is_published, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      cleanSlug,
      name_ar.trim(),
      name_en ? name_en.trim() : null,
      description_ar ? description_ar.trim() : null,
      description_en ? description_en.trim() : null,
      logo_url || null,
      category || 'social_media',
      parseInt(display_order, 10) || 0,
      is_published !== undefined ? (is_published ? 1 : 0) : 1,
      now
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: result.meta?.last_row_id,
      slug: cleanSlug
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// PUT /api/admin/portfolio/brands - update brand
export async function onRequestPut(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const body = await request.json();
    const {
      id,
      slug,
      name_ar,
      name_en,
      description_ar,
      description_en,
      logo_url,
      category,
      display_order,
      is_published
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Brand ID is required' }), { status: 400 });
    }

    const cleanSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : null;

    await db.prepare(`
      UPDATE portfolio_brands SET
        slug = COALESCE(?, slug),
        name_ar = COALESCE(?, name_ar),
        name_en = COALESCE(?, name_en),
        description_ar = COALESCE(?, description_ar),
        description_en = COALESCE(?, description_en),
        logo_url = COALESCE(?, logo_url),
        category = COALESCE(?, category),
        display_order = COALESCE(?, display_order),
        is_published = COALESCE(?, is_published)
      WHERE id = ?
    `).bind(
      cleanSlug,
      name_ar ? name_ar.trim() : null,
      name_en !== undefined ? name_en.trim() : null,
      description_ar !== undefined ? description_ar.trim() : null,
      description_en !== undefined ? description_en.trim() : null,
      logo_url !== undefined ? logo_url : null,
      category !== undefined ? category : null,
      display_order !== undefined ? parseInt(display_order, 10) : null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      id
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// DELETE /api/admin/portfolio/brands - delete brand
export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    // Cascade delete designs first (just in case foreign keys constraint is off)
    await db.prepare('DELETE FROM portfolio_designs WHERE brand_id = ?').bind(id).run();
    await db.prepare('DELETE FROM portfolio_brands WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
