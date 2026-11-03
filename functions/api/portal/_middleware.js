// Central Security Gatekeeper & Role-Based Access Control (RBAC) for Portal APIs
import { verifyToken } from './auth.js';
import { parseCfAccessJwt } from '../../lib/cf-access.js';

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

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Allow CORS Preflight
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '*';
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cf-Access-Jwt-Assertion',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // 2. Allow public auth route (/api/portal/auth) to handle its own login/logout/verify logic
  if (pathname === '/api/portal/auth' || pathname === '/api/portal/settings/payment') {
    const res = await next();
    return res;
  }

  // 3. Admin portal endpoints (/api/portal/admin) -> Require Admin Role
  if (pathname.startsWith('/api/portal/admin')) {
    if (!checkAdminAuth(request, env)) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Admin role required' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Robots-Tag': 'noindex, nofollow, noarchive'
        }
      });
    }
    const res = await next();
    const h = new Headers(res.headers);
    h.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    h.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return new Response(res.body, { status: res.status, headers: h });
  }

  // 4. Client endpoints (/api/portal/deliverable, /api/portal/calendar, /api/portal/review)
  // Check Cloudflare Access Assertion (Zero Trust Email OTP)
  const cfAssertion = request.headers.get('Cf-Access-Jwt-Assertion');
  const cfEmailHeader = request.headers.get('Cf-Access-Authenticated-User-Email');

  if (cfAssertion || cfEmailHeader) {
    let email = '';
    if (cfAssertion) {
      const cfPayload = parseCfAccessJwt(cfAssertion);
      if (cfPayload) email = (cfPayload.email || '').trim().toLowerCase();
    }
    if (!email && cfEmailHeader) email = cfEmailHeader.trim().toLowerCase();

    if (email) {
      const db = env.ANALYTICS_DB || env.DB;
      if (db) {
        try {
          const clientRow = await db.prepare(
            'SELECT id, company_name, contact_name, email FROM portal_clients WHERE LOWER(email) = ?'
          ).bind(email).first();

          if (clientRow) {
            context.data = context.data || {};
            context.data.clientAuth = {
              sub: clientRow.id,
              client_id: clientRow.id,
              company_name: clientRow.company_name,
              contact_name: clientRow.contact_name,
              email: clientRow.email,
              authMethod: 'cf_access_otp'
            };
            const res = await next();
            const h = new Headers(res.headers);
            h.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
            h.set('Cache-Control', 'no-store, no-cache, must-revalidate');
            h.set('X-Frame-Options', 'DENY');
            h.set('X-Content-Type-Options', 'nosniff');
            return new Response(res.body, { status: res.status, headers: h });
          }
        } catch (e) {
          console.warn('[Portal CF Access] Error querying client by email:', e.message);
        }
      }
    }
  }

  // Fallback to JWT session verification
  const cookieHeader = request.headers.get('Cookie') || '';
  const authHeader = request.headers.get('Authorization') || '';
  let token = null;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_portal_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Authentication required' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }

  const clientAuth = await verifyToken(token, env);
  if (!clientAuth) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired token' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }

  // Attach verified user context for downstream handlers
  context.data = context.data || {};
  context.data.clientAuth = clientAuth;

  const response = await next();

  // Enforce anti-indexing and security headers
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
