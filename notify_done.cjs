// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`🏛️ <b>مركز القيادة المركزي لتليجرام | إنجاز المرحلة 1 بنجاح (PHASE 1: Framework & Main Menu)</b> 🚀

<b>ما تم إنجازه واختباره بالكامل:</b>
1. <b>إدارة حالة الجلسات (D1 Session State Management):</b>
   - إنشاء جدول <code>telegram_sessions</code> في كلا قاعدتي D1.
   - التحقق من تخزين وقراءة وتحديث الجلسات (chat_id, current_menu, context_data, updated_at).

2. <b>مُنشئ القوائم التفاعلية (Telegram Menu Builder):</b>
   - إنشاء <code>functions/lib/telegram-menu.js</code> يدعم 6 صفوف كاملة من الأزرار الشفافة التفاعلية (Inline Keyboard).
   - تصميم واجهة "نظرة عامة" التنفيذية (Overview Menu) لربط مؤشرات الأداء الحية.

3. <b>موجه الويب هوك وتدقيق الأمان (Callback & Message Router):</b>
   - إنشاء <code>functions/api/telegram/webhook.js</code>.
   - معالجة أحداث <code>callback_query</code> و <code>message</code> مع إيقاف مؤشر التحميل فوراً (answerCallbackQuery).
   - حماية أمنية صارمة: رفض أي محادثة لا تطابق <code>TELEGRAM_CHAT_ID</code> المعتمد.

4. <b>بيانات النظرة العامة اللحظية (Live D1 Executive Pulse):</b>
   - قراءة إجمالي العملاء، المهام النشطة، الفواتير المحصلة، والليدز الجديدة أسبوعياً.
   - زري التحديث 🔄 والرجوع للقائمة الرئيسية ⬅️.

5. <b>اختبارات وفحوصات السلامة:</b>
   - Unit Tests: <b>PASSED 100%</b>.
   - Remote D1 Session Verification: <b>PASSED</b>.
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
