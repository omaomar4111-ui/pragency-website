function checkAdminAuth(request, env) {
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

// ── GET /api/portal/admin (List clients & all deliverables for agency team) ───
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!checkAdminAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="PR Agency Admin"',
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const clients = await db.prepare('SELECT id, company_name, contact_name, email, logo_url, active, created_at FROM portal_clients ORDER BY created_at DESC').all();
    const deliverables = await db.prepare('SELECT d.*, c.company_name FROM portal_deliverables d JOIN portal_clients c ON d.client_id = c.id ORDER BY d.scheduled_date DESC').all();

    return new Response(JSON.stringify({
      success: true,
      clients: clients.results || [],
      deliverables: deliverables.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ── POST /api/portal/admin (Create client or deliverable) ─────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!checkAdminAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const now = new Date().toISOString();

    if (action === 'create_client') {
      const { companyName, contactName, email, password, logoUrl, brandColor } = body;
      if (!companyName || !email || !password) {
        return new Response(JSON.stringify({ success: false, error: 'Missing required client fields' }), { status: 400 });
      }

      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password.trim()));
      const passHash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      const clientId = 'c_' + Date.now().toString(36);

      await db.prepare(`
        INSERT INTO portal_clients (id, company_name, contact_name, email, password_hash, logo_url, brand_color, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(clientId, companyName, contactName || null, email.trim().toLowerCase(), passHash, logoUrl || null, brandColor || '#8b5cf6', now).run();

      return new Response(JSON.stringify({ success: true, clientId }), { status: 200 });
    }

    if (action === 'create_deliverable') {
      const { clientId, title, type, mediaUrl, thumbnailUrl, caption, hashtags, scheduledDate, scheduledTime, platform } = body;
      if (!clientId || !title || !type || !mediaUrl || !scheduledDate) {
        return new Response(JSON.stringify({ success: false, error: 'Missing required deliverable fields' }), { status: 400 });
      }

      const deliverableId = 'del_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      await db.prepare(`
        INSERT INTO portal_deliverables (id, client_id, title, type, media_url, thumbnail_url, caption, hashtags, scheduled_date, scheduled_time, platform, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).bind(deliverableId, clientId, title, type, mediaUrl, thumbnailUrl || null, caption || '', hashtags || '', scheduledDate, scheduledTime || '18:00', platform || 'instagram', now).run();

      return new Response(JSON.stringify({ success: true, deliverableId }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
