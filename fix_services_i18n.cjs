const fs = require('fs');

// 1. Update locales
const arPath = 'locales/ar.json';
const enPath = 'locales/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf-8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

Object.assign(ar, {
  "services_page.main_title": "3 خدمات أساسية تحوّل براندك",
  "services_page.why_title": "ليه الخدمات دي مهمة؟",
  "services_page.why_desc": "مهما كان مجالك، الخدمات دي بتضمنلك:",
  "services_page.list1": "✓ حضور قوي على السوشيال ميديا",
  "services_page.list2": "✓ وصول أسرع لجمهورك المستهدف",
  "services_page.list3": "✓ منتجاتك وخدماتك تظهر بأفضل شكل"
});

Object.assign(en, {
  "services_page.main_title": "3 Essential Services to Transform Your Brand",
  "services_page.why_title": "Why Are These Services Important?",
  "services_page.why_desc": "Whatever your industry, these services guarantee:",
  "services_page.list1": "✓ Strong presence on social media",
  "services_page.list2": "✓ Faster reach to your target audience",
  "services_page.list3": "✓ Your products and services presented in the best light"
});

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

// 2. Fix services.html and services/index.html
const injectI18n = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf-8');

  // Inject into static titles
  html = html.replace(
    /<h2 class="section-title rv" style="text-align:center;color:#fff">3 خدمات أساسية تحوّل براندك<\/h2>/,
    '<h2 class="section-title rv" style="text-align:center;color:#fff" data-i18n="services_page.main_title">3 خدمات أساسية تحوّل براندك</h2>'
  );

  // Inject into the numbered cards
  // Note: numbered-card doesn't need text translation for "01", but the title does.
  // We already have 'service.social.title' from Phase 2 in the locales! Let's reuse those.
  html = html.replace(
    /<h3 class="numbered-title">إدارة السوشيال ميديا<\/h3>/g,
    '<h3 class="numbered-title" data-i18n="service.social.title">إدارة السوشيال ميديا</h3>'
  );
  html = html.replace(
    /<h3 class="numbered-title">الإعلانات المدفوعة<\/h3>/g,
    '<h3 class="numbered-title" data-i18n="service.media.title">الإعلانات المدفوعة</h3>'
  );
  html = html.replace(
    /<h3 class="numbered-title">إنتاج المحتوى<\/h3>/g,
    '<h3 class="numbered-title" data-i18n="service.content.title">إنتاج المحتوى</h3>'
  );

  // Inject into the 'why' section
  html = html.replace(
    /<h2 class="section-title" style="text-align:center;color:#A78BFA">ليه الخدمات دي مهمة؟<\/h2>/,
    '<h2 class="section-title" style="text-align:center;color:#A78BFA" data-i18n="services_page.why_title">ليه الخدمات دي مهمة؟</h2>'
  );
  html = html.replace(
    /<p class="section-desc" style="text-align:center;max-width:600px;margin:16px auto">مهما كان مجالك، الخدمات دي بتضمنلك:<\/p>/,
    '<p class="section-desc" style="text-align:center;max-width:600px;margin:16px auto" data-i18n="services_page.why_desc">مهما كان مجالك، الخدمات دي بتضمنلك:</p>'
  );
  
  html = html.replace(
    /<li>✓ حضور قوي على السوشيال ميديا<\/li>/,
    '<li data-i18n="services_page.list1">✓ حضور قوي على السوشيال ميديا</li>'
  );
  html = html.replace(
    /<li>✓ وصول أسرع لجمهورك المستهدف<\/li>/,
    '<li data-i18n="services_page.list2">✓ وصول أسرع لجمهورك المستهدف</li>'
  );
  html = html.replace(
    /<li>✓ منتجاتك وخدماتك تظهر بأفضل شكل<\/li>/,
    '<li data-i18n="services_page.list3">✓ منتجاتك وخدماتك تظهر بأفضل شكل</li>'
  );

  fs.writeFileSync(filePath, html);
};

injectI18n('services.html');
injectI18n('services/index.html');

// 3. Cache Busting (v=58 -> v=59)
const updateCache = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf-8');
  html = html.replace(/css\/pages\.css\?v=58/g, 'css/pages.css?v=59');
  fs.writeFileSync(filePath, html);
};

const allHtmlFiles = [
  'index.html', 'about.html', 'services.html', 'clients.html', 'team.html',
  'contact.html', 'privacy.html', 'terms.html', '404.html', 'thank-you.html',
  ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)
];

allHtmlFiles.forEach(updateCache);

console.log('Services page i18n injection complete. Cache busted to v=59.');
