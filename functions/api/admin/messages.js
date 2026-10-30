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

function unauthorizedResponse() {
  return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: {
      // 'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const url = new URL(request.url);
    const status = (url.searchParams.get('status') || '').trim().toLowerCase();
    const starred = url.searchParams.get('starred');
    const search = (url.searchParams.get('search') || '').trim();
    const sort = (url.searchParams.get('sort') || 'date_desc').trim().toLowerCase();
    const lead_source = (url.searchParams.get('lead_source') || '').trim();
    const utm_campaign = (url.searchParams.get('utm_campaign') || '').trim();

    let query = 'SELECT * FROM contacts';
    const whereClauses = [];
    const params = [];

    // Filter by status
    if (status && ['new', 'contacted', 'closed'].includes(status)) {
      whereClauses.push("COALESCE(status, 'new') = ?");
      params.push(status);
    }

    // Filter by starred
    if (starred !== null && starred !== '') {
      const starVal = (starred === '1' || starred === 'true') ? 1 : 0;
      whereClauses.push('COALESCE(starred, 0) = ?');
      params.push(starVal);
    }

    // Filter by lead_source (website / meta_lead_ads)
    if (lead_source) {
      whereClauses.push("COALESCE(lead_source, 'website') = ?");
      params.push(lead_source);
    }

    // Filter by utm_campaign
    if (utm_campaign) {
      whereClauses.push("utm_campaign = ?");
      params.push(utm_campaign);
    }

    // Search filter (name, phone, business, message, notes, campaign)
    if (search) {
      whereClauses.push('(name LIKE ? OR phone LIKE ? OR business LIKE ? OR message LIKE ? OR COALESCE(notes, "") LIKE ? OR COALESCE(utm_campaign, "") LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Sorting
    if (sort === 'date_asc') {
      query += ' ORDER BY created_at ASC, id ASC';
    } else if (sort === 'name') {
      query += ' ORDER BY name COLLATE NOCASE ASC, id DESC';
    } else {
      // Default: date_desc
      query += ' ORDER BY created_at DESC, id DESC';
    }

    query += ' LIMIT 500';

    const stmt = params.length > 0 ? env.DB.prepare(query).bind(...params) : env.DB.prepare(query);
    const { results } = await stmt.all();

    const sanitized = (results || []).map(r => ({
      ...r,
      status: r.status || 'new',
      notes: r.notes || '',
      starred: Number(r.starred || 0),
      lead_source: r.lead_source || 'website',
      utm_campaign: r.utm_campaign || '',
      utm_source: r.utm_source || '',
      utm_medium: r.utm_medium || '',
      utm_content: r.utm_content || '',
      meta_lead_id: r.meta_lead_id || ''
    }));

    return new Response(JSON.stringify({
      success: true,
      count: sanitized.length,
      data: sanitized
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    let body = {};
    if (request.headers.get('content-type')?.includes('application/json')) {
      body = await request.json().catch(() => ({}));
    }

    if (!id && body.id) {
      id = body.id;
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Message ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const updates = [];
    const params = [];

    if (body.status !== undefined) {
      const st = String(body.status).trim().toLowerCase();
      if (!['new', 'contacted', 'closed'].includes(st)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid status value. Must be new, contacted, or closed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
      updates.push('status = ?');
      params.push(st);
    }

    if (body.notes !== undefined) {
      const notes = String(body.notes || '').slice(0, 5000);
      updates.push('notes = ?');
      params.push(notes);
    }

    if (body.starred !== undefined) {
      const starred = (body.starred === 1 || body.starred === true || body.starred === '1') ? 1 : 0;
      updates.push('starred = ?');
      params.push(starred);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No valid fields provided to update (status, notes, starred)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    params.push(id);
    const sql = `UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(sql).bind(...params).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'تم تحديث الرسالة بنجاح',
      updatedId: id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id && request.headers.get('content-type')?.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Message ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    await env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'تم حذف الرسالة بنجاح',
      deletedId: id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
