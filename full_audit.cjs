// Comprehensive Full Audit Script
const https = require('https');

async function runFullAudit() {
  console.log('═══════════════════════════════════════');
  console.log('   STARTING FULL SYSTEM AUDIT');
  console.log('═══════════════════════════════════════\n');

  // PART 1: PENDING TASKS
  console.log('>>> [PART 1.1] INSTAGRAM SECTION CLEANUP');
  const indexRes = await fetch('https://pragency.pages.dev/');
  const indexHtml = await indexRes.text();
  const hasInstaGrid = indexHtml.includes('insta-grid') || indexHtml.includes('insta-item');
  const hasPinkBadge = /section-badge[^>]*>[\s\S]{0,200}Instagram/.test(indexHtml);
  const hasOldAcc = indexHtml.includes('2d_marketing_1');
  const hasNewAcc = indexHtml.includes('pragency_1');
  const hasFollowBtn = indexHtml.includes('instagram.follow') || indexHtml.includes('تابعنا');

  console.log('Has insta-grid (should be FALSE):', hasInstaGrid);
  console.log('Has pink badge (should be FALSE):', hasPinkBadge);
  console.log('Has OLD account 2d_marketing_1 (should be FALSE):', hasOldAcc);
  console.log('Has NEW account pragency_1 (should be TRUE):', hasNewAcc);
  console.log('Has follow button (should be TRUE):', hasFollowBtn);

  const aboutRes = await fetch('https://pragency.pages.dev/about');
  const aboutHtml = await aboutRes.text();
  console.log('About page - old account (should be FALSE):', aboutHtml.includes('2d_marketing_1'));
  console.log('About page - new account (should be TRUE):', aboutHtml.includes('pragency_1'));

  console.log('\n>>> [PART 1.2] "من نحن" vs "عن الوكالة" ACROSS ALL PAGES');
  const pages = ['/', '/about', '/services', '/team', '/clients', '/case-studies'];
  for (const p of pages) {
    const t = await fetch('https://pragency.pages.dev' + p).then(r => r.text());
    console.log(p.padEnd(15), '| has "من نحن":', t.includes('من نحن'), '| has "عن الوكالة":', t.includes('عن الوكالة'));
  }

  console.log('\n>>> [PART 1.3] CHATBOT AI OPTION LABEL');
  const cbText = await fetch('https://pragency.pages.dev/js/chatbot.js?v=84').then(r => r.text());
  console.log('Has new label "تحدث معنا" (should be TRUE):', cbText.includes('تحدث معنا'));
  console.log('Has old label (should be FALSE):', cbText.includes('تحدث مع المساعد الذكي') || cbText.includes('المساعد الذكي'));
  console.log('HTML has new label:', indexHtml.includes('تحدث معنا'));
  console.log('HTML has old label:', indexHtml.includes('تحدث مع المساعد الذكي'));

  console.log('\n>>> [PART 1.4] CHATBOT SERVICE LINKING');
  const postChat = (msg) => fetch('https://pragency.pages.dev/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg, sessionId: 'audit-' + Date.now() + Math.random(), visitorId: 'audit' })
  }).then(r => r.json());

  const queries = ['اسعاركم ايه', 'عايز اشوف شغلكم', 'ليه اختاركم', 'ازاي بتبدأوا', 'مين انتوا'];
  for (const q of queries) {
    const r = await postChat(q);
    const hasService = ['سوشيال', 'إعلانات', 'اعلانات', 'ميديا', 'فيديو', 'تصوير', 'براند', 'هوية', 'استراتيجية'].some(s => (r.reply || '').includes(s));
    console.log('Q:', q.padEnd(16), '| Mentions service:', hasService, '| Reply:', (r.reply || '').substring(0, 70).replace(/\n/g, ' '));
  }

  console.log('\n>>> [PART 2.1] CLIENT LOGIN PAGE');
  const loginRes = await fetch('https://pragency.pages.dev/client-login');
  console.log('Login page status:', loginRes.status);
  const loginHtml = await loginRes.text();
  console.log('Has email field:', loginHtml.includes('type="email"') || loginHtml.includes('name="email"'));
  console.log('Has password field:', loginHtml.includes('type="password"'));
  console.log('Has demo credentials:', loginHtml.includes('client@demo.com'));

  console.log('\n>>> [PART 2.2] CLIENT AUTHENTICATION & CALENDAR FETCH');
  const authRes = await fetch('https://pragency.pages.dev/api/portal/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'client@demo.com', password: 'demo123' })
  });
  console.log('AUTH status:', authRes.status);
  const authData = await authRes.json();
  console.log('Has token:', !!authData.token);
  console.log('Client company:', authData.client?.companyName);

  let firstDeliverableId = null;
  if (authData.token) {
    const calRes = await fetch('https://pragency.pages.dev/api/portal/calendar', {
      headers: { 'Authorization': 'Bearer ' + authData.token }
    });
    console.log('CALENDAR status:', calRes.status);
    const calData = await calRes.json();
    console.log('Calendar items count:', (calData.items || []).length);
    console.log('Stats:', JSON.stringify(calData.stats));
    if (calData.items && calData.items.length > 0) {
      firstDeliverableId = calData.items[0].id;
    }
  }

  console.log('\n>>> [PART 2.3] CLIENT REVIEW / APPROVAL');
  if (authData.token && firstDeliverableId) {
    const reviewRes = await fetch('https://pragency.pages.dev/api/portal/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authData.token
      },
      body: JSON.stringify({
        deliverableId: firstDeliverableId,
        status: 'approved',
        feedback: 'Audit test approval - Live Verified'
      })
    });
    const reviewBody = await reviewRes.text();
    console.log('REVIEW status:', reviewRes.status, '| body:', reviewBody);
  } else {
    console.log('SKIP review test (no item or token)');
  }
}

runFullAudit().catch(console.error);
