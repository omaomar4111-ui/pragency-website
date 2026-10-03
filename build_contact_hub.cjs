/**
 * build_contact_hub.cjs
 * One-shot script: builds the complete Contact Hub widget
 * Runs all transformations in memory then writes files.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Rewrite js/chatbot.js
//    - Remove #ai-chat-btn from widgetHtml
//    - Expose window.openChatbot() / window.closeChatbot()
//    - Keep all other logic intact
// ─────────────────────────────────────────────────────────────────────────────
const newChatbotJs = `(function() {
  'use strict';

  // 1. Session & Identity
  let sessionId = sessionStorage.getItem('pr_chat_session_id');
  if (!sessionId) {
    sessionId = 'cs_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem('pr_chat_session_id', sessionId);
  }

  function getVisitorId() {
    const match = document.cookie.match(/pr_vid=([^;]+)/);
    return match ? match[1] : 'anon_' + sessionId;
  }

  // 2. Inject HTML Widget (NO floating button — controlled by Contact Hub)
  const widgetHtml = \`
    <div id="ai-chat-panel">
      <div class="ai-chat-header">
        <div class="ai-chat-profile">
          <div class="ai-chat-avatar">PR</div>
          <div class="ai-chat-info">
            <h3 data-i18n="chat.title">مساعد PR Agency الذكي</h3>
            <span data-i18n="chat.status">متاح للرد فوراً</span>
          </div>
        </div>
        <button class="ai-chat-close" id="ai-chat-close-btn" aria-label="Close chat">✕</button>
      </div>

      <div class="ai-chat-messages" id="ai-chat-msgs"></div>

      <div class="ai-typing-indicator" id="ai-typing">
        <span></span><span></span><span></span>
      </div>

      <div class="ai-chat-input-row">
        <input type="text" class="ai-chat-field" id="ai-chat-input" data-i18n-ph="chat.placeholder" placeholder="اكتب استفسارك هنا..." />
        <button class="ai-chat-send-btn" id="ai-chat-send" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  \`;

  document.body.insertAdjacentHTML('beforeend', widgetHtml);

  // 3. UI References
  const panel = document.getElementById('ai-chat-panel');
  const closeBtn = document.getElementById('ai-chat-close-btn');
  const msgsContainer = document.getElementById('ai-chat-msgs');
  const input = document.getElementById('ai-chat-input');
  const sendBtn = document.getElementById('ai-chat-send');
  const typing = document.getElementById('ai-typing');

  // 4. Persistence in sessionStorage
  function saveHistory(messages) {
    sessionStorage.setItem('pr_chat_history_' + sessionId, JSON.stringify(messages));
  }

  function getHistory() {
    try {
      return JSON.parse(sessionStorage.getItem('pr_chat_history_' + sessionId)) || [];
    } catch (e) {
      return [];
    }
  }

  function renderMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = \`ai-msg ai-msg-\${role}\`;
    msgDiv.textContent = text;
    msgsContainer.appendChild(msgDiv);
    msgsContainer.scrollTop = msgsContainer.scrollHeight;
  }

  // Load existing history
  const history = getHistory();
  if (history.length > 0) {
    history.forEach(m => renderMessage(m.role, m.content));
  }

  // 5. Public API — called by Contact Hub
  let hasOpened = false;
  window.openChatbot = function() {
    panel.classList.add('active');
    input.focus();
    if (!hasOpened && history.length === 0) {
      hasOpened = true;
      const greeting = (window.__CURRENT_LANG__ === 'en' || document.documentElement.lang === 'en')
        ? "Hello! 👋 I am PR Agency AI Growth Assistant. How can I help you accelerate your marketing strategy and scale your sales today?"
        : "أهلاً بك! 👋 أنا مساعد النمو الذكي في PR Agency. كيف يمكنني مساعدتك في تطوير خطتك التسويقية ومبيعاتك اليوم؟";
      renderMessage('assistant', greeting);
      history.push({ role: 'assistant', content: greeting });
      saveHistory(history);
    }
  };

  window.closeChatbot = function() {
    panel.classList.remove('active');
  };

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('active');
    // Re-open the Contact Hub menu if available
    if (typeof window.openContactHub === 'function') window.openContactHub();
  });

  // 6. Send Logic
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    renderMessage('user', text);
    history.push({ role: 'user', content: text });
    saveHistory(history);

    // Show typing
    typing.style.display = 'flex';
    msgsContainer.scrollTop = msgsContainer.scrollHeight;

    // Check for email or phone in user message
    const emailMatch = text.match(/[\\w.-]+@[\\w.-]+\\.\\w+/);
    const phoneMatch = text.match(/(01[0125]\\d{8}|(?:\\+|00)?201[0125]\\d{8}|\\+?\\d{8,15})/);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          visitorId: getVisitorId()
        })
      });

      const data = await res.json();
      typing.style.display = 'none';

      const reply = data.reply || (document.documentElement.lang === 'en' ? "Thank you for reaching out! A strategist will connect with you." : "شكراً لتواصلك! سيتواصل معك أحد خبرائنا.");
      renderMessage('assistant', reply);
      history.push({ role: 'assistant', content: reply });
      saveHistory(history);

      // If email or phone detected, show in-chat lead form to confirm
      if (emailMatch || phoneMatch) {
        promptLeadCapture(emailMatch ? emailMatch[0] : '', phoneMatch ? phoneMatch[0] : '');
      }

    } catch (err) {
      typing.style.display = 'none';
      const errorMsg = document.documentElement.lang === 'en'
        ? "We're experiencing heavy demand. You can also reach us directly via WhatsApp at +201144826641."
        : "واجهنا ضغطاً بسيطاً في الاتصال، يمكنك أيضاً التواصل معنا مباشرة عبر واتساب: 01144826641.";
      renderMessage('assistant', errorMsg);
    }
  }

  function promptLeadCapture(detectedEmail, detectedPhone) {
    const isEn = document.documentElement.lang === 'en';
    const formDiv = document.createElement('div');
    formDiv.className = 'ai-lead-form';
    formDiv.innerHTML = \`
      <h4>\${isEn ? 'Confirm your details for consultation:' : 'أكد بياناتك لحجز استشارة مخصصة:'}</h4>
      <div class="ai-lead-field-group">
        <label style="font-size:0.75rem;color:#A78BFA;font-weight:600;display:block;margin-bottom:2px;">\${isEn ? 'Full Name *' : 'الاسم بالكامل *'}</label>
        <input type="text" class="ai-lead-input" id="ai-lead-name" placeholder="\${isEn ? 'Your Name' : 'اسمك الكريم'}" />
      </div>
      <div class="ai-lead-field-group">
        <label style="font-size:0.75rem;color:#A78BFA;font-weight:600;display:block;margin-bottom:2px;">\${isEn ? 'Phone / WhatsApp *' : 'رقم الموبايل / واتساب *'}</label>
        <input type="tel" class="ai-lead-input" id="ai-lead-phone" value="\${detectedPhone || ''}" placeholder="\${isEn ? 'e.g. 01xxxxxxxxx' : '01xxxxxxxxx'}" dir="ltr" />
      </div>
      <div class="ai-lead-field-group">
        <label style="font-size:0.75rem;color:#A78BFA;font-weight:600;display:block;margin-bottom:2px;">\${isEn ? 'Email Address' : 'البريد الإلكتروني'}</label>
        <input type="email" class="ai-lead-input" id="ai-lead-email" value="\${detectedEmail || ''}" placeholder="\${isEn ? 'name@example.com' : 'name@example.com'}" dir="ltr" />
      </div>
      <button class="ai-lead-btn" id="ai-lead-submit-btn">\${isEn ? 'Submit & Connect' : 'تأكيد وإرسال'}</button>
    \`;

    msgsContainer.appendChild(formDiv);
    msgsContainer.scrollTop = msgsContainer.scrollHeight;

    const submitBtn = formDiv.querySelector('#ai-lead-submit-btn');
    submitBtn.addEventListener('click', async () => {
      const name = formDiv.querySelector('#ai-lead-name').value.trim();
      const phone = formDiv.querySelector('#ai-lead-phone').value.trim();
      const email = formDiv.querySelector('#ai-lead-email').value.trim();

      if (!phone && !email) {
        alert(isEn ? 'Please enter at least a phone number or email.' : 'يرجى كتابة رقم الموبايل أو الإيميل على الأقل.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = isEn ? 'Sending...' : 'جاري الإرسال...';

      try {
        await fetch('/api/chat/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            visitorId: getVisitorId(),
            name,
            phone,
            email,
            message: 'Lead captured via Chatbot conversation'
          })
        });

        formDiv.innerHTML = \`<p style="color:#10B981;font-weight:700;margin:0;">\${isEn ? '✅ Thank you! We will reach out shortly.' : '✅ تم استلام بياناتك بنجاح وسنتواصل معك قريباً!'}</p>\`;
      } catch (e) {
        submitBtn.disabled = false;
        submitBtn.textContent = isEn ? 'Retry' : 'إعادة المحاولة';
      }
    });
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

})();
`;

fs.writeFileSync(path.join(ROOT, 'js/chatbot.js'), newChatbotJs, 'utf8');
console.log('✅ js/chatbot.js — updated (removed #ai-chat-btn, exposed openChatbot/closeChatbot)');

// ─────────────────────────────────────────────────────────────────────────────
// 2. Rewrite css/chatbot.css
//    - Remove #ai-chat-btn styles (lines 5-48)
//    - Remove .wa-widget styles if any
//    - Move chat panel to bottom-right
//    - Add Contact Hub CSS at the end
// ─────────────────────────────────────────────────────────────────────────────
let chatCss = fs.readFileSync(path.join(ROOT, 'css/chatbot.css'), 'utf8');

// Remove #ai-chat-btn block (we'll keep the panel but reposition it)
// We'll rewrite the entire file cleanly
const newChatbotCss = `/* ══════════════════════════════════════════════════════════════
   PR AGENCY — AI CHATBOT PANEL STYLES
   Controlled by Contact Hub Widget (bottom-right)
══════════════════════════════════════════════════════════════ */

/* Chat Panel Window */
#ai-chat-panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 380px;
  height: 560px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 120px);
  background: rgba(15, 10, 26, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(139, 92, 246, 0.2);
  z-index: 9995;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(20px) scale(0.95);
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

#ai-chat-panel.active {
  opacity: 1;
  pointer-events: all;
  transform: translateY(0) scale(1);
}

/* Header */
.ai-chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.1));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-chat-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 16px;
}

.ai-chat-info h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
}

.ai-chat-info span {
  font-size: 0.75rem;
  color: #10B981;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-chat-info span::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
}

.ai-chat-close {
  background: rgba(255, 255, 255, 0.06);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}

.ai-chat-close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* Messages Area */
.ai-chat-messages {
  flex: 1;
  padding: 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}

.ai-msg {
  max-width: 82%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.92rem;
  line-height: 1.6;
  word-break: break-word;
}

.ai-msg-assistant {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #F1F5F9;
  border-bottom-left-radius: 4px;
}

[dir="rtl"] .ai-msg-assistant {
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 4px;
}

.ai-msg-user {
  align-self: flex-end;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  color: #FFFFFF;
  border-bottom-right-radius: 4px;
}

[dir="rtl"] .ai-msg-user {
  border-bottom-right-radius: 16px;
  border-bottom-left-radius: 4px;
}

.ai-typing-indicator {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.04);
  padding: 10px 14px;
  border-radius: 14px;
  display: none;
  align-items: center;
  gap: 4px;
}

.ai-typing-indicator span {
  width: 6px;
  height: 6px;
  background: #A855F7;
  border-radius: 50%;
  animation: typing-dots 1.4s infinite ease-in-out both;
}

.ai-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.ai-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing-dots {
  0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* In-Chat Lead Form */
.ai-lead-form {
  margin-top: 10px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-lead-form h4 {
  margin: 0 0 4px;
  font-size: 0.88rem;
  color: #E2E8F0;
  font-weight: 700;
}

.ai-lead-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #fff;
  font-size: 0.85rem;
  box-sizing: border-box;
}

.ai-lead-input:focus {
  outline: none;
  border-color: #A855F7;
}

.ai-lead-btn {
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  color: #fff;
  border: none;
  padding: 8px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.ai-lead-btn:hover {
  opacity: 0.9;
}

/* Input Area */
.ai-chat-input-row {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-chat-field {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 14px;
  border-radius: 24px;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.ai-chat-field:focus {
  border-color: #8B5CF6;
}

.ai-chat-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6, #A855F7);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.ai-chat-send-btn:hover {
  transform: scale(1.05);
}

.ai-chat-send-btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

[dir="ltr"] .ai-chat-send-btn svg {
  transform: rotate(180deg);
}

/* ══════════════════════════════════════════════════════════════
   CONTACT HUB WIDGET — Unified bottom-right floating menu
══════════════════════════════════════════════════════════════ */
#contact-hub {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9990;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

/* Main trigger button */
#contact-hub-btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  color: #fff;
  border: none;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.45);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
  position: relative;
}

#contact-hub-btn:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 12px 30px rgba(139, 92, 246, 0.6);
}

#contact-hub-btn .hub-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #A855F7;
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  pointer-events: none;
}

@keyframes pulse-ring {
  0%   { transform: scale(0.95); opacity: 0.8; }
  50%  { transform: scale(1.3);  opacity: 0;   }
  100% { transform: scale(1.3);  opacity: 0;   }
}

#contact-hub-btn svg {
  width: 26px;
  height: 26px;
  fill: currentColor;
  transition: transform 0.3s ease;
}

#contact-hub-btn.open svg {
  transform: rotate(45deg);
}

/* Options menu */
#contact-hub-menu {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(10px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

#contact-hub-menu.open {
  opacity: 1;
  pointer-events: all;
  transform: translateY(0);
}

/* Each option item */
.hub-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-decoration: none;
}

.hub-option-label {
  background: rgba(15, 10, 26, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.hub-option-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 4px 14px rgba(0,0,0,0.3);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.hub-option:hover .hub-option-icon {
  transform: scale(1.1);
}

.hub-option-icon.ai-icon   { background: linear-gradient(135deg, #8B5CF6, #EC4899); }
.hub-option-icon.wa-icon   { background: #25D366; }
.hub-option-icon.call-icon { background: linear-gradient(135deg, #3B82F6, #06B6D4); }

/* RTL: flip label and icon order */
[dir="rtl"] .hub-option { flex-direction: row-reverse; }
[dir="rtl"] #contact-hub { right: 24px; left: auto; align-items: flex-end; }
[dir="rtl"] #ai-chat-panel { right: 24px; left: auto; }

@media (max-width: 480px) {
  #ai-chat-panel {
    bottom: 0;
    right: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    border: none;
  }
  #contact-hub {
    bottom: 16px;
    right: 16px;
  }
}
`;

fs.writeFileSync(path.join(ROOT, 'css/chatbot.css'), newChatbotCss, 'utf8');
console.log('✅ css/chatbot.css — rewritten (panel to right, Contact Hub CSS added, wa-widget removed)');

// ─────────────────────────────────────────────────────────────────────────────
// 3. Build Contact Hub HTML + JS snippet to inject into all HTML files
//    The snippet goes just before </body>
// ─────────────────────────────────────────────────────────────────────────────
const contactHubHtml = `
  <!-- Contact Hub Widget -->
  <div id="contact-hub">
    <div id="contact-hub-menu">
      <!-- AI Chat -->
      <div class="hub-option" id="hub-opt-ai" role="button" tabindex="0" aria-label="Chat with AI">
        <span class="hub-option-label" data-i18n="contact_hub.ai">تحدث مع المساعد الذكي</span>
        <span class="hub-option-icon ai-icon">💬</span>
      </div>
      <!-- WhatsApp -->
      <a class="hub-option" id="hub-opt-wa" href="https://wa.me/201144826641" target="_blank" rel="noopener" aria-label="WhatsApp">
        <span class="hub-option-label" data-i18n="contact_hub.whatsapp">واتساب</span>
        <span class="hub-option-icon wa-icon">
          <svg viewBox="0 0 448 512" width="22" height="22" fill="#fff"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157z"/></svg>
        </span>
      </a>
      <!-- Call -->
      <a class="hub-option" id="hub-opt-call" href="tel:+201144826641" aria-label="Call Us">
        <span class="hub-option-label" data-i18n="contact_hub.call">اتصل بنا</span>
        <span class="hub-option-icon call-icon">📞</span>
      </a>
    </div>

    <button id="contact-hub-btn" aria-label="Contact Us" aria-expanded="false">
      <div class="hub-pulse"></div>
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
    </button>
  </div>

  <script>
  (function(){
    var hubBtn = document.getElementById('contact-hub-btn');
    var hubMenu = document.getElementById('contact-hub-menu');
    var optAi = document.getElementById('hub-opt-ai');

    function toggleMenu() {
      var isOpen = hubMenu.classList.contains('open');
      hubMenu.classList.toggle('open');
      hubBtn.classList.toggle('open');
      hubBtn.setAttribute('aria-expanded', !isOpen);
    }

    window.openContactHub = function() {
      hubMenu.classList.add('open');
      hubBtn.classList.add('open');
      hubBtn.setAttribute('aria-expanded', 'true');
    };

    hubBtn.addEventListener('click', toggleMenu);

    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (!document.getElementById('contact-hub').contains(e.target) &&
          !document.getElementById('ai-chat-panel').contains(e.target)) {
        hubMenu.classList.remove('open');
        hubBtn.classList.remove('open');
        hubBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // AI Chat option
    optAi.addEventListener('click', function() {
      hubMenu.classList.remove('open');
      hubBtn.classList.remove('open');
      hubBtn.setAttribute('aria-expanded', 'false');
      if (typeof window.openChatbot === 'function') window.openChatbot();
    });
    optAi.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') optAi.click();
    });

    // WhatsApp tracking
    var optWa = document.getElementById('hub-opt-wa');
    optWa.addEventListener('click', function() {
      hubMenu.classList.remove('open');
      hubBtn.classList.remove('open');
      if (typeof gtag === 'function') gtag('event','whatsapp_click',{event_category:'engagement'});
      if (typeof fbq === 'function') fbq('track','Contact',{content_name:'WhatsApp Click'});
    });

    // Call tracking
    var optCall = document.getElementById('hub-opt-call');
    optCall.addEventListener('click', function() {
      hubMenu.classList.remove('open');
      hubBtn.classList.remove('open');
      if (typeof gtag === 'function') gtag('event','phone_call_click',{event_category:'engagement'});
    });
  })();
  </script>`;

// ─────────────────────────────────────────────────────────────────────────────
// 4. Process all HTML files
//    - Remove <script src="js/whatsapp-widget.js..." defer></script>
//    - Remove old Contact Hub block if any (idempotent)
//    - Inject Contact Hub HTML before </body>
//    - Bump version from v=69 → v=70 (all asset references)
// ─────────────────────────────────────────────────────────────────────────────
const htmlFiles = [
  'index.html','about.html','services.html','clients.html',
  'team.html','contact.html','privacy.html','terms.html',
  'thank-you.html','404.html'
];

let htmlCount = 0;
for (const file of htmlFiles) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) { console.log(`⚠️  ${file} — not found, skipping`); continue; }

  let html = fs.readFileSync(fp, 'utf8');

  // Remove wa-widget script tag (any variant of v=NNN)
  html = html.replace(/<script[^>]*src=["'][^"']*whatsapp-widget\.js[^"']*["'][^>]*><\/script>\s*/gi, '');

  // Remove old contact-hub block if already injected (idempotent)
  html = html.replace(/\s*<!-- Contact Hub Widget -->[\s\S]*?<\/script>/m, '');

  // Version bump v=69 → v=70
  html = html.replace(/v=69/g, 'v=70');

  // Inject Contact Hub before </body>
  html = html.replace('</body>', contactHubHtml + '\n</body>');

  fs.writeFileSync(fp, html, 'utf8');
  htmlCount++;
  console.log(`✅ ${file} — wa-widget removed, contact-hub injected, v=70`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Update locale files
// ─────────────────────────────────────────────────────────────────────────────
const arPath = path.join(ROOT, 'locales/ar.json');
const enPath = path.join(ROOT, 'locales/en.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Add contact_hub keys
ar.contact_hub = ar.contact_hub || {};
ar.contact_hub.ai        = ar.contact_hub.ai        || 'تحدث مع المساعد الذكي';
ar.contact_hub.whatsapp  = ar.contact_hub.whatsapp  || 'واتساب';
ar.contact_hub.call      = ar.contact_hub.call      || 'اتصل بنا';

en.contact_hub = en.contact_hub || {};
en.contact_hub.ai        = en.contact_hub.ai        || 'Chat with AI Assistant';
en.contact_hub.whatsapp  = en.contact_hub.whatsapp  || 'WhatsApp';
en.contact_hub.call      = en.contact_hub.call      || 'Call Us';

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
console.log('✅ locales/ar.json & locales/en.json — contact_hub keys added');

// ─────────────────────────────────────────────────────────────────────────────
// 6. Regenerate functions/locales_data.js
// ─────────────────────────────────────────────────────────────────────────────
const arStr = JSON.stringify(ar);
const enStr = JSON.stringify(en);
const localesData = `export const ar = ${arStr};\nexport const en = ${enStr};\n`;
fs.writeFileSync(path.join(ROOT, 'functions/locales_data.js'), localesData, 'utf8');
console.log('✅ functions/locales_data.js — regenerated');

console.log('\n🎉 Contact Hub build complete! Processed ' + htmlCount + ' HTML files.');
console.log('Next: git add -A && git commit && git push && node deploy_pragency.cjs');
