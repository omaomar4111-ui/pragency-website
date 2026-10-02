(function () {
  'use strict';
  const DEFAULT_LANG = 'ar';
  const SUPPORTED = ['ar', 'en'];
  const RTL_LANGS = ['ar'];
  const STORAGE_KEY = 'pr_lang';

  // Read language pre-rendered by Cloudflare Worker HTMLRewriter if present
  const serverLang = document.documentElement.lang;
  let currentLang = SUPPORTED.includes(serverLang) ? serverLang : DEFAULT_LANG;
  let translations = {};
  let isToggling = false;

  function detectLang() {
    if (window.location.pathname.startsWith('/en')) return 'en';
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
      document.querySelectorAll('.lang-switch .lang-label').forEach(function (label) {
        label.textContent = lang === 'ar' ? 'English' : 'عربي';
      });
    } catch (e) {
      console.warn('applyDirection error:', e);
    }
  }

  async function setLanguage(lang, navigate = false) {
    try {
      if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
      currentLang = lang;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
        document.cookie = `pr_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      } catch (e) {}

      // If user toggles language on a dedicated /en route or wants smooth transition
      if (navigate) {
        const currentPath = window.location.pathname;
        if (lang === 'en' && !currentPath.startsWith('/en')) {
          const newPath = '/en' + (currentPath === '/' ? '' : currentPath);
          window.location.href = newPath + window.location.search + window.location.hash;
          return;
        } else if (lang === 'ar' && currentPath.startsWith('/en')) {
          const newPath = currentPath.replace(/^\/en/, '') || '/';
          window.location.href = newPath + window.location.search + window.location.hash;
          return;
        }
      }

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
      setLanguage(targetLang, true).finally(function() {
        setTimeout(function() { isToggling = false; }, 200);
      });
    },
    t: function (key) { return translations[key] || key; }
  };

  function bindToggleButtons() {
    document.querySelectorAll('.lang-switch').forEach(function (btn) {
      if (!btn.dataset.i18nBound) {
        btn.dataset.i18nBound = '1';
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          window.i18n.toggle();
        });
      }
    });
  }

  const initialLang = detectLang();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setLanguage(initialLang, false).then(bindToggleButtons);
    });
  } else {
    setLanguage(initialLang, false).then(bindToggleButtons);
  }
})();