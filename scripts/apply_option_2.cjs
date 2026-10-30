const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// Replace hero title and sub - strictly human: NO commas, NO periods, NO AI fluff
html = html.replace(
  /<h1 class="hero-vr-title">[\s\S]*?<\/h1>\s*<p class="hero-vr-sub"[^>]*>[\s\S]*?<\/p>/,
  `<h1 class="hero-vr-title">
        <span data-i18n="hero.title.line1">تسويق حقيقي</span><br/>
        <span class="hero-vr-title-accent"><span data-i18n="hero.title.line2">يفتحلك سوق جديد</span></span><br/>
        <span class="hero-vr-title-small"><span data-i18n="hero.title.line3">ويكبر مبيعاتك</span></span>
      </h1>
      
      <p class="hero-vr-sub" data-i18n="hero.sub2">بنشتغل معاك خطوة بخطوة من الفكرة وتصوير الإعلان لحد ما عميلك يدخل يشتري</p>`
);

// Update CTA button
html = html.replace(/<span class="cta-label"[^>]*>[\s\S]*?<\/span>/, '<span class="cta-label" data-i18n="hero.cta">تعال نتكلم في مشروعك</span>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Updated index.html');

// 2. Update locales/ar.json
if (fs.existsSync('locales/ar.json')) {
  const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf8'));
  ar['hero.title.line1'] = "تسويق حقيقي";
  ar['hero.title.line2'] = "يفتحلك سوق جديد";
  ar['hero.title.line3'] = "ويكبر مبيعاتك";
  ar['hero.title'] = "تسويق حقيقي يفتحلك سوق جديد ويكبر مبيعاتك";
  ar['hero.sub2'] = "بنشتغل معاك خطوة بخطوة من الفكرة وتصوير الإعلان لحد ما عميلك يدخل يشتري";
  ar['hero.cta'] = "تعال نتكلم في مشروعك";
  fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2), 'utf8');
  console.log('Updated locales/ar.json');
}

// 3. Update locales/en.json
if (fs.existsSync('locales/en.json')) {
  const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf8'));
  en['hero.title.line1'] = "Real Marketing";
  en['hero.title.line2'] = "That Expands Your Market";
  en['hero.title.line3'] = "And Drives Your Sales";
  en['hero.title'] = "Real Marketing That Expands Your Market";
  en['hero.sub2'] = "We work with you step by step from concept and video production until your customers buy";
  en['hero.cta'] = "Let's Talk About Your Business";
  fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2), 'utf8');
  console.log('Updated locales/en.json');
}
