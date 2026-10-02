const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');
html = html.replace(/<span data-i18n="services.title">.*?<\/span>\s*<span>.*?<\/span>/, '<span data-i18n-html="services.title">حلول تسويق <span>متكاملة</span></span>');

// Also make sure footer brand and rights are properly structured without dangling arabic
html = html.replace(/<span data-i18n="footer.brand">PR Agency<\/span> — <span data-i18n="footer.rights">كل الحقوق محفوظة.<\/span>/, '<span data-i18n="footer.brand">PR Agency</span> — <span data-i18n="footer.rights">كل الحقوق محفوظة.</span>');

fs.writeFileSync('index.html', html);

let ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
let en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));
ar['services.title'] = 'حلول تسويق <span class="accent">متكاملة</span>';
en['services.title'] = 'Integrated Marketing <span class="accent">Solutions</span>';
fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2));

console.log('Final touchups done.');
