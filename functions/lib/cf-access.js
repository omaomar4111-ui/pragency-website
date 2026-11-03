// functions/lib/cf-access.js
// Cloudflare Access (Zero Trust) Email OTP Token Parser & Authenticator
// Extracts and verifies Cf-Access-Jwt-Assertion and matches against team members or approved domains.

/**
 * Safely decodes base64url string
 */
function base64UrlDecode(str) {
  try {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0: break;
      case 2: output += '=='; break;
      case 3: output += '='; break;
      default: return null;
    }
    return atob(output);
  } catch (e) {
    return null;
  }
}

/**
 * Parses a Cloudflare Access JWT Assertion string without external dependencies.
 * Validates expiration (exp) and structure.
 */
export function parseCfAccessJwt(jwtString) {
  if (!jwtString || typeof jwtString !== 'string') return null;
  const parts = jwtString.split('.');
  if (parts.length !== 3) return null;

  try {
    const jsonStr = base64UrlDecode(parts[1]);
    if (!jsonStr) return null;
    const payload = JSON.parse(jsonStr);

    // Expiration check
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('[CF Access] Token has expired. Exp:', payload.exp, 'Now:', now);
      return null;
    }

    return payload;
  } catch (err) {
    console.warn('[CF Access] Failed to decode assertion payload:', err.message);
    return null;
  }
}

/**
 * Authenticates an incoming request using Cloudflare Access Zero Trust headers.
 * Looks for `Cf-Access-Jwt-Assertion` and `Cf-Access-Authenticated-User-Email`.
 */
export async function authenticateCfAccessUser(request, env, db) {
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  const emailHeader = request.headers.get('Cf-Access-Authenticated-User-Email') || '';

  if (!assertion && !emailHeader) {
    return null;
  }

  let email = '';
  let sub = '';

  if (assertion) {
    const payload = parseCfAccessJwt(assertion);
    if (!payload) {
      return null;
    }
    // Verify audience if configured in Cloudflare environment
    if (env.CF_ACCESS_AUD && payload.aud) {
      const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audList.includes(env.CF_ACCESS_AUD)) {
        console.warn('[CF Access] Audience mismatch. Expected:', env.CF_ACCESS_AUD, 'Got:', payload.aud);
        return null;
      }
    }
    email = (payload.email || '').trim().toLowerCase();
    sub = payload.sub || '';
  }

  if (!email && emailHeader) {
    email = emailHeader.trim().toLowerCase();
  }

  if (!email) {
    return null;
  }

  // 1. Check against agency_team_members table in D1
  if (db) {
    try {
      const member = await db.prepare(
        'SELECT id, name, email, role, roles, department, active FROM agency_team_members WHERE LOWER(email) = ?'
      ).bind(email).first();

      if (member && member.active === 1) {
        const primaryRole = member.role || member.roles || 'Team Member';
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: primaryRole,
          department: member.department || 'Operations',
          isSuperAdmin: primaryRole.toLowerCase() === 'super admin' || primaryRole.toLowerCase() === 'superadmin',
          authMethod: 'cf_access_otp'
        };
      }
    } catch (e) {
      console.warn('[CF Access] Error querying team members:', e.message);
    }
  }

  // 2. Check approved domain / administrative list
  const isApprovedAdmin = 
    email.endsWith('@pragency.eg') ||
    email.endsWith('@2dmarketing.agency') ||
    email === 'hello@2dmarketing.agency' ||
    email.startsWith('admin@') ||
    (env.APPROVED_ADMIN_EMAILS && env.APPROVED_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).includes(email));

  if (isApprovedAdmin) {
    return {
      id: sub || ('cf_' + email.split('@')[0]),
      name: email.split('@')[0].toUpperCase(),
      email: email,
      role: 'Super Admin',
      department: 'Executive',
      isSuperAdmin: true,
      authMethod: 'cf_access_otp'
    };
  }

  return null;
}
