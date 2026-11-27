import { verifyAdminToken } from '../api/admin/login.js';
import { authenticateCfAccessUser } from '../lib/cf-access.js';

function checkBasicAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD;
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
  const db = env.ANALYTICS_DB || env.DB;

  let isAuthenticated = false;

  // 0. Check Cloudflare Access Assertion (Zero Trust Email OTP)
  const cfUser = await authenticateCfAccessUser(request, env, db);
  if (cfUser) {
    isAuthenticated = true;
  }

  // 1. Check Bearer Token (JWT) or Cookie
  if (!isAuthenticated) {
    const authHeader = request.headers.get('Authorization') || '';
    const cookieHeader = request.headers.get('Cookie') || '';
    let token = null;

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      const match = cookieHeader.match(/pr_admin_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (token) {
      const payload = await verifyAdminToken(token, env);
      if (payload) isAuthenticated = true;
    }
  }

  // 2. Fallback to Basic Auth (if provided)
  if (!isAuthenticated && checkBasicAuth(request, env)) {
    isAuthenticated = true;
  }

  // If not authenticated, let the frontend page load so it can render the login modal
  const response = await next();

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
