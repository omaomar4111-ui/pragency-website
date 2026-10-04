const https = require('https');

function request(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const reqHeaders = Object.assign({
      'Host': 'pragency.pages.dev',
      'User-Agent': 'Phase1-Verifier'
    }, headers);
    if (body) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request({
      hostname: '104.18.20.135',
      port: 443,
      path: path,
      method: method,
      headers: reqHeaders
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d), raw: d }); }
        catch (e) { resolve({ status: res.statusCode, raw: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function verifyPhase1() {
  console.log('=== 1. VERIFY HOMEPAGE ELEMENTS ===');
  const home = await request('/');
  const raw = home.raw || '';
  console.log('HTTP Status:', home.status);
  console.log('Has Trust Badges:', raw.includes('hero-trust-badges') && raw.includes('ضمان الجودة'));
  console.log('Has A/B Hero CTA:', raw.includes('hero-cta-btn'));
  console.log('Has 3-Step Multi-Form:', raw.includes('cro-step-grid') && raw.includes('service_type') && raw.includes('budget_tier'));
  console.log('Has Social Proof Section:', raw.includes('section-social-proof') && raw.includes('NH Clinics') && raw.includes('Island Gym'));

  console.log('\n=== 2. VERIFY A/B TEST API ===');
  const testVid = 'test-vid-' + Date.now();
  const abGet = await request('/api/ab-test?visitorId=' + testVid + '&page=/');
  console.log('A/B Assign Status:', abGet.status, '| Assigned Variant:', abGet.body ? abGet.body.variant : 'N/A');

  const abPost = await request('/api/ab-test', 'POST', {
    visitorId: testVid,
    variant: abGet.body ? abGet.body.variant : 'A',
    page: '/'
  });
  console.log('A/B Click Record Status:', abPost.status, '| Result:', abPost.body);

  console.log('\n=== 3. VERIFY MULTI-STEP SUBMISSION ===');
  const contactPost = await request('/api/contact', 'POST', {
    name: 'مهندس أحمد علي (CRO Test)',
    phone: '01099887766',
    email: 'cro.test@example.com',
    business: 'شركة عقارية',
    service: 'Media Buying',
    budget: '$3K - $10K',
    message: 'طلب استشارة حملة إعلانية تجريبية عبر الفورم الجديد'
  });
  console.log('Contact Submit Status:', contactPost.status, '| Result:', contactPost.body);
}

verifyPhase1().catch(console.error);
