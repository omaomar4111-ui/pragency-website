/**
 * build_case_studies_page.cjs
 * Creates case-studies.html & js/case-studies.js & syncs translations & sitemap
 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

// ── 1. Update locales with Step 8 keys ───────────────────────────────────────
const arPath = path.join(ROOT, 'locales/ar.json');
const enPath = path.join(ROOT, 'locales/en.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

ar['nav.case_studies'] = "قصص النجاح";
en['nav.case_studies'] = "Case Studies";

ar['case_studies.title'] = "قصص نجاح عملائنا";
ar['case_studies.subtitle'] = "نتايج حقيقية بأرقام حقيقية";
ar['case_studies.view'] = "اقرأ القصة كاملة";
ar['case_studies.empty'] = "لا توجد قصص نجاح منشورة حتى الآن";

ar['case_study.challenge'] = "التحدي";
ar['case_study.solution'] = "الحل";
ar['case_study.results'] = "النتايج والأرقام";
ar['case_study.testimonial'] = "رأي العميل";
ar['case_study.cta'] = "عايز نتايج زي دي؟";
ar['case_study.back'] = "← كل قصص النجاح";

en['case_studies.title'] = "Client Success Stories";
en['case_studies.subtitle'] = "Real results with real numbers";
en['case_studies.view'] = "Read Full Case Study";
en['case_studies.empty'] = "No case studies published yet";

en['case_study.challenge'] = "The Challenge";
en['case_study.solution'] = "The Solution";
en['case_study.results'] = "Results & Metrics";
en['case_study.testimonial'] = "Client Feedback";
en['case_study.cta'] = "Want similar results?";
en['case_study.back'] = "← All Case Studies";

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

const localesData = `export const ar = ${JSON.stringify(ar)};\nexport const en = ${JSON.stringify(en)};\n`;
fs.writeFileSync(path.join(ROOT, 'functions/locales_data.js'), localesData, 'utf8');
console.log('✅ Locales updated with case study keys & synced to locales_data.js');

// ── 2. Create case-studies.html ─────────────────────────────────────────────
const caseStudiesHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title data-i18n="case_studies.title">قصص نجاح عملائنا — PR Agency</title>
  <meta name="description" content="اكتشف كيف ساعدنا كبرى الشركات والعيادات والمتاجر على مضاعفة مبيعاتهم وتحقيق نمو استثنائي."/>
  
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link rel="stylesheet" href="/css/style.css?v=75"/>
  <link rel="stylesheet" href="/css/pages.css?v=75"/>
  <link rel="stylesheet" href="/css/chatbot.css?v=75"/>
  
  <style>
    .case-studies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 32px;
      margin: 40px auto 80px;
      max-width: 1200px;
      padding: 0 24px;
    }
    .cs-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s;
      text-decoration: none;
      color: inherit;
    }
    .cs-card:hover {
      transform: translateY(-6px);
      border-color: #8B5CF6;
      box-shadow: 0 16px 36px rgba(139, 92, 246, 0.2);
    }
    .cs-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .cs-logo {
      height: 48px;
      max-width: 130px;
      object-fit: contain;
      filter: brightness(1.2);
    }
    .cs-badge {
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #C4B5FD;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 12px;
    }
    .cs-name {
      font-size: 1.35rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 10px;
    }
    .cs-result-highlight {
      font-size: 0.95rem;
      color: #94A3B8;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .cs-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .cs-metric-item {
      text-align: center;
    }
    .cs-metric-val {
      font-size: 1.25rem;
      font-weight: 900;
      color: #10B981;
      display: block;
    }
    .cs-metric-lbl {
      font-size: 0.75rem;
      color: #94A3B8;
    }
    .cs-cta-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 12px;
      background: linear-gradient(135deg, #8B5CF6, #7C3AED);
      color: #fff;
      font-weight: 700;
      font-size: 0.9rem;
      transition: opacity 0.2s;
    }
    .cs-card:hover .cs-cta-btn {
      opacity: 0.95;
    }
    .cs-skeleton {
      min-height: 320px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      animation: pulse 1.5s infinite ease-in-out;
    }
    @keyframes pulse {
      0% { opacity: 0.5; }
      50% { opacity: 0.9; }
      100% { opacity: 0.5; }
    }
  </style>
</head>
<body class="page-services">

<nav id="hdr" role="navigation" aria-label="التنقل الرئيسي">
  <a href="/" aria-label="PR Agency — الرئيسية" class="hdr-logo-link">
    <img src="/assets/logos/pr-agency.webp" alt="PR Agency" class="hdr-logo" width="60" height="60"/>
  </a>
  <div class="hdr-nav">
    <a href="/" data-i18n="nav.home">الرئيسية</a>
    <a href="/about.html" data-i18n="nav.about">عن الوكالة</a>
    <a href="/services.html" data-i18n="nav.services">الخدمات</a>
    <a href="/case-studies" class="active" data-i18n="nav.case_studies">قصص النجاح</a>
    <a href="/team" data-i18n="nav.team">الفريق</a>
    <a href="/clients.html" data-i18n="nav.clients">العملاء</a>
    <a href="/#register" data-i18n="nav.contact">تواصل</a>
  </div>
  <div class="hdr-actions">
    <button class="hdr-burger" id="hdr-burger" aria-label="Menu">
      <svg viewBox="0 0 448 512" width="20" height="20" fill="currentColor">
        <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
      </svg>
    </button>
    <button class="lang-switch" aria-label="Switch language">
      <span class="lang-label">EN</span>
    </button>
    <a href="https://wa.me/201144826641" class="hdr-cta" target="_blank" rel="noopener">
      كلمنا
    </a>
  </div>
</nav>

<main class="page-standalone">
  <section class="page-hero">
    <div class="page-hero-container">
      <h1 class="page-hero-title" data-i18n="case_studies.title">قصص نجاح عملائنا</h1>
      <p class="page-hero-subtitle" data-i18n="case_studies.subtitle">نتايج حقيقية بأرقام حقيقية</p>
    </div>
  </section>

  <!-- Case Studies Grid -->
  <div class="case-studies-grid" id="case-studies-grid">
    <div class="cs-skeleton"></div>
    <div class="cs-skeleton"></div>
  </div>
</main>

<footer class="site-footer" role="contentinfo">
  <div class="site-footer-container">
    <div class="site-footer-grid">
      <div class="site-footer-brand">
        <img src="/assets/logos/pr-agency.webp" alt="PR Agency" class="site-footer-logo"/>
        <p class="site-footer-tagline">شريكك في تحقيق النمو — بسرعة وذكاء استراتيجي.</p>
      </div>
      <div class="site-footer-col">
        <h4 class="site-footer-heading" data-i18n="footer.quickLinks">روابط سريعة</h4>
        <ul class="site-footer-links">
          <li><a href="/" data-i18n="nav.home">الرئيسية</a></li>
          <li><a href="/services.html" data-i18n="nav.services">الخدمات</a></li>
          <li><a href="/case-studies" data-i18n="nav.case_studies">قصص النجاح</a></li>
          <li><a href="/#register" data-i18n="nav.contact">تواصل معنا</a></li>
        </ul>
      </div>
    </div>
    <div class="site-footer-bottom">
      <p>© 2026 PR Agency. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</footer>

<script src="/js/case-studies.js?v=75" defer></script>
<script src="/js/chatbot.js?v=75" defer></script>

</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'case-studies.html'), caseStudiesHtml, 'utf8');
console.log('✅ case-studies.html created');

// ── 3. Create js/case-studies.js ────────────────────────────────────────────
const caseStudiesJs = `(function() {
  'use strict';

  var grid = document.getElementById('case-studies-grid');
  if (!grid) return;

  var isEn = document.documentElement.lang === 'en';

  fetch('/api/case-studies')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      grid.innerHTML = '';

      if (!Array.isArray(data) || data.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#94A3B8;">' +
          (isEn ? 'No case studies published yet.' : 'لا توجد قصص نجاح منشورة حتى الآن.') +
          '</div>';
        return;
      }

      data.forEach(function(item) {
        var card = document.createElement('a');
        card.href = '/case-studies/' + encodeURIComponent(item.slug);
        card.className = 'cs-card';

        var clientName = (isEn && item.client_name_en) ? item.client_name_en : item.client_name;
        var resultText = (isEn && item.results_en) ? item.results_en : item.results_ar;
        var logoSrc = item.client_logo || '/assets/logos/pr-agency.webp';

        var metricsHtml = '';
        if (Array.isArray(item.metrics) && item.metrics.length > 0) {
          metricsHtml = '<div class="cs-metrics">';
          item.metrics.slice(0, 2).forEach(function(m) {
            metricsHtml += '<div class="cs-metric-item">' +
              '<span class="cs-metric-val">' + (m.value || '') + '</span>' +
              '<span class="cs-metric-lbl">' + (m.label || '') + '</span>' +
              '</div>';
          });
          metricsHtml += '</div>';
        }

        card.innerHTML = 
          '<div class="cs-top">' +
            '<img src="' + logoSrc + '" alt="' + clientName + '" class="cs-logo" loading="lazy" />' +
            '<span class="cs-badge">' + (item.service_type || 'Marketing') + '</span>' +
          '</div>' +
          '<h3 class="cs-name">' + clientName + '</h3>' +
          '<p class="cs-result-highlight">' + (resultText || '') + '</p>' +
          metricsHtml +
          '<div class="cs-cta-btn">' +
            '<span>' + (isEn ? 'Read Case Study' : 'اقرأ القصة كاملة') + '</span>' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</div>';

        grid.appendChild(card);
      });
    })
    .catch(function(err) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#EF4444;">' +
        (isEn ? 'Failed to load case studies. Please refresh.' : 'تعذر تحميل قصص النجاح. يرجى إعادة المحاولة.') +
        '</div>';
    });
})();
`;

fs.writeFileSync(path.join(ROOT, 'js/case-studies.js'), caseStudiesJs, 'utf8');
console.log('✅ js/case-studies.js created');

// ── 4. Add /case-studies to sitemap.xml ──────────────────────────────────────
const sitemapPath = path.join(ROOT, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemap.includes('/case-studies')) {
    const newEntry = `  <url>\n    <loc>https://pragency.pages.dev/case-studies</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n</urlset>`;
    sitemap = sitemap.replace('</urlset>', newEntry);
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    console.log('✅ sitemap.xml updated with /case-studies');
  }
}
