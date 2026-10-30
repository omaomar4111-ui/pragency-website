// 3D Credit Card Engine & Payment Simulation
(function() {
  window.PRPaymentEngine = {
    init: function() {
      const card = document.getElementById('interactive-credit-card');
      if (!card) return;

      const numInput = document.getElementById('card-input-number');
      const holderInput = document.getElementById('card-input-name');
      const expInput = document.getElementById('card-input-expiry');
      const cvvInput = document.getElementById('card-input-cvv');

      const cardNumDisplay = document.getElementById('display-card-number');
      const cardHolderDisplay = document.getElementById('display-card-holder');
      const cardExpDisplay = document.getElementById('display-card-expiry');
      const cardCvvDisplay = document.getElementById('display-card-cvv');

      if (numInput && cardNumDisplay) {
        numInput.addEventListener('input', (e) => {
          let val = e.target.value.replace(/\D/g, '').substring(0, 16);
          let formatted = val.match(/.{1,4}/g)?.join(' ') || '•••• •••• •••• ••••';
          e.target.value = val.match(/.{1,4}/g)?.join(' ') || val;
          cardNumDisplay.innerText = formatted;
        });
      }

      if (holderInput && cardHolderDisplay) {
        holderInput.addEventListener('input', (e) => {
          cardHolderDisplay.innerText = e.target.value.toUpperCase() || 'VALUED CLIENT';
        });
      }

      if (expInput && cardExpDisplay) {
        expInput.addEventListener('input', (e) => {
          let val = e.target.value.replace(/\D/g, '').substring(0, 4);
          if (val.length >= 3) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
          }
          e.target.value = val;
          cardExpDisplay.innerText = val || 'MM/YY';
        });
      }

      if (cvvInput) {
        cvvInput.addEventListener('focus', () => {
          card.classList.add('flipped');
        });
        cvvInput.addEventListener('blur', () => {
          card.classList.remove('flipped');
        });
        cvvInput.addEventListener('input', (e) => {
          let val = e.target.value.replace(/\D/g, '').substring(0, 4);
          e.target.value = val;
          if (cardCvvDisplay) cardCvvDisplay.innerText = val || '•••';
        });
      }
    },

    openPayModal: function(invId, invNumber, amount, currency) {
      const modal = document.getElementById('payment-modal');
      if (!modal) return;
      document.getElementById('pay-modal-inv-num').innerText = invNumber;
      document.getElementById('pay-modal-amount').innerText = amount + ' ' + (currency || 'EGP');
      
      const ipaAmountEl = document.getElementById('instapay-amount-display');
      if (ipaAmountEl) ipaAmountEl.innerText = amount + ' ' + (currency || 'EGP');
      const ipaInvEl = document.getElementById('instapay-inv-display');
      if (ipaInvEl) ipaInvEl.innerText = invNumber;

      const appleAmountEl = document.getElementById('applepay-amount-display');
      if (appleAmountEl) appleAmountEl.innerText = amount + ' ' + (currency || 'EGP');

      this.checkApplePaySupport();

      modal.setAttribute('data-inv-id', invId);
      modal.classList.add('active');
      document.getElementById('payment-form-area').style.display = 'block';
      document.getElementById('receipt-result-area').style.display = 'none';

      // Switch to Card tab by default and load InstaPay credentials
      this.switchPayTab('card');
      this.loadInstaPayDetails(invNumber, amount);
      this.init();
    },

    switchPayTab: function(tab) {
      const cardTabBtn = document.getElementById('pay-tab-card-btn');
      const appleTabBtn = document.getElementById('pay-tab-applepay-btn');
      const instapayTabBtn = document.getElementById('pay-tab-instapay-btn');
      
      const cardArea = document.getElementById('pay-method-card-area');
      const appleArea = document.getElementById('pay-method-applepay-area');
      const instapayArea = document.getElementById('pay-method-instapay-area');

      // Reset all buttons
      [cardTabBtn, appleTabBtn, instapayTabBtn].forEach(b => {
        if (b) { b.style.background = 'rgba(255,255,255,0.06)'; b.style.color = '#a1a1aa'; }
      });
      // Hide all areas
      if (cardArea) cardArea.style.display = 'none';
      if (appleArea) appleArea.style.display = 'none';
      if (instapayArea) instapayArea.style.display = 'none';

      if (tab === 'card') {
        if (cardTabBtn) { cardTabBtn.style.background = 'var(--portal-accent, #8b5cf6)'; cardTabBtn.style.color = '#fff'; }
        if (cardArea) cardArea.style.display = 'block';
      } else if (tab === 'applepay') {
        if (appleTabBtn) { appleTabBtn.style.background = 'var(--portal-accent, #8b5cf6)'; appleTabBtn.style.color = '#fff'; }
        if (appleArea) appleArea.style.display = 'block';
        this.checkApplePaySupport();
      } else if (tab === 'instapay') {
        if (instapayTabBtn) { instapayTabBtn.style.background = 'var(--portal-accent, #8b5cf6)'; instapayTabBtn.style.color = '#fff'; }
        if (instapayArea) instapayArea.style.display = 'block';
      }
    },

    checkApplePaySupport: function() {
      const isApplePayAvailable = (window.ApplePaySession && window.ApplePaySession.canMakePayments());
      const unsupportedNote = document.getElementById('apple-pay-unsupported-note');
      const payBtn = document.getElementById('btn-apple-pay-native');
      
      if (!isApplePayAvailable) {
        if (unsupportedNote) unsupportedNote.style.display = 'block';
        if (payBtn) {
          payBtn.style.opacity = '0.7';
          payBtn.title = 'متاح عبر متصفح Safari على iPhone أو Mac';
        }
      } else {
        if (unsupportedNote) unsupportedNote.style.display = 'none';
        if (payBtn) {
          payBtn.style.opacity = '1';
        }
      }
    },

    processApplePayPayment: async function() {
      const modal = document.getElementById('payment-modal');
      const invId = modal ? modal.getAttribute('data-inv-id') : null;
      const invNum = document.getElementById('pay-modal-inv-num')?.innerText || 'INV';
      const amount = document.getElementById('pay-modal-amount')?.innerText || '0 EGP';
      const payBtn = document.getElementById('btn-apple-pay-native');

      if (!invId) {
        alert('لم يتم تحديد الفاتورة');
        return;
      }

      if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerHTML = 'جاري تفويض Apple Pay عبر Face ID... ⏳';
      }

      try {
        // 1. Initiate Apple Pay Session via Backend
        const sessionRes = await fetch('/api/portal/invoices/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: invId, method: 'apple_pay', payment_method: 'apple_pay' })
        });
        const sessionData = await sessionRes.json();

        if (!sessionData.success) {
          alert('تعذر بدء جلسة Apple Pay: ' + (sessionData.error || 'خطأ'));
          if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerHTML = 'Pay with Apple Pay';
          }
          return;
        }

        const authCode = 'APAY_' + Math.floor(100000 + Math.random() * 900000);

        // 2. Trigger webhook to record paid status
        await fetch('/api/webhooks/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'payment_intent.succeeded',
            invoice_id: invId,
            transaction_id: sessionData.session?.transaction_id || ('APAY_TXN_' + Date.now()),
            amount: sessionData.session?.amount,
            auth_code: authCode,
            payment_method: 'Apple Pay (Tokenized Biometric)'
          })
        });

        // 3. Render Thermal Receipt
        document.getElementById('payment-form-area').style.display = 'none';
        const receiptArea = document.getElementById('receipt-result-area');
        if (receiptArea) receiptArea.style.display = 'block';

        const now = new Date();
        const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        document.getElementById('receipt-inv-num').innerText = invNum;
        document.getElementById('receipt-date').innerText = dateStr + ' ' + timeStr;
        document.getElementById('receipt-amount').innerText = amount;
        const authEl = document.getElementById('receipt-auth');
        if (authEl) authEl.innerText = authCode;

        if (typeof loadClientInvoices === 'function') loadClientInvoices();

      } catch (err) {
        alert('حدث خطأ أثناء معالجة Apple Pay: ' + err.message);
      } finally {
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.innerHTML = 'Pay with Apple Pay';
        }
      }
    },

    loadInstaPayDetails: async function(invNum, amount) {
      try {
        const res = await fetch('/api/portal/settings/payment');
        const data = await res.json();
        const ipa = data.payment?.instapay_ipa || 'pragency@instapay';
        const name = data.payment?.instapay_name || 'PR Agency Egypt';

        const ipaEl = document.getElementById('instapay-ipa-display');
        if (ipaEl) ipaEl.innerText = ipa;
        const nameEl = document.getElementById('instapay-name-display');
        if (nameEl) nameEl.innerText = name;

        // Dynamic QR generation
        const qrImg = document.getElementById('instapay-qr-img');
        if (qrImg) {
          const qrData = encodeURIComponent(`instapay://pay?ipa=${ipa}&amount=${amount}&ref=${invNum}`);
          qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}&bgcolor=12-12-18&color=139-92-246`;
        }
      } catch (e) {
        console.warn('Could not load instapay details:', e);
      }
    },

    copyInstaPayIpa: function() {
      const ipa = document.getElementById('instapay-ipa-display')?.innerText || 'pragency@instapay';
      navigator.clipboard.writeText(ipa);
      alert('تم نسخ عنوان إنستاباي بنجاح: ' + ipa);
    },

    submitInstaPayTransfer: async function() {
      const modal = document.getElementById('payment-modal');
      const invId = modal ? modal.getAttribute('data-inv-id') : null;
      const txnInput = document.getElementById('instapay-txn-input');
      const txnId = txnInput ? txnInput.value.trim() : '';

      if (!invId) {
        alert('لم يتم تحديد الفاتورة');
        return;
      }
      if (!txnId) {
        alert('يرجى إدخال رقم عملية التحويل من تطبيق إنستاباي');
        return;
      }

      const btn = document.getElementById('btn-submit-instapay');
      if (btn) {
        btn.disabled = true;
        btn.innerText = 'جاري إرسال إشعار السداد... ⏳';
      }

      try {
        const res = await fetch('/api/portal/invoices/instapay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: invId, transaction_id: txnId })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ تم إرسال إشعار السداد بنجاح وإبلاغ الإدارة للمراجعة والاعتماد!');
          this.closePayModal();
          if (typeof loadClientInvoices === 'function') loadClientInvoices();
        } else {
          alert('خطأ: ' + (data.error || 'تعذر تسجيل العملية'));
        }
      } catch (err) {
        alert('حدث خطأ في الاتصال: ' + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerText = '⚡ تأكيد وإرسال التحويل';
        }
      }
    },

    closePayModal: function() {
      const modal = document.getElementById('payment-modal');
      if (modal) modal.classList.remove('active');
    },

    processMockPayment: async function() {
      const submitBtn = document.getElementById('btn-submit-payment');
      const modal = document.getElementById('payment-modal');
      const invId = modal ? modal.getAttribute('data-inv-id') : null;

      if (!invId) {
        alert('لم يتم تحديد الفاتورة بشكل صحيح');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'جاري معالجة الدفع السحابي الآمن... ⏳';
      }

      try {
        // 1. Initiate Payment Session
        const sessionRes = await fetch('/api/portal/invoices/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: invId, payment_method: 'card' })
        });
        const sessionData = await sessionRes.json();

        if (!sessionData.success) {
          alert('تعذر بدء جلسة الدفع: ' + (sessionData.error || 'خطأ غير معروف'));
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '💳 تأكيد السداد الآمن';
          }
          return;
        }

        const authCode = 'AUTH_' + Math.floor(100000 + Math.random() * 900000);

        // 2. Execute Webhook Callback to Confirm Transaction & Update Database
        const webhookRes = await fetch('/api/webhooks/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'payment_intent.succeeded',
            invoice_id: invId,
            transaction_id: sessionData.session?.transaction_id || ('TXN_' + Date.now()),
            amount: sessionData.session?.amount,
            auth_code: authCode,
            payment_method: 'Credit Card (3D Secure)'
          })
        });

        const webhookData = await webhookRes.json();

        // 3. Render Thermal Receipt
        document.getElementById('payment-form-area').style.display = 'none';
        const receiptArea = document.getElementById('receipt-result-area');
        receiptArea.style.display = 'block';

        const invNum = document.getElementById('pay-modal-inv-num').innerText;
        const amount = document.getElementById('pay-modal-amount').innerText;
        const now = new Date();
        const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        document.getElementById('receipt-inv-num').innerText = invNum;
        document.getElementById('receipt-date').innerText = dateStr + ' ' + timeStr;
        document.getElementById('receipt-amount').innerText = amount;
        document.getElementById('receipt-auth').innerText = authCode;

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '💳 تأكيد السداد الآمن';
        }

        // Refresh invoices in portal table if function available
        if (typeof loadClientInvoices === 'function') {
          loadClientInvoices();
        }

      } catch (err) {
        alert('حدث خطأ في معالجة الدفع: ' + err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '💳 تأكيد السداد الآمن';
        }
      }
    }
  };

  // 3D Tilt Effect for Cards
  window.initTilt3D = function(selector) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTilt3D('.tilt-card-3d');
  });
})();
