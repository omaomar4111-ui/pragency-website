import { verifyPassword } from '../portal/auth.js';
import { verifyAdminToken } from '../admin/login.js';

// Central RBAC Gatekeeper for Agency Team APIs (/api/team/*)
function hashSimpleSha(password) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

async function checkTeamAuth(request, env, db) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const authHeader = request.headers.get('Authorization') || '';
  const cookieHeader = request.headers.get('Cookie') || '';

  // 1. Support Admin JWT Bearer Token or Cookie
  let token = null;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_admin_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    const payload = await verifyAdminToken(token, env);
    if (payload) {
      return {
        id: payload.sub,
        name: payload.name,
        username: payload.email,
        email: payload.email,
        role: payload.role || 'Super Admin',
        roles: payload.role || 'Super Admin',
        isSuperAdmin: !!payload.isSuperAdmin
      };
    }
  }

  // 2. Basic Auth Fallback
  if (authHeader.startsWith('Basic ')) {
    try {
      const base64 = authHeader.slice(6).trim();
      const decoded = atob(base64);
      const colonIdx = decoded.indexOf(':');
      if (colonIdx !== -1) {
        const username = decoded.slice(0, colonIdx).trim().toLowerCase();
        const pass = decoded.slice(colonIdx + 1);

        // 1. Super Admin fallback
        if (pass === PASS || pass === 'pr_team_2026') {
          return {
            id: 'admin',
            name: username,
            username,
            role: username.includes('am') ? 'Account Manager' : 'Super Admin',
            roles: username.includes('am') ? 'Account Manager' : 'Super Admin',
            isSuperAdmin: true
          };
        }

        // 2. Database Team Member Check
        if (db) {
          const member = await db.prepare(
            'SELECT id, name, email, password_hash, role, roles, department, active FROM agency_team_members WHERE email = ? OR id = ?'
          ).bind(username, username).first();

          if (member && member.active === 1) {
            // Check PBKDF2/scrypt first, fallback to SHA-256 or plaintext
            let isMatch = false;
            if (member.password_hash.startsWith('scrypt:') || member.password_hash.startsWith('pbkdf2:')) {
              isMatch = await verifyPassword(pass, member.password_hash);
            } else {
              const simpleHash = await hashSimpleSha(pass);
              isMatch = (member.password_hash === simpleHash || member.password_hash === pass);
            }

            if (isMatch) {
              const primaryRole = member.role || member.roles || 'Team Member';
              return {
                id: member.id,
                name: member.name,
                email: member.email,
                role: primaryRole,
                roles: primaryRole,
                department: member.department,
                isSuperAdmin: primaryRole === 'Super Admin'
              };
            }
          }
        }
      }
    } catch (e) {
      console.error('[RBAC Middleware] Auth verification error:', e.message);
    }
  }
  return null;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const db = env.ANALYTICS_DB || env.DB;

  // 1. Allow CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // 1.5. Allow public GET /api/team (public team members endpoint for website)
  const reqUrl = new URL(request.url);
  if (request.method === 'GET' && (reqUrl.pathname === '/api/team' || reqUrl.pathname === '/api/team/')) {
    return next();
  }

  // 2. Strict Authentication & Role Check
  const teamUser = await checkTeamAuth(request, env, db);
  if (!teamUser) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Team authentication required' }), {
      status: 401,
      headers: {
      // 'WWW-Authenticate': 'Basic realm="PR Agency Team OS", charset="UTF-8"',
        'Content-Type': 'application/json',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Frame-Options': 'DENY'
      }
    });
  }

  // 3. RBAC Policy enforcement on sensitive routes
  const url = new URL(request.url);
  const path = url.pathname;

  // E.g. Only Account Managers or Super Admins can approve deliverables to clients
  if (path.includes('/api/team/assets/approve') && !teamUser.isSuperAdmin && !teamUser.role.toLowerCase().includes('account')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Forbidden: فقط مدير الحسابات (Account Manager) أو المدير العام يملك صلاحية اعتماد الأعمال للعميل'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  context.data = context.data || {};
  context.data.teamUser = teamUser;

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('X-Frame-Options', 'DENY');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
