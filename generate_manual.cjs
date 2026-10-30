const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'manual_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Generate valid admin token for session injection
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

async function run() {
  console.log('🚀 Starting Chrome for User Manual Generation...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const token = generateAdminToken();

  // Helper to inject auth into localStorage and hide login modal
  async function prepareAdminPage(url) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.evaluate((jwt) => {
      localStorage.setItem('admin_jwt', jwt);
      localStorage.setItem('admin_user', JSON.stringify({
        id: 'admin-1',
        name: 'System Admin',
        role: 'Super Admin'
      }));
      const modal = document.getElementById('adminLoginModal');
      if (modal) modal.style.display = 'none';
      const main = document.querySelector('.main-area');
      if (main) main.style.display = 'block';
    }, token);
  }

  console.log('📸 1. Capturing Daily Tasks...');
  await prepareAdminPage('https://pragency.pages.dev/admin-agency-os-2026');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') {
      const btn = document.querySelector('[data-tab="daily-tasks"]');
      switchTab('daily-tasks', btn);
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  const shotTasks = path.join(SCREENSHOT_DIR, '01_daily_tasks.png');
  await page.screenshot({ path: shotTasks });

  console.log('📸 2. Capturing Profitability Report...');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') {
      const btn = document.querySelector('[data-tab="profitability"]');
      switchTab('profitability', btn);
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  const shotProfit = path.join(SCREENSHOT_DIR, '02_profitability.png');
  await page.screenshot({ path: shotProfit });

  console.log('📸 3. Capturing Team Management...');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') {
      const btn = document.querySelector('[data-tab="team"]');
      switchTab('team', btn);
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  const shotTeam = path.join(SCREENSHOT_DIR, '03_team.png');
  await page.screenshot({ path: shotTeam });

  console.log('📸 4. Capturing Creative Production (مسار التيم)...');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') {
      const btn = document.querySelector('[data-tab="creative"]');
      switchTab('creative', btn);
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  const shotCreative = path.join(SCREENSHOT_DIR, '04_creative.png');
  await page.screenshot({ path: shotCreative });

  console.log('📸 5. Capturing Invoices...');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') {
      const btn = document.querySelector('[data-tab="invoices"]');
      switchTab('invoices', btn);
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  const shotInvoices = path.join(SCREENSHOT_DIR, '05_invoices.png');
  await page.screenshot({ path: shotInvoices });

  console.log('📸 6. Capturing Sales CRM...');
  await page.goto('https://pragency.pages.dev/sales-crm-2026', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const shotCRM = path.join(SCREENSHOT_DIR, '06_sales_crm.png');
  await page.screenshot({ path: shotCRM });

  console.log('📸 7. Capturing Client Portal...');
  await page.goto('https://pragency.pages.dev/portal-access-2026', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const shotPortal = path.join(SCREENSHOT_DIR, '07_client_portal.png');
  await page.screenshot({ path: shotPortal });

  console.log('📝 Building Printable Manual HTML Layout...');

  function imgBase64(filePath) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }

  const manualHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>دليل استخدام نظام PR Agency OS</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Cairo', sans-serif;
      background: #0d0e12;
      color: #f3f4f6;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }

    .page {
      page-break-after: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 10px 0;
    }

    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 90vh;
      border: 2px solid rgba(139, 92, 246, 0.3);
      border-radius: 24px;
      padding: 40px;
      background: radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
      margin-bottom: 20px;
    }

    .cover-title {
      font-size: 38px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 12px;
    }

    .cover-title span {
      color: #8b5cf6;
    }

    .cover-sub {
      font-size: 18px;
      color: #9ca3af;
      max-width: 650px;
      margin-bottom: 30px;
    }

    .badge {
      background: rgba(139, 92, 246, 0.2);
      border: 1px solid #8b5cf6;
      color: #c4b5fd;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .section-card {
      background: #14161f;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .section-num {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #8b5cf6;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 15px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }

    .screenshot-box {
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 18px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    .screenshot-box img {
      width: 100%;
      height: auto;
      display: block;
    }

    .explanation {
      background: rgba(255, 255, 255, 0.02);
      border-right: 4px solid #8b5cf6;
      padding: 14px 18px;
      border-radius: 4px 10px 10px 4px;
      font-size: 14px;
      color: #d1d5db;
    }

    .explanation p {
      margin: 6px 0;
    }

    .tip {
      color: #fbbf24;
      font-weight: 700;
    }

    .action-step {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 6px;
    }

    .action-step strong {
      color: #8b5cf6;
    }
  </style>
</head>
<body>

  <!-- غلاف الدليل -->
  <div class="page">
    <div class="cover-page">
      <div class="badge">دليل التشغيل العملي للموظفين والإدارة 2026</div>
      <h1 class="cover-title">دليل استخدام نظام <span>PR Agency OS</span></h1>
      <p class="cover-sub">
        دليلك البسيط والعملي عشان تفهم كل ركن في السيستم وتشتغل بيه بأعلى كفاءة بدون تعقيد، من أول تسجيل مهامك اليومية لحد إصدار الفواتير ومتابعة الأرباح.
      </p>
      <div style="font-size: 13px; color: #6b7280;">
        نسخة الوكالة المعتمدة • PR Agency Egypt
      </div>
    </div>
  </div>

  <!-- القسم 1: المهام اليومية -->
  <div class="page">
    <div class="section-card">
      <div class="section-header">
        <div class="section-num">1</div>
        <h2 class="section-title">المهام اليومية وتتبع الوقت (Daily Tasks)</h2>
      </div>
      <div class="screenshot-box">
        <img src="${imgBase64(shotTasks)}" alt="Daily Tasks" />
      </div>
      <div class="explanation">
        <p><strong>إزاي تشتغل بيها:</strong> ده مكانك الأساسي أول ما تفتح الشغل كل يوم الصبح. بتلاقي مهامك المخططة لليوم على اليمين وصندوق الـ Backlog على الشمال.</p>
        <div class="action-step">
          <span>⏱️</span>
          <span><strong>تسجيل الوقت:</strong> دوس على "ابدأ التايمر" على المهمة اللي شغال عليها عشان يحسب الوقت بالدقيقة تلقائياً.</span>
        </div>
        <div class="action-step">
          <span>✅</span>
          <span><strong>إنهاء المهمة:</strong> لما تخلص المهمة دوس "إتمام" عشان تتنقل لقائمة إنجازات اليوم وتتسجل في النظام.</span>
        </div>
        <div class="action-step">
          <span>🚀</span>
          <span><strong>نهاية اليوم:</strong> قبل ما تقفل جهازك، دوس "Publish My Day" عشان تقفل يومك وتشارك إنجازاتك مع المديرين والتيم.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- القسم 2: تقرير الربحية -->
  <div class="page">
    <div class="section-card">
      <div class="section-header">
        <div class="section-num">2</div>
        <h2 class="section-title">تقرير الربحية ومصفوفة المشاريع (Profitability)</h2>
      </div>
      <div class="screenshot-box">
        <img src="${imgBase64(shotProfit)}" alt="Profitability" />
      </div>
      <div class="explanation">
        <p><strong>الهدف منه:</strong> ده التقرير المالي اللي بيقول للإدارة إحنا بنكسب ولا بنخسر في كل عميل بناءً على الساعات الفعلية اللي التيم بيقضيها في الشغل.</p>
        <div class="action-step">
          <span>💰</span>
          <span><strong>الحسبة بتمشي إزاي؟</strong> السيستم بيجيب قيمة العقد الشهري (Retainer) ويطرح منه (عدد الساعات × تكلفة الساعة للموظف).</span>
        </div>
        <div class="action-step">
          <span>🔴</span>
          <span><strong>عينك على إيه؟</strong> ركز على أي عميل هامش ربحه ظاهر بالأحمر أو بالسالب؛ ده معناه إن التيم بيشتغل فيه ساعات أكتر من حقه وبيخسر الوكالة فلوس.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- القسم 3: إدارة الفريق -->
  <div class="page">
    <div class="section-card">
      <div class="section-header">
        <div class="section-num">3</div>
        <h2 class="section-title">إدارة فريق العمل والصلاحيات (Team & RBAC)</h2>
      </div>
      <div class="screenshot-box">
        <img src="${imgBase64(shotTeam)}" alt="Team" />
      </div>
      <div class="explanation">
        <p><strong>الاستخدام:</strong> هنا بنسجل كل أفراد الوكالة (مصممين، مونتيرين، كتاب محتوى، ومديري حسابات) ونحدد صلاحيات كل واحد.</p>
        <div class="action-step">
          <span>👥</span>
          <span><strong>إضافة عضو جديد:</strong> دوس "+ إضافة عضو" واكتب الاسم، الإيميل، التخصص، وسعر الساعة بتاعه عشان يدخل في حسابات التكلفة.</span>
        </div>
        <div class="action-step">
          <span>🔐</span>
          <span><strong>الصلاحيات:</strong> الديزاينر والكاتب بيشوفوا شغلهم بس، ومدير الحسابات بيقدر يراجع ويعتمد الساعات، بينما الأدمن معاه كل الصلاحيات.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- القسم 4: مسار التيم الإبداعي -->
  <div class="page">
    <div class="section-card">
      <div class="section-header">
        <div class="section-num">4</div>
        <h2 class="section-title">مسار التيم والإنتاج الإبداعي (Creative Pipeline)</h2>
      </div>
      <div class="screenshot-box">
        <img src="${imgBase64(shotCreative)}" alt="Creative" />
      </div>
      <div class="explanation">
        <p><strong>طريقة الشغل:</strong> ده خط سير إنتاج البوستات، الفيديوهات، والتصاميم من لحظة كتابة الفكرة لحد ما تروح للعميل يعتمدها.</p>
        <div class="action-step">
          <span>🎨</span>
          <span><strong>تسليم الشغل:</strong> الكاتب بيحط الكابشن والاسكريبت، بعده الديزاينر يرفع التصميم أو المونتير يرفع الفيديو.</span>
        </div>
        <div class="action-step">
          <span>⚡</span>
          <span><strong>النقل للبوابة:</strong> أول ما يكتمل البوست بيتحول تلقائياً لبوابة العميل عشان يشوفه ويدوس موافقة أو يطلب تعديل.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- القسم 5: الفواتير والتحصيل -->
  <div class="page">
    <div class="section-card">
      <div class="section-header">
        <div class="section-num">5</div>
        <h2 class="section-title">إصدار الفواتير ومتابعة التحصيل (Invoices)</h2>
      </div>
      <div class="screenshot-box">
        <img src="${imgBase64(shotInvoices)}" alt="Invoices" />
      </div>
      <div class="explanation">
        <p><strong>ببساطة:</strong> المكان المسؤول عن كل مليم داخل الوكالة؛ إصدار الفواتير الشهرية ومتابعة مين دفع ومين متأخر عليه فلوس.</p>
        <div class="action-step">
          <span>🧾</span>
          <span><strong>عمل فاتورة:</strong> بتختار العميل والمبلغ وتاريخ الاستحقاق، والسيستم بيطلع رقم الفاتورة ويظهرها مباشرة في بوابة العميل.</span>
        </div>
        <div class="action-step">
          <span>💵</span>
          <span><strong>تأكيد السداد:</strong> أول ما يوصل التحويل البنكي أو فودافون كاش، بتدوس "تأكيد الدفع" عشان تتحدث في الحسابات والأرباح فوراً.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- القسم 6: نظام المبيعات CRM -->
  <div class="page">
    <div class="section-card">
      <div class="section-header">
        <div class="section-num">6</div>
        <h2 class="section-title">نظام المبيعات والمتابعة الصوتية (Sales CRM)</h2>
      </div>
      <div class="screenshot-box">
        <img src="${imgBase64(shotCRM)}" alt="Sales CRM" />
      </div>
      <div class="explanation">
        <p><strong>ليه هو الأقوى؟</strong> معمول بتصميم احترافي شبه Linear.app و Twenty CRM عشان تتابع أي عميل محتمل بيكلم الوكالة لحد ما يتعاقد.</p>
        <div class="action-step">
          <span>🗂️</span>
          <span><strong>لوحة الـ Kanban:</strong> بتسحب كارت العميل من مرحلة لمرحلة (عميل جديد ⬅️ تم التواصل ⬅️ ميتينج مجدول ⬅️ عرض سعر ⬅️ تعاقد).</span>
        </div>
        <div class="action-step">
          <span>🎙️</span>
          <span><strong>التسجيل الصوتي الذكي:</strong> بعد ما تخلص مكالمتك مع العميل، دوس على زرار المايك واتكلم بصوتك، والذكاء الاصطناعي هيفرغ كلامك ويكتبه في ملخص المتابعة فوراً بدون ما تضيع وقت في الكتابة.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- القسم 7: بوابة العميل -->
  <div class="page">
    <div class="section-card">
      <div class="section-header">
        <div class="section-num">7</div>
        <h2 class="section-title">بوابة العميل والاعتماد المباشر (Client Portal)</h2>
      </div>
      <div class="screenshot-box">
        <img src="${imgBase64(shotPortal)}" alt="Client Portal" />
      </div>
      <div class="explanation">
        <p><strong>إيه اللي العميل بيشوفه؟</strong> بوابة خاصة ومشفرة برمز سري لكل عميل، مبيشوفش فيها كواليس الوكالة، بس بيشوف شغله النهائي.</p>
        <div class="action-step">
          <span>📱</span>
          <span><strong>اعتماد البوستات:</strong> العميل بيدخل يشوف جدول الشهر كله، يقدر يدوس "موافقة" بضغطة واحدة أو يكتب كومنت لو محتاج تعديل بسيط.</span>
        </div>
        <div class="action-step">
          <span>🔒</span>
          <span><strong>الخصوصية:</strong> كل عميل معزول تماماً ومستحيل يشوف شغل أو بيانات أي عميل تاني.</span>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
  `;

  const manualHtmlPath = path.join(__dirname, 'manual_layout.html');
  fs.writeFileSync(manualHtmlPath, manualHtml, 'utf8');

  console.log('📄 Rendering PDF with Puppeteer...');
  const printPage = await browser.newPage();
  await printPage.goto(`file://${manualHtmlPath}`, { waitUntil: 'networkidle0' });

  const pdfPath = path.join(__dirname, 'PR_Agency_System_Manual.pdf');
  await printPage.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '15mm',
      right: '15mm'
    }
  });

  console.log('✅ PDF Manual successfully created at:', pdfPath);
  await browser.close();
}

run().catch(err => {
  console.error('❌ Error generating manual:', err);
  process.exit(1);
});
