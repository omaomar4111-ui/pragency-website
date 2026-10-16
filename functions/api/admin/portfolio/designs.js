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

// GET /api/admin/portfolio/designs - list designs
export async function onRequestGet(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const url = new URL(request.url);
    const brandSlug = url.searchParams.get('brand');
    const brandId = url.searchParams.get('brand_id');

    let query = `
      SELECT d.*, b.name_ar AS brand_name_ar, b.name_en AS brand_name_en, b.slug AS brand_slug
      FROM portfolio_designs d
      INNER JOIN portfolio_brands b ON d.brand_id = b.id
    `;
    const params = [];

    if (brandSlug) {
      query += ` WHERE b.slug = ?`;
      params.push(brandSlug);
    } else if (brandId) {
      query += ` WHERE d.brand_id = ?`;
      params.push(brandId);
    }

    query += ` ORDER BY d.display_order ASC, d.id DESC`;

    const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
    const { results } = await stmt.all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST /api/admin/portfolio/designs - create new design
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const body = await request.json();
    const {
      brand_id,
      title_ar,
      title_en,
      description_ar,
      description_en,
      image_url,
      thumbnail_url,
      r2_key,
      design_type,
      display_order,
      is_published
    } = body;

    if (!brand_id || !image_url) {
      return new Response(JSON.stringify({ error: 'البراند والصورة مطلوبان' }), { status: 400 });
    }

    const now = new Date().toISOString();

    const result = await db.prepare(`
      INSERT INTO portfolio_designs (
        brand_id, title_ar, title_en, description_ar, description_en,
        image_url, thumbnail_url, r2_key, design_type, display_order, is_published, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      parseInt(brand_id, 10),
      title_ar ? title_ar.trim() : null,
      title_en ? title_en.trim() : null,
      description_ar ? description_ar.trim() : null,
      description_en ? description_en.trim() : null,
      image_url.trim(),
      thumbnail_url ? thumbnail_url.trim() : image_url.trim(),
      r2_key || null,
      design_type || 'social_media',
      parseInt(display_order, 10) || 0,
      is_published !== undefined ? (is_published ? 1 : 0) : 1,
      now
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: result.meta?.last_row_id
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// PUT /api/admin/portfolio/designs - update design
export async function onRequestPut(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const body = await request.json();
    const {
      id,
      brand_id,
      title_ar,
      title_en,
      description_ar,
      description_en,
      image_url,
      thumbnail_url,
      r2_key,
      design_type,
      display_order,
      is_published
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Design ID is required' }), { status: 400 });
    }

    await db.prepare(`
      UPDATE portfolio_designs SET
        brand_id = COALESCE(?, brand_id),
        title_ar = COALESCE(?, title_ar),
        title_en = COALESCE(?, title_en),
        description_ar = COALESCE(?, description_ar),
        description_en = COALESCE(?, description_en),
        image_url = COALESCE(?, image_url),
        thumbnail_url = COALESCE(?, thumbnail_url),
        r2_key = COALESCE(?, r2_key),
        design_type = COALESCE(?, design_type),
        display_order = COALESCE(?, display_order),
        is_published = COALESCE(?, is_published)
      WHERE id = ?
    `).bind(
      brand_id ? parseInt(brand_id, 10) : null,
      title_ar !== undefined ? title_ar.trim() : null,
      title_en !== undefined ? title_en.trim() : null,
      description_ar !== undefined ? description_ar.trim() : null,
      description_en !== undefined ? description_en.trim() : null,
      image_url !== undefined ? image_url.trim() : null,
      thumbnail_url !== undefined ? thumbnail_url.trim() : null,
      r2_key !== undefined ? r2_key : null,
      design_type !== undefined ? design_type : null,
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

// DELETE /api/admin/portfolio/designs - delete design and R2 object
export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

    const design = await db.prepare('SELECT r2_key FROM portfolio_designs WHERE id = ?').bind(id).first();
    if (design && design.r2_key && env.PORTFOLIO_BUCKET) {
      try {
        await env.PORTFOLIO_BUCKET.delete(design.r2_key);
      } catch (r2Err) {
        console.warn('Failed to delete R2 object:', r2Err);
      }
    }

    await db.prepare('DELETE FROM portfolio_designs WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
