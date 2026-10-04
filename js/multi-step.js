(function () {
  'use strict';

  var STORAGE_KEY = 'pr_cro_form_session_v3';

  function initMultiStepForm() {
    var form = document.getElementById('registerForm');
    if (!form || form.__croInit) return;
    form.__croInit = true;

    var steps = form.querySelectorAll('.form-step');
    var progressSteps = form.querySelectorAll('.form-progress-step');
    var progressBar = form.querySelector('.form-progress-bar');

    var step1Next = document.getElementById('step1NextBtn');
    var step2Next = document.getElementById('step2NextBtn');
    var step2Prev = document.getElementById('step2PrevBtn');
    var step3Prev = document.getElementById('step3PrevBtn');

    var customIndustryWrapper = document.getElementById('custom-industry-wrapper');
    var customIndustryInput = document.getElementById('custom-industry');
    var businessSelect = document.getElementById('reg-business');

    // Make Choice Cards act as clickable radio labels
    form.querySelectorAll('.cro-choice-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        var radio = card.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          // Uncheck sibling card styles in same group
          var name = radio.name;
          form.querySelectorAll('input[name="' + name + '"]').forEach(function(r) {
            var parentCard = r.closest('.cro-choice-card');
            if (parentCard) parentCard.classList.toggle('active', r.checked);
          });
          saveDraft();
        }
      });
    });

    function toggleCustomIndustry() {
      if (!businessSelect || !customIndustryWrapper) return;
      var val = (businessSelect.value || '').toLowerCase();
      var isOther = val.includes('other') || val.includes('أخرى') || val.includes('اخرى') || val.includes('خدمات');
      if (isOther) {
        customIndustryWrapper.style.display = 'block';
        if (customIndustryInput) customIndustryInput.required = true;
      } else {
        customIndustryWrapper.style.display = 'none';
        if (customIndustryInput) {
          customIndustryInput.required = false;
          customIndustryInput.value = '';
        }
      }
    }

    if (businessSelect) {
      businessSelect.addEventListener('change', toggleCustomIndustry);
    }

    function goToStep(stepNum) {
      steps.forEach(function(s) {
        s.classList.toggle('active', s.dataset.step == stepNum);
      });
      progressSteps.forEach(function(s) {
        s.classList.toggle('active', parseInt(s.dataset.step) <= stepNum);
      });
      if (progressBar) {
        var pct = ((stepNum - 1) / 2) * 100;
        progressBar.style.width = pct + '%';
        progressBar.setAttribute('data-step', stepNum);
      }
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Step 1 Validation & Next
    if (step1Next) {
      step1Next.addEventListener('click', function(e) {
        e.preventDefault();
        var selectedService = form.querySelector('input[name="service_type"]:checked');
        if (!selectedService) {
          alert(document.documentElement.lang === 'en' ? 'Please select a service to continue.' : 'يرجى اختيار الخدمة المطلوبة للمتابعة.');
          return;
        }
        goToStep(2);
      });
    }

    // Step 2 Validation & Next
    if (step2Next) {
      step2Next.addEventListener('click', function(e) {
        e.preventDefault();
        var selectedBudget = form.querySelector('input[name="budget_tier"]:checked');
        if (!selectedBudget) {
          alert(document.documentElement.lang === 'en' ? 'Please choose your expected budget range.' : 'يرجى تحديد الميزانية المتوقعة للمتابعة.');
          return;
        }
        goToStep(3);
      });
    }

    if (step2Prev) {
      step2Prev.addEventListener('click', function(e) {
        e.preventDefault();
        goToStep(1);
      });
    }

    if (step3Prev) {
      step3Prev.addEventListener('click', function(e) {
        e.preventDefault();
        goToStep(2);
      });
    }

    // Session Storage persistence
    function saveDraft() {
      try {
        var formData = {
          service: (form.querySelector('input[name="service_type"]:checked') || {}).value || '',
          budget: (form.querySelector('input[name="budget_tier"]:checked') || {}).value || '',
          name: (document.getElementById('reg-name') || {}).value || '',
          phone: (document.getElementById('reg-phone') || {}).value || '',
          email: (document.getElementById('reg-email') || {}).value || '',
          business: (document.getElementById('reg-business') || {}).value || '',
          custom_industry: (document.getElementById('custom-industry') || {}).value || ''
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (err) {}
    }

    function restoreDraft() {
      try {
        var raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        if (data.service) {
          var radio = form.querySelector('input[name="service_type"][value="' + data.service + '"]');
          if (radio) {
            radio.checked = true;
            var c = radio.closest('.cro-choice-card');
            if (c) c.classList.add('active');
          }
        }
        if (data.budget) {
          var bRadio = form.querySelector('input[name="budget_tier"][value="' + data.budget + '"]');
          if (bRadio) {
            bRadio.checked = true;
            var bc = bRadio.closest('.cro-choice-card');
            if (bc) bc.classList.add('active');
          }
        }
        if (data.name && document.getElementById('reg-name')) document.getElementById('reg-name').value = data.name;
        if (data.phone && document.getElementById('reg-phone')) document.getElementById('reg-phone').value = data.phone;
        if (data.email && document.getElementById('reg-email')) document.getElementById('reg-email').value = data.email;
        if (data.business && document.getElementById('reg-business')) {
          document.getElementById('reg-business').value = data.business;
          toggleCustomIndustry();
        }
        if (data.custom_industry && document.getElementById('custom-industry')) {
          document.getElementById('custom-industry').value = data.custom_industry;
        }
      } catch (e) {}
    }

    form.addEventListener('input', saveDraft);
    form.addEventListener('change', saveDraft);

    form.addEventListener('submit', function() {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
    });

    restoreDraft();
    toggleCustomIndustry();
  }

  // ── A/B Testing Integration ──
  function initABTesting() {
    var ctaBtn = document.getElementById('hero-cta-btn');
    if (!ctaBtn) return;

    var match = document.cookie.match(/pr_vid=([^;]+)/);
    var visitorId = match ? match[1] : 'anon_' + Date.now();
    var isEn = document.documentElement.lang === 'en';

    // Retrieve or assign variant
    fetch('/api/ab-test?visitorId=' + encodeURIComponent(visitorId) + '&page=' + encodeURIComponent(window.location.pathname))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var variant = data.variant || 'A';
        ctaBtn.setAttribute('data-ab-variant', variant);
        var labelSpan = ctaBtn.querySelector('.cta-label');
        if (labelSpan) {
          if (variant === 'B') {
            labelSpan.textContent = isEn ? 'Get Free Consultation' : 'احصل على استشارة مجانية';
          } else {
            labelSpan.textContent = isEn ? 'Request a Quote' : 'اطلب عرض سعر';
          }
        }
      })
      .catch(function(err) {});

    // Track click on hero CTA
    ctaBtn.addEventListener('click', function() {
      var variant = ctaBtn.getAttribute('data-ab-variant') || 'A';
      fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: visitorId,
          variant: variant,
          page: window.location.pathname
        })
      }).catch(function() {});
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initMultiStepForm();
      initABTesting();
    });
  } else {
    initMultiStepForm();
    initABTesting();
  }
})();
