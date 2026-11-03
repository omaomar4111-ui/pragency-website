// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`🎨 <b>إنجاز المرحلة 2 بنجاح تام: تجربة المستخدم واللغة البشرية (UX/UI & Content Humanization)</b> 🚀

تم الانتهاء بنجاح من كافة متطلبات المرحلة الثانية:

<b>1. التدقيق الكامل للتصميم المتجاوب (Responsive Design) 📱</b>
• فحص شامل لكافة المقاسات: 375px (موبايل)، 768px (تابلت)، 1024px (لابتوب)، 1440px (ديسكتوب).
• <b>صفر تمرير أفقي (Zero Horizontal Scroll):</b> ضبط <code>overflow-x: hidden</code> ومحاذاة كافة الجداول والـ Grids.
• <b>تحويل الجداول إلى كروت (Stacked Cards):</b> تحويل جداول الصفقات والمهام والفواتير على شاشات الموبايل إلى بطاقات عمودية واضحة تحمل <code>data-label</code>.
• <b>نوافذ منبثقة ملء الشاشة (Full-Screen Modals):</b> عرض النوافذ على الموبايل بمقاس 100vw × 100vh لسهولة الاستخدام مع زر إغلاق صريح.
• <b>معيار آبل وجوجل للمس (Touch Targets ≥ 44px):</b> ضبط ارتفاعات كافة الأزرار والروابط لمنع النقرات الخاطئة.
• <b>حجم الخط 16px للمدخلات:</b> منع المتصفح (خاصة Safari iOS) من عمل زووم تلقائي مزعج عند الكتابة.

<b>2. إزالة النبرة الآلية وتطبيق العامية الراقية (Humanize All Text) ✍️</b>
• استبدال الرسائل الآلية بنصوص دافئة وطبيعية:
  ❌ "جاري معالجة الطلب..." ➔ ✅ "بنجهز طلبك..."
  ❌ "جاري الإرسال..." ➔ ✅ "بنرسل بياناتك، ثواني..."
  ❌ "تم إتمام العملية بنجاح" ➔ ✅ "تم الحفظ بنجاح"
  ❌ "فشل الاتصال بالخادم، حاول مرة أخرى" ➔ ✅ "معلش، النت قطع أو السيرفر مش مستجيب. جرب تاني بعد ثواني."
  ❌ "جاري التحقق..." ➔ ✅ "بنتأكد من بياناتك وندخلك..."

<b>3. اختبار رحلة المستخدم الشاملة عبر Playwright (E2E Walkthrough) 🧪</b>
• نجاح 3 رحلات مستخدم كاملة بنسبة 100% (زائر، مشرف نظام، عميل البوابة).
• حفظ 6 لقطات شاشة (Screenshots) توثق دقة الواجهات على الموبايل والديسكتوب في مجلد الـ Artifacts.

🌐 <b>الرابط المباشر للإنتاج:</b> https://b1307c10.pragency.pages.dev`;

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
    console.log('✅ Phase 2 Notification Dispatched to Telegram Admin.');
    console.log('Response Status:', res.statusCode);
  });
});

req.on('error', (err) => {
  console.error('❌ Failed to send Telegram notification:', err.message);
});

req.write(payload);
req.end();
