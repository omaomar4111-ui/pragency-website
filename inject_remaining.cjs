const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');
const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

// 1. Mobile menu header
html = html.replace(
  '<span style="font-weight:900;color:#fff">القائمة</span>',
  '<span style="font-weight:900;color:#fff" data-i18n="nav.menu">القائمة</span>'
);

// 2. Hero CTA check (line 245 in audit)
html = html.replace(
  /<a href="#register" class="hero-vr-cta"[^>]*>([\s\S]*?)اطلب عرض سعر([\s\S]*?)<\/a>/,
  '<a href="#register" class="hero-vr-cta" onclick="document.getElementById(\'register\').scrollIntoView({behavior:\'smooth\'}); return false;">\n        <span data-i18n="hero.cta">اطلب عرض سعر</span>\n        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">\n          <path d="M5 12h14M12 5l7 7-7 7"/>\n        </svg>\n      </a>'
);

// 3. Register / Contact form elements
html = html.replace(
  'ابعتلنا هدفك وميزانيتك الأولية، وهنرجعلك بخطة واضحة وجاهزة للتنفيذ.',
  '<span data-i18n="contact.desc">ابعتلنا هدفك وميزانيتك الأولية، وهنرجعلك بخطة واضحة وجاهزة للتنفيذ.</span>'
);
html = html.replace(
  '<h3 class="register-reach-title">تقدر توصلنا من</h3>',
  '<h3 class="register-reach-title" data-i18n="contact.reach">تقدر توصلنا من</h3>'
);
html = html.replace(
  '<span class="step-label">معلوماتك</span>',
  '<span class="step-label" data-i18n="contact.step1">معلوماتك</span>'
);
html = html.replace(
  '<span class="step-label">التفاصيل</span>',
  '<span class="step-label" data-i18n="contact.step2">التفاصيل</span>'
);
html = html.replace(
  '<option value="">اختر نوع نشاطك</option>',
  '<option value="" data-i18n="contact.business.ph">اختر نوع نشاطك</option>'
);
html = html.replace(
  '<option value="عيادة">عيادة / مركز طبي</option>',
  '<option value="عيادة" data-i18n="contact.business.clinic">عيادة / مركز طبي</option>'
);
html = html.replace(
  '<option value="جيم">جيم / نادي رياضي</option>',
  '<option value="جيم" data-i18n="contact.business.gym">جيم / نادي رياضي</option>'
);
html = html.replace(
  '<option value="عقارات">شركة عقارية</option>',
  '<option value="عقارات" data-i18n="contact.business.realestate">شركة عقارية</option>'
);
html = html.replace(
  '<option value="متجر">متجر إلكتروني</option>',
  '<option value="متجر" data-i18n="contact.business.ecommerce">متجر إلكتروني</option>'
);
html = html.replace(
  '<option value="مطعم">مطعم / كافيه</option>',
  '<option value="مطعم" data-i18n="contact.business.restaurant">مطعم / كافيه</option>'
);
html = html.replace(
  '<option value="خدمات">خدمات أخرى</option>',
  '<option value="خدمات" data-i18n="contact.business.other">خدمات أخرى</option>'
);
html = html.replace(
  '<span>التالي</span>',
  '<span data-i18n="contact.next">التالي</span>'
);
html = html.replace(
  '<label for="reg-budget">الميزانية الشهرية (اختياري)</label>',
  '<label for="reg-budget" data-i18n="contact.budget.label">الميزانية الشهرية (اختياري)</label>'
);
html = html.replace(
  '<option value="">اختر الميزانية</option>',
  '<option value="" data-i18n="contact.budget.ph">اختر الميزانية</option>'
);
html = html.replace(
  '<option value="أقل من 10,000">أقل من 10,000 ج.م</option>',
  '<option value="أقل من 10,000" data-i18n="contact.budget.tier1">أقل من 10,000 ج.م</option>'
);
html = html.replace(
  '<option value="10,000 - 25,000">10,000 - 25,000 ج.م</option>',
  '<option value="10,000 - 25,000" data-i18n="contact.budget.tier2">10,000 - 25,000 ج.م</option>'
);
html = html.replace(
  '<option value="25,000 - 50,000">25,000 - 50,000 ج.م</option>',
  '<option value="25,000 - 50,000" data-i18n="contact.budget.tier3">25,000 - 50,000 ج.م</option>'
);
html = html.replace(
  '<option value="50,000 - 100,000">50,000 - 100,000 ج.م</option>',
  '<option value="50,000 - 100,000" data-i18n="contact.budget.tier4">50,000 - 100,000 ج.م</option>'
);
html = html.replace(
  '<option value="أكثر من 100,000">أكثر من 100,000 ج.م</option>',
  '<option value="أكثر من 100,000" data-i18n="contact.budget.tier5">أكثر من 100,000 ج.م</option>'
);
html = html.replace(
  '<label for="reg-message">رسالتك (اختياري)</label>',
  '<label for="reg-message" data-i18n="contact.message.label">رسالتك (اختياري)</label>'
);
html = html.replace(
  '<button type="button" class="form-step-back" onclick="goToStep(1)">السابق</button>',
  '<button type="button" class="form-step-back" onclick="goToStep(1)" data-i18n="contact.prev">السابق</button>'
);
html = html.replace(
  'السابق\n                </button>',
  '<span data-i18n="contact.prev">السابق</span>\n                </button>'
);

// 4. Floating / Assistant & Footer texts
html = html.replace(
  '<div class="conv-title">PR Agency — مساعد النمو</div>',
  '<div class="conv-title" data-i18n="assistant.title">PR Agency — مساعد النمو</div>'
);
html = html.replace(
  '<div class="smart-cta-msg" id="smartCtaMsg">مستني إيه؟</div>',
  '<div class="smart-cta-msg" id="smartCtaMsg" data-i18n="smartcta.msg">مستني إيه؟</div>'
);
html = html.replace(
  '<button class="smart-cta-btn" onclick="openConv()">ابدأ المحادثة</button>',
  '<button class="smart-cta-btn" onclick="openConv()" data-i18n="smartcta.btn">ابدأ المحادثة</button>'
);
html = html.replace(
  '<div class="search-hint">اضغط Ctrl + K في أي وقت</div>',
  '<div class="search-hint" data-i18n="search.hint">اضغط Ctrl + K في أي وقت</div>'
);

// Add keys to locales
Object.assign(ar, {
  "nav.menu": "القائمة",
  "contact.desc": "ابعتلنا هدفك وميزانيتك الأولية، وهنرجعلك بخطة واضحة وجاهزة للتنفيذ.",
  "contact.reach": "تقدر توصلنا من",
  "contact.step1": "معلوماتك",
  "contact.step2": "التفاصيل",
  "contact.business.ph": "اختر نوع نشاطك",
  "contact.business.clinic": "عيادة / مركز طبي",
  "contact.business.gym": "جيم / نادي رياضي",
  "contact.business.realestate": "شركة عقارية",
  "contact.business.ecommerce": "متجر إلكتروني",
  "contact.business.restaurant": "مطعم / كافيه",
  "contact.business.other": "خدمات أخرى",
  "contact.next": "التالي",
  "contact.prev": "السابق",
  "contact.budget.label": "الميزانية الشهرية (اختياري)",
  "contact.budget.ph": "اختر الميزانية",
  "contact.budget.tier1": "أقل من 10,000 ج.م",
  "contact.budget.tier2": "10,000 - 25,000 ج.م",
  "contact.budget.tier3": "25,000 - 50,000 ج.م",
  "contact.budget.tier4": "50,000 - 100,000 ج.م",
  "contact.budget.tier5": "أكثر من 100,000 ج.م",
  "contact.message.label": "رسالتك (اختياري)",
  "assistant.title": "PR Agency — مساعد النمو",
  "smartcta.msg": "مستني إيه؟",
  "smartcta.btn": "ابدأ المحادثة",
  "search.hint": "اضغط Ctrl + K في أي وقت"
});

Object.assign(en, {
  "nav.menu": "Menu",
  "contact.desc": "Send us your goal and initial budget, and we'll get back with a clear, ready-to-execute plan.",
  "contact.reach": "You can reach us via",
  "contact.step1": "Your Info",
  "contact.step2": "Details",
  "contact.business.ph": "Select your industry",
  "contact.business.clinic": "Clinic / Medical Center",
  "contact.business.gym": "Gym / Sports Club",
  "contact.business.realestate": "Real Estate Company",
  "contact.business.ecommerce": "E-commerce Store",
  "contact.business.restaurant": "Restaurant / Cafe",
  "contact.business.other": "Other Services",
  "contact.next": "Next",
  "contact.prev": "Previous",
  "contact.budget.label": "Monthly Budget (Optional)",
  "contact.budget.ph": "Select Budget",
  "contact.budget.tier1": "Less than 10,000 EGP",
  "contact.budget.tier2": "10,000 - 25,000 EGP",
  "contact.budget.tier3": "25,000 - 50,000 EGP",
  "contact.budget.tier4": "50,000 - 100,000 EGP",
  "contact.budget.tier5": "More than 100,000 EGP",
  "contact.message.label": "Your Message (Optional)",
  "assistant.title": "PR Agency — Growth Assistant",
  "smartcta.msg": "What are you waiting for?",
  "smartcta.btn": "Start Conversation",
  "search.hint": "Press Ctrl + K anytime"
});

fs.writeFileSync('index.html', html);
fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2));

console.log('Batch 2 of missing tags injected successfully.');
