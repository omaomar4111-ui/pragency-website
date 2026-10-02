(function () {
  'use strict';
  const DEFAULT_LANG = 'ar';
  const SUPPORTED = ['ar', 'en'];
  const RTL_LANGS = ['ar'];
  const STORAGE_KEY = 'pr_lang';

  let currentLang = DEFAULT_LANG;
  let translations = {};
  let isToggling = false;

  function detectLang() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return stored;
    } catch (e) {}
    const browser = (navigator.language || 'ar').toLowerCase().slice(0, 2);
    return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG;
  }

  async function loadTranslations(lang) {
    try {
      const res = await fetch('/locales/' + lang + '.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      translations = await res.json();
    } catch (e) {
      console.warn('i18n load failed:', lang, e);
      translations = {};
    }
  }

  function applyTranslations() {
    try {
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
    } catch (e) {
      console.warn('applyTranslations error:', e);
    }
  }

  function applyDirection(lang) {
    try {
      document.documentElement.lang = lang;
      document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
      document.body.classList.toggle('lang-ar', lang === 'ar');
      document.body.classList.toggle('lang-en', lang === 'en');
      // When website is AR, button shows EN (the target to switch to).
      // When website is EN, button shows عربي (or AR) so user knows clicking it takes them back to Arabic.
      document.querySelectorAll('.lang-switch .lang-label').forEach(function (label) {
        label.textContent = lang === 'ar' ? 'English' : 'عربي';
      });
    } catch (e) {
      console.warn('applyDirection error:', e);
    }
  }

  async function setLanguage(lang) {
    try {
      if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
      currentLang = lang;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
      await loadTranslations(lang);
      applyDirection(lang);
      applyTranslations();
      document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: lang } }));
    } catch (e) {
      console.error('setLanguage error:', e);
    }
  }

  window.i18n = {
    get: function () { return currentLang; },
    set: setLanguage,
    toggle: function () {
      if (isToggling) return;
      isToggling = true;
      const targetLang = (currentLang === 'ar') ? 'en' : 'ar';
      setLanguage(targetLang).finally(function() {
        setTimeout(function() { isToggling = false; }, 200);
      });
    },
    t: function (key) { return translations[key] || key; }
  };

  function bindToggleButtons() {
    document.querySelectorAll('.lang-switch').forEach(function (btn) {
      // Remove inline onclick if present to avoid dual trigger
      if (btn.getAttribute('onclick')) {
        btn.removeAttribute('onclick');
      }
      if (!btn.dataset.i18nBound) {
        btn.dataset.i18nBound = '1';
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          window.i18n.toggle();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setLanguage(detectLang()).then(bindToggleButtons);
    });
  } else {
    setLanguage(detectLang()).then(bindToggleButtons);
  }
})();