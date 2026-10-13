const fs = require('fs');

async function runFinalAudit() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   STARTING FINAL COMPREHENSIVE PRODUCTION AUDIT');
  console.log('═══════════════════════════════════════════════════════\n');

  // ── 1.1 PASSWORD SECURITY ─────────────────────────────────
  console.log('>>> [1.1] PASSWORD SECURITY AUDIT');
  const authCode = fs.readFileSync('functions/api/portal/auth.js', 'utf8');
  console.log('Hashing method search:');
  console.log('Uses bcrypt:', authCode.includes('bcrypt'));
  console.log('Uses argon2:', authCode.includes('argon2'));
  console.log('Uses scrypt:', authCode.includes('scrypt'));
  console.log('Uses SHA-256:', authCode.includes('sha256') || authCode.includes('SHA-256'));

  // ── 1.2 JWT SECURITY ──────────────────────────────────────
  console.log('\n>>> [1.2] JWT SECURITY AUDIT');
  console.log('JWT secret from env:', authCode.includes('env.JWT_SECRET') || authCode.includes('env.PORTAL_SECRET'));
  console.log('JWT secret hardcoded:', /secret['"]\s*[:=]\s*['"][a-zA-Z0-9]/i.test(authCode));
  const expMatch = authCode.match(/expiresIn['"]?\s*[:=]\s*['"]([^'"]+)/);
  console.log('Token expiry:', expMatch ? expMatch[1] : 'NOT FOUND');

  // ── 1.3 RATE LIMITING ─────────────────────────────────────
  console.log('\n>>> [1.3] BRUTE FORCE & RATE LIMITING TEST (10 ATTEMPTS)');
  for (let i = 0; i < 10; i++) {
    const res = await fetch('https://pragency.pages.dev/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'client@demo.com', password: 'wrong' + i })
    });
    const body = await res.text();
    console.log(`Attempt ${i} | Status: ${res.status} | ${body.substring(0, 95)}`);
  }

  // ── 1.4 DATA ACCESS ISOLATION ─────────────────────────────
  console.log('\n>>> [1.4] DATA ACCESS ISOLATION TEST');
  const authRes = await fetch('https://pragency.pages.dev/api/portal/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'client@demo.com', password: 'demo123' })
  });
  const authData = await authRes.json();
  const token = authData.token;

  // Try to access non-existent or other client's deliverable
  const fakeRes = await fetch('https://pragency.pages.dev/api/portal/deliverable?id=99999', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const fakeBody = await fakeRes.text();
  console.log('Access other client data (id=99999):', fakeRes.status, fakeBody.substring(0, 150));

  // ── 1.5 SQL INJECTION CHECK ───────────────────────────────
  console.log('\n>>> [1.5] SQL INJECTION CHECK');
  const portalDir = 'functions/api/portal';
  let allBound = true;
  for (const f of fs.readdirSync(portalDir)) {
    if (!f.endsWith('.js')) continue;
    const content = fs.readFileSync(`${portalDir}/${f}`, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
      if (l.includes('.prepare(') && l.includes('?') && !l.includes('.bind(')) {
        const snippet = lines.slice(idx, idx + 4).join(' ');
        if (!snippet.includes('.bind(')) {
          console.log(`Unbound SQL query in ${f}:${idx + 1}`);
          allBound = false;
        }
      }
    });
  }
  console.log('All parameterized queries strictly use .bind():', allBound);

  // ── 1.6 FILE ACCESS SECURITY ──────────────────────────────
  console.log('\n>>> [1.6] FILE ACCESS SECURITY');
  const pdfRes = await fetch('https://pragency.pages.dev/assets/documents/PR_Agency_Portfolio_2026.pdf');
  console.log('Portfolio PDF status (should be 200 or protected):', pdfRes.status);
  const unauthRes = await fetch('https://pragency.pages.dev/api/portal/deliverable?id=1');
  console.log('Unauthenticated deliverable access:', unauthRes.status);

  // ── 1.7 PRIVACY POLICY ────────────────────────────────────
  console.log('\n>>> [1.7] PRIVACY POLICY CHECK');
  const privText = await fetch('https://pragency.pages.dev/privacy').then(r => r.text());
  console.log('Privacy policy mentions Client Portal:', privText.includes('Client Portal') || privText.includes('بوابة العملاء'));
  console.log('Mentions JWT/Authentication:', privText.includes('JWT') || privText.includes('Authentication') || privText.includes('login'));
  console.log('Mentions data retention:', privText.includes('retention') || privText.includes('حذف') || privText.includes('delete'));

  // ── PART 2: ALL 4 PENDING TASKS ───────────────────────────
  console.log('\n>>> [PART 2] VERIFY ALL 4 PENDING TASKS');
  const homeText = await fetch('https://pragency.pages.dev/').then(r => r.text());
  console.log('=== TASK 1.1: INSTAGRAM ===');
  console.log('insta-grid removed:', !homeText.includes('insta-grid'));
  console.log('pink badge removed:', !homeText.match(/section-badge[^>]*>[\s\S]{0,200}Instagram/));
  console.log('old account gone:', !homeText.includes('2d_marketing_1'));
  console.log('new account present:', homeText.includes('pragency_1'));

  console.log('\n=== TASK 1.2: من نحن ===');
  const pages = ['/', '/about', '/services', '/team', '/clients', '/case-studies'];
  for (const p of pages) {
    const t = await fetch('https://pragency.pages.dev' + p).then(r => r.text());
    console.log(p.padEnd(15), '| من نحن:', t.includes('من نحن'), '| عن الوكالة:', t.includes('عن الوكالة'));
  }

  console.log('\n=== TASK 1.3: تحدث معنا ===');
  const cbText = await fetch('https://pragency.pages.dev/js/chatbot.js?v=86').then(r => r.text());
  console.log('new label:', cbText.includes('تحدث معنا'));
  console.log('old label gone:', !cbText.includes('المساعد الذكي'));

  console.log('\n=== TASK 1.4: SERVICE LINKING ===');
  const post = (msg) => fetch('https://pragency.pages.dev/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg, sessionId: 'final-' + Date.now() + Math.random(), visitorId: 'final' })
  }).then(r => r.json());

  for (const q of ['اسعاركم ايه', 'ليه اختاركم', 'مين انتوا']) {
    const r = await post(q);
    const has = ['سوشيال', 'إعلانات', 'ميديا', 'فيديو', 'براند', 'هوية', 'استراتيجية'].some(s => (r.reply || '').includes(s));
    console.log(q.padEnd(14), '| Mentions service:', has);
  }

  // ── PART 3: PRODUCTION READINESS ──────────────────────────
  console.log('\n>>> [PART 3] FULL PRODUCTION URLS CHECK');
  const urls = [
    { path: '/', name: 'Homepage' },
    { path: '/about', name: 'About' },
    { path: '/services', name: 'Services' },
    { path: '/team', name: 'Team' },
    { path: '/clients', name: 'Clients' },
    { path: '/case-studies', name: 'Case Studies' },
    { path: '/privacy', name: 'Privacy' },
    { path: '/client-login', name: 'Client Login' },
    { path: '/sitemap.xml', name: 'Sitemap' },
    { path: '/robots.txt', name: 'Robots' },
    { path: '/manifest.json', name: 'PWA Manifest' },
    { path: '/sw.js', name: 'Service Worker' },
    { path: '/offline.html', name: 'Offline Page' }
  ];
  for (const u of urls) {
    try {
      const r = await fetch('https://pragency.pages.dev' + u.path);
      console.log(u.name.padEnd(16), '| Status:', r.status);
    } catch (e) {
      console.log(u.name.padEnd(16), '| ERROR:', e.message);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   AUDIT SUITE COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
}

runFinalAudit().catch(console.error);
