function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  try {
    const decoded = atob(auth.slice(6).trim());
    const idx = decoded.indexOf(':');
    if (idx === -1) return false;
    return decoded.slice(idx + 1) === PASS;
  } catch (e) {
    return false;
  }
}

function unauthorized() {
  return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorized();
  if (!env.DB) return json({ success: false, error: 'Database not configured' }, 500);

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM testimonials ORDER BY order_index ASC, id DESC'
    ).all();
    return json({ success: true, data: results || [] });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorized();
  if (!env.DB) return json({ success: false, error: 'Database not configured' }, 500);

  try {
    const b = await request.json();
    if (!b.name || !b.content) {
      return json({ success: false, error: 'Name and content are required' }, 400);
    }

    const rating = Math.min(Math.max(parseInt(b.rating, 10) || 5, 1), 5);
    const orderIndex = parseInt(b.order_index, 10) || 0;
    const isActive = b.is_active !== undefined ? (b.is_active ? 1 : 0) : 1;

    const result = await env.DB.prepare(
      `INSERT INTO testimonials (name, company, role, content, rating, photo_url, order_index, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      String(b.name).trim(),
      String(b.company || '').trim(),
      String(b.role || '').trim(),
      String(b.content).trim(),
      rating,
      String(b.photo_url || '').trim(),
      orderIndex,
      isActive
    ).run();

    return json({ success: true, id: result.meta?.last_row_id, message: 'تمت إضافة الرأي بنجاح' });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorized();
  if (!env.DB) return json({ success: false, error: 'Database not configured' }, 500);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ success: false, error: 'ID is required' }, 400);

    const b = await request.json();
    const updates = [];
    const params = [];

    const allowed = ['name', 'company', 'role', 'content', 'rating', 'photo_url', 'order_index', 'is_active'];
    for (const f of allowed) {
      if (b[f] !== undefined) {
        updates.push(`${f} = ?`);
        if (f === 'rating') {
          params.push(Math.min(Math.max(parseInt(b[f], 10) || 5, 1), 5));
        } else if (f === 'order_index') {
          params.push(parseInt(b[f], 10) || 0);
        } else if (f === 'is_active') {
          params.push(b[f] ? 1 : 0);
        } else {
          params.push(String(b[f] || '').trim());
        }
      }
    }

    if (updates.length === 0) {
      return json({ success: false, error: 'No fields to update' }, 400);
    }

    params.push(id);
    await env.DB.prepare(`UPDATE testimonials SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

    return json({ success: true, message: 'تم تحديث الرأي بنجاح' });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorized();
  if (!env.DB) return json({ success: false, error: 'Database not configured' }, 500);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ success: false, error: 'ID is required' }, 400);

    await env.DB.prepare('DELETE FROM testimonials WHERE id = ?').bind(id).run();
    return json({ success: true, message: 'تم حذف الرأي بنجاح' });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}
