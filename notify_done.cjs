// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`📐 <b>إنجاز نظام التصميم المرن والمتكيف بنجاح تام (Fluid & Adaptive Design System)</b> 🚀

تم تطبيق تقنيات CSS الحديثة لضمان تجاوب ذكي وسلس 100% دون فواصل جامدة (No Rigid Breakpoints):

<b>1. الطباعة والمسافات المرنة (Fluid Typography & Spacing) 🔤</b>
• استبدال المقاسات الثابتة بدوال <code>clamp()</code> لكافة العناوين والنصوص والمسافات البينية.
• الخطوط تتدرج بسلاسة من شاشات الموبايل (320px) وحتى الشاشات العريضة (2560px).
• ضبط التباعد العمودي والأفقي <code>clamp(3rem, 7vw, 7.5rem)</code> ليناسب أي شاشة تلقائياً.

<b>2. شبكات العرض التلقائية (Fluid Grids with auto-fit) 📊</b>
• إعادة هيكلة كافة الشبكات (الخدمات، القيم، آراء العملاء، الفريق، الشركاء):
  <code>grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));</code>
• تدفق الكروت تلقائياً وتوزيع الأعمدة بانسيابية بدون قفزات مفاجئة أو كسر للتصميم.

<b>3. معالجة فراغ قسم الواجهة (Hero Section Gap Fix) 🎯</b>
• تصحيح التباعد بين النص والتمثال باستخدام <code>gap: clamp(2rem, 5vw, 4rem)</code>.
• محاذاة مركزية مثالية <code>align-items: center; justify-content: center;</code> وتوزيع متوازن للعمودين.

<b>4. ارتفاع الشاشة الديناميكي للموبايل (100dvh) 📱</b>
• استخدام <code>min-height: 100dvh</code> لضمان عدم اقتطاع شريط عناوين المتصفح لمحتوى الواجهة.

<b>5. صور متجاوبة بالكامل (Responsive Images) 🖼️</b>
• إلزام جميع الصور بـ <code>max-width: 100%; height: auto; object-fit: contain/cover;</code>.

🧪 <b>نتائج الاختبار والتحقق عبر Chrome DevTools:</b>
• فحص شامل لـ 6 مقاسات (320px, 375px, 768px, 1024px, 1440px, 1920px) ➔ <b>صفر تمرير أفقي (Horizontal Overflow: NO) بنسبة 100%</b>.
• التقاط وحفظ لقطات الشاشة التوثيقية بمقاسي 1440px و 768px.

🌐 <b>الرابط المباشر للإنتاج:</b> https://pragency.pages.dev`;

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
    console.log('✅ Fluid Design Notification Dispatched to Telegram Admin.');
    console.log('Response Status:', res.statusCode);
  });
});

req.on('error', (err) => {
  console.error('❌ Failed to send Telegram notification:', err.message);
});

req.write(payload);
req.end();
