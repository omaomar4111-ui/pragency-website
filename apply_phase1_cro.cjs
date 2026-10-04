/**
 * apply_phase1_cro.cjs
 * Implements Phase 1 (CRO) completely:
 * 1. Multi-Step Form (3 Steps: Service, Budget, Contact) with Progress Bar & SessionStorage
 * 2. Social Proof Section with Client Logos & 3 Testimonials
 * 3. Trust Badges in Hero section
 * 4. A/B Testing client-side integration for Hero CTA
 * 5. Sync locales (ar.json, en.json, locales_data.js)
 * 6. Bump version to v=74
 */

const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

// ── 1. Update locales with new keys for CRO ─────────────────────────────────
const arPath = path.join(ROOT, 'locales/ar.json');
const enPath = path.join(ROOT, 'locales/en.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Trust badges
ar['trust.badge1'] = "ضمان الجودة";
ar['trust.badge2'] = "تسليم في الوقت";
ar['trust.badge3'] = "+5 سنوات خبرة";
ar['trust.badge4'] = "دعم 24/7";

en['trust.badge1'] = "Quality Guarantee";
en['trust.badge2'] = "On-Time Delivery";
en['trust.badge3'] = "+5 Years Experience";
en['trust.badge4'] = "24/7 Dedicated Support";

// A/B test CTA
ar['hero.cta_variant_a'] = "اطلب عرض سعر";
ar['hero.cta_variant_b'] = "احصل على استشارة مجانية";
en['hero.cta_variant_a'] = "Request a Quote";
en['hero.cta_variant_b'] = "Get Free Consultation";

// Social Proof
ar['social_proof.title'] = "أكثر من 19 علامة تجارية تثق فينا";
ar['social_proof.subtitle'] = "نساعد شركاءنا على تحقيق نمو استثنائي ومضاعفة المبيعات بأعلى معايير الإبداع الرقمي";
ar['social_proof.t1_quote'] = "ضاعفنا عدد الحجوزات والمبيعات من خلال إعلاناتهم الاحترافية وحملات السوشيال ميديا.";
ar['social_proof.t1_author'] = "د. أحمد منصور";
ar['social_proof.t1_role'] = "مدير مراكز NH Clinics الطبية";
ar['social_proof.t2_quote'] = "فريق تصوير وميديا باينج على أعلى مستوى من الإتقان والالتزام التام بالنتائج والمواعيد.";
ar['social_proof.t2_author'] = "م. كريم الشريف";
ar['social_proof.t2_role'] = "شريك مؤسس — قطاع التطوير العقاري";
ar['social_proof.t3_quote'] = "من أفضل الوكالات التي تعاونا معها، استراتيجية المحتوى والريلز حققت تفاعلاً غير مسبوق.";
ar['social_proof.t3_author'] = "كابتن عمر زكي";
ar['social_proof.t3_role'] = "المدير التنفيذي — Island Gym";

en['social_proof.title'] = "Trusted by 19+ Leading Brands";
en['social_proof.subtitle'] = "Empowering our partners to achieve record-breaking growth and market authority";
en['social_proof.t1_quote'] = "We multiplied our patient bookings and sales through their precision media buying and social campaigns.";
en['social_proof.t1_author'] = "Dr. Ahmed Mansour";
en['social_proof.t1_role'] = "Director — NH Clinics";
en['social_proof.t2_quote'] = "High-caliber production and ad buying team with remarkable attention to deliverables and ROI.";
en['social_proof.t2_author'] = "Eng. Karim El-Sherif";
en['social_proof.t2_role'] = "Co-founder — Property Development";
en['social_proof.t3_quote'] = "One of the finest agencies we partnered with; their creative Reels strategy drove unprecedented engagement.";
en['social_proof.t3_author'] = "Omar Zaki";
en['social_proof.t3_role'] = "Managing Director — Island Gym";

// Form 3 Steps
ar['cro_form.step1_title'] = "الخدمة المطلوبة";
ar['cro_form.step2_title'] = "الميزانية المتوقعة";
ar['cro_form.step3_title'] = "بيانات التواصل";
ar['cro_form.service_social'] = "إدارة السوشيال ميديا";
ar['cro_form.service_ads'] = "الإعلانات الممولة (Media Buying)";
ar['cro_form.service_video'] = "الإنتاج المرئي والتصوير";
ar['cro_form.service_branding'] = "الهوية البصرية والبراندنج";
ar['cro_form.service_strategy'] = "استراتيجية التسويق والنمو";
ar['cro_form.service_other'] = "خدمات أخرى / مخصصة";
ar['cro_form.budget_under_1k'] = "أقل من $1,000 (أقل من 50,000 ج.م)";
ar['cro_form.budget_1k_3k'] = "$1,000 - $3,000 (50k - 150k ج.م)";
ar['cro_form.budget_3k_10k'] = "$3,000 - $10,000 (150k - 500k ج.م)";
ar['cro_form.budget_above_10k'] = "أكثر من $10,000 (أكثر من 500,000 ج.م)";
ar['cro_form.email_label'] = "البريد الإلكتروني (اختياري)";
ar['cro_form.email_ph'] = "name@company.com";
ar['cro_form.submit_btn'] = "إرسال وتأكيد الطلب 🚀";

en['cro_form.step1_title'] = "Select Service";
en['cro_form.step2_title'] = "Estimated Budget";
en['cro_form.step3_title'] = "Contact Info";
en['cro_form.service_social'] = "Social Media Management";
en['cro_form.service_ads'] = "Media Buying (Paid Ads)";
en['cro_form.service_video'] = "Video & Commercial Production";
en['cro_form.service_branding'] = "Brand Identity & Design";
en['cro_form.service_strategy'] = "Marketing Growth Strategy";
en['cro_form.service_other'] = "Other / Custom Services";
en['cro_form.budget_under_1k'] = "Under $1,000 (< 50,000 EGP)";
en['cro_form.budget_1k_3k'] = "$1,000 - $3,000 (50k - 150k EGP)";
en['cro_form.budget_3k_10k'] = "$3,000 - $10,000 (150k - 500k EGP)";
en['cro_form.budget_above_10k'] = "Above $10,000 (> 500,000 EGP)";
en['cro_form.email_label'] = "Email Address (Optional)";
en['cro_form.email_ph'] = "name@company.com";
en['cro_form.submit_btn'] = "Submit & Confirm Request 🚀";

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

// Regenerate functions/locales_data.js
const localesData = `export const ar = ${JSON.stringify(ar)};\nexport const en = ${JSON.stringify(en)};\n`;
fs.writeFileSync(path.join(ROOT, 'functions/locales_data.js'), localesData, 'utf8');
console.log('✅ Locales synced and functions/locales_data.js regenerated');

// ── 2. Update CSS for CRO (Trust badges, Multi-step, Social Proof) ───────────
const croCss = `
/* ══════════════════════════════════════════════════════════════
   PHASE 1: CRO (Conversion Rate Optimization) STYLES
══════════════════════════════════════════════════════════════ */

/* Trust Badges in Hero */
.hero-trust-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
.trust-badge-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #E2E8F0;
  transition: border-color 0.2s, transform 0.2s;
}
.trust-badge-item:hover {
  border-color: #8B5CF6;
  transform: translateY(-1px);
}
.trust-badge-item svg {
  color: #10B981;
  flex-shrink: 0;
}

/* Multi-Step 3-Step Styles */
.cro-step-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
@media (max-width: 580px) {
  .cro-step-grid {
    grid-template-columns: 1fr;
  }
}
.cro-choice-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.cro-choice-card:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.4);
}
.cro-choice-card.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: #8B5CF6;
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.25);
}
.cro-choice-card input[type="radio"] {
  accent-color: #8B5CF6;
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.cro-choice-card span {
  font-size: 0.92rem;
  font-weight: 600;
  color: #F8FAFC;
}

/* Social Proof Section */
.section-social-proof {
  padding: 90px 24px 60px;
  background: linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.04) 50%, transparent 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 40px;
}
.social-proof-container {
  max-width: 1200px;
  margin: 0 auto;
}
.social-proof-header {
  text-align: center;
  margin-bottom: 48px;
}
.social-proof-title {
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight: 900;
  color: #FFFFFF;
  margin-bottom: 12px;
}
.social-proof-sub {
  color: #94A3B8;
  font-size: 1rem;
  max-width: 650px;
  margin: 0 auto;
}

/* Client Logos Marquee / Row */
.social-proof-logos {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 32px 48px;
  margin-bottom: 60px;
  padding: 24px;
  background: rgba(15, 10, 26, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}
.social-proof-logo-item {
  height: 52px;
  max-width: 140px;
  object-fit: contain;
  filter: grayscale(100%) brightness(1.2);
  opacity: 0.7;
  transition: all 0.3s ease;
}
.social-proof-logo-item:hover {
  filter: grayscale(0%) brightness(1);
  opacity: 1;
  transform: scale(1.08);
}

/* Testimonials Grid */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
@media (max-width: 900px) {
  .testimonials-grid {
    grid-template-columns: 1fr;
  }
}
.testimonial-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  transition: transform 0.3s ease, border-color 0.3s ease;
}
.testimonial-card:hover {
  transform: translateY(-4px);
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}
.testimonial-stars {
  color: #F59E0B;
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}
.testimonial-quote {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #CBD5E1;
  margin-bottom: 24px;
  font-style: italic;
}
.testimonial-author-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 16px;
}
.testimonial-avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
}
.testimonial-author-name {
  font-weight: 800;
  color: #FFFFFF;
  font-size: 0.95rem;
}
.testimonial-author-role {
  color: #94A3B8;
  font-size: 0.8rem;
}
`;

fs.appendFileSync(path.join(ROOT, 'css/chatbot.css'), '\n' + croCss, 'utf8');
console.log('✅ css/chatbot.css — CRO styles appended');

// ── 3. Rewrite js/multi-step.js to fully support 3 Steps & A/B Testing ───────
const newMultiStepJs = `(function () {
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
`;

fs.writeFileSync(path.join(ROOT, 'js/multi-step.js'), newMultiStepJs, 'utf8');
console.log('✅ js/multi-step.js — rewritten with 3-step engine & A/B testing tracker');

// ── 4. Patch index.html: Hero CTA, Trust Badges, Multi-Step Form & Social Proof ──
let indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Replace Hero CTA with ID & A/B testing structure + Trust Badges
const oldHeroCtaRegex = /<a href="#register" class="hero-vr-cta"[^>]*>[\s\S]*?<\/a>/;
const newHeroCtaAndTrustBadges = `
      <a href="#register" id="hero-cta-btn" class="hero-vr-cta" onclick="document.getElementById('register').scrollIntoView({behavior:'smooth'}); return false;">
        <span class="cta-label" data-i18n="hero.cta">اطلب عرض سعر</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>

      <!-- Trust Badges (Task 1.3) -->
      <div class="hero-trust-badges">
        <div class="trust-badge-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span data-i18n="trust.badge1">ضمان الجودة</span>
        </div>
        <div class="trust-badge-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span data-i18n="trust.badge2">تسليم في الوقت</span>
        </div>
        <div class="trust-badge-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          <span data-i18n="trust.badge3">+5 سنوات خبرة</span>
        </div>
        <div class="trust-badge-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span data-i18n="trust.badge4">دعم 24/7</span>
        </div>
      </div>
`;
indexHtml = indexHtml.replace(oldHeroCtaRegex, newHeroCtaAndTrustBadges);

// Replace Form inside register with 3-Step Multi-Step Form
const oldFormRegex = /<form id="registerForm"[\s\S]*?<\/form>/;
const newFormHtml = `
        <form id="registerForm" class="register-form multi-step-form" novalidate>
          
          <!-- Progress Bar (3 Steps) -->
          <div class="form-progress">
            <div class="form-progress-bar" style="width: 0%;" data-step="1"></div>
            <div class="form-progress-step active" data-step="1">
              <span class="step-num">1</span>
              <span class="step-label" data-i18n="cro_form.step1_title">الخدمة المطلوبة</span>
            </div>
            <div class="form-progress-step" data-step="2">
              <span class="step-num">2</span>
              <span class="step-label" data-i18n="cro_form.step2_title">الميزانية المتوقعة</span>
            </div>
            <div class="form-progress-step" data-step="3">
              <span class="step-num">3</span>
              <span class="step-label" data-i18n="cro_form.step3_title">بيانات التواصل</span>
            </div>
          </div>

          <!-- STEP 1: Service Type -->
          <div class="form-step active" data-step="1">
            <div class="cro-step-grid">
              <label class="cro-choice-card">
                <input type="radio" name="service_type" value="Social Media" required />
                <span data-i18n="cro_form.service_social">إدارة السوشيال ميديا</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="service_type" value="Media Buying" />
                <span data-i18n="cro_form.service_ads">الإعلانات الممولة (Media Buying)</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="service_type" value="Video Production" />
                <span data-i18n="cro_form.service_video">الإنتاج المرئي والتصوير</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="service_type" value="Branding" />
                <span data-i18n="cro_form.service_branding">الهوية البصرية والبراندنج</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="service_type" value="Strategy" />
                <span data-i18n="cro_form.service_strategy">استراتيجية التسويق والنمو</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="service_type" value="Other" />
                <span data-i18n="cro_form.service_other">خدمات أخرى / مخصصة</span>
              </label>
            </div>
            <button type="button" class="register-submit form-next-btn" id="step1NextBtn">
              <span data-i18n="contact.next">التالي</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          </div>

          <!-- STEP 2: Budget Range -->
          <div class="form-step" data-step="2">
            <div class="cro-step-grid">
              <label class="cro-choice-card">
                <input type="radio" name="budget_tier" value="< $1K" required />
                <span data-i18n="cro_form.budget_under_1k">أقل من $1,000</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="budget_tier" value="$1K - $3K" />
                <span data-i18n="cro_form.budget_1k_3k">$1,000 - $3,000</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="budget_tier" value="$3K - $10K" />
                <span data-i18n="cro_form.budget_3k_10k">$3,000 - $10,000</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="budget_tier" value="> $10K" />
                <span data-i18n="cro_form.budget_above_10k">أكثر من $10,000</span>
              </label>
            </div>
            <div class="form-actions" style="display:flex;gap:12px;">
              <button type="button" class="register-submit form-prev-btn" id="step2PrevBtn" style="background:transparent;border:1px solid rgba(168,85,247,0.4);color:#A78BFA">
                السابق
              </button>
              <button type="button" class="register-submit form-next-btn" id="step2NextBtn">
                <span data-i18n="contact.next">التالي</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
            </div>
          </div>

          <!-- STEP 3: Contact Info & Submission -->
          <div class="form-step" data-step="3">
            <div class="register-field">
              <label for="reg-name" data-i18n="form.name">الاسم *</label>
              <input type="text" id="reg-name" name="name" required data-i18n="form.name.ph" placeholder="اسمك الكامل" autocomplete="name"/>
            </div>
            <div class="register-field">
              <label for="reg-phone" data-i18n="form.phone">رقم الموبايل *</label>
              <input type="tel" id="reg-phone" name="phone" required data-i18n="form.phone.ph" placeholder="01xxxxxxxxx" dir="ltr" autocomplete="tel"/>
            </div>
            <div class="register-field">
              <label for="reg-email" data-i18n="cro_form.email_label">البريد الإلكتروني (اختياري)</label>
              <input type="email" id="reg-email" name="email" placeholder="name@company.com" dir="ltr" autocomplete="email"/>
            </div>
            <div class="register-field">
              <label for="reg-business" data-i18n="form.business">نوع النشاط *</label>
              <select id="reg-business" name="business" required>
                <option value="" data-i18n="contact.business.ph">اختر نوع نشاطك</option>
                <option value="عيادة" data-i18n="contact.business.clinic">عيادة / مركز طبي</option>
                <option value="جيم" data-i18n="contact.business.gym">جيم / نادي رياضي</option>
                <option value="عقارات" data-i18n="contact.business.realestate">شركة عقارية</option>
                <option value="متجر" data-i18n="contact.business.ecommerce">متجر إلكتروني</option>
                <option value="مطعم" data-i18n="contact.business.restaurant">مطعم / كافيه</option>
                <option value="خدمات أخرى" data-i18n="contact.business.other">خدمات أخرى</option>
              </select>
            </div>
            <div id="custom-industry-wrapper" class="register-field" style="display: none; margin-top: 12px;">
              <label for="custom-industry" data-i18n="contact.custom_industry_label">حدد مجالك *</label>
              <input 
                type="text" 
                id="custom-industry" 
                name="custom_industry" 
                placeholder="اكتب اسم مجالك" 
                data-i18n-placeholder="contact.custom_industry_placeholder"
                maxlength="100"
              />
            </div>
            <div class="form-actions" style="display:flex;gap:12px;">
              <button type="button" class="register-submit form-prev-btn" id="step3PrevBtn" style="background:transparent;border:1px solid rgba(168,85,247,0.4);color:#A78BFA">
                السابق
              </button>
              <button type="submit" class="register-submit" id="registerSubmit">
                <span data-i18n="cro_form.submit_btn">إرسال وتأكيد الطلب 🚀</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
            </div>
          </div>

        </form>
`;
indexHtml = indexHtml.replace(oldFormRegex, newFormHtml);

// Insert Social Proof Section above Footer
const socialProofHtml = `
<!-- ═══════════════════════════════════════════════════════
     SOCIAL PROOF & TESTIMONIALS (Task 1.2)
═══════════════════════════════════════════════════════ -->
<section id="social-proof" class="section-social-proof">
  <div class="social-proof-container">
    
    <div class="social-proof-header">
      <h2 class="social-proof-title" data-i18n="social_proof.title">أكثر من 19 علامة تجارية تثق فينا</h2>
      <p class="social-proof-sub" data-i18n="social_proof.subtitle">نساعد شركاءنا على تحقيق نمو استثنائي ومضاعفة المبيعات بأعلى معايير الإبداع الرقمي</p>
    </div>

    <!-- 8 Client Logos -->
    <div class="social-proof-logos">
      <img src="assets/logos/clients/client-05-nh-clinics.webp" alt="NH Clinics" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-07-mountain-view.webp" alt="Mountain View Partner" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-14-island-gym.webp" alt="Island Gym" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-02-home-ix.webp" alt="Home IX" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-04-dar.webp" alt="Dar Real Estate" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-15-iskin.webp" alt="ISkin Clinics" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-18-ovo.webp" alt="OVO Stores" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-09-memaar.webp" alt="Memaar Properties" class="social-proof-logo-item" loading="lazy" />
    </div>

    <!-- 3 Client Testimonials -->
    <div class="testimonials-grid">
      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-quote" data-i18n="social_proof.t1_quote">"ضاعفنا عدد الحجوزات والمبيعات من خلال إعلاناتهم الاحترافية وحملات السوشيال ميديا."</p>
        <div class="testimonial-author-wrap">
          <div class="testimonial-avatar-placeholder">NH</div>
          <div>
            <div class="testimonial-author-name" data-i18n="social_proof.t1_author">د. أحمد منصور</div>
            <div class="testimonial-author-role" data-i18n="social_proof.t1_role">مدير مراكز NH Clinics الطبية</div>
          </div>
        </div>
      </div>

      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-quote" data-i18n="social_proof.t2_quote">"فريق تصوير وميديا باينج على أعلى مستوى من الإتقان والالتزام التام بالنتائج والمواعيد."</p>
        <div class="testimonial-author-wrap">
          <div class="testimonial-avatar-placeholder">MV</div>
          <div>
            <div class="testimonial-author-name" data-i18n="social_proof.t2_author">م. كريم الشريف</div>
            <div class="testimonial-author-role" data-i18n="social_proof.t2_role">شريك مؤسس — قطاع التطوير العقاري</div>
          </div>
        </div>
      </div>

      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-quote" data-i18n="social_proof.t3_quote">"من أفضل الوكالات التي تعاونا معها، استراتيجية المحتوى والريلز حققت تفاعلاً غير مسبوق."</p>
        <div class="testimonial-author-wrap">
          <div class="testimonial-avatar-placeholder">IG</div>
          <div>
            <div class="testimonial-author-name" data-i18n="social_proof.t3_author">كابتن عمر زكي</div>
            <div class="testimonial-author-role" data-i18n="social_proof.t3_role">المدير التنفيذي — Island Gym</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>
`;

indexHtml = indexHtml.replace('<footer id="site-footer"', socialProofHtml + '\n<footer id="site-footer"');

// Ensure multi-step script is loaded
if (!indexHtml.includes('js/multi-step.js')) {
  indexHtml = indexHtml.replace('</body>', '<script src="js/multi-step.js?v=74" defer></script>\n</body>');
}

fs.writeFileSync(path.join(ROOT, 'index.html'), indexHtml, 'utf8');
console.log('✅ index.html — patched with Hero A/B CTA, Trust Badges, 3-Step Form, Social Proof section');

// ── 5. Bump versions from v=73 to v=74 in all html files ─────────────────────
const htmlFiles = [
  'index.html','about.html','services.html','clients.html',
  'team.html','contact.html','privacy.html','terms.html',
  'thank-you.html','404.html'
];

let bumped = 0;
for (const f of htmlFiles) {
  const fp = path.join(ROOT, f);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  if (content.includes('v=73')) {
    content = content.replace(/v=73/g, 'v=74');
    fs.writeFileSync(fp, content, 'utf8');
    bumped++;
  }
}
console.log(`✅ Version bumped to v=74 in ${bumped} files`);
