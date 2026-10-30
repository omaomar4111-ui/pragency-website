const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
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

async function testMobileClick() {
  console.log('🚀 Launching Chrome in iPhone Viewport Mode...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  page.on('console', msg => console.log('PAGE CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  // Set auth cookie
  const token = generateAdminToken();
  await page.setCookie({
    name: 'pr_admin_token',
    value: token,
    domain: 'pragency.pages.dev',
    path: '/'
  });

  await page.goto('https://pragency.pages.dev/sales-crm-2026.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: 'mobile_before_click.png' });
  console.log('Saved mobile_before_click.png');

  // Find all buttons with text 'تفاصيل'
  const buttons = await page.$$('button');
  let detailBtn = null;
  for (const b of buttons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.trim() === 'تفاصيل') {
      detailBtn = b;
      break;
    }
  }

  if (detailBtn) {
    console.log('Found "تفاصيل" button! Clicking with touch tap...');
    await detailBtn.tap();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'mobile_after_click.png' });
    console.log('Saved mobile_after_click.png');

    const modalState = await page.evaluate(() => {
      const modal = document.getElementById('leadDetailModal');
      const style = window.getComputedStyle(modal);
      return {
        className: modal.className,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex,
        rect: modal.getBoundingClientRect()
      };
    });
    console.log('Modal State after tap:\n', JSON.stringify(modalState, null, 2));
  } else {
    console.log('Could not find "تفاصيل" button!');
  }

  await browser.close();
}

testMobileClick().catch(console.error);
