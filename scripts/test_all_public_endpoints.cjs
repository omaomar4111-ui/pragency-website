const endpoints = [
  { url: 'https://pragency.pages.dev/api/ab-test', method: 'GET' },
  { url: 'https://pragency.pages.dev/api/case-studies', method: 'GET' },
  { url: 'https://pragency.pages.dev/api/clients', method: 'GET' },
  { url: 'https://pragency.pages.dev/api/faqs', method: 'GET' },
  { url: 'https://pragency.pages.dev/api/portfolio/brands', method: 'GET' },
  { url: 'https://pragency.pages.dev/api/team', method: 'GET' },
  { url: 'https://pragency.pages.dev/locales/ar.json', method: 'GET' },
  { url: 'https://pragency.pages.dev/locales/en.json', method: 'GET' },
  { url: 'https://pragency.pages.dev/api/admin/sales/leads', method: 'GET' },
  { url: 'https://pragency.pages.dev/api/admin/sales/leads?id=lead_1793376958902', method: 'GET' },
  {
    url: 'https://pragency.pages.dev/api/admin/sales/ai-skill',
    method: 'POST',
    body: { action: 'custom', leadId: 'lead_1793376958902', prompt: 'test' }
  }
];

(async () => {
  for (const ep of endpoints) {
    try {
      const opts = { method: ep.method };
      if (ep.body) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(ep.body);
      }
      const res = await fetch(ep.url, opts);
      console.log(`[${ep.method}] ${ep.url} -> Status: ${res.status}`);
      if (res.status >= 400) {
        const text = await res.text();
        console.log('   Error body:', text.substring(0, 150));
      }
    } catch (e) {
      console.log(`[${ep.method}] ${ep.url} -> FETCH FAILED: ${e.message}`);
    }
  }
})();
