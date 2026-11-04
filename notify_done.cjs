// notify_done.cjs
// Dispatches Telegram completion message to the User / Admin
const https = require('https');
const fs = require('fs');
const path = require('path');

// Helper to load local environment files without committing secrets
function loadEnvFile(fileName) {
  try {
    const filePath = path.resolve(__dirname, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  } catch (e) {
    // Silently continue
  }
}

// Attempt to load .env and .dev.vars if present locally
loadEnvFile('.env');
loadEnvFile('.dev.vars');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('SECURITY FATAL: TELEGRAM_BOT_TOKEN is not set in environment variables or .env file. Hardcoded secrets are prohibited.');
}

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
if (!TELEGRAM_CHAT_ID) {
  throw new Error('SECURITY FATAL: TELEGRAM_CHAT_ID is not set in environment variables or .env file.');
}

const message = 
`🔒 <b>إنجاز المرحلة الثانية: تطهير وتأمين الأسرار البرمجية بنجاح (Secrets Sanitization & Hardening)</b> 🛡️

تم تطبيق معايير الأمان المتقدمة لمكافحة تسريب المفاتيح (Zero-Exposure Policy):

<b>1. إزالة الأسرار الصلبة (Zero Hardcoded Credentials) 🛑</b>
• تم تفريغ وحذف التوكنات الصلبة (Fallback Tokens) من كافة ملفات المشروع.
• إلزام كود <code>notify_done.cjs</code> بالاعتماد الحصري على <code>process.env.TELEGRAM_BOT_TOKEN</code>.
• رمي استثناء أمني قاتل (Security Fatal Exception) في حال غياب التوكن لمنع أي تسريب مستقبلي.

<b>2. تطهير إعدادات ورانجلر (wrangler.toml Sanitization) 🧹</b>
• حذف المفاتيح الحساسة (<code>TELEGRAM_BOT_TOKEN</code>, <code>JWT_SECRET</code>, <code>PORTAL_SECRET</code>) من ملف <code>wrangler.toml</code>.
• حصر إعدادات <code>[vars]</code> على المتغيرات العامة غير الحساسة فقط.

<b>3. التحصين بملفات البيئة والتجاهل (Environment Isolation & .gitignore) 📁</b>
• التحقق من حظر <code>.env*</code> و <code>.dev.vars*</code> و <code>release.keystore*</code> من الدخول إلى Git.
• إنشاء قالب <code>.dev.vars.example</code> كمرجع للتطوير المحلي الآمن.

<b>4. جاهزية المرحلة الثالثة (Ready for DAST Phase 3) 🚀</b>
• الانتقال إلى فحص الثغرات الآلي ومسح OWASP ZAP & Nuclei.

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
    console.log('✅ Secrets Sanitization Notification Dispatched to Telegram Admin.');
    console.log('Response Status:', res.statusCode);
  });
});

req.on('error', (err) => {
  console.error('❌ Failed to send Telegram notification:', err.message);
});

req.write(payload);
req.end();
