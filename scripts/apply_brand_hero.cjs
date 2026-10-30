const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  /<h1 class="hero-vr-title">[\s\S]*?<\/h1>\s*<p class="hero-vr-sub"[^>]*>[\s\S]*?<\/p>/,
  `<h1 class="hero-vr-title">
        <span data-i18n="hero.title.line1">نكبّر قيمة براندك</span><br/>
        <span class="hero-vr-title-accent"><span data-i18n="hero.title.line2">بحلول تسويق رقمي متكاملة،</span></span><br/>
        <span class="hero-vr-title-small"><span data-i18n="hero.title.line3">ونتائج حقيقية تشوفها على أرض الواقع.</span></span>
      </h1>
      
      <p class="hero-vr-sub" data-i18n="hero.sub2">في PR Agency، بنؤمن إن التسويق مش رفاهية ولا مجرد محتوى شكله حلو وخلاص. التسويق بالنسبة لنا أداة عملية تفتح لبيزنسك أبواب جديدة، وتحقق نمو واضح في مبيعاتك وانتشارك في السوق.</p>`
);

// Update CTA button text if applicable
html = html.replace(/<span class="cta-label"[^>]*>[\s\S]*?<\/span>/, '<span class="cta-label" data-i18n="hero.cta">ابدأ رحلة نموك معنا</span>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Updated index.html');

// 2. Update locales/ar.json
if (fs.existsSync('locales/ar.json')) {
  const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf8'));
  ar['hero.title.line1'] = "نكبّر قيمة براندك";
  ar['hero.title.line2'] = "بحلول تسويق رقمي متكاملة،";
  ar['hero.title.line3'] = "ونتائج حقيقية تشوفها على أرض الواقع.";
  ar['hero.title'] = "نكبّر قيمة براندك بحلول تسويق رقمي متكاملة";
  ar['hero.sub2'] = "في PR Agency، بنؤمن إن التسويق مش رفاهية ولا مجرد محتوى شكله حلو وخلاص. التسويق بالنسبة لنا أداة عملية تفتح لبيزنسك أبواب جديدة، وتحقق نمو واضح في مبيعاتك وانتشارك في السوق.";
  ar['hero.cta'] = "ابدأ رحلة نموك معنا";
  fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2), 'utf8');
  console.log('Updated locales/ar.json');
}

// 3. Update locales/en.json
if (fs.existsSync('locales/en.json')) {
  const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf8'));
  en['hero.title.line1'] = "Elevating Your Brand";
  en['hero.title.line2'] = "With Complete Digital Solutions,";
  en['hero.title.line3'] = "And Real Growth You Can Measure.";
  en['hero.title'] = "Elevating Your Brand With Complete Digital Solutions";
  en['hero.sub2'] = "At PR Agency, we believe marketing isn't a luxury or just nice-looking content. For us, marketing is a practical tool that opens new opportunities and drives clear growth in your sales and visibility.";
  en['hero.cta'] = "Start Your Growth Journey";
  fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2), 'utf8');
  console.log('Updated locales/en.json');
}
