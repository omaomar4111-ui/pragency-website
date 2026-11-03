const fs = require('fs');

console.log('Starting Fluid & Adaptive Design System refactor...');

// ═══════════════════════════════════════════════════════════════════
// 1. UPDATE css/main.css
// ═══════════════════════════════════════════════════════════════════
let mainCss = fs.readFileSync('css/main.css', 'utf8');

// Fluid typography & spacing in :root
mainCss = mainCss.replace(
  /\/\* Typography \(احتفظ بالقيم الحالية\) \*\/[\s\S]*?--t-hero:\s*clamp\([^)]+\);/,
  `/* Fluid Typography System */
  --t-xs:   clamp(0.7rem, 0.25vw + 0.65rem, 0.82rem);
  --t-sm:   clamp(0.82rem, 0.35vw + 0.75rem, 0.95rem);
  --t-base: clamp(0.95rem, 0.4vw + 0.85rem, 1.12rem);
  --t-md:   clamp(1.05rem, 0.6vw + 0.92rem, 1.25rem);
  --t-lg:   clamp(1.2rem, 1.1vw + 0.95rem, 1.55rem);
  --t-xl:   clamp(1.4rem, 1.8vw + 1rem, 2.1rem);
  --t-2xl:  clamp(1.75rem, 2.8vw + 1.1rem, 2.85rem);
  --t-3xl:  clamp(2.1rem, 3.8vw + 1.25rem, 3.6rem);
  --t-4xl:  clamp(2.4rem, 4.8vw + 1.4rem, 4.4rem);
  --t-hero: clamp(2.2rem, 5.5vw + 1rem, 5.2rem);`
);

// Fluid Spacing in :root
mainCss = mainCss.replace(
  /\/\* Spacing \*\/[\s\S]*?--sp-20:\s*80px;/,
  `/* Fluid Spacing System */
  --sp-1:  clamp(0.2rem, 0.4vw, 0.3rem);
  --sp-2:  clamp(0.4rem, 0.7vw, 0.55rem);
  --sp-3:  clamp(0.6rem, 1vw, 0.8rem);
  --sp-4:  clamp(0.8rem, 1.4vw, 1.15rem);
  --sp-5:  clamp(1.05rem, 1.8vw, 1.45rem);
  --sp-6:  clamp(1.25rem, 2.2vw, 1.75rem);
  --sp-8:  clamp(1.65rem, 3vw, 2.4rem);
  --sp-10: clamp(2rem, 3.8vw, 3.1rem);
  --sp-12: clamp(2.4rem, 4.5vw, 3.8rem);
  --sp-16: clamp(3rem, 6vw, 5rem);
  --sp-20: clamp(3.8rem, 8vw, 6.5rem);`
);

// Fluid Layout in :root
mainCss = mainCss.replace(
  /\/\* Layout \*\/[\s\S]*?--narrow-w:\s*min\([^)]+\);/,
  `/* Fluid Layout System */
  --section-y: clamp(3rem, 7vw, 7.5rem);
  --section-x: clamp(1rem, 4vw, 4.5rem);
  --content-w: min(1320px, 100% - 2 * var(--section-x));
  --narrow-w:  min(720px, 100% - 2 * var(--section-x));`
);

// Responsive Images
mainCss = mainCss.replace(
  /img,svg,video{max-width:100%;display:block}/,
  `img,svg,video{max-width:100%;height:auto;display:block}
img{object-fit:cover}
.hdr-logo,.site-footer-logo,.hero-statue-layer img,.hero-logo-layer img,.client-logo,.client-card img{object-fit:contain}`
);

// Fluid Headings
mainCss = mainCss.replace(
  /h1,h2,h3,h4{font-family:var\(--font\);line-height:1\.15;color:var\(--c-w100\)}[\s\S]*?h3{font-size:var\(--t-xl\);font-weight:800}/,
  `h1,h2,h3,h4{font-family:var(--font);line-height:1.18;color:var(--c-w100)}
h1{font-size:clamp(2.2rem, 4.8vw + 1rem, 4.2rem);font-weight:900;margin-bottom:clamp(1rem, 2vw, 1.8rem)}
h2{font-size:clamp(1.6rem, 3vw + 0.8rem, 2.85rem);font-weight:900;margin-bottom:clamp(0.75rem, 1.5vw, 1.5rem)}
h3{font-size:clamp(1.25rem, 2vw + 0.6rem, 2rem);font-weight:800;margin-bottom:clamp(0.5rem, 1vw, 1rem)}
h4{font-size:clamp(1.1rem, 1.2vw + 0.8rem, 1.45rem);font-weight:700}`
);

// Fluid footer grid
mainCss = mainCss.replace(
  /\.site-footer-grid\s*{[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?}/,
  `.site-footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: clamp(2rem, 5vw, 4rem);
  margin-bottom: clamp(2rem, 4vh, 3.5rem);
}`
);

fs.writeFileSync('css/main.css', mainCss, 'utf8');
console.log('✅ Updated css/main.css with Fluid Typography, Spacing, and Grids.');

// ═══════════════════════════════════════════════════════════════════
// 2. UPDATE css/pages.css
// ═══════════════════════════════════════════════════════════════════
let pagesCss = fs.readFileSync('css/pages.css', 'utf8');

// Replace Hero Section CSS in pages.css
const heroTargetRegex = /\/\* ══════════════════════════════════════════════════════════════\s+HERO — مطابق VR Agency\s+══════════════════════════════════════════════════════════════ \*\/[\s\S]*?(?=\/\* ══════════════════════════════════════════════════════════════\s+HERO SERVICES MARQUEE)/;

const newHeroCss = `/* ══════════════════════════════════════════════════════════════
   HERO — FLUID & ADAPTIVE DESIGN SYSTEM
══════════════════════════════════════════════════════════════ */
.hero-vr,
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
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(80px, 12dvh, 130px) var(--section-x) clamp(30px, 5dvh, 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* خلفية خفيفة */
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

/* ═══ Fluid Hero Inner Grid (Auto-Fit) ═══ */
.hero-vr-inner {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: min(1320px, 100%);
  margin: 0 auto;
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)) !important;
  gap: clamp(2rem, 5vw, 4rem) !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 0 clamp(1.5rem, 3vh, 3rem);
}

/* ═══ العمود الأيمن: النص ═══ */
.hero-vr-text {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: right;
}

.hero-vr-title {
  font-family: var(--font);
  font-size: clamp(2rem, 4.2vw + 0.8rem, 4.2rem);
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0 0 clamp(1rem, 2vh, 1.5rem) 0;
}

.hero-vr-title-accent {
  color: var(--c-purple-h);
  display: inline-block;
}

.hero-vr-title-small {
  display: block;
  font-size: clamp(1.25rem, 2.2vw + 0.5rem, 2.2rem);
  font-weight: 700;
  color: var(--c-w80);
  margin-top: clamp(0.25rem, 0.8vh, 0.6rem);
}

.hero-vr-sub {
  font-family: var(--font);
  font-size: clamp(1rem, 0.8vw + 0.75rem, 1.25rem);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 400;
  margin: 0 0 clamp(1.5rem, 3vh, 2.2rem) 0;
  max-width: 540px;
}

.hero-vr-cta {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: clamp(0.5rem, 1vw, 0.75rem);
  padding: clamp(0.8rem, 1.5vw, 1rem) clamp(1.6rem, 2.5vw, 2.2rem);
  background: var(--c-purple-h);
  color: #fff;
  font-family: var(--font);
  font-size: clamp(0.95rem, 0.4vw + 0.85rem, 1.1rem);
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

/* ═══ العمود الأيسر: الصورة واللوجو المتجاوب ═══ */
.hero-vr-logo-wrap {
  position: relative;
  width: 100%;
  max-width: min(540px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
  direction: ltr;
}

.hero-statue-layer,
.hero-statue-layer img,
.hero-statue-layer picture {
  background: transparent !important;
}

.hero-statue-layer {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  z-index: 1;
}

.hero-statue-layer img {
  width: 100%;
  height: auto;
  max-width: 100%;
  display: block;
  object-fit: contain;
  aspect-ratio: 1000/1091;
  mix-blend-mode: screen !important;
  filter: brightness(1.05) contrast(1.05) drop-shadow(0 0 35px rgba(124, 58, 237, 0.35));
}

.hero-brand-lockup {
  position: absolute;
  top: 5%;
  left: -2%;
  z-index: 5;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: clamp(10px, 1.8vw, 20px);
  margin: 0;
}

.hero-logo-layer {
  width: clamp(130px, 18vw, 210px);
  max-width: 210px;
  flex-shrink: 0;
}

.hero-logo-layer img {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  aspect-ratio: 1/1;
  filter: 
    drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))
    drop-shadow(0 0 40px rgba(139, 92, 246, 0.2));
}

.hero-tagline-layer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Cairo', sans-serif;
  font-size: clamp(10px, 0.9vw, 13px);
  font-weight: 600;
  letter-spacing: clamp(2px, 0.3vw, 4px);
  line-height: 1.4;
  text-transform: uppercase;
  padding-left: clamp(10px, 1.2vw, 16px);
  border-left: 2px solid rgba(168, 85, 247, 0.5);
  white-space: nowrap;
}

/* التجاوب السلس على الشاشات الصغيرة */
@media (max-width: 768px) {
  .hero-vr-inner {
    text-align: center;
    gap: 2rem !important;
  }
  .hero-vr-text {
    align-items: center;
    text-align: center;
  }
  .hero-vr-cta {
    align-self: center;
  }
  .hero-vr-sub {
    margin-left: auto;
    margin-right: auto;
  }
  .hero-vr-logo-wrap {
    max-width: 380px;
  }
  .hero-brand-lockup {
    position: static;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }
  .hero-tagline-layer {
    border-left: none;
    padding-left: 0;
    text-align: center;
  }
}
`;

pagesCss = pagesCss.replace(heroTargetRegex, newHeroCss);

// ═══ Refactor Grids across pages.css using Fluid auto-fit ═══
// Team grid
pagesCss = pagesCss.replace(
  /\.team-grid\s*{[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?width:\s*100%;[\s\S]*?}/,
  `.team-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)) !important;
  gap: clamp(1.2rem, 2.5vw, 1.8rem) !important;
  max-width: 1280px !important;
  margin: 0 auto !important;
  padding: 0 var(--section-x) !important;
  width: 100%;
  box-sizing: border-box;
}`
);

// Values grid
pagesCss = pagesCss.replace(
  /\.values-vr-grid\s*{[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?margin:\s*0\s+auto;[\s\S]*?}/,
  `.values-vr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: clamp(1.2rem, 3vw, 2rem);
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 var(--section-x);
}`
);

// Testimonials grid
pagesCss = pagesCss.replace(
  /\.testimonials-grid\s*{[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?margin:\s*0\s+auto;[\s\S]*?}/,
  `.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: clamp(1.2rem, 3vw, 2rem);
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--section-x);
}`
);

// Process grid
pagesCss = pagesCss.replace(
  /\.process-grid\s*{[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?gap:\s*24px;[\s\S]*?}/,
  `.process-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: clamp(1.2rem, 2.5vw, 1.8rem);
}`
);

// Numbered grid
pagesCss = pagesCss.replace(
  /\.numbered-grid\s*{[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?margin:\s*40px\s+auto;[\s\S]*?}/,
  `.numbered-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(1.2rem, 2.5vw, 1.8rem);
  max-width: 1100px;
  margin: clamp(2rem, 4vw, 3rem) auto;
  padding: 0 var(--section-x);
}`
);

// About values grid
pagesCss = pagesCss.replace(
  /\.about-values-grid\s*{[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?gap:\s*24px;[\s\S]*?}/,
  `.about-values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: clamp(1.2rem, 2.5vw, 1.8rem);
  margin: 0 0 clamp(2rem, 5vw, 4rem);
}`
);

// About stats
pagesCss = pagesCss.replace(
  /\.about-stats\s*{[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?text-align:\s*center;[\s\S]*?}/,
  `.about-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
  text-align: center;
  padding: clamp(2rem, 4vw, 3rem) 0;
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}`
);

// Client logos grid
pagesCss = pagesCss.replace(
  /\.clients-logos-grid\s*{[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?box-sizing:\s*border-box\s*!important;\s*}/,
  `.clients-logos-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)) !important;
  gap: clamp(1.2rem, 3vw, 2.5rem) !important;
  align-items: center !important;
  justify-items: center !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: clamp(1.5rem, 4vw, 3rem) var(--section-x) !important;
  box-sizing: border-box !important;
}`
);

// Register Card
pagesCss = pagesCss.replace(
  /\.register-card\s*{[\s\S]*?grid-template-columns:\s*1fr\s+1fr;[\s\S]*?overflow:\s*hidden;\s*}/,
  `.register-card {
  background: linear-gradient(135deg, rgba(15,0,0,0.85), rgba(5,0,0,0.95));
  border: 1px solid rgba(124, 58, 237, 0.18);
  border-radius: 28px;
  padding: clamp(2rem, 5vw, 4rem);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: clamp(2rem, 5vw, 4rem);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}`
);

// Register Row
pagesCss = pagesCss.replace(
  /\.register-row\s*{[\s\S]*?grid-template-columns:\s*1fr\s+1fr;[\s\S]*?gap:\s*24px;\s*}/,
  `.register-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
}`
);

fs.writeFileSync('css/pages.css', pagesCss, 'utf8');
console.log('✅ Updated css/pages.css with Fluid Hero & Grids.');

// ═══════════════════════════════════════════════════════════════════
// 3. UPDATE index.html #critical-css
// ═══════════════════════════════════════════════════════════════════
let indexHtml = fs.readFileSync('index.html', 'utf8');

const newCriticalCss = `    <style id="critical-css">
    :root {
      --c-black:#0A0612;--c-s1:#110A1E;--c-s2:#17102A;--c-purple:#6D28D9;--c-purple-h:#7C3AED;
      --c-w100:#fff;--c-w80:rgba(255,255,255,0.8);--c-w60:rgba(255,255,255,0.6);
      --section-x: clamp(1rem, 4vw, 4.5rem);
    }
    *,*::before,*::after{box-sizing:border-box}
    html{background:#0A0612;color:#fff;font-family:'Cairo',sans-serif;scroll-behavior:smooth}
    body{margin:0;padding:0;background:#0A0612;color:#fff;overflow-x:hidden}
    #hdr{position:fixed;top:0;left:0;right:0;z-index:900;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:rgba(10,6,18,0.85);backdrop-filter:blur(10px)}
    .hdr-logo{width:60px;height:60px;display:block;object-fit:contain}
    #hero{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;position:relative;padding:clamp(80px,12dvh,130px) var(--section-x) clamp(30px,5dvh,60px);background:#0A0612}
    .hero-vr-inner{width:100%;max-width:min(1320px,100%);margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:clamp(2rem,5vw,4rem);align-items:center;justify-content:center}
    .hero-vr-text{width:100%;max-width:620px;margin:0 auto;display:flex;flex-direction:column;justify-content:center;text-align:right}
    .hero-vr-title{font-size:clamp(2rem,4.2vw + 0.8rem,4.2rem);font-weight:900;line-height:1.15;margin:0 0 clamp(1rem,2vh,1.5rem)}
    .hero-vr-title-accent{color:#A78BFA;display:inline-block}
    .hero-vr-title-small{display:block;font-size:clamp(1.25rem,2.2vw + 0.5rem,2.2rem);font-weight:700;color:rgba(255,255,255,0.8);margin-top:clamp(0.25rem,0.8vh,0.6rem)}
    .hero-vr-sub{font-size:clamp(1rem,0.8vw + 0.75rem,1.25rem);color:rgba(255,255,255,0.75);margin:0 0 clamp(1.5rem,3vh,2.2rem);line-height:1.7;max-width:540px}
    .hero-vr-cta{display:inline-flex;align-items:center;align-self:flex-start;gap:clamp(0.5rem,1vw,0.75rem);background:#7C3AED;color:#fff;padding:clamp(0.8rem,1.5vw,1rem) clamp(1.6rem,2.5vw,2.2rem);border-radius:30px;font-weight:800;text-decoration:none}
    .hero-vr-logo-wrap{position:relative;width:100%;max-width:min(540px,100%);margin:0 auto;display:flex;align-items:center;justify-content:center;isolation:isolate;direction:ltr}
    .hero-statue-layer{position:relative;width:100%;max-width:480px;margin:0 auto;z-index:1}
    .hero-statue-layer img{width:100%;height:auto;max-width:100%;display:block;aspect-ratio:1000/1091;object-fit:contain}
    .hero-brand-lockup{position:absolute;top:5%;left:-2%;z-index:5;display:flex;flex-direction:row;align-items:center;gap:clamp(10px,1.8vw,20px);margin:0}
    .hero-logo-layer{width:clamp(130px,18vw,210px);max-width:210px;flex-shrink:0}
    .hero-logo-layer img{width:100%;height:auto;display:block;aspect-ratio:1/1;object-fit:contain}
    .hero-tagline-layer{display:flex;flex-direction:column;gap:4px;color:rgba(255,255,255,0.9);font-size:clamp(10px,0.9vw,13px);font-weight:600;letter-spacing:clamp(2px,0.3vw,4px);border-left:2px solid rgba(168,85,247,0.5);padding-left:clamp(10px,1.2vw,16px);white-space:nowrap}
    @media(max-width:768px){
      .hero-vr-inner{text-align:center;gap:2rem}
      .hero-vr-text{align-items:center;text-align:center}
      .hero-vr-cta{align-self:center}
      .hero-vr-sub{margin-left:auto;margin-right:auto}
      .hero-vr-logo-wrap{max-width:380px}
      .hero-brand-lockup{position:static;flex-direction:column;gap:8px;margin-bottom:12px}
      .hero-tagline-layer{border-left:none;padding-left:0;text-align:center}
    }
  </style>`;

indexHtml = indexHtml.replace(/<style id="critical-css">[\s\S]*?<\/style>/, newCriticalCss);

fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('✅ Updated index.html critical CSS with fluid hero and spacing.');
