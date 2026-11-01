// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8857951958:AAGLCjUIW_KwZZ-Tl07LfKEvhw5XsC-bp7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5715939844';

const message = 
`👤 <b>مركز القيادة المركزي لتليجرام | إنجاز المرحلة 5 بنجاح (PHASE 5: Team & Settings)</b> 🚀

<b>ما تم إنجازه واختباره بالكامل:</b>
1. <b>إدارة فريق العمل والصلاحيات (Team Hub):</b>
   - مسار <code>menu:team</code> يعرض قائمة بأعضاء الفريق وحالة حساباتهم وأدوارهم.
   - <b>إجراءات العضو الفورية:</b>
     • <code>action:team:view</code>: عرض تفاصيل العضو وعدد المهام المسندة له.
     • <code>action:team:toggle</code>: تفعيل/تعطيل الحساب بضغطة زر وتحديث D1 لحظياً.
     • <code>action:team:tasks</code>: استعراض المهام المسندة للعضو.
     • <code>action:team:delete</code>: حذف العضو وإلغاء صلاحياته فورياً.
   - <b>➕ إضافة عضو جديد حوارياً:</b> تفعيل وضع <code>awaiting_team_add</code> لإضافة عضو بالاسم والدور والقسم والبريد.

2. <b>إدارة إعدادات الوكالة الحساسة (Settings Management):</b>
   - مسار <code>menu:settings</code> لعرض بيانات الدفع وتكوينات النظام:
     • حساب InstaPay IPA واسم المستفيد الرسمي.
     • معرّف Apple Pay Merchant ID.
     • معرّف Telegram Chat ID والبلدان المستهدفة.
   - <b>تعديل الإعدادات حوارياً:</b> دعم تعديل أي إعداد وتحديثه في جدول <code>agency_settings</code> بـ D1.
   - <b>🔔 زر اختبار الإشعارات الفورية:</b> فحص مسار الإشعارات وضمان وصول التنبيهات لحظياً.

3. <b>اختبارات وفحوصات السلامة:</b>
   - Phase 5 Team & Settings Unit & D1 Tests: <b>PASSED 100%</b>.
   - D1 Table Updates & Session Handling: <b>PASSED</b>.
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
