const puppeteer = require('C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\node_modules\\puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const urls = [
    'https://pragency.pages.dev/sales-crm-2026.html',
    'https://pragency.pages.dev/collage-deck.html?leadId=lead_1793376958902',
    'https://pragency.pages.dev/admin-agency.html',
    'https://pragency.pages.dev/index.html'
  ];

  for (const url of urls) {
    console.log('\n=========================================');
    console.log('Testing URL:', url);
    console.log('=========================================');
    const page = await browser.newPage();
    const errors = [];
    const warnings = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warn') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      errors.push('PAGE_ERROR: ' + err.message);
    });

    page.on('requestfailed', req => {
      failedRequests.push(req.url() + ' -> ' + (req.failure() ? req.failure().errorText : 'failed'));
    });

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log('HTTP Status:', response.status());
    } catch (e) {
      console.log('Navigation Error:', e.message);
    }

    if (errors.length > 0) {
      console.log('Console Errors found (' + errors.length + '):');
      errors.forEach(e => console.log('  ❌ ' + e));
    } else {
      console.log('✅ No console errors.');
    }

    if (failedRequests.length > 0) {
      console.log('Failed Requests (' + failedRequests.length + '):');
      failedRequests.forEach(f => console.log('  ⚠️ ' + f));
    } else {
      console.log('✅ No failed network requests.');
    }

    // Detailed check for sales-crm
    if (url.includes('sales-crm')) {
      try {
        console.log('\n--- Checking Sales CRM elements & actions ---');
        const leadsData = await page.evaluate(async () => {
          try {
            const res = await fetch('/api/admin/sales/leads');
            const data = await res.json();
            return { status: res.status, ok: res.ok, count: data.leads ? data.leads.length : 0, firstLead: data.leads ? data.leads[0] : null };
          } catch (e) {
            return { error: e.message };
          }
        });
        console.log('Direct fetch /api/admin/sales/leads in page context:', leadsData);

        const renderedRows = await page.evaluate(() => {
          return document.querySelectorAll('tbody tr').length;
        });
        console.log('Rendered rows in table:', renderedRows);

        const tableHTML = await page.evaluate(() => {
          return document.querySelector('tbody')?.innerHTML.substring(0, 300);
        });
        console.log('tbody preview:', tableHTML);

        // Click lead row
        const row = await page.$('tbody tr');
        if (row) {
          console.log('Clicking first lead row...');
          await row.click();
          await new Promise(r => setTimeout(r, 1000));
          const modalState = await page.evaluate(() => {
            const m = document.getElementById('leadModal');
            if (!m) return 'No leadModal found';
            const s = window.getComputedStyle(m);
            return {
              display: s.display,
              visibility: s.visibility,
              opacity: s.opacity,
              className: m.className,
              name: document.getElementById('modalLeadName')?.innerText,
              phone: document.getElementById('modalLeadPhone')?.innerText
            };
          });
          console.log('Lead modal state:', modalState);
        }

        // Test AI button in modal
        console.log('Testing AI button inside modal...');
        const aiTestResult = await page.evaluate(async () => {
          try {
            const res = await fetch('/api/admin/sales/ai-skill', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'custom',
                leadId: 'lead_1793376958902',
                prompt: 'اقترح استراتيجية تسعير'
              })
            });
            const text = await res.text();
            return { status: res.status, textPreview: text.substring(0, 200) };
          } catch (e) {
            return { error: e.message };
          }
        });
        console.log('AI endpoint response test:', aiTestResult);

      } catch (err) {
        console.log('Interactive check error:', err.message);
      }
    }

    // Detailed check for collage deck
    if (url.includes('collage-deck')) {
      const deckState = await page.evaluate(() => {
        return {
          slidesCount: document.querySelectorAll('.slide').length,
          clientName: document.getElementById('clientNameDisplay')?.innerText,
          bodyTextLength: document.body.innerText.length
        };
      });
      console.log('Collage deck state:', deckState);
    }

    // Detailed check for admin-agency
    if (url.includes('admin-agency')) {
      const adminState = await page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.innerText.substring(0, 150)
        };
      });
      console.log('Admin agency state:', adminState);
    }

    await page.close();
  }

  await browser.close();
})();
