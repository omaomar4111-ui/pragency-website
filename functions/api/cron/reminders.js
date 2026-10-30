// functions/api/cron/reminders.js
// Secure Automated & Manual Reminders Runner for Cloudflare Pages Functions
import { handleRemindersCron } from '../cron-reminders.js';
import { verifyAdminToken } from '../admin/login.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Verification:
  // Option 1: Secret token via query parameter or header (?token=... or Authorization: Bearer <secret>)
  // Option 2: Super Admin JWT Authorization header
  const CRON_SECRET = env.CRON_SECRET || 'pragency_cron_secret_2026_super_secure';
  const queryToken = url.searchParams.get('token');
  const authHeader = request.headers.get('Authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

  let isAuthorized = false;

  if (queryToken && queryToken === CRON_SECRET) {
    isAuthorized = true;
  } else if (bearerToken && bearerToken === CRON_SECRET) {
    isAuthorized = true;
  } else if (bearerToken) {
    // Check if valid admin token
    const adminUser = await verifyAdminToken(bearerToken, env);
    if (adminUser) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return jsonResponse({
      success: false,
      error: 'Unauthorized: Valid CRON_SECRET or Admin Bearer token required.'
    }, 401);
  }

  try {
    const report = await handleRemindersCron(env);
    return jsonResponse({
      success: true,
      message: 'تم تشغيل فحص التذكيرات وإرسال التقرير بنجاح',
      report
    });
  } catch (err) {
    console.error('Error running reminders cron:', err);
    return jsonResponse({
      success: false,
      error: err.message || 'Internal Server Error'
    }, 500);
  }
}
