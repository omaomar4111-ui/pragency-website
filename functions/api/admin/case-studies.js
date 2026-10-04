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
      'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (!checkAuth(request, env)) return unauthorizedResponse();

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    // 1. GET: List all case studies (published & drafts)
    if (request.method === 'GET') {
      const result = await db.prepare('SELECT * FROM case_studies ORDER BY id DESC').all();
      return new Response(JSON.stringify(result.results || []), { status: 200, headers: jsonHeaders });
    }

    // 2. POST: Create new case study
    if (request.method === 'POST') {
      const data = await request.json();
      let slug = (data.slug || '').trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-');
      if (!slug) {
        slug = (data.client_name_en || data.client_name || 'case')
          .toLowerCase().trim().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-');
      }

      const now = new Date().toISOString();
      const insertQuery = `
        INSERT INTO case_studies (
          slug, client_name, client_name_en, client_logo, service_type,
          challenge_ar, challenge_en, solution_ar, solution_en,
          results_ar, results_en, metrics_json, cover_image,
          testimonial_ar, testimonial_en, testimonial_author,
          is_published, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.prepare(insertQuery).bind(
        slug,
        data.client_name || '',
        data.client_name_en || '',
        data.client_logo || '',
        data.service_type || 'Marketing',
        data.challenge_ar || '',
        data.challenge_en || '',
        data.solution_ar || '',
        data.solution_en || '',
        data.results_ar || '',
        data.results_en || '',
        typeof data.metrics_json === 'string' ? data.metrics_json : JSON.stringify(data.metrics_json || []),
        data.cover_image || '',
        data.testimonial_ar || '',
        data.testimonial_en || '',
        data.testimonial_author || '',
        data.is_published !== undefined ? (data.is_published ? 1 : 0) : 1,
        now
      ).run();

      return new Response(JSON.stringify({ success: true, slug }), { status: 201, headers: jsonHeaders });
    }

    // 3. PUT: Update existing case study by ID
    if (request.method === 'PUT') {
      const data = await request.json();
      const id = data.id;
      if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers: jsonHeaders });

      const updateQuery = `
        UPDATE case_studies SET
          slug = ?, client_name = ?, client_name_en = ?, client_logo = ?, service_type = ?,
          challenge_ar = ?, challenge_en = ?, solution_ar = ?, solution_en = ?,
          results_ar = ?, results_en = ?, metrics_json = ?, cover_image = ?,
          testimonial_ar = ?, testimonial_en = ?, testimonial_author = ?,
          is_published = ?
        WHERE id = ?
      `;

      await db.prepare(updateQuery).bind(
        data.slug,
        data.client_name,
        data.client_name_en,
        data.client_logo,
        data.service_type,
        data.challenge_ar,
        data.challenge_en,
        data.solution_ar,
        data.solution_en,
        data.results_ar,
        data.results_en,
        typeof data.metrics_json === 'string' ? data.metrics_json : JSON.stringify(data.metrics_json || []),
        data.cover_image,
        data.testimonial_ar,
        data.testimonial_en,
        data.testimonial_author,
        data.is_published ? 1 : 0,
        id
      ).run();

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
    }

    // 4. DELETE: Delete case study by ID
    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers: jsonHeaders });

      await db.prepare('DELETE FROM case_studies WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: jsonHeaders });
  }
}
