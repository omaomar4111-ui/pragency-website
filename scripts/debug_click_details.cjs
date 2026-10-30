const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function generateAdminToken() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64').replace(/=/g, '');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub: "admin-1",
    user_id: "admin-1",
    username: "admin",
    name: "System Admin",
    role: "Super Admin",
    exp: now + 86400 * 30
  })).toString('base64').replace(/=/g, '');
  return `${header}.${payload}.dummy_signature_manual`;
}

async function testClickDetails() {
  console.log('🚀 Launching Chrome with Auth to test clicking "تفاصيل"...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE [' + msg.type() + ']:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err.message));

  // Set auth cookie
  const token = generateAdminToken();
  await page.setCookie({
    name: 'pr_admin_token',
    value: token,
    domain: 'pragency.pages.dev',
    path: '/'
  });

  console.log('Navigating to https://pragency.pages.dev/sales-crm-2026.html ...');
  await page.goto('https://pragency.pages.dev/sales-crm-2026.html', { waitUntil: 'networkidle2' });

  // Wait for table to load
  await new Promise(r => setTimeout(r, 2500));

  console.log('Looking for "تفاصيل" buttons...');
  const detailButtons = await page.$$('button');
  console.log('Total buttons found on page:', detailButtons.length);

  let targetBtn = null;
  for (const b of detailButtons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('تفاصيل')) {
      targetBtn = b;
      console.log('Found "تفاصيل" button! Text:', text);
      break;
    }
  }

  if (targetBtn) {
    console.log('Clicking "تفاصيل" button...');
    await targetBtn.click();
    await new Promise(r => setTimeout(r, 1500));

    // Check if modal is visible
    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('leadDetailModal');
      if (!modal) return 'modal not in DOM';
      const style = window.getComputedStyle(modal);
      return {
        display: style.display,
        classList: [...modal.classList],
        zIndex: style.zIndex,
        opacity: style.opacity,
        visibility: style.visibility,
        contentInnerHTML: document.getElementById('leadDetailContent')?.innerHTML?.slice(0, 300)
      };
    });

    console.log('Modal state after click:\n', JSON.stringify(modalVisible, null, 2));
  } else {
    console.log('No "تفاصيل" button found on initial load!');
  }

  await browser.close();
}

testClickDetails().catch(console.error);
