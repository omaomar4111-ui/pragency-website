// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`🚀 <b>تحديث المنظومة الشامل | إنجاز المراحل الثلاث بنجاح تام</b> 🏆

<b>1. المرحلة 1: تحسين الأداء والسرعة (Performance Optimization) ⚡</b>
• تحويل كافة الصور في <code>index.html</code> و<code>clients.html</code> إلى تنسيق <b>WebP</b> المضغوط.
• إضافة <code>loading="lazy"</code> مع أبعاد صريحة <code>width</code> و<code>height</code> لمنع الـ CLS.
• تضمين الـ <b>Critical CSS</b> في الـ <code>&lt;head&gt;</code> لمنع أي وميض أو تأخير في أول رندرة.
• تأجيل تحميل ملفات الـ CSS غير الحرجة عبر <code>media="print" onload="this.media='all'"</code>.
• تفعيل التحميل المؤجل <code>defer</code> لجميع السكربتات وLazy-loading لـ GSAP عند تفاعل المستخدم.

<b>2. المرحلة 2: بناء تطبيق الأندرويد (Android APK CI Automation) 📱</b>
• إنشاء مسار GitHub Actions الآلي <code>.github/workflows/build-android.yml</code>.
• بناء وتوقيع ملف APK تلقائياً عبر سحابة GitHub بدون الحاجة لتثبيت Android Studio.
• دعم فك تشفير <code>ANDROID_KEYSTORE_BASE64</code> من GitHub Secrets مع توليد تلقائي احتياطي للمفتاح على السحابة لضمان نجاح الـ Build 100%.
• رفع ملف APK جاهز للتنزيل كـ Artifact باسم <code>PR-Agency-APK</code>.

<b>3. المرحلة 3: الفحص الأمني المتقدم واختبار الاختراق (Penetration Audit) 🛡️</b>
• نجاح <b>19 من أصل 19 اختبار أمني</b> بنسبة 100% (تقرير <code>SECURITY_AUDIT_REPORT.md</code>):
  - <b>Rate Limiting:</b> حظر هجمات التخمين على بوابة العملاء والإدارة (429) وتحديد معدل الويبهوك (20 reqs/10s).
  - <b>IDOR Defense:</b> عزل صارم لفواتير وبيانات العملاء بالاعتماد على <code>payload.sub</code>.
  - <b>SQL Injection:</b> كافة الاستعلامات مجهزة وآمنة 100% عبر Parameterized Bindings.
  - <b>XSS Defense:</b> تعقيم وتشفير لكافة المدخلات ونصوص الذكاء الاصطناعي.
  - <b>RBAC:</b> حظر وصول المصممين للشؤون المالية وحظر تعديل الفريق لغير الـ Super Admin.
  - <b>Security Headers:</b> تفعيل CSP وHSTS وnosniff وDENY frame وnoindex في <code>_headers</code> و<code>robots.txt</code>.`;

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
