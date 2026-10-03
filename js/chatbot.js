(function() {
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
  const widgetHtml = `
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
  `;

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
    msgDiv.className = `ai-msg ai-msg-${role}`;
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
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/(01[0125]\d{8}|(?:\+|00)?201[0125]\d{8}|\+?\d{8,15})/);

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
    formDiv.innerHTML = `
      <h4>${isEn ? 'Confirm your details for consultation:' : 'أكد بياناتك لحجز استشارة مخصصة:'}</h4>
      <div class="ai-lead-field-group">
        <label style="font-size:0.75rem;color:#A78BFA;font-weight:600;display:block;margin-bottom:2px;">${isEn ? 'Full Name *' : 'الاسم بالكامل *'}</label>
        <input type="text" class="ai-lead-input" id="ai-lead-name" placeholder="${isEn ? 'Your Name' : 'اسمك الكريم'}" />
      </div>
      <div class="ai-lead-field-group">
        <label style="font-size:0.75rem;color:#A78BFA;font-weight:600;display:block;margin-bottom:2px;">${isEn ? 'Phone / WhatsApp *' : 'رقم الموبايل / واتساب *'}</label>
        <input type="tel" class="ai-lead-input" id="ai-lead-phone" value="${detectedPhone || ''}" placeholder="${isEn ? 'e.g. 01xxxxxxxxx' : '01xxxxxxxxx'}" dir="ltr" />
      </div>
      <div class="ai-lead-field-group">
        <label style="font-size:0.75rem;color:#A78BFA;font-weight:600;display:block;margin-bottom:2px;">${isEn ? 'Email Address' : 'البريد الإلكتروني'}</label>
        <input type="email" class="ai-lead-input" id="ai-lead-email" value="${detectedEmail || ''}" placeholder="${isEn ? 'name@example.com' : 'name@example.com'}" dir="ltr" />
      </div>
      <button class="ai-lead-btn" id="ai-lead-submit-btn">${isEn ? 'Submit & Connect' : 'تأكيد وإرسال'}</button>
    `;

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

        formDiv.innerHTML = `<p style="color:#10B981;font-weight:700;margin:0;">${isEn ? '✅ Thank you! We will reach out shortly.' : '✅ تم استلام بياناتك بنجاح وسنتواصل معك قريباً!'}</p>`;
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
