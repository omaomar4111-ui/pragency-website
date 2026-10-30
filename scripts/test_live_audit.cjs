const https = require('https');

const auth = Buffer.from('admin:pr2026').toString('base64');
const options = {
  hostname: 'pragency.pages.dev',
  path: '/api/admin/audit?limit=3',
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + auth,
    'User-Agent': 'Node-Audit-Test'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', data);
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.end();
