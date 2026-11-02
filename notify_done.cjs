// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`🤖 <b>تم إطلاق المساعد الذكي التفاعلي لبوت التليجرام (AI Chat Assistant)!</b> 🚀

تم بنجاح ربط الذكاء الاصطناعي مع مركز قيادة وكالة التسويق PR Agency على تليجرام:

<b>1. فهم اللغة الطبيعية (Arabic / English) 🗣️</b>
• الرد على الأسئلة والمحادثات بأسلوب احترافي ذكي بدون الحاجة للأزرار فقط.

<b>2. استعلام لحظي مباشر من قواعد بيانات D1 📊</b>
• "عندي كام عميل؟" ➔ يجيب بعدد العملاء الفعلي مع قائمة بأبرز الشركات المسجلة.
• "اعرض الفواتير والتحصيل" ➔ استعراض المبالغ المحصلة والمعلقة والمتأخرات.
• "عايز اعرف موقف المهام" ➔ إحصاء المهام المجدولة والمنجزة والمتأخرة.
• "إحصائيات الليدز والمبيعات" ➔ مسار المبيعات والصفقات الجديدة.

<b>3. تنفيذ الأوامر آلياً (Action Execution) ⚡</b>
• "أضف مهمة [عنوان المهمة]" ➔ يضيف المهمة فوراً في جدول المهام بـ D1 ويطلق الوكيل الإبداعي (Creative Agent) لصياغة البريف.

<b>4. صياغة المحتوى بالمهارات التسويقية المدمجة ✍️</b>
• "اكتبلي بوست عن خدماتنا" ➔ صياغة بوست إعلاني مقنع يعتمد نموذج Hook + Problem + Solution + CTA.
• "عايز سكريبت فيديو ريلز" ➔ سيناريو فيديو إعلاني قصير 9:16 مع توقيت المشاهد.

<b>5. حماية وأمان صارم 🛡️</b>
• حظر أي وصول غير مصرح به وحصر الخدمة حصرياً للمدير العام (${TELEGRAM_CHAT_ID}).`;

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
    console.log('✅ Notification Dispatched to Telegram Admin.');
    console.log('Response Status:', res.statusCode);
    try {
      const parsed = JSON.parse(body);
      console.log('Telegram API ok:', parsed.ok);
    } catch(e) {}
  });
});

req.on('error', (err) => {
  console.error('❌ Failed to send Telegram notification:', err.message);
});

req.write(payload);
req.end();
