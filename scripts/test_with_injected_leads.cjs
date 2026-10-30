const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testWithInjectedLeads() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err.message));

  await page.goto('https://pragency.pages.dev/sales-crm-2026.html', { waitUntil: 'networkidle2' });

  const res = await page.evaluate(async () => {
    // 1. Check if openLeadDetail exists
    console.log('Testing openLeadDetail existence...');
    if (typeof openLeadDetail !== 'function') return { error: 'openLeadDetail is not a function' };

    // 2. Mock allLeads
    allLeads = [
      {
        id: 'lead_1793376958902',
        name: 'أ/ محمد مشورة (مكتب محاماة واستشارات قانونية)',
        project_name: 'مكتب محمد مشورة للمحاماة - الجيزة',
        phone: '+201009904404',
        source_type: 'client_referral',
        pipeline_stage: 'contacted',
        budget_tier: '30,000 EGP',
        service_interested: 'باقة إدارة السوشيال ميديا وحملات الاستشارات القانونية والفانل',
        created_at: new Date().toISOString()
      }
    ];

    // Re-render dashboard table
    refreshDashboard();

    // Now try to click or call openLeadDetail
    try {
      console.log('Calling openLeadDetail with lead_1793376958902 ...');
      await openLeadDetail('lead_1793376958902');
      
      const modal = document.getElementById('leadDetailModal');
      const style = window.getComputedStyle(modal);
      return {
        success: true,
        modalDisplay: style.display,
        modalZIndex: style.zIndex,
        modalClasses: modal.className,
        contentLength: document.getElementById('leadDetailContent')?.innerHTML?.length
      };
    } catch (e) {
      return { error: e.message, stack: e.stack };
    }
  });

  console.log('TEST RESULT:\n', JSON.stringify(res, null, 2));
  await browser.close();
}

testWithInjectedLeads().catch(console.error);
