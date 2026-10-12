// Helper: Hash password with SHA-256
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate simple HMAC-signed session token
async function createToken(client, secret) {
  const payload = {
    sub: client.id,
    name: client.company_name,
    email: client.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 30) // 30 days
  };
  const str = btoa(JSON.stringify(payload));
  const sig = await sha256(str + (secret || 'pr-portal-secret-key-2026'));
  return `${str}.${sig}`;
}

export async function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [str, sig] = token.split('.');
  const expectedSig = await sha256(str + (secret || 'pr-portal-secret-key-2026'));
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(atob(str));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// ── 1. POST /api/portal/auth (Login / Logout) ──────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { action, email, password } = body;

    if (action === 'logout') {
      return new Response(JSON.stringify({ success: true, message: 'Logged out' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'pr_portal_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
        }
      });
    }

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, error: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = await db.prepare('SELECT * FROM portal_clients WHERE email = ? AND active = 1').bind(email.trim().toLowerCase()).first();
    if (!client) {
      return new Response(JSON.stringify({ success: false, error: 'بيانات الدخول غير صحيحة أو الحساب غير مفعل' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const inputHash = await sha256(password.trim());
    if (inputHash !== client.password_hash) {
      return new Response(JSON.stringify({ success: false, error: 'كلمة المرور غير صحيحة' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const secret = env.PORTAL_JWT_SECRET || 'pr-portal-secret-key-2026';
    const token = await createToken(client, secret);

    return new Response(JSON.stringify({
      success: true,
      token,
      client: {
        id: client.id,
        companyName: client.company_name,
        contactName: client.contact_name,
        email: client.email,
        logoUrl: client.logo_url,
        brandColor: client.brand_color
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `pr_portal_token=${token}; Path=/; Max-Age=2592000; SameSite=Lax`
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ── 2. GET /api/portal/auth (Check session) ───────────────────────────────────
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  const cookieHeader = request.headers.get('Cookie') || '';
  const authHeader = request.headers.get('Authorization') || '';
  
  let token = null;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_portal_token=([^;]+)/);
    if (match) token = match[1];
  }

  const secret = env.PORTAL_JWT_SECRET || 'pr-portal-secret-key-2026';
  const payload = await verifyToken(token, secret);

  if (!payload || !db) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const client = await db.prepare('SELECT id, company_name, contact_name, email, logo_url, brand_color FROM portal_clients WHERE id = ? AND active = 1').bind(payload.sub).first();

  if (!client) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    authenticated: true,
    client: {
      id: client.id,
      companyName: client.company_name,
      contactName: client.contact_name,
      email: client.email,
      logoUrl: client.logo_url,
      brandColor: client.brand_color
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
