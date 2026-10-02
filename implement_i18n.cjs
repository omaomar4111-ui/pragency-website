const fs = require('fs');
const path = require('path');

// ==================================================
// WAVE A: i18n Infrastructure
// ==================================================
if (!fs.existsSync('locales')) fs.mkdirSync('locales');

const arJSON = {
  "lang.code": "ar",
  "lang.name": "العربية",
  "lang.switch": "English",
  "nav.home": "الرئيسية",
  "nav.about": "عن الوكالة",
  "nav.services": "الخدمات",
  "nav.team": "الفريق",
  "nav.clients": "العملاء",
  "nav.faq": "الأسئلة الشائعة",
  "nav.contact": "تواصل",
  "hero.title.line1": "نحرّك براندك",
  "hero.title.line2": "للأمام",
  "hero.title.line3": "بسرعة وذكاء استراتيجي.",
  "hero.sub": "استراتيجية واضحة + تنفيذ احترافي:",
  "hero.cta": "اطلب عرض سعر",
  "about.eyebrow": "شريكك في النمو",
  "about.title": "شريكك في النمو",
  "about.lead": "في PR Agency، بنؤمن إن التسويق مش مجرد \"محتوى شكله حلو\".",
  "about.body": "بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح.",
  "about.more": "شوف المزيد عن الوكالة",
  "services.eyebrow": "خدماتنا",
  "services.title": "حلول تسويق متكاملة",
  "services.sub": "كل خدمة مصممة تحقق هدف محدد — وبنشتغل فيها باحتراف.",
  "services.more": "شوف كل الخدمات بالتفصيل",
  "values.title": "ليه تتشارك معانا؟",
  "clients.eyebrow": "شركاء نجاحنا",
  "clients.title": "علامات تثق فينا",
  "clients.sub": "+19 براند اشتغلنا معاهم في مجالات مختلفة.",
  "clients.more": "شوف كل شركاء نجاحنا",
  "team.eyebrow": "فريقنا",
  "team.title": "الناس اللي بتشتغل على شغلك",
  "team.sub": "كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.",
  "team.more": "تعرّف على كل أعضاء الفريق",
  "faq.eyebrow": "أسئلة شائعة",
  "faq.title": "عندك سؤال؟",
  "faq.sub": "كل اللي محتاج تعرفه عن شغلنا معاك",
  "contact.eyebrow": "تواصل معانا النهارده",
  "contact.title.line1": "خلينا ناخد",
  "contact.title.line2": "أول خطوة",
  "contact.title.line3": "سوا.",
  "contact.lead": "ابعتلنا هدفك وميزانيتك الأولية، وهنرجعلك بخطة واضحة وجاهزة للتنفيذ.",
  "form.name": "الاسم *",
  "form.name.ph": "اسمك الكامل",
  "form.phone": "رقم الموبايل *",
  "form.phone.ph": "01xxxxxxxxx",
  "form.business": "نوع النشاط *",
  "form.business.ph": "عيادة / جيم / عقارات / متجر",
  "form.budget": "الميزانية الشهرية",
  "form.budget.ph": "مثال: 15,000 EGP",
  "form.message": "رسالتك",
  "form.message.ph": "عايز تقولنا إيه؟ اكتب هنا...",
  "form.submit": "احصل على استشارة مجانية",
  "form.next": "التالي",
  "form.prev": "السابق",
  "form.success": "✅ تم استلام رسالتك، هنرد عليك قريب إن شاء الله",
  "footer.tagline": "شريكك في تحقيق النمو — بسرعة وذكاء استراتيجي.",
  "footer.quickLinks": "روابط سريعة",
  "footer.project.title": "عندك مشروع؟ يلا نبدأ",
  "footer.project.desc": "ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ.",
  "footer.privacy": "سياسة الخصوصية",
  "footer.terms": "شروط الاستخدام",
  "footer.rights": "كل الحقوق محفوظة."
};
fs.writeFileSync('locales/ar.json', JSON.stringify(arJSON, null, 2));

const enJSON = {
  "lang.code": "en",
  "lang.name": "English",
  "lang.switch": "العربية",
  "nav.home": "Home",
  "nav.about": "About Us",
  "nav.services": "Services",
  "nav.team": "Team",
  "nav.clients": "Clients",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",
  "hero.title.line1": "Move Your Brand",
  "hero.title.line2": "Forward",
  "hero.title.line3": "Fast and Strategically.",
  "hero.sub": "Clear strategy + professional execution:",
  "hero.cta": "Get a Quote",
  "about.eyebrow": "Your Growth Partner",
  "about.title": "Your Growth Partner",
  "about.lead": "At PR Agency, we believe marketing isn't just \"nice-looking content\".",
  "about.body": "For us, marketing is a practical tool that opens new opportunities and drives real growth.",
  "about.more": "Learn more about us",
  "services.eyebrow": "Our Services",
  "services.title": "Integrated Marketing Solutions",
  "services.sub": "Every service is designed to achieve a specific goal.",
  "services.more": "See all services",
  "values.title": "Why Work With Us?",
  "clients.eyebrow": "Our Partners",
  "clients.title": "Brands That Trust Us",
  "clients.sub": "19+ brands across various industries.",
  "clients.more": "See all partners",
  "team.eyebrow": "Our Team",
  "team.title": "The People Behind Your Growth",
  "team.sub": "Each with a specific role.",
  "team.more": "Meet the full team",
  "faq.eyebrow": "FAQ",
  "faq.title": "Got a Question?",
  "faq.sub": "Everything you need to know",
  "contact.eyebrow": "Talk to us today",
  "contact.title.line1": "Let's Take",
  "contact.title.line2": "The First Step",
  "contact.title.line3": "Together.",
  "contact.lead": "Send us your goal and budget, and we'll get back with a clear plan.",
  "form.name": "Name *",
  "form.name.ph": "Your full name",
  "form.phone": "Phone *",
  "form.phone.ph": "01xxxxxxxxx",
  "form.business": "Business Type *",
  "form.business.ph": "Clinic / Gym / Real Estate / Store",
  "form.budget": "Monthly Budget",
  "form.budget.ph": "e.g. 15,000 EGP",
  "form.message": "Your Message",
  "form.message.ph": "Tell us what you need...",
  "form.submit": "Get a Free Consultation",
  "form.next": "Next",
  "form.prev": "Back",
  "form.success": "✅ Received! We'll get back to you soon.",
  "footer.tagline": "Your growth partner — fast and strategic.",
  "footer.quickLinks": "Quick Links",
  "footer.project.title": "Got a project? Let's start",
  "footer.project.desc": "Send us your goal and budget.",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Use",
  "footer.rights": "All rights reserved."
};
fs.writeFileSync('locales/en.json', JSON.stringify(enJSON, null, 2));

const i18nJS = `(function () {
  'use strict';
  const DEFAULT_LANG = 'ar';
  const SUPPORTED = ['ar', 'en'];
  const RTL_LANGS = ['ar'];
  const STORAGE_KEY = 'pr_lang';
  
  let currentLang = DEFAULT_LANG;
  let translations = {};
  
  function detectLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const browser = (navigator.language || 'ar').toLowerCase().slice(0, 2);
    return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG;
  }
  
  async function loadTranslations(lang) {
    try {
      const res = await fetch('/locales/' + lang + '.json');
      translations = await res.json();
    } catch (e) {
      console.warn('i18n load failed:', lang, e);
      translations = {};
    }
  }
  
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.dataset.i18n;
      const val = translations[key];
      if (!val) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });
  }
  
  function applyDirection(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
    document.body.classList.toggle('lang-ar', lang === 'ar');
    document.body.classList.toggle('lang-en', lang === 'en');
    
    // Update all language switch labels
    document.querySelectorAll('.lang-switch .lang-label').forEach(label => {
      label.textContent = lang === 'ar' ? 'EN' : 'AR';
    });
  }
  
  async function setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    await loadTranslations(lang);
    applyDirection(lang);
    applyTranslations();
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: lang } }));
  }
  
  window.i18n = {
    get: function () { return currentLang; },
    set: setLanguage,
    toggle: function () { setLanguage(currentLang === 'ar' ? 'en' : 'ar'); },
    t: function (key) { return translations[key] || key; }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setLanguage(detectLang()); });
  } else {
    setLanguage(detectLang());
  }
})();`;
fs.writeFileSync('js/i18n.js', i18nJS);

// ==================================================
// WAVE B: Update APIs
// ==================================================
const patchFile = (p, search, replace) => {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    content = content.replace(search, replace);
    fs.writeFileSync(p, content);
  }
};

patchFile('functions/api/team.js', /SELECT id, name, role, bio, image_url, order_index/, 'SELECT id, name, name_en, role, role_en, bio, bio_en, image_url, order_index');
patchFile('functions/api/clients.js', /SELECT id, name, logo_url, website_url, order_index/, 'SELECT id, name, name_en, logo_url, website_url, order_index');
patchFile('functions/api/faqs.js', /SELECT id, question, answer, order_index/, 'SELECT id, question, question_en, answer, answer_en, order_index');

patchFile('functions/api/admin/team.js', 
  /const \{ name, role, bio, image_url, order_index/g, 
  'const { name, name_en, role, role_en, bio, bio_en, image_url, order_index');
patchFile('functions/api/admin/team.js', 
  /question, answer, order_index/g, 
  'question, question_en, answer, answer_en, order_index');
patchFile('functions/api/admin/clients.js', 
  /const \{ name, logo_url, website_url, order_index/g, 
  'const { name, name_en, logo_url, website_url, order_index');
patchFile('functions/api/admin/faqs.js', 
  /const \{ question, answer, order_index/g, 
  'const { question, question_en, answer, answer_en, order_index');

// Also update SQL inserts/updates for admin APIs
patchFile('functions/api/admin/team.js', /SET name = \?, role = \?, bio = \?/, 'SET name = ?, name_en = ?, role = ?, role_en = ?, bio = ?, bio_en = ?');
patchFile('functions/api/admin/team.js', /\(name, role, bio,/, '(name, name_en, role, role_en, bio, bio_en,');

// ==================================================
// WAVE C: Update Frontend JS
// ==================================================
const injectI18nHook = (filePath, renderFuncName) => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf-8');
  if (!code.includes('i18n:changed')) {
    code += `\n// Re-render on language change\ndocument.addEventListener('i18n:changed', () => {\n  if (typeof ${renderFuncName} === 'function') ${renderFuncName}();\n});\n`;
  }
  fs.writeFileSync(filePath, code);
};
injectI18nHook('js/team.js', 'renderTeam');
injectI18nHook('js/clients.js', 'renderClientsMarquee'); 
injectI18nHook('js/faqs.js', 'window.renderFaqs'); 

// Team
let teamJS = fs.readFileSync('js/team.js', 'utf-8');
teamJS = teamJS.replace(/\$\{m\.name\}/g, '${window.i18n?.get() === "en" && m.name_en ? m.name_en : m.name}');
teamJS = teamJS.replace(/\$\{m\.role\}/g, '${window.i18n?.get() === "en" && m.role_en ? m.role_en : m.role}');
teamJS = teamJS.replace(/\$\{m\.bio\}/g, '${window.i18n?.get() === "en" && m.bio_en ? m.bio_en : m.bio}');
fs.writeFileSync('js/team.js', teamJS);

// Clients
let clientsJS = fs.readFileSync('js/clients.js', 'utf-8');
clientsJS = clientsJS.replace(/\$\{client\.name\}/g, '${window.i18n?.get() === "en" && client.name_en ? client.name_en : client.name}');
fs.writeFileSync('js/clients.js', clientsJS);

// FAQs
if (fs.existsSync('js/faqs.js')) {
  let faqsJS = fs.readFileSync('js/faqs.js', 'utf-8');
  faqsJS = faqsJS.replace(/\$\{f\.question\}/g, '${window.i18n?.get() === "en" && f.question_en ? f.question_en : f.question}');
  faqsJS = faqsJS.replace(/\$\{f\.answer\}/g, '${window.i18n?.get() === "en" && f.answer_en ? f.answer_en : f.answer}');
  
  if (!faqsJS.includes('i18n:changed')) {
    faqsJS = faqsJS.replace(/faqContainer\.innerHTML = faqs\.map/g, `
    window.renderFaqs = () => {
      faqContainer.innerHTML = faqs.map`);
    faqsJS = faqsJS.replace(/ans\.style\.maxHeight = ans\.scrollHeight \+ "px";\n      }/g, `ans.style.maxHeight = ans.scrollHeight + "px";
      }
    };
    window.renderFaqs();
    document.addEventListener('i18n:changed', window.renderFaqs);`);
  }
  fs.writeFileSync('js/faqs.js', faqsJS);
}

// ==================================================
// WAVE D & F & G: HTML + CSS
// ==================================================
let pagesCss = fs.readFileSync('css/pages.css', 'utf-8');
if (!pagesCss.includes('.lang-switch')) {
  pagesCss += `\n
.lang-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 50px;
  color: #A78BFA;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.3s;
  font-family: inherit;
}
.lang-switch:hover {
  background: rgba(109, 40, 217, 0.2);
  border-color: #A78BFA;
}
.lang-icon { width: 16px; height: 16px; }

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
body.lang-en {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
body.lang-en h1, body.lang-en h2, body.lang-en h3, body.lang-en h4, body.lang-en h5 {
  font-family: 'Inter', system-ui, sans-serif;
}
`;
  fs.writeFileSync('css/pages.css', pagesCss);
}

const srvFiles = fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f);
const allHtml = [...fs.readdirSync('.').filter(f => f.endsWith('.html')), ...srvFiles];

const langBtn = `
        <button class="lang-switch" onclick="i18n.toggle()" aria-label="Switch language">
          <svg class="lang-icon" viewBox="0 0 512 512" fill="currentColor" width="16" height="16">
            <path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.1 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160z"/>
          </svg>
          <span class="lang-label">EN</span>
        </button>`;

allHtml.forEach(f => {
  let html = fs.readFileSync(f, 'utf-8');
  
  // Add lang-switch if not present
  if (!html.includes('lang-switch')) {
    html = html.replace(/<div class="hdr-actions">\s*(<a|<button)/, `<div class="hdr-actions">${langBtn}\n        $1`);
  }
  
  // Add i18n.js if not present
  if (!html.includes('i18n.js')) {
    const isSrv = f.startsWith('services/');
    html = html.replace(/<\/body>/, `  <script src="${isSrv ? '../' : ''}js/i18n.js?v=1" defer></script>\n</body>`);
  }
  
  // Bump cache
  html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=55');
  
  fs.writeFileSync(f, html);
});

console.log('DONE');
