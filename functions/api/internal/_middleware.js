// functions/api/internal/_middleware.js
// Protects all /api/internal/* endpoints (AI Agents, emit-event, etc.)
import { verifyAdminToken } from '../admin/login.js';
import { authenticateCfAccessUser } from '../../lib/cf-access.js';

export async function onRequest(context) {
  const { request, env } = context;

  // 1. Check Internal Secret Header (for server-to-server / cron calls)
  const internalSecret = request.headers.get('X-Internal-Secret');
  if (env.INTERNAL_API_SECRET && internalSecret && internalSecret === env.INTERNAL_API_SECRET) {
    return context.next();
  }

  // 2. Check Admin Bearer Token
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const admin = await verifyAdminToken(token, env);
      if (admin) {
        context.data.user = admin;
        return context.next();
      }
    } catch (e) {}
  }

  // 3. Check Cloudflare Access Zero Trust JWT
  const db = env.DB || env.ANALYTICS_DB;
  const cfUser = await authenticateCfAccessUser(request, env, db);
  if (cfUser && cfUser.isSuperAdmin) {
    context.data.user = cfUser;
    return context.next();
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Unauthorized: Internal API requires Admin or Internal Secret' }),
    { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
}
