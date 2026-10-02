const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');
const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

html = html.replace(
  '<span>القاهرة — مصر</span>',
  '<span data-i18n="footer.location.val">القاهرة — مصر</span>'
);

html = html.replace(
  'السابق\n                </button>',
  '<span data-i18n="contact.prev">السابق</span>\n                </button>'
);

html = html.replace(
  'ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ.',
  '<span data-i18n="contact.desc">ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ.</span>'
);

html = html.replace(
  '<div style="text-align:center;color:var(--c-w50);padding:20px">جارٍ تحميل الأسئلة...</div>',
  '<div style="text-align:center;color:var(--c-w50);padding:20px" data-i18n="faq.loading">جارٍ تحميل الأسئلة...</div>'
);

ar['faq.loading'] = "جارٍ تحميل الأسئلة...";
en['faq.loading'] = "Loading questions...";

fs.writeFileSync('index.html', html);
fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2));

console.log('Final touch-ups complete.');
