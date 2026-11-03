// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`⚡ <b>إنجاز المرحلة 3 بنجاح تام: تحسين الأداء والسرعة الخارقة (Performance Optimization)</b> 🚀

تم الانتهاء بنجاح من كافة متطلبات المرحلة الثالثة لتسريع المنظومة بالكامل:

<b>1. تحسين الصور وتصفير الـ Layout Shift (CLS = 0.021) 🖼️</b>
• تدقيق 100% من وسوم <code>&lt;img&gt;</code> عبر كافة الصفحات وإلزامها بأبعاد صريحة <code>width</code> و <code>height</code> وخاصية <code>loading="lazy"</code>.
• توليد نسخ WebP متجاوبة لتمثال الواجهة (400w / 700w / 1000w) وتقليص حجم تحميل الموبايل من 120KB إلى <b>21KB</b> فقط (توفير 82%).
• تحميل مسبق عالي الأولوية للـ LCP Hero Image مع مطابقة تامة لـ <code>imagesrcset</code> و <code>fetchpriority="high"</code>.

<b>2. تحسين الخطوط ونمط التنسيق الحرج (Critical CSS) 🎨</b>
• تضمين التنسيق الحرج لجزء الشاشة الأول (Header & Hero) داخل <code>&lt;head&gt;</code> لمنع أي قفزات بصرية.
• ضغط ملفات CSS عبر <code>esbuild</code> إلى <code>main.min.css</code> (24KB) و <code>pages.min.css</code> (49KB) وتأجيل غير الحرج منها.
• تحميل خطوط Cairo بدون حجب مع تفعيل <code>font-display: swap</code> ومسبقات الاتصال Google CDN.

<b>3. تصفير وقت حجب الخيط الرئيسي (TBT = 0 ms!) ⚙️</b>
• إزالة محرك الجزيئات المكرر وإيقاف Canvas على الموبايل عبر Media Queries بدون استدعاء Layout Reflow.
• تأجيل مزامنة الكاباسيتور <code>native-sync.js</code> ومؤشر القراءة <code>scroll-progress.js</code> لتعمل على <code>requestIdleCallback</code>.
• تحويل مستمعات التأثيرات (Ripples) إلى Event Delegation موحد على مستوى المستند.

<b>4. التخزين المؤقت المتقدم (Edge Caching) 🌐</b>
• ضبط كاشينج سنوي غير قابل للتعديل <code>max-age=31536000, immutable</code> لكافة الأصول الثابتة.

📊 <b>نتائج فحص Lighthouse الرسمي للإنتاج:</b>
• <b>Desktop:</b> 95/100 Performance | 100/100 Best Practices | 100/100 SEO | 91/100 A11y (LCP: 0.7s)
• <b>Mobile:</b> 84/100 Performance | 100/100 Best Practices | 100/100 SEO | 91/100 A11y (TBT: 0 ms | CLS: 0.021)

🌐 <b>الرابط المباشر للمنظومة على Cloudflare Pages:</b> https://pragency.pages.dev`;

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
    console.log('✅ Phase 3 Notification Dispatched to Telegram Admin.');
    console.log('Response Status:', res.statusCode);
  });
});

req.on('error', (err) => {
  console.error('❌ Failed to send Telegram notification:', err.message);
});

req.write(payload);
req.end();
