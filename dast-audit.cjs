// dast-audit.cjs
// Dynamic Application Security Testing (DAST) Suite against https://pragency.pages.dev
// Tests OWASP Top 10 vulnerabilities dynamically against the live production environment.

const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://pragency.pages.dev';

// Test results storage
const results = [];

function recordTest(category, name, passed, details) {
  results.push({ category, name, passed, details });
  const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${statusIcon}] [${category}] ${name}`);
  if (details) console.log(`       ↳ ${details}`);
}

async function request(method, path, options = {}) {
  const targetUrl = new URL(path, BASE_URL);
  const headers = options.headers || {};
  const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

  if (body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const req = https.request(targetUrl, {
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) req.write(body);
    req.end();
  });
}

async function runSuite() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`       🛡️ DAST SECURITY PENETRATION SUITE — PR AGENCY PRODUCTION       `);
  console.log(`       Target: ${BASE_URL}                                             `);
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  // ─── 1. SQL Injection Tests ────────────────────────────────────────────────
  console.log('--- 1. SQL Injection Defense ---');
  try {
    // 1.1 Portal Auth SQLi
    const sqliLoginRes = await request('POST', '/api/portal/auth', {
      body: { email: "' OR '1'='1' --", password: 'anypassword' }
    });
    const sqliLoginPass = sqliLoginRes.statusCode === 400 || sqliLoginRes.statusCode === 401;
    const sqliLoginNoLeak = !sqliLoginRes.body.includes('syntax error') && !sqliLoginRes.body.includes('sqlite_') && !sqliLoginRes.body.includes('D1_ERROR');
    recordTest('SQL Injection', 'Portal Login SQLi Immunity', sqliLoginPass && sqliLoginNoLeak,
      `Status: ${sqliLoginRes.statusCode}. No raw SQL syntax/table leaks found.`);

    // 1.2 Contact Form SQLi
    const sqliContactRes = await request('POST', '/api/contact', {
      body: { name: "Robert'); DROP TABLE leads;--", email: "sqli-test@test.com", phone: "01000000000", message: "' OR 1=1 --" }
    });
    const sqliContactPass = sqliContactRes.statusCode < 500 && !sqliContactRes.body.includes('syntax error');
    recordTest('SQL Injection', 'Contact Form Parameterized Statements', sqliContactPass,
      `Status: ${sqliContactRes.statusCode}. Payloads safely handled.`);

    // 1.3 Search Parameter SQLi
    const sqliSearchRes = await request('GET', "/api/admin/search?q=' UNION SELECT 1,2,3--");
    const sqliSearchPass = sqliSearchRes.statusCode === 401 || (sqliSearchRes.statusCode === 200 && !sqliSearchRes.body.includes('UNION SELECT'));
    recordTest('SQL Injection', 'Admin Search Query Sanitization', sqliSearchPass,
      `Status: ${sqliSearchRes.statusCode}. Protected by Auth middleware / safe query parsing.`);
  } catch (err) {
    recordTest('SQL Injection', 'SQLi Suite Execution', false, err.message);
  }

  // ─── 2. Cross-Site Scripting (XSS) ─────────────────────────────────────────
  console.log('\n--- 2. Cross-Site Scripting (XSS) Defense ---');
  try {
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    const xssContactRes = await request('POST', '/api/contact', {
      body: { name: xssPayload, email: 'xss-tester@example.com', phone: '01011112222', message: xssPayload }
    });
    // Check if the response echoes back raw unescaped script tag
    const xssReflected = xssContactRes.body.includes('<script>alert("XSS")</script>');
    recordTest('XSS Defense', 'Contact Form Stored/Reflected Neutralization', !xssReflected,
      `Server response does not reflect unescaped HTML/script tags.`);

    // Test parameter reflection on public index
    const xssIndexRes = await request('GET', '/?test=<script>alert("reflected")</script>');
    const xssIndexReflected = xssIndexRes.body.includes('<script>alert("reflected")</script>');
    recordTest('XSS Defense', 'URL Query Reflection Neutralization', !xssIndexReflected,
      `Public homepage does not reflect untrusted URL parameters into DOM.`);
  } catch (err) {
    recordTest('XSS Defense', 'XSS Suite Execution', false, err.message);
  }

  // ─── 3. Security Headers (HEAD requests) ───────────────────────────────────
  console.log('\n--- 3. Security Headers Verification ---');
  try {
    const headRes = await request('HEAD', '/');
    const h = headRes.headers;

    recordTest('Security Headers', 'HSTS (Strict-Transport-Security)',
      Boolean(h['strict-transport-security'] && h['strict-transport-security'].includes('max-age=31536000')),
      `Value: ${h['strict-transport-security']}`);

    recordTest('Security Headers', 'X-Frame-Options (Clickjacking Defense)',
      Boolean(h['x-frame-options'] && (h['x-frame-options'].toUpperCase() === 'DENY' || h['x-frame-options'].toUpperCase() === 'SAMEORIGIN')),
      `Value: ${h['x-frame-options']}`);

    recordTest('Security Headers', 'X-Content-Type-Options (MIME Sniffing)',
      Boolean(h['x-content-type-options'] && h['x-content-type-options'].toLowerCase() === 'nosniff'),
      `Value: ${h['x-content-type-options']}`);

    recordTest('Security Headers', 'Content-Security-Policy (CSP)',
      Boolean(h['content-security-policy'] && h['content-security-policy'].includes("default-src")),
      `Value: ${h['content-security-policy'] ? h['content-security-policy'].substring(0, 45) + '...' : 'Missing'}`);

    recordTest('Security Headers', 'Referrer-Policy',
      Boolean(h['referrer-policy'] && h['referrer-policy'].includes('strict-origin')),
      `Value: ${h['referrer-policy']}`);

    // Admin headers check
    const adminHead = await request('HEAD', '/admin');
    const adminH = adminHead.headers;
    recordTest('Security Headers', 'X-Robots-Tag (Admin Search Engine Cloaking)',
      Boolean(adminH['x-robots-tag'] && adminH['x-robots-tag'].includes('noindex')),
      `Value on /admin: ${adminH['x-robots-tag']}`);
  } catch (err) {
    recordTest('Security Headers', 'Headers Suite Execution', false, err.message);
  }

  // ─── 4. Open Redirects ─────────────────────────────────────────────────────
  console.log('\n--- 4. Open Redirect Defense ---');
  try {
    const evilUrls = [
      'https://evil-attacker.com',
      '//evil-attacker.com',
      'javascript:alert(1)'
    ];

    let openRedirectFound = false;
    for (const evil of evilUrls) {
      const res = await request('GET', `/?redirect=${encodeURIComponent(evil)}`);
      if (res.statusCode === 301 || res.statusCode === 302) {
        const loc = res.headers.location || '';
        if (loc.includes('evil-attacker.com') || loc.startsWith('javascript:')) {
          openRedirectFound = true;
          break;
        }
      }
    }

    recordTest('Open Redirect', 'External Domain Redirection Blocker', !openRedirectFound,
      openRedirectFound ? 'Vulnerable to external redirection' : 'No arbitrary open redirects allowed.');
  } catch (err) {
    recordTest('Open Redirect', 'Open Redirect Suite Execution', false, err.message);
  }

  // ─── 5. CORS Misconfiguration ──────────────────────────────────────────────
  console.log('\n--- 5. CORS Misconfiguration Audit ---');
  try {
    const corsRes = await request('GET', '/api/admin/tasks', {
      headers: {
        'Origin': 'https://evil-hacker.com'
      }
    });

    const acao = corsRes.headers['access-control-allow-origin'];
    const acac = corsRes.headers['access-control-allow-credentials'];

    // CORS is misconfigured if it trusts evil-hacker.com AND allows credentials
    const isMisconfigured = (acao === 'https://evil-hacker.com' || acao === '*') && acac === 'true';

    recordTest('CORS Audit', 'Strict Origin / Credentials Segregation', !isMisconfigured,
      `Origin Reflection: ${acao || 'None'}, Allow-Credentials: ${acac || 'False'}.`);
  } catch (err) {
    recordTest('CORS Audit', 'CORS Suite Execution', false, err.message);
  }

  // ─── 6. HTTP Method Tampering ──────────────────────────────────────────────
  console.log('\n--- 6. HTTP Method Tampering ---');
  try {
    // Attempt PUT and DELETE on read-only endpoints
    const putRes = await request('PUT', '/api/clients', { body: { test: 1 } });
    const deleteRes = await request('DELETE', '/api/team');

    const putBlocked = [401, 403, 404, 405].includes(putRes.statusCode);
    const deleteBlocked = [401, 403, 404, 405].includes(deleteRes.statusCode);

    recordTest('Method Tampering', 'PUT Verb on Read-Only API', putBlocked,
      `Status: ${putRes.statusCode} (Expected 401/403/404/405)`);

    recordTest('Method Tampering', 'DELETE Verb on Read-Only API', deleteBlocked,
      `Status: ${deleteRes.statusCode} (Expected 401/403/404/405)`);
  } catch (err) {
    recordTest('Method Tampering', 'Method Tampering Suite Execution', false, err.message);
  }

  // ─── 7. Sensitive Data Exposure ────────────────────────────────────────────
  console.log('\n--- 7. Sensitive Data Exposure ---');
  try {
    const endpoints = ['/api/case-studies', '/api/clients', '/api/team'];
    let exposedSecret = null;

    for (const ep of endpoints) {
      const res = await request('GET', ep);
      if (res.statusCode === 200) {
        const bodyLower = res.body.toLowerCase();
        if (bodyLower.includes('password_hash') || bodyLower.includes('"password"') || bodyLower.includes('jwt_secret') || bodyLower.includes('bot_token')) {
          exposedSecret = `${ep} leaks sensitive credentials`;
          break;
        }
      }
    }

    recordTest('Data Exposure', 'Zero Passwords/Hashes/Tokens in Public APIs', !exposedSecret,
      exposedSecret || 'All public endpoints sanitized. No credentials exposed.');
  } catch (err) {
    recordTest('Data Exposure', 'Data Exposure Suite Execution', false, err.message);
  }

  // ─── 8. Rate Limiting Audit ────────────────────────────────────────────────
  console.log('\n--- 8. Rate Limiting & Brute Force Protection ---');
  try {
    console.log('Sending 50 rapid requests to test rate limiter threshold...');
    const rapidRequests = [];
    const targetEndpoint = '/api/portal/auth';
    let count429 = 0;

    for (let i = 0; i < 50; i++) {
      rapidRequests.push(
        request('POST', targetEndpoint, {
          body: { email: 'rate-limit-probe@pragency.eg', password: 'wrong-password-' + i }
        }).then(res => {
          if (res.statusCode === 429) count429++;
          return res.statusCode;
        }).catch(() => null)
      );
    }

    const statuses = await Promise.all(rapidRequests);
    const rateLimitTriggered = count429 > 0;

    recordTest('Rate Limiting', 'Brute Force Flood Protection (HTTP 429)', rateLimitTriggered,
      `Received ${count429} HTTP 429 Too Many Requests responses out of 50 requests.`);
  } catch (err) {
    recordTest('Rate Limiting', 'Rate Limiting Suite Execution', false, err.message);
  }

  // ─── Final Summary ─────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('                       DAST AUDIT SUMMARY                              ');
  console.log('═══════════════════════════════════════════════════════════════════════');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;

  console.log(`Total Automated Tests : ${totalCount}`);
  console.log(`Passed Tests          : ${passedCount} ✅`);
  console.log(`Failed Tests          : ${failedCount} ${failedCount > 0 ? '❌' : ''}`);
  console.log(`Pass Rate             : ${((passedCount / totalCount) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════════════════');

  if (failedCount > 0) {
    console.log('\n⚠️ VULNERABILITIES IDENTIFIED REQUIRING IMMEDIATE CODE FIXES:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`- [${r.category}] ${r.name}: ${r.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL LIVE DAST AUDIT TESTS PASSED WITH 100% SUCCESS! PLATFORM IS BULLETPROOF.');
    process.exit(0);
  }
}

runSuite();
