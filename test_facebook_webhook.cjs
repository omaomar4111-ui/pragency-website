const https = require('https');

// Simulating a real inbound Meta Webhook payload for Lead Ads
const metaPayload = {
  object: "page",
  entry: [
    {
      id: "109876543210987",
      time: Math.floor(Date.now() / 1000),
      changes: [
        {
          field: "leadgen",
          value: {
            ad_id: "23851234567890123",
            form_id: "876543210987654",
            leadgen_id: "445566778899001",
            created_time: Math.floor(Date.now() / 1000),
            page_id: "109876543210987",
            adgroup_id: "23851234567890122",
            form_data: {
              full_name: "م. كريم عبد العزيز",
              email: "karim.abdelaziz@testcorp.eg",
              phone_number: "+201012345678",
              campaign_name: "حملة الاستشارات التسويقية Q4 2026"
            }
          }
        }
      ]
    }
  ]
};

function sendWebhook() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(metaPayload);
    const req = https.request('https://pragency.pages.dev/api/webhooks/facebook-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'facebookexternalua'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('--- [1] SIMULATING META FACEBOOK LEAD ADS WEBHOOK POST ---');
  console.log('Sending Lead payload for: "م. كريم عبد العزيز" ...');
  const res = await sendWebhook();
  console.log('HTTP Status:', res.status);
  console.log('Response Body:', JSON.stringify(res.body, null, 2));
}

run();
