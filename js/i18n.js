(function () {
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
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    const key = el.dataset.i18nHtml;
    if (translations[key]) el.innerHTML = translations[key];
  });
}
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    const key = el.dataset.i18nHtml;
    if (translations[key]) el.innerHTML = translations[key];
  });
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
})();