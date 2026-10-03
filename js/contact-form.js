(function () {
  'use strict';

  // Extract and persist UTM parameters across navigation
  function getUtmParams() {
    var utms = {};
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'lead_source'];
    try {
      var searchParams = new URLSearchParams(window.location.search);
      keys.forEach(function (k) {
        var v = searchParams.get(k);
        if (v) {
          utms[k] = v;
          try { sessionStorage.setItem('pr_' + k, v); } catch (e) {}
        } else {
          try {
            var stored = sessionStorage.getItem('pr_' + k);
            if (stored) utms[k] = stored;
          } catch (e) {}
        }
      });
    } catch (e) {}
    return utms;
  }

  function bindForm(form) {
    if (!form || form.__bound) return;
    form.__bound = true;

    var submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('#cf-submit') || form.querySelector('#registerSubmit');
    var originalBtnText = submitBtn ? submitBtn.innerHTML : '';

    var statusEl = form.querySelector('.form-status') || form.querySelector('.register-status') || document.getElementById('cf-status') || document.getElementById('registerStatus');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'register-status';
      statusEl.setAttribute('role', 'status');
      statusEl.setAttribute('aria-live', 'polite');
      form.appendChild(statusEl);
    }

    function setStatus(type, message) {
      statusEl.textContent = message;
      statusEl.className = (statusEl.id === 'cf-status' ? 'form-status ' : 'register-status ') + type;
      statusEl.style.display = 'block';
    }

    function setLoading(isLoading) {
      if (!submitBtn) return;
      submitBtn.disabled = isLoading;
      submitBtn.style.opacity = isLoading ? '0.6' : '1';
      if (isLoading) {
        submitBtn.innerHTML = '<span>جاري الإرسال...</span>';
      } else {
        submitBtn.innerHTML = originalBtnText;
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var formData = new FormData(form);
      var utms = getUtmParams();

      var rawBusiness = (formData.get('business') || '').toString().trim();
      var customIndustry = (formData.get('custom_industry') || '').toString().trim();
      var isOther = rawBusiness.includes('other') || rawBusiness.includes('أخرى') || rawBusiness.includes('اخرى') || rawBusiness.includes('خدمات');
      var finalBusiness = (isOther && customIndustry) ? customIndustry : rawBusiness;

      var payload = {
        name:         (formData.get('name')     || '').toString().trim(),
        phone:        (formData.get('phone')    || '').toString().trim(),
        business:     finalBusiness,
        budget:       (formData.get('budget')   || '').toString().trim(),
        message:      (formData.get('message')  || '').toString().trim(),
        utm_source:   utms.utm_source   || '',
        utm_medium:   utms.utm_medium   || '',
        utm_campaign: utms.utm_campaign || '',
        utm_content:  utms.utm_content  || '',
        lead_source:  utms.lead_source  || 'website'
      };

      if (!payload.name || payload.name.length < 2) {
        setStatus('error', '⚠️ من فضلك اكتب اسمك (حرفين على الأقل)');
        return;
      }
      if (!payload.phone || payload.phone.length < 8) {
        setStatus('error', '⚠️ من فضلك اكتب رقم موبايل صحيح');
        return;
      }

      setLoading(true);
      setStatus('loading', '⏳ جاري الإرسال...');

      try {
        var response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        var result = await response.json();

        if (response.ok && result.success) {
          setStatus('success', '✅ تم استلام رسالتك بنجاح! جاري تحويلك...');

          // Fire analytics conversion events
          if (typeof gtag === 'function') {
            gtag('event', 'generate_lead', {
              'event_category': 'form',
              'event_label': 'Contact Form',
              'value': 1
            });
          }
          if (typeof fbq === 'function') {
            fbq('track', 'Lead', {
              content_name: 'Contact Form Submit',
              value: 1.00,
              currency: 'EGP'
            });
          }

          form.reset();

          // Redirect to Thank You page
          setTimeout(function () {
            window.location.href = '/thank-you.html';
          }, 350);

        } else {
          var errorMsg = result.errors
            ? result.errors.join(' | ')
            : (result.error || 'حدث خطأ غير متوقع');
          setStatus('error', '❌ ' + errorMsg);
        }
      } catch (err) {
        console.error('Submit error:', err);
        setStatus('error', '❌ فشل الاتصال بالخادم، حاول مرة أخرى');
      } finally {
        setLoading(false);
      }
    });
  }

  function initContactForms() {
    var forms = [
      document.getElementById('registerForm'),
      document.getElementById('contact-form')
    ];
    var extraForms = document.querySelectorAll('form[data-contact-form]');
    extraForms.forEach(function (f) { forms.push(f); });

    forms.forEach(function (form) {
      if (form) {
        bindForm(form);
        // Bind custom industry toggle for contact.html if present
        var cfBusiness = form.querySelector('#cf-business');
        var cfWrapper = form.querySelector('#cf-custom-industry-wrapper');
        var cfInput = form.querySelector('#cf-custom-industry');
        if (cfBusiness && cfWrapper) {
          cfBusiness.addEventListener('change', function () {
            var v = (this.value || '').toLowerCase();
            var isOther = v.includes('other') || v.includes('أخرى') || v.includes('اخرى') || v.includes('خدمات');
            if (isOther) {
              cfWrapper.style.display = 'block';
              if (cfInput) cfInput.required = true;
            } else {
              cfWrapper.style.display = 'none';
              if (cfInput) {
                cfInput.required = false;
                cfInput.value = '';
              }
            }
          });
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForms);
  } else {
    initContactForms();
  }
})();
