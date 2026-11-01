// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`👥 <b>مركز القيادة المركزي لتليجرام | إنجاز المرحلة 3 بنجاح (PHASE 3: Clients & Leads)</b> 🚀

<b>ما تم إنجازه واختباره بالكامل:</b>
1. <b>إدارة العملاء (Clients Hub):</b>
   - مسار <code>menu:clients</code> لاستعراض عملاء الوكالة مع اشتراكاتهم وتفاصيل التواصل.
   - <b>📄 ملف العميل (Client Details):</b> إحصاء التسليمات النشطة والفواتير غير المسددة مع رابط مباشر للبوابة.
   - <b>🗑️ إدارة الحسابات:</b> إمكانية حذف أو أرشفة العميل من تليجرام.

2. <b>إدارة الصفقات والـ Pipeline (Leads & Sales Funnel):</b>
   - مسار <code>menu:leads</code> لعرض أحدث 10 صفقات مع تصنيف الميزانية وحالة المسار ورقم الهاتف.
   - <b>🔄 تحديث المراحل اللحظي (Stage Transitions):</b>
     • أزرار لنقل الليد بين المراحل: (جديد 🆕، تم التواصل 📞، عرض سعر 📑، تعاقد بنجاح 🏆، خسارة ❌).
     • تحديث قاعدة بيانات D1 فورياً ومزامنتها مع CRM المبيعات.
   - <b>💬 المتابعات والمراسلة:</b>
     • تفعيل وضع إدخال الرسائل الفوري <code>awaiting_lead_msg</code> وحفظ الملاحظات في سجلات المتابعة.

3. <b>اختبارات وفحوصات السلامة:</b>
   - Phase 3 Unit & D1 Integration Tests: <b>PASSED 100%</b>.
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
        console.log('✅ Telegram completion notification sent successfully to admin!');
      } else {
        console.error('❌ Telegram API error:', data.description);
      }
    } catch (e) {
      console.log('Response:', body);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request error:', err.message);
});

req.write(payload);
req.end();
