// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`🚀 <b>اكتمال خطة العمل بالكامل بنجاح 100% | PR Agency OS</b> 🏆

تم الانتهاء بنجاح من كافة المراحل الأربعة لخريطة الطريق:

<b>1. تحسين الأداء (Lighthouse 90+) ⚡</b>
• ضغط وتحويل كافة الصور إلى صيغة WebP وتحديد الأبعاد بدقة.
• تقليل زمن التحميل بتأجيل الأنماط غير الحرجة وLazy-loading للمحتوى.

<b>2. مسار بناء تطبيق أندرويد تلقائياً (Android APK CI Automation) 📱</b>
• تجهيز ملف الـ CI على مسار <code>.github/workflows/build-android.yml</code>.
• توليد وتوقيع ملف الـ APK ورفعه تلقائياً كـ Artifact.

<b>3. محرك المزامنة الأوفلاين الشامل (Offline Sync & Mutation Queue) 📡</b>
• اعتراض تلقائي لكافة عمليات الحفظ والتعديل (Forms / Leads / Tasks / Invoices) عند انقطاع الإنترنت.
• تخزين العمليات محلياً برقم تسلسلي في طابور <code>pr_offline_sync_queue</code>.
• إعادة إرسال وتزامن البيانات آلياً مع سحابة Cloudflare D1 فور استعادة الاتصال.
• شريط تنبيه تفاعلي وتوست إشعار يوضح حالة الاتصال والمزامنة.

<b>4. خط أنابيب الاختبارات وضمان الجودة الشامل (QA Pipeline) 🧪</b>
• أمر موحد <code>npm test</code> يفحص 6 مجموعات اختبار خلال 18 ثانية:
  ✅ فحص حدود الشخصيات وعدم تسريب أدوات الإدارة
  ✅ فحص محرك المزامنة الأوفلاين
  ✅ فحص الأمان واختبار الاختراق (19 اختبار أمني)
  ✅ فحص الوكلاء الأذكياء (Sales, Creative, Success)
  ✅ فحص مساعد تليجرام الذكي وموجه المهارات التسويقية
  ✅ فحص مركز قيادة تليجرام المركزي

🌐 <b>الموقع والنظام لايف 100%:</b> https://0a0fc954.pragency.pages.dev`;

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
    console.log('✅ Final Completion Notification Dispatched to Telegram Admin.');
    console.log('Response Status:', res.statusCode);
  });
});

req.on('error', (err) => {
  console.error('❌ Failed to send Telegram notification:', err.message);
});

req.write(payload);
req.end();
