// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`📈 <b>مركز القيادة المركزي لتليجرام | إنجاز المرحلة 7 بنجاح (PHASE 7: Reports & Analytics)</b> 🚀

<b>ما تم إنجازه واختباره بالكامل:</b>
1. <b>مركز التقارير التنفيذية والتحليلات اللحظية (Executive Reports):</b>
   - <b>💰 تقرير الإيرادات والتحصيل (Revenue Report):</b>
     • حساب إجمالي الإيرادات التاريخية، التحصيلات الشهرية، المستحقات المعلقة، ومعدل التحصيل ونسبة السداد.
   - <b>📊 تقرير أداء الفريق والمشاريع (Performance Report):</b>
     • تصنيف أعلى 5 عملاء إيراداً وأعلى 5 أعضاء فريق إنجازاً للمهام مع معدل الإنجاز الكلي للمهام.
   - <b>📈 تقرير مسار المبيعات والتحويلات (Leads & Conversion):</b>
     • تحليل إجمالي الليدز، معدل التحويل (Won Rate)، والتوزيع الدقيق بحسب مراحل الـ Pipeline ومصادر الجلب (Sources).
   - <b>🤖 تقرير وكلاء الذكاء الاصطناعي (Autonomous Agents):</b>
     • إحصاء إجراءات الوكلاء المقترحة والمعتمدة والمرفوضة ونسبة دقة وقبول قرارات الـ AI.

2. <b>مركز التصدير الشامل للبيانات (CSV / Excel Data Export):</b>
   - مسار <code>menu:report:csv_select</code> لتصدير أي قاعدة بيانات بضغطة زر.
   - توليد ملفات CSV متوافقة مع Excel مع ترميز UTF-8 BOM الداعم للغة العربية:
     • <code>action:report:export:leads</code>: تصدير الليدز وصفقات الـ CRM.
     • <code>action:report:export:invoices</code>: تصدير الفواتير وحالات السداد.
     • <code>action:report:export:clients</code>: تصدير سجلات العملاء وعقود Retainers.
     • <code>action:report:export:tasks</code>: تصدير المهام وسجلات الإسناد.
   - إرسال الملفات كمستندات رسمية عبر Telegram API (مع دعم المعاينة السريعة).

3. <b>اكتمال منظومة Telegram Command Center بالكامل (7/7 Phases Complete):</b>
   - Phase 1: Framework & Main Menu ✅
   - Phase 2: Tasks Management ✅
   - Phase 3: Clients & Leads ✅
   - Phase 4: Invoices & Projects ✅
   - Phase 5: Team & Settings ✅
   - Phase 6: AI Tools & Automation ✅
   - Phase 7: Reports & CSV Export ✅
   - Architecture Boundary Check: <b>PASSED (0 violations)</b>.`;

const payload = JSON.stringify({
  chat_id: TELEGRAM_CHAT_ID,
  text: message,
  parse_mode: 'HTML',
  disable_web_page_preview: true
});

const req = https.request({
  hostname: 'api.telegram.org',
  path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (data.ok) {
        console.log('✅ Telegram Notification Dispatched Successfully!');
        process.exit(0);
      } else {
        console.error('❌ Telegram API Error:', data.description);
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Failed to parse response:', e);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request error:', err);
  process.exit(1);
});

req.write(payload);
req.end();
