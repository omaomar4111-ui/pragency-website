const puppeteer = require('C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\node_modules\\puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));

  console.log('Navigating to sales-crm-2026.html...');
  await page.goto('https://pragency.pages.dev/sales-crm-2026.html', { waitUntil: 'networkidle2' });

  // 1. Check all navigation tabs
  console.log('Testing Navigation Tabs...');
  const tabs = ['dashboard', 'leads', 'kanban', 'overdue', 'reports'];
  for (const tab of tabs) {
    const res = await page.evaluate((t) => {
      try {
        const btn = document.querySelector(`[onclick*="showPage('${t}'"]`);
        if (btn) btn.click();
        else if (typeof showPage === 'function') showPage(t);
        const el = document.getElementById('page-' + t);
        return { tab: t, active: el?.classList.contains('active'), display: el ? window.getComputedStyle(el).display : 'none' };
      } catch (e) {
        return { tab: t, error: e.message };
      }
    }, tab);
    console.log('Tab', tab, ':', res);
  }

  // 2. Open Lead Details
  console.log('Testing Open Lead Details...');
  const detailRes = await page.evaluate(async () => {
    try {
      const detailsBtn = document.querySelector('button[onclick*="openLeadDetail"]');
      if (detailsBtn) detailsBtn.click();
      else if (typeof openLeadDetail === 'function') await openLeadDetail('lead_1793376958902');
      
      const modal = document.getElementById('leadDetailModal');
      const style = modal ? window.getComputedStyle(modal) : null;
      return {
        found: !!modal,
        display: style?.display,
        visibility: style?.visibility,
        opacity: style?.opacity,
        contentLen: document.getElementById('leadDetailContent')?.innerHTML.length
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Open Lead Details Result:', detailRes);

  // 3. Test Add Lead Modal
  console.log('Testing Add Lead Modal...');
  const addLeadRes = await page.evaluate(() => {
    try {
      const btn = document.querySelector('[onclick*="openAddLeadModal"]');
      if (btn) btn.click();
      const modal = document.getElementById('addLeadModal');
      const style = modal ? window.getComputedStyle(modal) : null;
      return {
        found: !!modal,
        display: style?.display,
        visibility: style?.visibility,
        opacity: style?.opacity
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Add Lead Modal Result:', addLeadRes);

  // 4. Test Language Switcher
  console.log('Testing Language Switcher...');
  const langRes = await page.evaluate(() => {
    try {
      const btn = document.getElementById('langToggleBtn');
      if (btn) btn.click();
      const dir1 = document.documentElement.getAttribute('dir');
      if (btn) btn.click();
      const dir2 = document.documentElement.getAttribute('dir');
      return { dir1, dir2 };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Language Switcher Result:', langRes);

  if (errors.length > 0) {
    console.log('❌ Errors during testing (', errors.length, '):');
    errors.forEach(e => console.log('  -', e));
  } else {
    console.log('✅ ZERO errors during all interactions!');
  }

  await browser.close();
})();
