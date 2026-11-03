// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`🔒 <b>إنجاز المرحلة 1 بنجاح تام: الأمان والتحقق (Auth & Security Overhaul)</b> 🛡️

تم بنجاح تنفيذ وتأمين منظومة PR Agency بنظام <b>Cloudflare Zero Trust (Email OTP)</b> واجتياز الفحص الأمني الشامل:

<b>1. تكامل Cloudflare Access ورمز البريد (Email OTP) 📧</b>
• بناء وحدة التحقق <code>functions/lib/cf-access.js</code> لفك تشفير وتأكيد ترويسة <code>Cf-Access-Jwt-Assertion</code> لحظياً.
• مطابقة البريد الإلكتروني مع جدول <code>agency_team_members</code> وقائمة الإدارة المعتمدة، مع ربط عملاء البوابة مع <code>portal_clients</code>.
• تحديث شاشة تسجيل الدخول في <code>admin-agency.html</code> للتحقق الفوري بدون كلمة مرور (Passwordless Access).

<b>2. الحماية الصارمة من تجاوز الصلاحيات (Auth Bypass Defense) 🚫</b>
• إغلاق كافة ثغرات الـ Bypass في <code>functions/api/admin/_middleware.js</code>: أي طلب غير موثق يُردع فوراً بـ <code>HTTP 401 Unauthorized</code>.

<b>3. نتائج الفحص الأمني واختبار الاختراق (Penetration Audit) 📋</b>
• اجتياز <b>20 من أصل 20 اختبار أمني بنسبة نجاح 100%</b> (تقرير <code>SECURITY_AUDIT_REPORT.md</code>):
  ✅ <b>Auth Bypass:</b> حظر تام لأي محاولة وصول بدون توكن.
  ✅ <b>Zero Trust OTP:</b> قبول المشرفين المصرح لهم ورفض الإيميلات الخارجية فوراً.
  ✅ <b>IDOR Defense:</b> عزل كامل لفواتير العملاء ومنع المصممين من البيانات المالية (403).
  ✅ <b>SQL Injection:</b> تحصين كافة العمليات عبر Parameterized Queries (.bind).
  ✅ <b>XSS Defense:</b> تشفير كامل لمدخلات المستخدمين ومخرجات الذكاء الاصطناعي.
  ✅ <b>Rate Limiting:</b> حظر التخمين بعد 5 محاولات (429) وتحديد معدل الويبهوك.
  ✅ <b>Security Headers:</b> فرض CSP و HSTS و DENY Frame و nosniff و noindex.

🌐 <b>الرابط المباشر للإنتاج:</b> https://01473f80.pragency.pages.dev`;

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
    console.log('✅ Phase 1 Notification Dispatched to Telegram Admin.');
    console.log('Response Status:', res.statusCode);
  });
});

req.on('error', (err) => {
  console.error('❌ Failed to send Telegram notification:', err.message);
});

req.write(payload);
req.end();
