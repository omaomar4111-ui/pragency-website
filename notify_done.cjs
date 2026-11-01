// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`✅ <b>تم إنجاز وتفعيل وكيل المبيعات الذكي (Autonomous Sales AI Agent) بنجاح!</b> 🚀

<b>ما تم إنجازه واختباره بالكامل:</b>
1. <b>محرك الوكيل الذكي (Backend):</b>
   - مسار <code>POST /api/internal/agents/sales-agent</code> مدمج مع قواعد <code>skills/prospecting</code> و <code>skills/cold-email</code>.
   - تحليل قطاع العميل ونقاط الألم وصياغة رسالة افتتاحية مقنعة واحترافية.
   - حفظ المسودات في جدول D1: <code>agent_pending_actions</code> بوضع <code>pending_approval</code>.

2. <b>واجهة المراجعة والاعتماد (Human-in-the-Loop UI):</b>
   - إضافة قسم <b>🤖 مركز الوكلاء (Agents)</b> في لوحة الإدارة <code>admin-agency.html</code>.
   - استعراض المسودات مع إمكانية التعديل المباشر داخل Textarea قبل الإرسال.
   - زري <b>"✅ إرسال (Approve & Send)"</b> و <b>"❌ تجاهل (Reject)"</b> مع تحديث الحالة لـ <code>sent</code>.

3. <b>ربط ويب هوك فيسبوك (Meta Lead Ads):</b>
   - تحديث <code>functions/api/webhooks/facebook-leads.js</code> لتشغيل الوكيل آلياً عبر <code>context.waitUntil()</code> فور وصول أي ليد.

4. <b>إشعارات تليجرام الفورية:</b>
   - إرسال إشعار فوري للإدارة عند تجهيز أي مسودة جديدة للموافقة عليها.

5. <b>نشر النظام:</b>
   - فحص بنية الأمان: <b>PASSED</b>.
   - اختبارات Vitest و Playwright: <b>PASSED</b>.
   - النشر الحي على Cloudflare Pages جاهز ومفعل.`;

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
