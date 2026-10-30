import { verifyPassword } from '../portal/auth.js';
import { logSystemAction } from '../../lib/audit.js';

function getJwtSecret(env) {
  const secret = env.JWT_SECRET || env.PORTAL_SECRET || env.PORTAL_JWT_SECRET || 'pr2026_super_secret_jwt_key_agency_os';
  return secret;
}

// Generate a signed JWT token valid for 30 days
export async function createAdminToken(user, env) {
  const secretKey = getJwtSecret(env);
  const payload = {
    sub: user.id || 'admin',
    name: user.name || 'Super Admin',
    email: user.email || 'admin@pragency.com',
    role: user.role || 'Super Admin',
    isSuperAdmin: !!user.isSuperAdmin,
    token_type: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 30), // 30-day session
    expiresIn: '30d'
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (let i = 0; i < jsonBytes.byteLength; i++) {
    binary += String.fromCharCode(jsonBytes[i]);
  }
  const str = btoa(binary);
  const sigBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${str}.${secretKey}`));
  const sig = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${str}.${sig}`;
}

// Verify JWT token
export async function verifyAdminToken(token, env) {
  if (!token || !token.includes('.')) return null;
  const secretKey = getJwtSecret(env);
  const [str, sig] = token.split('.');
  const expectedBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${str}.${secretKey}`));
  const expectedSig = Array.from(new Uint8Array(expectedBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (sig !== expectedSig) return null;

  try {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decodedText = new TextDecoder().decode(bytes);
    const payload = JSON.parse(decodedText);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    // Enforce token audience / type segregation: Client tokens cannot act as Admin
    if (payload.token_type !== 'admin' && !payload.role) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function hashSimpleSha(password) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

// POST: Admin Login -> issues 30-day JWT with strict Rate Limiting (Max 5 failed attempts per 15 mins)
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Math.floor(Date.now() / 1000);
  const WINDOW_SECONDS = 900; // 15 minutes
  const MAX_ATTEMPTS = 5;

  try {
    // 0. Check Rate Limiter via D1
    if (db && clientIp !== 'unknown') {
      try {
        const record = await db.prepare(
          'SELECT attempts, first_attempt_at, last_attempt_at, blocked_until FROM login_attempts WHERE ip = ?'
        ).bind(clientIp).first();

        if (record) {
          // If currently blocked and block time has not expired
          if (record.blocked_until && record.blocked_until > now) {
            const retryAfter = record.blocked_until - now;
            await logSystemAction(db, {
              actor_id: 'anonymous',
              actor_name: 'Blocked IP',
              actor_role: 'system',
              action: 'admin_login_rate_limited',
              target_type: 'auth',
              target_id: clientIp,
              details: { reason: 'Rate limit exceeded (blocked)', retry_after: retryAfter },
              ip_address: clientIp
            });

            return new Response(JSON.stringify({
              success: false,
              error: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول (5 محاولات). برجاء الانتظار قبل المحاولة مرة أخرى.',
              retry_after: retryAfter
            }), {
              status: 429,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Retry-After': String(retryAfter)
              }
            });
          }

          // If window expired, reset attempts
          if (now - record.first_attempt_at > WINDOW_SECONDS) {
            await db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(clientIp).run();
          }
        }
      } catch (rateLimitErr) {
        console.warn('[RateLimiter Pre-check Warning]:', rateLimitErr.message);
      }
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: 'اسم المستخدم وكلمة المرور مطلوبان' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const normUser = username.trim().toLowerCase();
    const pass = password.trim();
    const ADMIN_USER = (env.ADMIN_USERNAME || 'admin').toLowerCase();
    const ADMIN_PASS = env.ADMIN_PASSWORD || 'pr2026';

    let authenticatedUser = null;

    // 1. Super Admin Environment Variable Check
    if ((normUser === ADMIN_USER || normUser === 'superadmin' || normUser === 'admin' || normUser === 'admin@pragency.eg' || normUser === 'admin@pragency.com') && pass === ADMIN_PASS) {
      authenticatedUser = {
        id: 'admin_root',
        name: 'Super Admin',
        email: 'admin@pragency.eg',
        role: 'Super Admin',
        isSuperAdmin: true
      };
    }

    // 2. Database Team Member Check
    if (!authenticatedUser && db) {
      const member = await db.prepare(
        'SELECT id, name, email, password_hash, role, roles, department, active FROM agency_team_members WHERE email = ? OR id = ?'
      ).bind(normUser, normUser).first();

      if (member && member.active === 1) {
        let isMatch = false;
        if (member.password_hash.startsWith('scrypt:') || member.password_hash.startsWith('pbkdf2:')) {
          isMatch = await verifyPassword(pass, member.password_hash);
        } else {
          const simpleHash = await hashSimpleSha(pass);
          isMatch = (member.password_hash === simpleHash || member.password_hash === pass);
        }

        if (isMatch) {
          const primaryRole = member.role || member.roles || 'Team Member';
          authenticatedUser = {
            id: member.id,
            name: member.name,
            email: member.email,
            role: primaryRole,
            department: member.department,
            isSuperAdmin: primaryRole === 'Super Admin'
          };
        }
      }
    }

    // Handle Failed Attempt (Rate Limiter Increment)
    if (!authenticatedUser) {
      let attemptsCount = 1;
      let isBlocked = false;

      if (db && clientIp !== 'unknown') {
        try {
          const record = await db.prepare(
            'SELECT attempts, first_attempt_at FROM login_attempts WHERE ip = ?'
          ).bind(clientIp).first();

          if (!record || (now - record.first_attempt_at > WINDOW_SECONDS)) {
            // New window or first failure
            await db.prepare(
              'INSERT INTO login_attempts (ip, attempts, first_attempt_at, last_attempt_at, blocked_until) VALUES (?, 1, ?, ?, NULL) ON CONFLICT(ip) DO UPDATE SET attempts = 1, first_attempt_at = ?, last_attempt_at = ?, blocked_until = NULL'
            ).bind(clientIp, now, now, now, now).run();
            attemptsCount = 1;
          } else {
            attemptsCount = record.attempts + 1;
            if (attemptsCount > MAX_ATTEMPTS) {
              isBlocked = true;
              const blockedUntil = now + WINDOW_SECONDS;
              await db.prepare(
                'UPDATE login_attempts SET attempts = ?, last_attempt_at = ?, blocked_until = ? WHERE ip = ?'
              ).bind(attemptsCount, now, blockedUntil, clientIp).run();

              // Log blocked attempt to audit logs
              await logSystemAction(db, {
                actor_id: 'anonymous',
                actor_name: 'Blocked IP',
                actor_role: 'system',
                action: 'admin_login_rate_limited',
                target_type: 'auth',
                target_id: clientIp,
                details: { reason: 'Exceeded 5 failed login attempts', attempts: attemptsCount, blocked_until: blockedUntil },
                ip_address: clientIp
              });

              return new Response(JSON.stringify({
                success: false,
                error: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول (5 محاولات). تم حظر الوصول مؤقتاً لمدة 15 دقيقة.',
                retry_after: WINDOW_SECONDS
              }), {
                status: 429,
                headers: {
                  'Content-Type': 'application/json; charset=utf-8',
                  'Retry-After': String(WINDOW_SECONDS)
                }
              });
            } else {
              await db.prepare(
                'UPDATE login_attempts SET attempts = ?, last_attempt_at = ? WHERE ip = ?'
              ).bind(attemptsCount, now, clientIp).run();
            }
          }
        } catch (dbErr) {
          console.warn('[RateLimiter Post-failure Warning]:', dbErr.message);
        }
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'بيانات الدخول غير صحيحة أو الحساب غير مفعل',
        remaining_attempts: Math.max(0, MAX_ATTEMPTS - attemptsCount)
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Success: Reset failed attempts for this IP
    if (db && clientIp !== 'unknown') {
      try {
        await db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(clientIp).run();
      } catch (resetErr) {
        console.warn('[RateLimiter Reset Warning]:', resetErr.message);
      }
    }

    // Generate 30-day JWT token
    const token = await createAdminToken(authenticatedUser, env);

    // Audit log login
    if (db) {
      await logSystemAction(db, {
        actor_id: authenticatedUser.id,
        actor_name: authenticatedUser.name,
        actor_role: authenticatedUser.role,
        action: 'admin_login_success',
        target_type: 'auth',
        target_id: authenticatedUser.id,
        details: { method: 'jwt_login', role: authenticatedUser.role },
        ip_address: clientIp
      });
    }

    return new Response(JSON.stringify({
      success: true,
      token,
      expiresIn: '30d',
      user: authenticatedUser
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Set-Cookie': `pr_admin_token=${token}; Path=/; Max-Age=2592000; SameSite=Lax`
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// OPTIONS for CORS
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
