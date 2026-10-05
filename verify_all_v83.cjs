const https = require('https');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function verifyAll() {
  console.log('--- TEST A & B: HTML Verifications ---');
  const htmlRes = await request({
    hostname: '172.66.44.172',
    port: 443,
    path: '/',
    method: 'GET',
    headers: {
      'Host': 'pragency.pages.dev',
      'User-Agent': 'Mozilla/5.0 NodeTest',
      'Connection': 'close'
    },
    rejectUnauthorized: false
  });

  const t = htmlRes.text;

  // Test A: Instagram Cleanup
  console.log('Test A (Instagram Cleanup):', {
    hasInstaGrid: t.includes('insta-grid') || t.includes('insta-item'),
    hasInstaBadge: t.includes('class="section-badge"') && t.includes('Instagram'),
    hasOldAccount: t.includes('2d_marketing_1'),
    hasNewAccount: t.includes('pragency_1')
  });

  // Test B: Nav Label
  console.log('Test B (Nav Label):', {
    hasNew: t.includes('من نحن'),
    hasOld: t.includes('عن الوكالة')
  });

  console.log('\n--- TEST C: Chatbot Label in chatbot.js ---');
  const jsRes = await request({
    hostname: '172.66.44.172',
    port: 443,
    path: '/js/chatbot.js?v=83',
    method: 'GET',
    headers: {
      'Host': 'pragency.pages.dev',
      'User-Agent': 'Mozilla/5.0 NodeTest',
      'Connection': 'close'
    },
    rejectUnauthorized: false
  });
  console.log('Test C (Chatbot Label):', {
    hasNew: jsRes.text.includes('تحدث معنا'),
    hasOld: jsRes.text.includes('المساعد الذكي')
  });

  console.log('\n--- TEST D: Chatbot Service Linking ---');
  const postChat = async (msg) => {
    const res = await request({
      hostname: '172.66.44.172',
      port: 443,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Host': 'pragency.pages.dev',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 NodeTest',
        'Connection': 'close'
      },
      rejectUnauthorized: false
    }, JSON.stringify({
      message: msg,
      sessionId: 'svc-' + Date.now() + Math.random(),
      visitorId: 'test-v83'
    }));
    return JSON.parse(res.text);
  };

  const r1 = await postChat('اسعاركم ايه');
  console.log('Pricing:', r1.reply ? r1.reply.substring(0, 200) : r1);
  const hasServices1 = r1.reply && (r1.reply.includes('سوشيال') || r1.reply.includes('إعلانات') || r1.reply.includes('ميديا'));
  console.log('Mentions services?', hasServices1);

  const r2 = await postChat('ليه اختاركم');
  console.log('Comparison:', r2.reply ? r2.reply.substring(0, 200) : r2);
  const hasServices2 = r2.reply && (r2.reply.includes('سوشيال') || r2.reply.includes('إعلانات') || r2.reply.includes('براند'));
  console.log('Mentions services?', hasServices2);
}

verifyAll().catch(console.error);
