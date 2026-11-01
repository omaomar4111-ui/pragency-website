const puppeteer = require('C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\node_modules\\puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const testUrls = [
    'https://pragency.pages.dev/audit.html',
    'https://pragency.pages.dev/loyalty.html',
    'https://pragency.pages.dev/index.html'
  ];

  for (const url of testUrls) {
    const page = await browser.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push(e.message));

    const res = await page.goto(url, { waitUntil: 'networkidle2' });
    console.log(`[TEST] ${url} -> Status: ${res.status()}, Errors: ${errs.length}`);
    if (errs.length) console.log('   ❌ Errors:', errs);

    if (url.includes('audit')) {
      // Click two cards and check score update
      await page.click('.check-card');
      const score = await page.evaluate(() => document.getElementById('scoreText')?.innerText);
      console.log('   Score after 1 check:', score);
    }

    if (url.includes('loyalty')) {
      // Click simulate geofence
      await page.evaluate(() => simulateGeofence());
      const notifActive = await page.evaluate(() => document.getElementById('pushNotification')?.classList.contains('active'));
      console.log('   Push notification triggered:', notifActive);
    }

    await page.close();
  }

  await browser.close();
})();
