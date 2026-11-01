const puppeteer = require('C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\node_modules\\puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const urls = [
    'https://pragency.pages.dev/website-factory.html',
    'https://pragency.pages.dev/templates/fashion-wigs/index.html',
    'https://pragency.pages.dev/templates/clinics/index.html',
    'https://pragency.pages.dev/templates/cars-ppf/index.html',
    'https://pragency.pages.dev/templates/gym-coaching/index.html'
  ];

  for (const url of urls) {
    const page = await browser.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push(e.message));

    const res = await page.goto(url, { waitUntil: 'networkidle2' });
    console.log(`[TEST] ${url} -> Status: ${res.status()}, Errors: ${errs.length}`);
    if (errs.length) console.log('   ❌ Errors:', errs);
    await page.close();
  }

  await browser.close();
})();
