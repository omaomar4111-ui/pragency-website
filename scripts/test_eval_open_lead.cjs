const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testOpenLeadDetail() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  await page.goto('https://pragency.pages.dev/sales-crm-2026.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const result = await page.evaluate(async () => {
    try {
      console.log('typeof openLeadDetail:', typeof openLeadDetail);
      console.log('allLeads length:', window.allLeads ? window.allLeads.length : 'allLeads is undefined');
      
      // Let's see what leads are in allLeads
      if (window.allLeads && window.allLeads.length) {
        console.log('First lead:', JSON.stringify(window.allLeads[0]));
        openLeadDetail(window.allLeads[0].id);
        const modal = document.getElementById('leadDetailModal');
        return {
          success: true,
          modalClasses: modal ? modal.className : 'no modal',
          contentHTML: document.getElementById('leadDetailContent')?.innerHTML
        };
      } else {
        return { success: false, reason: 'allLeads is empty' };
      }
    } catch (e) {
      return { success: false, error: e.message, stack: e.stack };
    }
  });

  console.log('EVALUATE RESULT:\n', JSON.stringify(result, null, 2));
  await browser.close();
}

testOpenLeadDetail().catch(console.error);
