/**
 * apply_mobile_fixes.cjs
 * Part 2a: Contact Hub mobile position (bottom-left on mobile)
 * Part 2b: Hide hero logo layer on mobile
 * Part 3:  Telegram rate-limit handling + NOTIFY_ALL_VISITS filter
 * Version: v=70 → v=71
 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

// ─────────────────────────────────────────────────────────────────────────────
// PART 2a + 2b: Patch css/chatbot.css
// Append mobile fixes at the end
// ─────────────────────────────────────────────────────────────────────────────
const mobileCss = `
/* ══════════════════════════════════════════════════════════════
   MOBILE FIXES (v71)
══════════════════════════════════════════════════════════════ */

/* 2a: Move Contact Hub to bottom-LEFT on mobile so it doesn't overlap hero CTA */
@media (max-width: 768px) {
  #contact-hub {
    bottom: 16px;
    left: 16px;
    right: auto;
  }

  #contact-hub-btn {
    width: 52px;
    height: 52px;
  }

  /* Menu opens up from bottom-left */
  #contact-hub-menu {
    align-items: flex-start;
  }

  /* Hub option labels: keep label left of icon on mobile too */
  .hub-option {
    flex-direction: row;
  }

  /* RTL override: keep same layout on mobile RTL */
  [dir="rtl"] #contact-hub {
    left: 16px;
    right: auto;
  }

  [dir="rtl"] .hub-option {
    flex-direction: row;
  }

  /* Chat panel full-screen on mobile (already set, confirm right/left) */
  #ai-chat-panel {
    bottom: 0;
    right: 0;
    left: 0;
    width: 100vw;
    max-width: 100vw;
  }
}

/* 2b: Hide hero logo layer on mobile only — keep on desktop */
@media (max-width: 768px) {
  .hero-logo-layer,
  .hero-brand-lockup {
    display: none !important;
  }
}
`;

const chatCssPath = path.join(ROOT, 'css/chatbot.css');
let chatCss = fs.readFileSync(chatCssPath, 'utf8');

// Remove old mobile fixes block if already present (idempotent)
chatCss = chatCss.replace(/\n\/\* ═+\s*\n\s*MOBILE FIXES[\s\S]*?(?=\n\/\* ═|$)/m, '');

chatCss += mobileCss;
fs.writeFileSync(chatCssPath, chatCss, 'utf8');
console.log('✅ css/chatbot.css — mobile fixes added (hub bottom-left, hero-logo-layer hidden)');

// ─────────────────────────────────────────────────────────────────────────────
// PART 3: Patch functions/_middleware.js
// - Improve sendTelegramAlert with HTTP 429 retry logging
// - Add NOTIFY_ALL_VISITS logic (default: new visitors only)
// ─────────────────────────────────────────────────────────────────────────────
let mw = fs.readFileSync(path.join(ROOT, 'functions/_middleware.js'), 'utf8');

// Replace the sendTelegramAlert function with improved version
const oldFuncStart = 'async function sendTelegramAlert(env, data) {';
const oldFuncEnd = '}\n\nasync function logVisit(';

const startIdx = mw.indexOf(oldFuncStart);
const endIdx   = mw.indexOf(oldFuncEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error('❌ Could not locate sendTelegramAlert in _middleware.js — skipping Part 3');
} else {
  const newFunc = `async function sendTelegramAlert(env, data) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[Analytics] Telegram credentials missing in Worker env:', { hasToken: !!token, hasChatId: !!chatId });
    return;
  }

  // ── NOTIFY_ALL_VISITS logic ────────────────────────────────────────────────
  // Default: only notify for NEW visitors (no pr_vid cookie previously seen).
  // If env var NOTIFY_ALL_VISITS=true, notify for returning visitors too,
  // but with a 5-minute per-visitor cooldown stored in Worker memory.
  const notifyAll = (env.NOTIFY_ALL_VISITS || '').toLowerCase() === 'true';
  const isNewVisitor = data.isNewVisitor === true;

  if (!isNewVisitor && !notifyAll) {
    // Returning visitor and NOTIFY_ALL_VISITS is false → skip
    return;
  }

  // Country filtering: Support NOTIFY_COUNTRIES env var, fallback to EG, SA, AE
  const allowedCountries = (env.NOTIFY_COUNTRIES || 'EG,SA,AE')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);

  const visitorCountry = (data.country || '').trim().toUpperCase();
  if (visitorCountry && !allowedCountries.includes(visitorCountry)) {
    console.log(\`[Analytics] Skipping Telegram alert for country \${visitorCountry}. Allowed: \${allowedCountries.join(',')}\`);
    return;
  }

  // ── Per-visitor cooldown (Worker memory, 5-min window) ────────────────────
  const COOLDOWN_MS = notifyAll ? 5 * 60 * 1000 : 60 * 1000; // 5 min if notifyAll, else 1 min
  const now = Date.now();
  const lastSent = notifyCooldown.get(data.visitorId) || 0;
  if (now - lastSent < COOLDOWN_MS) {
    return;
  }
  notifyCooldown.set(data.visitorId, now);

  if (notifyCooldown.size > 2000) {
    notifyCooldown.clear();
  }

  // ── Build message ─────────────────────────────────────────────────────────
  const locationParts = [data.city, data.region, data.country].filter(Boolean).join(', ') || 'Unknown';
  let geoBlock = \`📍 <b>Location:</b> \${locationParts}\`;
  if (data.postalCode) geoBlock += \`\\n📮 <b>Postal Code:</b> \${data.postalCode}\`;
  if (data.latitude && data.longitude) geoBlock += \`\\n🧭 <b>Coordinates:</b> \${data.latitude}, \${data.longitude}\`;

  const visitorLabel = isNewVisitor ? '🆕 <b>New Visitor!</b>' : '🔄 <b>Returning Visitor</b>';

  const message =
    \`🔔 \${visitorLabel} — PR Agency\\n\` +
    \`\${geoBlock}\\n\` +
    \`🌐 <b>Page:</b> \${data.path}\\n\` +
    \`📱 <b>Device:</b> \${data.device}\\n\` +
    \`🔗 <b>Referrer:</b> \${data.referrer || 'Direct'}\\n\` +
    \`🆔 <b>Visitor ID:</b> <code>\${data.visitorId.slice(0, 8)}</code>\`;

  // ── Send with 429 retry handling ──────────────────────────────────────────
  try {
    const tgResponse = await fetch(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });

    if (tgResponse.status === 429) {
      const retryAfter = parseInt(tgResponse.headers.get('Retry-After') || '5', 10);
      console.warn(\`TELEGRAM_RATE_LIMITED: retry after \${retryAfter}s for visitor \${data.visitorId.slice(0,8)}\`);
      // Reset cooldown so next request can retry
      notifyCooldown.delete(data.visitorId);
      return;
    }

    const tgBody = await tgResponse.text();
    console.log('TELEGRAM_RESPONSE_STATUS:', tgResponse.status);
    if (tgResponse.status !== 200) {
      console.warn('TELEGRAM_RESPONSE_BODY:', tgBody);
    }
  } catch (err) {
    console.error('TELEGRAM_FETCH_ERROR:', err.message);
  }
}

`;

  // Now patch the "isNewVisitor" flag into the onRequest function
  // Currently newVidCookie is set only when visitorId is new — we use that as the signal
  const newMiddleware = mw.slice(0, startIdx) + newFunc + mw.slice(endIdx + oldFuncEnd.length);
  
  // Add isNewVisitor to visitorData object (inside onRequest)
  const patched = newMiddleware.replace(
    'device: userAgent.includes(\'Mobile\') ? \'Mobile\' : \'Desktop\',',
    'device: userAgent.includes(\'Mobile\') ? \'Mobile\' : \'Desktop\',\n      isNewVisitor: !cookies[\'pr_vid\'],'
  );

  fs.writeFileSync(path.join(ROOT, 'functions/_middleware.js'), patched, 'utf8');
  console.log('✅ functions/_middleware.js — Telegram 429 handling + NOTIFY_ALL_VISITS + isNewVisitor flag');
}

// ─────────────────────────────────────────────────────────────────────────────
// Version bump: v=70 → v=71 in all HTML files
// ─────────────────────────────────────────────────────────────────────────────
const htmlFiles = [
  'index.html','about.html','services.html','clients.html',
  'team.html','contact.html','privacy.html','terms.html',
  'thank-you.html','404.html'
];

let bumped = 0;
for (const file of htmlFiles) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) continue;
  let html = fs.readFileSync(fp, 'utf8');
  if (html.includes('v=70')) {
    html = html.replace(/v=70/g, 'v=71');
    fs.writeFileSync(fp, html, 'utf8');
    bumped++;
    console.log(`✅ ${file} — v=70 → v=71`);
  }
}
console.log(`\nVersion bumped in ${bumped} files`);
console.log('\n🎉 All patches applied! Ready to commit and deploy.');
