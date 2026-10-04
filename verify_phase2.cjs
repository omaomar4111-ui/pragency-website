const https = require('https');

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const reqHeaders = Object.assign({
      'Host': 'pragency.pages.dev',
      'User-Agent': 'Phase2-Verifier'
    }, headers);
    const req = https.request({
      hostname: '104.18.20.135',
      port: 443,
      path: path,
      method: 'GET',
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
    req.end();
  });
}

async function verifyPhase2() {
  console.log('=== TEST A: LISTING PAGE ===');
  const pageRes = await request('/case-studies');
  const pageHtml = pageRes.raw || '';
  console.log('Status:', pageRes.status);
  console.log('Has Grid:', pageHtml.includes('case-studies-grid'));
  console.log('Has Title:', pageHtml.includes('قصص نجاح'));

  console.log('\n=== TEST B: PUBLIC API ===');
  const apiRes = await request('/api/case-studies');
  const list = Array.isArray(apiRes.body) ? apiRes.body : [];
  console.log('Status:', apiRes.status);
  console.log('Count:', list.length);
  console.log('First Item:', list[0] ? list[0].client_name + ' (' + list[0].slug + ')' : 'None');
  console.log('Second Item:', list[1] ? list[1].client_name + ' (' + list[1].slug + ')' : 'None');

  console.log('\n=== TEST C: INDIVIDUAL CASE STUDY PAGE (SSR) ===');
  const singleRes = await request('/case-studies/nh-clinics');
  const singleHtml = singleRes.raw || '';
  console.log('Status:', singleRes.status);
  console.log('Has Challenge:', singleHtml.includes('التحدي'));
  console.log('Has Results:', singleHtml.includes('النتايج'));
  console.log('Has Schema CaseStudy:', singleHtml.includes('"@type":"CaseStudy"'));
  console.log('Has Testimonial:', singleHtml.includes('شغل احترافي'));

  console.log('\n=== TEST C2: SECOND CASE STUDY (ISLAND GYM) ===');
  const singleRes2 = await request('/case-studies/island-gym');
  const singleHtml2 = singleRes2.raw || '';
  console.log('Status:', singleRes2.status);
  console.log('Has Client Name:', singleHtml2.includes('Island Gym'));
  console.log('Has Metrics:', singleHtml2.includes('4.2x'));

  console.log('\n=== TEST E: ADMIN CASE STUDIES UI ===');
  const adminRes = await request('/admin/case-studies', {
    'Authorization': 'Basic ' + Buffer.from('admin:pr2026').toString('base64')
  });
  console.log('Admin Status:', adminRes.status);
  console.log('Has Admin CRUD Form:', (adminRes.raw || '').includes('إدارة قصص النجاح') && (adminRes.raw || '').includes('csForm'));
}

verifyPhase2().catch(console.error);
