import { verifyAdminToken } from './login.js';
import { authenticateCfAccessUser } from '../../lib/cf-access.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  // 0. Check Cloudflare Access Zero Trust Assertion (Email OTP)
  const cfUser = await authenticateCfAccessUser(request, env, db);
  if (cfUser) {
    return new Response(JSON.stringify({
      authenticated: true,
      authMethod: 'cf_access_otp',
      user: {
        id: cfUser.id,
        name: cfUser.name,
        email: cfUser.email,
        role: cfUser.role,
        isSuperAdmin: !!cfUser.isSuperAdmin
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }

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
