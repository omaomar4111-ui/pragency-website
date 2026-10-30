const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const server = http.createServer((req, res) => {
  const parsed = req.url.split('?')[0];
  const filePath = path.join(__dirname, '..', parsed === '/' ? 'sales-crm-2026.html' : parsed);

  if (req.url.startsWith('/api/admin/sales/leads')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      lead: {
        id: 'lead_1793376958902',
        name: 'أ/ محمد مشورة (مكتب محاماة واستشارات قانونية)',
        phone: '+201009904404',
        project_name: 'مكتب محمد مشورة للمحاماة - الجيزة',
        pipeline_stage: 'contacted',
        source_type: 'client_referral',
        budget_tier: 'enterprise',
        service_interested: 'full_package',
        next_followup_due: '2026-11-05',
        assigned_sales_name: 'Sales Rep'
      },
      leads: [
        {
          id: 'lead_1793376958902',
          name: 'أ/ محمد مشورة (مكتب محاماة واستشارات قانونية)',
          phone: '+201009904404',
          project_name: 'مكتب محمد مشورة للمحاماة - الجيزة',
          pipeline_stage: 'contacted',
          source_type: 'client_referral',
          budget_tier: 'enterprise',
          service_interested: 'full_package',
          next_followup_due: '2026-11-05',
          assigned_sales_name: 'Sales Rep'
        }
      ],
      followups: [
        { created_at: '2026-10-30', outcome: 'interested', notes: 'العميل مهتم بقضايا الإيجار الجديد ولديه 100+ رسالة أسبوعياً ويحتاج فلترة الحجوزات واستشارات مدفوعة' }
      ]
    }));
    return;
  }

  if (req.url.startsWith('/api/admin/sales/ai-skill')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      actionTitle: 'استوديو الذكاء الاصطناعي للمبيعات',
      result: '## الخطة الاستراتيجية المخصصة (Collage Strategy 2026)\n1. فجوة السوق: التركيز على قضايا الإيجار الجديد.\n2. زوايا المحتوى: عرض قضايا حقيقية بدون أسماء لكسر احتكار المنافسين.\n3. العرض التجاري: باقة ريتينر شهرية مع تحصيل عبر انستاباي 500 ج للمحلي و 1000 ج للمغتربين.'
    }));
    return;
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = ext === '.css' ? 'text/css' : ext === '.js' ? 'text/javascript' : 'text/html';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4920, async () => {
  console.log('🚀 Verification test server listening on http://localhost:4920');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.error('PAGE UNCAUGHT ERROR:', err.message);
  });

  console.log('1. Loading CRM in Mobile Viewport...');
  await page.goto('http://localhost:4920/sales-crm-2026.html', { waitUntil: 'networkidle0' });

  // 1. Check for cheap emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const pageText = await page.evaluate(() => document.body.innerText);
  const foundEmoji = emojiRegex.test(pageText);
  console.log('Emoji presence in CRM UI:', foundEmoji ? 'WARNING: Emojis detected' : 'PASSED: Zero emojis found in UI');

  // 2. Test Language Switcher
  console.log('2. Testing Language Switcher (AR -> EN)...');
  const initialDir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
  console.log('Initial document direction:', initialDir);

  await page.click('#langToggleBtn');
  await new Promise(r => setTimeout(r, 600));

  const newDir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
  const newTitle = await page.evaluate(() => document.querySelector('.page-title').innerText);
  console.log('Direction after click:', newDir);
  console.log('Title after click (English):', newTitle);

  // Switch back to Arabic
  console.log('3. Testing Language Switcher (EN -> AR)...');
  await page.click('#langToggleBtn');
  await new Promise(r => setTimeout(r, 600));
  const backDir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
  console.log('Direction after second click (Arabic):', backDir);

  // 4. Test Lead Details Modal & AI Studio
  console.log('4. Testing Lead Details & AI Studio Click...');
  const buttons = await page.$$('button');
  let detailBtn = null;
  for (const b of buttons) {
    const txt = await (await b.getProperty('innerText')).jsonValue();
    if (txt.includes('التفاصيل') || txt.includes('Details')) {
      detailBtn = b;
      break;
    }
  }

  if (detailBtn) {
    await detailBtn.tap();
    await new Promise(r => setTimeout(r, 1200));

    const modalState = await page.evaluate(() => {
      const m = document.getElementById('leadDetailModal');
      const box = document.getElementById('leadDetailContent');
      const promptInput = document.getElementById('aiCustomPromptInput');
      const style = window.getComputedStyle(m);
      return {
        isOpen: m.classList.contains('open'),
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex,
        hasPromptInput: !!promptInput,
        boxTextLength: box ? box.innerHTML.length : 0
      };
    });
    console.log('Modal & AI Studio state after tap:\n', JSON.stringify(modalState, null, 2));

    // 5. Test AI Custom Prompting inside modal
    console.log('5. Testing AI Studio custom prompting...');
    await page.evaluate(() => {
      const input = document.getElementById('aiCustomPromptInput');
      if (input) input.value = 'تحليل مخصص لقضايا الإيجار الجديد وعرض سعر';
    });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const genBtn = btns.find(b => b.innerText.includes('توليد') || b.innerText.includes('Generate'));
      if (genBtn) genBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    const aiResultText = await page.evaluate(() => {
      return document.getElementById('aiStudioResult')?.innerText?.slice(0, 150);
    });
    console.log('AI Studio generated result preview:\n', aiResultText);

    await page.screenshot({ path: 'verified_crm_mobile_modal.png' });
    console.log('Saved verified_crm_mobile_modal.png');
  } else {
    console.log('ERROR: Details button not found!');
  }

  // 6. Test Collage Deck Presentation
  console.log('6. Verifying Collage Deck HTML (A4 Landscape Print Layout)...');
  await page.goto('http://localhost:4920/collage-deck.html', { waitUntil: 'networkidle0' });
  const deckTitle = await page.evaluate(() => document.getElementById('coverClientTitle')?.innerText);
  const slidesCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log('Collage Deck Client Title:', deckTitle);
  console.log('Total Slides in Collage Deck:', slidesCount);
  await page.screenshot({ path: 'verified_collage_deck.png' });
  console.log('Saved verified_collage_deck.png');

  await browser.close();
  server.close();
  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('Errors encountered:', errors.length);
  process.exit(errors.length > 0 ? 1 : 0);
});
