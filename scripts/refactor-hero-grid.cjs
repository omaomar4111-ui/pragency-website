const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Refactor index.html
const indexPath = path.join(rootDir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Ensure hdr-inner wrapper
if (!indexContent.includes('<div class="hdr-inner">')) {
  indexContent = indexContent.replace(
    /<nav id="hdr" role="navigation" aria-label="التنقل الرئيسي">([\s\S]*?)<\/nav>/,
    (match, inner) => {
      return `<nav id="hdr" role="navigation" aria-label="التنقل الرئيسي">\n  <div class="hdr-inner">${inner.trim()}\n  </div>\n</nav>`;
    }
  );
}

// Replace Hero section and extract Marquee below it
const heroSectionRegex = /<!-- ═+[\r\n\s]+HERO[\s\S]*?-->[\s\S]*?<section id="hero" class="hero-vr">[\s\S]*?<\/section>/;

const newHeroAndMarquee = `<!-- ═══════════════════════════════════════════════════════
     HERO — STRICT 2-COLUMN GRID (NON-OVERLAPPING)
═══════════════════════════════════════════════════════ -->
<section id="hero" class="hero-section hero-vr">
  <div class="hero-container hero-vr-inner">
    
    <!-- عمود النص (يمين في العربي، يسار في الإنجليزي) -->
    <div class="hero-text-col hero-vr-text">
      <h1 class="hero-title hero-vr-title">
        <span data-i18n="hero.title.line1">تسويق حقيقي</span><br/>
        <span class="hero-vr-title-accent"><span data-i18n="hero.title.line2">يفتحلك سوق جديد</span></span><br/>
        <span class="hero-vr-title-small"><span data-i18n="hero.title.line3">ويكبر مبيعاتك</span></span>
      </h1>
      
      <p class="hero-sub hero-vr-sub" data-i18n="hero.sub2">بنشتغل معاك خطوة بخطوة من الفكرة وتصوير الإعلان لحد ما عميلك يدخل يشتري</p>
      
      <a href="#register" id="hero-cta-btn" class="hero-vr-cta" onclick="document.getElementById('register').scrollIntoView({behavior:'smooth'}); return false;">
        <span class="cta-label" data-i18n="hero.cta">تعال نتكلم في مشروعك</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </div>
    
    <!-- عمود التمثال (يسار في العربي، يمين في الإنجليزي) -->
    <div class="hero-media-col hero-vr-logo-wrap">
      <div class="hero-statue-wrap hero-statue-layer" aria-hidden="true">
        <picture>
          <source type="image/webp" srcset="assets/images/hero-statue-400w.webp 400w, assets/images/hero-statue-700w.webp 700w, assets/images/hero-statue.webp 1000w" sizes="(max-width: 600px) 360px, (max-width: 1024px) 700px, 1000px">
          <img 
            src="assets/images/hero-statue.webp" 
            alt="PR Agency Sculpture"
            loading="eager"
            fetchpriority="high"
            width="1000" 
            height="1091"
            class="hero-statue-img"
          />
        </picture>
      </div>
    </div>
    
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════
     SERVICES MARQUEE (سيكشن منفصل تماماً تحت الهيرو)
═══════════════════════════════════════════════════════ -->
<section class="services-marquee-section hero-vr-services" aria-label="شريط الخدمات">
  <div class="hero-vr-services-track">
    <span data-i18n="marquee.service1">إدارة السوشيال ميديا</span><span class="dot">•</span>
    <span data-i18n="marquee.service2">الإعلانات المدفوعة</span><span class="dot">•</span>
    <span data-i18n="marquee.service3">العلامة التجارية والهوية</span><span class="dot">•</span>
    <span data-i18n="marquee.service4">إنتاج المحتوى</span><span class="dot">•</span>
    <span data-i18n="marquee.service5">استراتيجية التسويق</span><span class="dot">•</span>
    <span data-i18n="marquee.service1">إدارة السوشيال ميديا</span><span class="dot">•</span>
    <span data-i18n="marquee.service2">الإعلانات المدفوعة</span><span class="dot">•</span>
    <span data-i18n="marquee.service3">العلامة التجارية والهوية</span><span class="dot">•</span>
    <span data-i18n="marquee.service4">إنتاج المحتوى</span><span class="dot">•</span>
    <span data-i18n="marquee.service5">استراتيجية التسويق</span><span class="dot">•</span>
  </div>
</section>`;

if (heroSectionRegex.test(indexContent)) {
  indexContent = indexContent.replace(heroSectionRegex, newHeroAndMarquee);
} else {
  console.warn('Hero section regex did not match directly, checking fallback...');
  const heroOnlyRegex = /<section id="hero" class="hero-vr">[\s\S]*?<\/section>/;
  if (heroOnlyRegex.test(indexContent)) {
    indexContent = indexContent.replace(heroOnlyRegex, newHeroAndMarquee);
  }
}

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('Successfully updated index.html');

// 2. Refactor css/main.css for #hdr and .hdr-inner
const mainCssPath = path.join(rootDir, 'css', 'main.css');
let mainCss = fs.readFileSync(mainCssPath, 'utf8');

const hdrRegex = /#hdr\s*\{[\s\S]*?#hdr\.scrolled\s*\{[\s\S]*?\}/;
const newHdrCss = `#hdr {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: var(--z-sticky);
  background: rgba(10, 6, 18, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.hdr-inner {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

#hdr.scrolled {
  background: rgba(10, 6, 18, 0.95);
  border-bottom-color: rgba(139, 92, 246, 0.25);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}`;

if (hdrRegex.test(mainCss)) {
  mainCss = mainCss.replace(hdrRegex, newHdrCss);
  fs.writeFileSync(mainCssPath, mainCss, 'utf8');
  console.log('Successfully updated css/main.css');
} else {
  console.warn('Could not match #hdr in css/main.css');
}

// 3. Refactor css/pages.css for Hero and Marquee
const pagesCssPath = path.join(rootDir, 'css', 'pages.css');
let pagesCss = fs.readFileSync(pagesCssPath, 'utf8');

const heroPagesRegex = /\/\* ═+[\r\n\s]+HERO[\s\S]*?@keyframes servicesScroll\s*\{[\s\S]*?\}\s*\}/;

const newHeroPagesCss = `/* ══════════════════════════════════════════════════════════════
   HERO — STRICT 2-COLUMN GRID (NON-OVERLAPPING)
══════════════════════════════════════════════════════════════ */
.hero-vr,
.hero-section,
#hero {
  position: relative;
  background: 
    radial-gradient(
      ellipse 60% 60% at 35% 50%,
      rgba(139, 92, 246, 0.18) 0%,
      rgba(109, 40, 217, 0.08) 45%,
      transparent 70%
    ),
    linear-gradient(180deg, #0A0612 0%, #150A24 50%, #0A0612 100%);
  min-height: 85vh;
  padding: 120px 24px 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-vr::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 60% 50% at 30% 30%, rgba(124, 58, 237, 0.10) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 70% 70%, rgba(124, 58, 237, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ═══ Strict 2-Column Desktop Grid ═══ */
.hero-container,
.hero-vr-inner {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 40px !important;
  align-items: center !important;
}

/* ═══ العمود 1: النص ═══ */
.hero-text-col,
.hero-vr-text {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 580px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: right;
}

.hero-title,
.hero-vr-title {
  font-family: var(--font);
  font-size: 3.5rem !important; /* Strict 3.5rem on desktop (~56px) */
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0 0 20px 0;
}

.hero-vr-title-accent {
  color: var(--c-purple-h);
  display: inline-block;
}

.hero-vr-title-small {
  display: block;
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--c-w80);
  margin-top: 8px;
}

.hero-sub,
.hero-vr-sub {
  font-family: var(--font);
  font-size: 1.15rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 400;
  margin: 0 0 32px 0;
  max-width: 520px;
}

.hero-vr-cta {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 10px;
  padding: 14px 32px;
  background: var(--c-purple-h);
  color: #fff;
  font-family: var(--font);
  font-size: 1.05rem;
  font-weight: 800;
  text-decoration: none;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
  transition: transform 0.3s var(--e-float), box-shadow 0.3s;
}

.hero-vr-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 40px rgba(124, 58, 237, 0.6);
}

.hero-vr-cta svg {
  transition: transform 0.3s;
}

.hero-vr-cta:hover svg {
  transform: translateX(-4px);
}

/* ═══ العمود 2: الصورة / التمثال ═══ */
.hero-media-col,
.hero-vr-logo-wrap {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-statue-wrap,
.hero-statue-layer {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-statue-img,
.hero-statue-layer img {
  width: 100%;
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  aspect-ratio: 1000/1091;
  mix-blend-mode: screen !important;
  filter: brightness(1.05) contrast(1.05) drop-shadow(0 0 35px rgba(124, 58, 237, 0.35));
}

/* ═══ Strict Mobile Layout ═══ */
@media (max-width: 768px) {
  #hero,
  .hero-vr,
  .hero-section {
    padding: 100px 16px 40px !important;
    min-height: auto !important;
  }

  .hero-container,
  .hero-vr-inner {
    grid-template-columns: 1fr !important;
    gap: 32px !important;
    text-align: center;
  }

  .hero-text-col,
  .hero-vr-text {
    max-width: 100% !important;
    align-items: center !important;
    text-align: center !important;
  }

  .hero-title,
  .hero-vr-title {
    font-size: 2rem !important; /* Strict 2rem on mobile */
    line-height: 1.25 !important;
  }

  .hero-vr-title-small {
    font-size: 1.25rem !important;
  }

  .hero-sub,
  .hero-vr-sub {
    font-size: 1rem !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .hero-vr-cta {
    align-self: center !important;
    padding: 12px 28px !important;
  }

  .hero-media-col,
  .hero-vr-logo-wrap {
    max-width: 320px !important;
  }
}

/* ══════════════════════════════════════════════════════════════
   SEPARATE MARQUEE SECTION (BELOW HERO)
══════════════════════════════════════════════════════════════ */
.services-marquee-section,
.hero-vr-services {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 22px 0;
  background: rgba(10, 6, 18, 0.95);
  border-top: 1px solid rgba(124, 58, 237, 0.2);
  border-bottom: 1px solid rgba(124, 58, 237, 0.2);
  overflow: hidden;
  direction: ltr;
}

.services-marquee-section::before,
.services-marquee-section::after,
.hero-vr-services::before,
.hero-vr-services::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  width: 120px;
  z-index: 2;
  pointer-events: none;
}
.services-marquee-section::before,
.hero-vr-services::before {
  right: 0;
  background: linear-gradient(270deg, #0A0612, transparent 100%);
}
.services-marquee-section::after,
.hero-vr-services::after {
  left: 0;
  background: linear-gradient(90deg, #0A0612, transparent 100%);
}

.hero-vr-services-track {
  display: inline-flex;
  gap: 40px;
  align-items: center;
  white-space: nowrap;
  animation: servicesScroll 35s linear infinite;
  will-change: transform;
}

.hero-vr-services-track > span {
  font-family: var(--font);
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.hero-vr-services-track > .dot {
  color: var(--c-purple-h);
  font-size: 20px;
}

@keyframes servicesScroll {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}`;

if (heroPagesRegex.test(pagesCss)) {
  pagesCss = pagesCss.replace(heroPagesRegex, newHeroPagesCss);
  fs.writeFileSync(pagesCssPath, pagesCss, 'utf8');
  console.log('Successfully updated css/pages.css');
} else {
  console.warn('Could not match Hero in css/pages.css');
}
