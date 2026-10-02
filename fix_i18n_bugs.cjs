const fs = require('fs');

// 1. i18n.js innerHTML fix
let i18n = fs.readFileSync('js/i18n.js', 'utf-8');
const applyTranslationsOld = /function applyTranslations\(\) \{[\s\S]*?\}\n/m;
const applyTranslationsNew = `function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.dataset.i18n;
    const val = translations[key];
    if (!val) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else if (/<[a-z][\\s\\S]*>/i.test(val)) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    const key = el.dataset.i18nHtml;
    if (translations[key]) el.innerHTML = translations[key];
  });
}
`;
i18n = i18n.replace(applyTranslationsOld, applyTranslationsNew);
fs.writeFileSync('js/i18n.js', i18n);

// 2. Fix locales hero keys (remove HTML from hero lines)
const arLocales = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const enLocales = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

arLocales['hero.title.line1'] = "نحرّك براندك";
arLocales['hero.title.line2'] = "للأمام";
arLocales['hero.title.line3'] = "بسرعة وذكاء استراتيجي.";
arLocales['hero.sub'] = "استراتيجية واضحة + تنفيذ احترافي:";
arLocales['hero.cta'] = "اطلب عرض سعر";

enLocales['hero.title.line1'] = "Move Your Brand";
enLocales['hero.title.line2'] = "Forward";
enLocales['hero.title.line3'] = "Fast and Strategically.";
enLocales['hero.sub'] = "Clear strategy + professional execution:";
enLocales['hero.cta'] = "Get a Quote";

// 3. Values and Services missing keys
const newAR = {
  "services.card1.title": "إدارة السوشيال ميديا",
  "services.card1.desc": "إدارة كاملة لحساباتك لزيادة التفاعل والمبيعات.",
  "services.card2.title": "الإعلانات المدفوعة",
  "services.card2.desc": "حملات إعلانية ذكية تستهدف عميلك الصح.",
  "services.card3.title": "إنتاج المحتوى",
  "services.card3.desc": "تصوير ومونتاج يبرز قيمة براندك.",
  "services.card4.title": "العلامة التجارية",
  "services.card4.desc": "تصميم هوية بصرية تعلق في ذهن العميل.",
  "services.card5.title": "استراتيجية التسويق",
  "services.card5.desc": "خطة عمل متكاملة تقودك للنمو.",
  "values.card1.title": "شراكة مش بس شغل",
  "values.card1.desc": "بنعتبر نفسنا جزء من فريقك، نجاحك هو نجاحنا.",
  "values.card2.title": "فريق متخصص",
  "values.card2.desc": "كل خدمة بيقوم بيها خبير في مجاله، مفيش حد بيعمل كل حاجة.",
  "values.card3.title": "أرقام بتثبت نجاحنا",
  "values.card3.desc": "بنقيس كل خطوة وبنحلل النتائج عشان نضمن أفضل ROI.",
  "values.card4.title": "تنفيذ سريع",
  "values.card4.desc": "في عالم التسويق الوقت بفلوس، وإحنا بنقدر ده كويس.",
  "about.title": "وكالتك لنمو أسرع",
  "cta.contactUs": "تواصل معنا"
};

const newEN = {
  "services.card1.title": "Social Media Management",
  "services.card1.desc": "Full management of your accounts to increase engagement and sales.",
  "services.card2.title": "Media Buying",
  "services.card2.desc": "Smart ad campaigns targeting the right customer.",
  "services.card3.title": "Content Production",
  "services.card3.desc": "Photography and video editing highlighting your brand value.",
  "services.card4.title": "Branding",
  "services.card4.desc": "Designing a visual identity that sticks in your customer's mind.",
  "services.card5.title": "Marketing Strategy",
  "services.card5.desc": "Integrated action plan leading you to growth.",
  "values.card1.title": "Partnership, Not Just Work",
  "values.card1.desc": "We consider ourselves part of your team. Your success is our success.",
  "values.card2.title": "Specialized Team",
  "values.card2.desc": "Every service is done by an expert. No jacks-of-all-trades here.",
  "values.card3.title": "Numbers Prove Our Success",
  "values.card3.desc": "We measure every step and analyze results for the best ROI.",
  "values.card4.title": "Fast Execution",
  "values.card4.desc": "In marketing, time is money. We appreciate that.",
  "about.title": "Your Agency For Faster Growth",
  "cta.contactUs": "Contact Us"
};

Object.assign(arLocales, newAR);
Object.assign(enLocales, newEN);

fs.writeFileSync('locales/ar.json', JSON.stringify(arLocales, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(enLocales, null, 2));

// 4. Update index.html DOM
let html = fs.readFileSync('index.html', 'utf-8');

// Services section cards (matching titles inside the slider)
// "إدارة السوشيال ميديا"
html = html.replace(/<div class="sc-title">إدارة السوشيال ميديا<\/div>/, '<div class="sc-title" data-i18n="services.card1.title">إدارة السوشيال ميديا</div>');
html = html.replace(/إدارة كاملة لحساباتك لزيادة التفاعل والمبيعات\./, '<span data-i18n="services.card1.desc">إدارة كاملة لحساباتك لزيادة التفاعل والمبيعات.</span>');
// "الإعلانات المدفوعة"
html = html.replace(/<div class="sc-title">الإعلانات المدفوعة<\/div>/, '<div class="sc-title" data-i18n="services.card2.title">الإعلانات المدفوعة</div>');
html = html.replace(/حملات إعلانية ذكية تستهدف عميلك الصح\./, '<span data-i18n="services.card2.desc">حملات إعلانية ذكية تستهدف عميلك الصح.</span>');
// "إنتاج المحتوى"
html = html.replace(/<div class="sc-title">إنتاج المحتوى<\/div>/, '<div class="sc-title" data-i18n="services.card3.title">إنتاج المحتوى</div>');
html = html.replace(/تصوير ومونتاج يبرز قيمة براندك\./, '<span data-i18n="services.card3.desc">تصوير ومونتاج يبرز قيمة براندك.</span>');
// "العلامة التجارية"
html = html.replace(/<div class="sc-title">العلامة التجارية<\/div>/, '<div class="sc-title" data-i18n="services.card4.title">العلامة التجارية</div>');
html = html.replace(/تصميم هوية بصرية تعلق في ذهن العميل\./, '<span data-i18n="services.card4.desc">تصميم هوية بصرية تعلق في ذهن العميل.</span>');
// "استراتيجية التسويق"
html = html.replace(/<div class="sc-title">استراتيجية التسويق<\/div>/, '<div class="sc-title" data-i18n="services.card5.title">استراتيجية التسويق</div>');
html = html.replace(/خطة عمل متكاملة تقودك للنمو\./, '<span data-i18n="services.card5.desc">خطة عمل متكاملة تقودك للنمو.</span>');

// Values cards
html = html.replace(/<h3>شراكة مش بس شغل<\/h3>/, '<h3 data-i18n="values.card1.title">شراكة مش بس شغل</h3>');
html = html.replace(/<p>بنعتبر نفسنا جزء من فريقك، نجاحك هو نجاحنا\./, '<p data-i18n="values.card1.desc">بنعتبر نفسنا جزء من فريقك، نجاحك هو نجاحنا.');
html = html.replace(/<h3>فريق متخصص<\/h3>/, '<h3 data-i18n="values.card2.title">فريق متخصص</h3>');
html = html.replace(/<p>كل خدمة بيقوم بيها خبير في مجاله، مفيش حد بيعمل كل حاجة\./, '<p data-i18n="values.card2.desc">كل خدمة بيقوم بيها خبير في مجاله، مفيش حد بيعمل كل حاجة.');
html = html.replace(/<h3>أرقام بتثبت نجاحنا<\/h3>/, '<h3 data-i18n="values.card3.title">أرقام بتثبت نجاحنا</h3>');
html = html.replace(/<p>بنقيس كل خطوة وبنحلل النتائج عشان نضمن أفضل ROI\./, '<p data-i18n="values.card3.desc">بنقيس كل خطوة وبنحلل النتائج عشان نضمن أفضل ROI.');
html = html.replace(/<h3>تنفيذ سريع<\/h3>/, '<h3 data-i18n="values.card4.title">تنفيذ سريع</h3>');
html = html.replace(/<p>في عالم التسويق الوقت بفلوس، وإحنا بنقدر ده كويس\./, '<p data-i18n="values.card4.desc">في عالم التسويق الوقت بفلوس، وإحنا بنقدر ده كويس.');

// Contact circle
html = html.replace(/<span>تواصل معنا<\/span>/g, '<span data-i18n="cta.contactUs">تواصل معنا</span>');

// About title
html = html.replace(/<h2 class="section-title rv">وكالتك لنمو أسرع<\/h2>/, '<h2 class="section-title rv" data-i18n="about.title">وكالتك لنمو أسرع</h2>');

// Cache bump
html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=57');

fs.writeFileSync('index.html', html);

// Update cache in other files
const srvFiles = fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f);
const allHtmlFiles = [...fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'index.html'), ...srvFiles];
allHtmlFiles.forEach(f => {
  let htmlCont = fs.readFileSync(f, 'utf-8');
  htmlCont = htmlCont.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=57');
  fs.writeFileSync(f, htmlCont);
});

console.log('Done fixing rendering bugs.');
