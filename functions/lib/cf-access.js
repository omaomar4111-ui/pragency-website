// functions/lib/cf-access.js
// Cloudflare Access (Zero Trust) Email OTP Token Parser & Cryptographic RS256 Authenticator
// Extracts and cryptographically verifies Cf-Access-Jwt-Assertion against Cloudflare JWKS.

const jwksCache = new Map();
const JWKS_TTL_MS = 3600 * 1000; // 1 hour

function base64UrlToUint8Array(str) {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0: break;
    case 2: output += '=='; break;
    case 3: output += '='; break;
    default: throw new Error('Invalid base64url string');
  }
  const binary = atob(output);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecode(str) {
  try {
    const bytes = base64UrlToUint8Array(str);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return null;
  }
}

async function fetchJwks(certsUrl) {
  const cached = jwksCache.get(certsUrl);
  if (cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) {
    return cached.keys;
  }
  const res = await fetch(certsUrl, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    throw new Error(`Failed to fetch CF Access certs: ${res.status}`);
  }
  const data = await res.json();
  const keys = Array.isArray(data.keys) ? data.keys : [];
  jwksCache.set(certsUrl, { keys, fetchedAt: Date.now() });
  return keys;
}

/**
 * Cryptographically verifies a Cloudflare Access JWT Assertion (RS256)
 * against Cloudflare's public JWKS endpoint.
 */
export async function verifyCfAccessJwt(jwtString, env = {}) {
  if (!jwtString || typeof jwtString !== 'string') return null;
  const parts = jwtString.split('.');
  if (parts.length !== 3) return null;

  try {
    const headerStr = base64UrlDecode(parts[0]);
    const payloadStr = base64UrlDecode(parts[1]);
    if (!headerStr || !payloadStr) return null;

    const header = JSON.parse(headerStr);
    const payload = JSON.parse(payloadStr);

    if (header.alg !== 'RS256' || !header.kid) {
      console.warn('[CF Access] Unsupported alg or missing kid');
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('[CF Access] Token expired');
      return null;
    }

    if (env.CF_ACCESS_AUD && payload.aud) {
      const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audList.includes(env.CF_ACCESS_AUD)) {
        console.warn('[CF Access] Audience mismatch');
        return null;
      }
    }

    // Determine certs URL from env.CF_ACCESS_TEAM_DOMAIN or validated payload.iss
    let certsUrl = '';
    if (env.CF_ACCESS_TEAM_DOMAIN) {
      certsUrl = `https://${env.CF_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`;
    } else if (payload.iss && /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com\/?$/i.test(payload.iss)) {
      certsUrl = `${payload.iss.replace(/\/$/, '')}/cdn-cgi/access/certs`;
    } else {
      console.warn('[CF Access] Missing CF_ACCESS_TEAM_DOMAIN and invalid iss');
      return null;
    }

    const keys = await fetchJwks(certsUrl);
    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) {
      console.warn('[CF Access] Matching JWK not found for kid:', header.kid);
      return null;
    }

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlToUint8Array(parts[2]);
    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes,
      signingInput
    );

    if (!isValid) {
      console.warn('[CF Access] Invalid RS256 signature');
      return null;
    }

    return payload;
  } catch (err) {
    console.warn('[CF Access] JWT verification failed:', err.message);
    return null;
  }
}

/**
 * Authenticates an incoming request using Cloudflare Access Zero Trust.
 * Strictly requires a cryptographically verified `Cf-Access-Jwt-Assertion`.
 */
export async function authenticateCfAccessUser(request, env, db) {
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  if (!assertion) {
    return null;
  }

  const payload = await verifyCfAccessJwt(assertion, env);
  if (!payload) {
    return null;
  }

  const email = (payload.email || '').trim().toLowerCase();
  const sub = payload.sub || '';
  if (!email) {
    return null;
  }

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
          roles: member.roles || primaryRole,
          department: member.department || 'General',
          isSuperAdmin: primaryRole.toLowerCase().includes('super') || primaryRole.toLowerCase().includes('admin'),
          authMethod: 'cf_access',
          sub
        };
      }
    } catch (dbErr) {
      console.warn('[CF Access] D1 lookup failed:', dbErr.message);
    }
  }

  return null;
}

export { verifyCfAccessJwt as parseCfAccessJwt };
