const puppeteer = require('C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\node_modules\\puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const networkRequests = [];

  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => consoleMessages.push({ type: 'pageerror', text: err.message, stack: err.stack }));
  page.on('response', res => {
    if (res.status() >= 400) {
      networkRequests.push({ url: res.url(), status: res.status(), statusText: res.statusText() });
    }
  });

  await page.goto('https://pragency.pages.dev/index.html', { waitUntil: 'networkidle2' });

  console.log('=== Index.html Console Messages ===');
  console.dir(consoleMessages, { depth: null });

  console.log('=== Failed Responses >= 400 ===');
  console.dir(networkRequests, { depth: null });

  await browser.close();
})();
