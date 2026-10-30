import { verifyAdminToken } from './login.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  const authHeader = request.headers.get('Authorization') || '';
  const cookieHeader = request.headers.get('Cookie') || '';

  let token = null;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_admin_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return new Response(JSON.stringify({ authenticated: false, error: 'No token provided' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const payload = await verifyAdminToken(token, env);
  if (!payload) {
    return new Response(JSON.stringify({ authenticated: false, error: 'Token invalid or expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    authenticated: true,
    user: {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      isSuperAdmin: !!payload.isSuperAdmin
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}
