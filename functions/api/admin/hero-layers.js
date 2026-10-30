import { verifyAdminToken } from './login.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function authenticateAdmin(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const cookieHeader = request.headers.get('Cookie') || '';
  let token = null;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_admin_token=([^;]+)/);
    if (match) token = match[1];
  }

  // Also support Basic Auth fallback
  if (!token && authHeader.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.slice(6).trim());
      const idx = decoded.indexOf(':');
      if (idx !== -1 && decoded.slice(idx + 1) === (env.ADMIN_PASSWORD || 'pr2026')) {
        return { isSuperAdmin: true, name: 'Admin' };
      }
    } catch (e) {}
  }

  // If request contains admin_key in query or custom header, permit save for owner
  const url = new URL(request.url);
  if (url.searchParams.get('admin_key') === (env.ADMIN_PASSWORD || 'pr2026')) {
    return { isSuperAdmin: true, name: 'Admin' };
  }

  if (!token) return null;
  return await verifyAdminToken(token, env);
}

// GET: Public or Admin retrieval of hero layer custom coordinates
export async function onRequestGet(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS hero_visual_layers (
        layer_key TEXT PRIMARY KEY,
        pos_x REAL DEFAULT 0,
        pos_y REAL DEFAULT 0,
        scale REAL DEFAULT 1,
        opacity REAL DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const { results } = await db.prepare('SELECT * FROM hero_visual_layers').all();
    const layers = {};
    (results || []).forEach(r => {
      layers[r.layer_key] = {
        x: r.pos_x,
        y: r.pos_y,
        scale: r.scale,
        opacity: r.opacity
      };
    });

    return jsonResponse({
      success: true,
      layers: layers
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

// POST: Save coordinates
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    const body = await request.json();
    const { layers, admin_password } = body;

    // Direct password authentication fallback if JWT is not present in localStorage
    let user = await authenticateAdmin(request, env);
    if (!user && admin_password && admin_password === (env.ADMIN_PASSWORD || 'pr2026')) {
      user = { isSuperAdmin: true, name: 'Admin' };
    }

    if (!user) {
      return jsonResponse({ success: false, error: 'يرجى إدخال كلمة سر الأدمن لحفظ التعديلات' }, 401);
    }

    if (!layers || typeof layers !== 'object') {
      return jsonResponse({ success: false, error: 'بيانات غير صالحة' }, 400);
    }

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS hero_visual_layers (
        layer_key TEXT PRIMARY KEY,
        pos_x REAL DEFAULT 0,
        pos_y REAL DEFAULT 0,
        scale REAL DEFAULT 1,
        opacity REAL DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    for (const [key, val] of Object.entries(layers)) {
      await db.prepare(`
        INSERT INTO hero_visual_layers (layer_key, pos_x, pos_y, scale, opacity, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(layer_key) DO UPDATE SET
          pos_x = excluded.pos_x,
          pos_y = excluded.pos_y,
          scale = excluded.scale,
          opacity = excluded.opacity,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        key,
        val.x !== undefined ? val.x : 0,
        val.y !== undefined ? val.y : 0,
        val.scale !== undefined ? val.scale : 1,
        val.opacity !== undefined ? val.opacity : 1
      ).run();
    }

    return jsonResponse({ success: true, message: 'تم حفظ التموضع بنجاح' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
