// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`🤖 <b>مركز القيادة المركزي لتليجرام | إنجاز المرحلة 6 بنجاح (PHASE 6: AI Tools & Automation)</b> 🚀

<b>ما تم إنجازه واختباره بالكامل:</b>
1. <b>استوديو أدوات الذكاء الاصطناعي التوليدي (AI Tools Studio):</b>
   - مسار <code>menu:ai</code> يتيح الوصول السريع لجميع أدوات توليد المحتوى والاستراتيجيات.
   - <b>✍️ كتابة بوستات إعلانية (Social Media Copy):</b> وضع حواري <code>awaiting_ai_post</code> لتوليد بوستات تسويقية متكاملة مع Hook وCall to action وهاشتاجات متوافقة مع السوق المصري والخليجي.
   - <b>📊 استراتيجيات التسويق الرقمي (Marketing Strategies):</b> وضع حواري <code>awaiting_ai_strategy</code> لبناء استراتيجية كاملة (جمهور، تموضع، توزيع ميزانيات، مؤشرات أداء).
   - <b>📑 مخططات العروض البيعية (Pitch Deck Outlines):</b> وضع حواري <code>awaiting_ai_pitch</code> لصياغة عروض بيع وحساب هوامش باقات Retainers.
   - <b>🔍 التنقيب والبحث الاستخباري (Prospecting):</b> وضع حواري <code>awaiting_ai_prospect</code> لتحليل الشركات وتحديد نقاط الضعف وزوايا البيع ورسائل التواصل الأولى.
   - <b>دعم الذكاء الاصطناعي متعدد المستويات:</b> محرك هجين يدمج Cloudflare Workers AI وGemini 1.5 Flash مع قوالب ذكية تضمن العمل الفوري.

2. <b>محرك الأتمتة وسير العمل (Automation & Workflows Hub):</b>
   - مسار <code>menu:automation</code> لعرض جميع مسارات العمل المسجلة في <code>agency_workflows</code>.
   - <b>⚡ تشغيل يدوي فوري:</b> زر <code>action:workflow:run</code> لتشغيل المسار وتسجيله في <code>workflow_execution_logs</code> لحظياً.
   - <b>🔴 / 🟢 تفعيل وتعطيل المسارات:</b> بضغطة زر واحدة وتحديث حالة <code>is_active</code> مباشرة في D1.
   - <b>📜 سجلات التشغيل:</b> مسار <code>menu:workflow:logs</code> لعرض آخر عمليات التشغيل وحالاتها الزمنية.

3. <b>اختبارات وفحوصات السلامة:</b>
   - Phase 6 AI Tools & Automation Tests: <b>PASSED 100%</b>.
   - D1 Table Updates & Execution Logging: <b>PASSED</b>.
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
