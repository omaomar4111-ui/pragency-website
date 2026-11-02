// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`🤖 <b>تحديث المنظومة | إنجاز المرحلة C بالكامل بنجاح (PHASE C: Full AI Agents Integration)</b> 🚀

<b>ما تم إنجازه واختباره بالكامل:</b>
1. <b>مركز الوكلاء الذكي الشامل (Agents Hub - 3 Sub-sections):</b>
   - تبويب مركز الوكلاء في Admin OS يحتوي الآن على 3 أقسام مستقلة مع عدادات حية:
     • <code>[💼 وكيل المبيعات (Sales Agent)]</code>: صياغة مسودات استقطاب الليدز (واتساب وإيميل).
     • <code>[🎨 الوكيل الإبداعي (Creative Agent)]</code>: توليد ومراجعة البريفات الإعلانية للمهام.
     • <code>[⚠️ وكيل نجاح العملاء (Client Success Agent)]</code>: رصد مخاطر تسرب العملاء والـ Churn.

2. <b>الوكيل الإبداعي المستقل (Creative Agent):</b>
   - محرك <code>functions/api/internal/agents/creative-agent.js</code> يعمل تلقائياً في الخلفية عبر <code>context.waitUntil()</code> فور إنشاء أي مهمة جديدة.
   - يولد بريف إعلاني متكامل (3s Hook, Visual Direction, Story Flow, Sales Copy, CTA).
   - يحفظ المسودة في <code>agent_pending_actions</code> ويرسل إشعار تليجرام تفاعلي.
   - عند الاعتماد من لوحة التحكم أو تليجرام، يتم تحديث حقل <code>tasks.ai_brief</code> مباشرة في D1.

3. <b>وكيل نجاح العملاء ومكافحة التسرب (Client Success Agent):</b>
   - محرك <code>functions/api/internal/agents/client-success-agent.js</code> يفحص الفواتير المتأخرة لأكثر من 7 أيام والعملاء الخاملين بدون مهام لأكثر من 14 يوماً.
   - يصيغ خطة تدخل فورية (Retention Playbook) ويرسل تنبيهات مع أزرار اتصال وتذكير سداد.

4. <b>التكامل التفاعلي مع تليجرام (Telegram Command Center):</b>
   - دعم كامل لـ Callbacks الإجراءات الذكية في <code>webhook.js</code>:
     • <code>[✅ اعتماد البريف للمهمة]</code>: يحدث <code>tasks.ai_brief</code> في D1 فوراً.
     • <code>[✏️ تعديل]</code> / <code>[❌ رفض]</code>.
     • <code>[📞 تسجيل اتصال بالعميل]</code> / <code>[📧 إرسال تذكير سداد]</code>.

5. <b>قواعد البيانات (D1 Schemas):</b>
   - تحديث جدول <code>tasks</code> بإضافة عمود <code>ai_brief TEXT</code>.
   - تحديث جدول <code>agent_pending_actions</code> بإضافة <code>related_id TEXT</code> و<code>processed_at DATETIME</code>.

6. <b>نتائج الاختبارات والامتثال المعماري:</b>
   - اختبارات الوكلاء (Phase C Suite): <b>PASSED 100%</b>.
   - الفحص المعماري الصارم (check-architecture.cjs): <b>0 violations (PASSED)</b>.
   - اختبارات الموبايل (Playwright 375px, 390px, 428px): <b>PASSED (9/9)</b>.`;

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
