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
      params.push(parseInt(brandId, 10));
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

// POST /api/admin/portfolio/designs - create new design(s) (supports single or bulk array)
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const body = await request.json();
    const now = new Date().toISOString();

    // Check if bulk insert (array of items)
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return new Response(JSON.stringify({ error: 'القائمة فارغة' }), { status: 400 });
      }

      const insertedIds = [];
      for (const item of body) {
        if (!item.brand_id || !item.image_url) continue;
        const mediaType = item.media_type || (item.design_type === 'video' ? 'video' : 'image');
        const videoUrl = item.video_url || (mediaType === 'video' ? item.image_url : null);

        const res = await db.prepare(`
          INSERT INTO portfolio_designs (
            brand_id, title_ar, title_en, description_ar, description_en,
            image_url, thumbnail_url, video_url, media_type, r2_key, design_type, display_order, is_published, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          parseInt(item.brand_id, 10),
          item.title_ar ? item.title_ar.trim() : null,
          item.title_en ? item.title_en.trim() : null,
          item.description_ar ? item.description_ar.trim() : null,
          item.description_en ? item.description_en.trim() : null,
          item.image_url.trim(),
          item.thumbnail_url ? item.thumbnail_url.trim() : item.image_url.trim(),
          videoUrl ? videoUrl.trim() : null,
          mediaType,
          item.r2_key || null,
          item.design_type || 'social_media',
          parseInt(item.display_order, 10) || 0,
          item.is_published !== undefined ? (item.is_published ? 1 : 0) : 1,
          now
        ).run();
        insertedIds.push(res.meta?.last_row_id);
      }

      return new Response(JSON.stringify({ success: true, count: insertedIds.length, ids: insertedIds }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // Single design insert
    const {
      brand_id,
      title_ar,
      title_en,
      description_ar,
      description_en,
      image_url,
      thumbnail_url,
      video_url,
      media_type,
      r2_key,
      design_type,
      display_order,
      is_published
    } = body;

    if (!brand_id || !image_url) {
      return new Response(JSON.stringify({ error: 'البراند والصورة مطلوبان' }), { status: 400 });
    }

    const calculatedMediaType = media_type || (design_type === 'video' ? 'video' : 'image');
    const calculatedVideoUrl = video_url || (calculatedMediaType === 'video' ? image_url : null);

    const result = await db.prepare(`
      INSERT INTO portfolio_designs (
        brand_id, title_ar, title_en, description_ar, description_en,
        image_url, thumbnail_url, video_url, media_type, r2_key, design_type, display_order, is_published, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      parseInt(brand_id, 10),
      title_ar ? title_ar.trim() : null,
      title_en ? title_en.trim() : null,
      description_ar ? description_ar.trim() : null,
      description_en ? description_en.trim() : null,
      image_url.trim(),
      thumbnail_url ? thumbnail_url.trim() : image_url.trim(),
      calculatedVideoUrl ? calculatedVideoUrl.trim() : null,
      calculatedMediaType,
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
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// PUT /api/admin/portfolio/designs - update design or batch reorder
export async function onRequestPut(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const body = await request.json();

    // Check if batch reorder: { reorder: [{ id: 1, display_order: 0 }, ...] }
    if (body.reorder && Array.isArray(body.reorder)) {
      for (const item of body.reorder) {
        if (item.id !== undefined && item.display_order !== undefined) {
          await db.prepare('UPDATE portfolio_designs SET display_order = ? WHERE id = ?')
            .bind(parseInt(item.display_order, 10), parseInt(item.id, 10)).run();
        }
      }
      return new Response(JSON.stringify({ success: true, message: 'Reordered successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const {
      id,
      brand_id,
      title_ar,
      title_en,
      description_ar,
      description_en,
      image_url,
      thumbnail_url,
      video_url,
      media_type,
      r2_key,
      design_type,
      display_order,
      is_published
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'معرّف التصميم مطلوب' }), { status: 400 });
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
        video_url = COALESCE(?, video_url),
        media_type = COALESCE(?, media_type),
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
      video_url !== undefined ? video_url.trim() : null,
      media_type !== undefined ? media_type : null,
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

// DELETE /api/admin/portfolio/designs - delete single or bulk delete
export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthResponse();

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 });

  try {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get('ids');
    const idParam = url.searchParams.get('id');

    let idsToDelete = [];
    if (idsParam) {
      idsToDelete = idsParam.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
    } else if (idParam) {
      idsToDelete = [parseInt(idParam.trim(), 10)];
    } else {
      try {
        const body = await request.json();
        if (body && Array.isArray(body.ids)) {
          idsToDelete = body.ids.map(s => parseInt(s, 10)).filter(Boolean);
        } else if (body && body.id) {
          idsToDelete = [parseInt(body.id, 10)].filter(Boolean);
        }
      } catch (e) {
        // no json body
      }
    }

    if (idsToDelete.length === 0) {
      return new Response(JSON.stringify({ error: 'معرّف التصميم أو المعرفات مطلوبة' }), { status: 400 });
    }

    for (const id of idsToDelete) {
      const design = await db.prepare('SELECT r2_key FROM portfolio_designs WHERE id = ?').bind(id).first();
      if (design && design.r2_key && env.PORTFOLIO_BUCKET) {
        try {
          await env.PORTFOLIO_BUCKET.delete(design.r2_key);
        } catch (r2Err) {
          console.warn('Failed to delete R2 object:', r2Err);
        }
      }
      await db.prepare('DELETE FROM portfolio_designs WHERE id = ?').bind(id).run();
    }

    return new Response(JSON.stringify({ success: true, deleted: idsToDelete.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
