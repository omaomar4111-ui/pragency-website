const fs = require('fs');

// 1. UPDATE i18n.js to support innerHTML properly
let i18n = fs.readFileSync('js/i18n.js', 'utf-8');
const applyTranslationsOld = /function applyTranslations\(\) \{[\s\S]*?\}\n/m;
const applyTranslationsNew = `function applyTranslations() {
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
}
`;
i18n = i18n.replace(applyTranslationsOld, applyTranslationsNew);
fs.writeFileSync('js/i18n.js', i18n);

// 2. READ locales
const arLocales = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const enLocales = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

// 3. ADD MISSING KEYS
Object.assign(arLocales, {
  "hero.sub": "استراتيجية واضحة + تنفيذ احترافي: إدارة السوشيال ميديا، الإعلانات المدفوعة، الهوية البصرية، إنتاج المحتوى، والاستراتيجية.",
  "services.card1.title": "إدارة السوشيال ميديا",
  "services.card1.desc": "إدارة احترافية لحساباتك على كل المنصات، بمحتوى يبني علاقة حقيقية مع جمهورك.",
  "services.card2.title": "الإعلانات المدفوعة",
  "services.card2.desc": "حملات مدفوعة على Meta وGoogle وTikTok — مستهدفة بأعلى دقة وعائد قابل للقياس.",
  "services.card3.title": "إنتاج المحتوى",
  "services.card3.desc": "تصوير ومونتاج يبرز قيمة براندك بشكل احترافي، ويخليه يعلق في ذهن العميل.",
  "services.card4.title": "العلامة التجارية",
  "services.card4.desc": "تصميم هوية بصرية كاملة متسقة مع شخصية البراند بتاعتك.",
  "services.card5.title": "استراتيجية التسويق",
  "services.card5.desc": "خطة عمل متكاملة تقودك للنمو، مبنية على تحليل دقيق للسوق والمنافسين.",
  "values.card1.title": "مدير حساب مخصص",
  "values.card1.desc": "حد واحد مسؤول عنك، بيتابع كل تفصيلة، وبيفهم شغلك من الجوّه.",
  "values.card2.title": "فريق متخصص",
  "values.card2.desc": "كل خدمة بيقوم بيها خبير في مجاله، مفيش حد بيعمل كل حاجة.",
  "values.card3.title": "أرقام بتثبت نجاحنا",
  "values.card3.desc": "بنقيس كل خطوة وبنحلل النتائج عشان نضمن أفضل ROI.",
  "values.card4.title": "تنفيذ سريع",
  "values.card4.desc": "في عالم التسويق الوقت بفلوس، وإحنا بنقدر ده كويس.",
  "about.title": "وكالتك لنمو أسرع",
  "about.lead": "في PR Agency، بنؤمن إن التسويق مش مجرد <span class=\"accent\">\"محتوى شكله حلو\"</span>.",
  "about.body": "بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح.",
  "marquee.service1": "إدارة السوشيال ميديا",
  "marquee.service2": "الإعلانات المدفوعة",
  "marquee.service3": "العلامة التجارية والهوية",
  "marquee.service4": "إنتاج المحتوى",
  "marquee.service5": "استراتيجية التسويق",
  "cta.contactUs": "تواصل معنا",
  "team.title": "الناس اللي <span class=\"accent\">بتشتغل</span> على شغلك",
  "team.sub": "كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.",
  "clients.title": "علامات <span class=\"accent\">تثق فينا</span>",
  "clients.sub": "+19 براند اشتغلنا معاهم في مجالات مختلفة.",
  "faq.title": "الأسئلة <span class=\"accent\">الشائعة</span>",
  "faq.sub": "جمعنا لك أبرز الأسئلة اللي ممكن تدور في بالك عن خدماتنا وطريقة عملنا.",
  "footer.brand": "PR Agency",
  "footer.rights": "كل الحقوق محفوظة.",
  "footer.location": "المقر",
  "footer.location.val": "القاهرة — مصر",
  "footer.phone": "فريق المبيعات",
  "footer.email": "تواصل إداري",
  "form.phone.ph": "01xxxxxxxxx"
});

Object.assign(enLocales, {
  "hero.sub": "Clear strategy + professional execution: Social Media Management, Media Buying, Branding, Content Production, and Strategy.",
  "services.card1.title": "Social Media Management",
  "services.card1.desc": "Professional management for your accounts across all platforms, with content that builds genuine connection with your audience.",
  "services.card2.title": "Media Buying",
  "services.card2.desc": "Paid campaigns on Meta, Google, and TikTok — highly targeted with measurable ROI.",
  "services.card3.title": "Content Production",
  "services.card3.desc": "Professional photography and editing that highlight your brand's value and make it memorable.",
  "services.card4.title": "Branding",
  "services.card4.desc": "Complete visual identity design consistent with your brand personality.",
  "services.card5.title": "Marketing Strategy",
  "services.card5.desc": "An integrated action plan leading to growth, based on precise market and competitor analysis.",
  "values.card1.title": "Dedicated Account Manager",
  "values.card1.desc": "One person responsible for you, following every detail, understanding your business inside out.",
  "values.card2.title": "Specialized Team",
  "values.card2.desc": "Every service is done by an expert. No jacks-of-all-trades here.",
  "values.card3.title": "Numbers Prove Our Success",
  "values.card3.desc": "We measure every step and analyze results to ensure the best ROI.",
  "values.card4.title": "Fast Execution",
  "values.card4.desc": "In marketing, time is money. We appreciate that completely.",
  "about.title": "Your Agency For Faster Growth",
  "about.lead": "At PR Agency, we believe marketing isn't just <span class=\"accent\">\"nice-looking content\"</span>.",
  "about.body": "For us, marketing is a practical tool that opens new opportunities and drives real sales and visibility growth.",
  "marquee.service1": "Social Media Management",
  "marquee.service2": "Media Buying",
  "marquee.service3": "Branding & Identity",
  "marquee.service4": "Content Production",
  "marquee.service5": "Marketing Strategy",
  "cta.contactUs": "Contact Us",
  "team.title": "The People <span class=\"accent\">Working</span> For You",
  "team.sub": "Everyone has a specific role — a team that knows its job inside out.",
  "clients.title": "Brands <span class=\"accent\">Trusting Us</span>",
  "clients.sub": "19+ brands we've worked with across different industries.",
  "faq.title": "Frequently Asked <span class=\"accent\">Questions</span>",
  "faq.sub": "We gathered the most common questions about our services and workflow.",
  "footer.brand": "PR Agency",
  "footer.rights": "All rights reserved.",
  "footer.location": "Headquarters",
  "footer.location.val": "Cairo — Egypt",
  "footer.phone": "Sales Team",
  "footer.email": "Admin Contact",
  "form.phone.ph": "01xxxxxxxxx"
});

fs.writeFileSync('locales/ar.json', JSON.stringify(arLocales, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(enLocales, null, 2));

// 4. FIX HTML (index.html, about.html, etc.)
const fixHTML = (file) => {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf-8');

  // Strip previously bad data-i18n replacements inside nested spans if any
  html = html.replace(/><span data-i18n="team\.title">الناس اللي بتشتغل على شغلك<\/span></, '>الناس اللي <span class="accent">بتشتغل</span> على شغلك<');
  html = html.replace(/><span data-i18n="clients\.title">علامات تثق فينا<\/span></, '>علامات <span class="accent">تثق فينا</span><');
  html = html.replace(/><span data-i18n="faq\.title">الأسئلة الشائعة<\/span></, '>الأسئلة <span class="accent">الشائعة</span><');

  // Hero Sub
  html = html.replace(/<p class="hero-vr-sub">.*?<\/p>/, '<p class="hero-vr-sub" data-i18n="hero.sub">استراتيجية واضحة + تنفيذ احترافي: إدارة السوشيال ميديا، الإعلانات المدفوعة، الهوية البصرية، إنتاج المحتوى، والاستراتيجية.</p>');
  html = html.replace(/<p class="hero-vr-sub" data-i18n="hero\.sub">.*?<\/p>/, '<p class="hero-vr-sub" data-i18n="hero.sub">استراتيجية واضحة + تنفيذ احترافي: إدارة السوشيال ميديا، الإعلانات المدفوعة، الهوية البصرية، إنتاج المحتوى، والاستراتيجية.</p>');

  // Services Cards
  html = html.replace(/<h3 class="service-vr-title">إدارة السوشيال ميديا<\/h3>/, '<h3 class="service-vr-title" data-i18n="services.card1.title">إدارة السوشيال ميديا</h3>');
  html = html.replace(/<p class="service-vr-desc">إدارة احترافية لحساباتك على كل المنصات، بمحتوى يبني علاقة حقيقية مع جمهورك\.\s*<\/p>/, '<p class="service-vr-desc" data-i18n="services.card1.desc">إدارة احترافية لحساباتك على كل المنصات، بمحتوى يبني علاقة حقيقية مع جمهورك.</p>');

  html = html.replace(/<h3 class="service-vr-title">الإعلانات المدفوعة<\/h3>/, '<h3 class="service-vr-title" data-i18n="services.card2.title">الإعلانات المدفوعة</h3>');
  html = html.replace(/<p class="service-vr-desc">حملات مدفوعة على Meta وGoogle وTikTok — مستهدفة بأعلى دقة وعائد قابل للقياس\.\s*<\/p>/, '<p class="service-vr-desc" data-i18n="services.card2.desc">حملات مدفوعة على Meta وGoogle وTikTok — مستهدفة بأعلى دقة وعائد قابل للقياس.</p>');

  html = html.replace(/<h3 class="service-vr-title">إنتاج المحتوى<\/h3>/, '<h3 class="service-vr-title" data-i18n="services.card3.title">إنتاج المحتوى</h3>');
  html = html.replace(/<p class="service-vr-desc">تصوير ومونتاج يبرز قيمة براندك بشكل احترافي، ويخليه يعلق في ذهن العميل\.\s*<\/p>/, '<p class="service-vr-desc" data-i18n="services.card3.desc">تصوير ومونتاج يبرز قيمة براندك بشكل احترافي، ويخليه يعلق في ذهن العميل.</p>');

  html = html.replace(/<h3 class="service-vr-title">العلامة التجارية<\/h3>/, '<h3 class="service-vr-title" data-i18n="services.card4.title">العلامة التجارية</h3>');
  html = html.replace(/<p class="service-vr-desc">تصميم هوية بصرية كاملة متسقة مع شخصية البراند بتاعتك\.\s*<\/p>/, '<p class="service-vr-desc" data-i18n="services.card4.desc">تصميم هوية بصرية كاملة متسقة مع شخصية البراند بتاعتك.</p>');

  html = html.replace(/<h3 class="service-vr-title">استراتيجية التسويق<\/h3>/, '<h3 class="service-vr-title" data-i18n="services.card5.title">استراتيجية التسويق</h3>');
  html = html.replace(/<p class="service-vr-desc">خطة عمل متكاملة تقودك للنمو، مبنية على تحليل دقيق للسوق والمنافسين\.\s*<\/p>/, '<p class="service-vr-desc" data-i18n="services.card5.desc">خطة عمل متكاملة تقودك للنمو، مبنية على تحليل دقيق للسوق والمنافسين.</p>');

  // Values Cards
  html = html.replace(/<h3 class="value-vr-title">مدير حساب مخصص<\/h3>/, '<h3 class="value-vr-title" data-i18n="values.card1.title">مدير حساب مخصص</h3>');
  html = html.replace(/<p class="value-vr-desc">حد واحد مسؤول عنك، بيتابع كل تفصيلة، وبيفهم شغلك من الجوّه\.\s*<\/p>/, '<p class="value-vr-desc" data-i18n="values.card1.desc">حد واحد مسؤول عنك، بيتابع كل تفصيلة، وبيفهم شغلك من الجوّه.</p>');

  html = html.replace(/<h3 class="value-vr-title">فريق متخصص<\/h3>/, '<h3 class="value-vr-title" data-i18n="values.card2.title">فريق متخصص</h3>');
  html = html.replace(/<p class="value-vr-desc">كل خدمة بيقوم بيها خبير في مجاله، مفيش حد بيعمل كل حاجة\.\s*<\/p>/, '<p class="value-vr-desc" data-i18n="values.card2.desc">كل خدمة بيقوم بيها خبير في مجاله، مفيش حد بيعمل كل حاجة.</p>');

  html = html.replace(/<h3 class="value-vr-title">أرقام بتثبت نجاحنا<\/h3>/, '<h3 class="value-vr-title" data-i18n="values.card3.title">أرقام بتثبت نجاحنا</h3>');
  html = html.replace(/<p class="value-vr-desc">بنقيس كل خطوة وبنحلل النتائج عشان نضمن أفضل ROI\.\s*<\/p>/, '<p class="value-vr-desc" data-i18n="values.card3.desc">بنقيس كل خطوة وبنحلل النتائج عشان نضمن أفضل ROI.</p>');

  html = html.replace(/<h3 class="value-vr-title">تنفيذ سريع<\/h3>/, '<h3 class="value-vr-title" data-i18n="values.card4.title">تنفيذ سريع</h3>');
  html = html.replace(/<p class="value-vr-desc">في عالم التسويق الوقت بفلوس، وإحنا بنقدر ده كويس\.\s*<\/p>/, '<p class="value-vr-desc" data-i18n="values.card4.desc">في عالم التسويق الوقت بفلوس، وإحنا بنقدر ده كويس.</p>');

  // About Section
  html = html.replace(/<h2 class="section-about-vr-title rv".*?>.*?<\/h2>/, '<h2 class="section-about-vr-title rv" data-i18n="about.title">وكالتك لنمو أسرع</h2>');
  html = html.replace(/<p class="section-about-vr-lead rv".*?>.*?<\/p>/, '<p class="section-about-vr-lead rv" data-i18n-html="about.lead">في PR Agency، بنؤمن إن التسويق مش مجرد <span class="accent">"محتوى شكله حلو"</span>.</p>');
  html = html.replace(/<p class="section-about-vr-body rv".*?>.*?<\/p>/, '<p class="section-about-vr-body rv" data-i18n="about.body">بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح.</p>');

  // Team, Clients, FAQ Titles
  html = html.replace(/<h2 class="section-h2 rv">الناس اللي <span class="accent">بتشتغل<\/span> على شغلك<\/h2>/, '<h2 class="section-h2 rv" data-i18n-html="team.title">الناس اللي <span class="accent">بتشتغل</span> على شغلك</h2>');
  html = html.replace(/<h2 class="section-h2 rv">علامات <span class="accent">تثق فينا<\/span><\/h2>/, '<h2 class="section-h2 rv" data-i18n-html="clients.title">علامات <span class="accent">تثق فينا</span></h2>');
  html = html.replace(/<h2 class="section-h2 rv">الأسئلة <span class="accent">الشائعة<\/span><\/h2>/, '<h2 class="section-h2 rv" data-i18n-html="faq.title">الأسئلة <span class="accent">الشائعة</span></h2>');

  html = html.replace(/<p class="section-sub rv">كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء\.\s*<\/p>/, '<p class="section-sub rv" data-i18n="team.sub">كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.</p>');
  html = html.replace(/<p class="section-sub rv">\+19 براند اشتغلنا معاهم في مجالات مختلفة\.\s*<\/p>/, '<p class="section-sub rv" data-i18n="clients.sub">+19 براند اشتغلنا معاهم في مجالات مختلفة.</p>');
  html = html.replace(/<p class="section-sub rv">جمعنا لك أبرز الأسئلة اللي ممكن تدور في بالك عن خدماتنا وطريقة عملنا\.\s*<\/p>/, '<p class="section-sub rv" data-i18n="faq.sub">جمعنا لك أبرز الأسئلة اللي ممكن تدور في بالك عن خدماتنا وطريقة عملنا.</p>');

  // Marquee
  html = html.replace(/<span>إدارة السوشيال ميديا<\/span>/g, '<span data-i18n="marquee.service1">إدارة السوشيال ميديا</span>');
  html = html.replace(/<span>الإعلانات المدفوعة<\/span>/g, '<span data-i18n="marquee.service2">الإعلانات المدفوعة</span>');
  html = html.replace(/<span>العلامة التجارية والهوية<\/span>/g, '<span data-i18n="marquee.service3">العلامة التجارية والهوية</span>');
  html = html.replace(/<span>إنتاج المحتوى<\/span>/g, '<span data-i18n="marquee.service4">إنتاج المحتوى</span>');
  html = html.replace(/<span>استراتيجية التسويق<\/span>/g, '<span data-i18n="marquee.service5">استراتيجية التسويق</span>');

  // Contact Placeholders (some input/textarea)
  html = html.replace(/placeholder="01xxxxxxxxx"/g, 'data-i18n="form.phone.ph" placeholder="01xxxxxxxxx"');

  // CTA Circles
  html = html.replace(/<span class="circle-cta-text">تواصل معنا<\/span>/g, '<span class="circle-cta-text" data-i18n="cta.contactUs">تواصل معنا</span>');
  // Just in case we already added it in phase 2:
  html = html.replace(/<span class="circle-cta-text" data-i18n="cta.contactUs">تواصل معنا<\/span>/g, '<span class="circle-cta-text" data-i18n="cta.contactUs">تواصل معنا</span>'); // dedup

  // Footer Titles & Contact info
  html = html.replace(/<div class="site-footer-contact-label">المقر<\/div>/, '<div class="site-footer-contact-label" data-i18n="footer.location">المقر</div>');
  html = html.replace(/<span class="site-footer-contact-value">القاهرة — مصر<\/span>/, '<span class="site-footer-contact-value" data-i18n="footer.location.val">القاهرة — مصر</span>');
  
  html = html.replace(/<div class="site-footer-contact-label">فريق المبيعات<\/div>/, '<div class="site-footer-contact-label" data-i18n="footer.phone">فريق المبيعات</div>');
  html = html.replace(/<div class="site-footer-contact-label">تواصل إداري<\/div>/, '<div class="site-footer-contact-label" data-i18n="footer.email">تواصل إداري</div>');

  html = html.replace(/<span id="footer-year">2026<\/span>\s*(<span data-i18n="footer.brand">)?PR Agency(<\/span>)?\s*—\s*(<span data-i18n="footer.rights">)?كل الحقوق محفوظة\.(<\/span>)?/, '<span id="footer-year">2026</span> <span data-i18n="footer.brand">PR Agency</span> — <span data-i18n="footer.rights">كل الحقوق محفوظة.</span>');

  // Cache Bump
  html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=58');

  // Ensure labels don't get double nested data-i18n
  html = html.replace(/data-i18n="[^"]+"\s+data-i18n="/g, 'data-i18n="');
  html = html.replace(/data-i18n-html="[^"]+"\s+data-i18n-html="/g, 'data-i18n-html="');

  fs.writeFileSync(file, html);
};

['index.html', 'about.html', 'services.html', 'clients.html', 'team.html'].forEach(fixHTML);

// 5. Update other files cache
const srvFiles = fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f);
const allHtmlFiles = [...fs.readdirSync('.').filter(f => f.endsWith('.html') && !['index.html', 'about.html', 'services.html', 'clients.html', 'team.html'].includes(f)), ...srvFiles];
allHtmlFiles.forEach(f => {
  let htmlCont = fs.readFileSync(f, 'utf-8');
  htmlCont = htmlCont.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=58');
  fs.writeFileSync(f, htmlCont);
});

// 6. Fix team.js, clients.js, faqs.js rendering if needed
// team.js
let teamJS = fs.readFileSync('js/team.js', 'utf-8');
if (!teamJS.includes('i18n:changed')) {
  teamJS += `\ndocument.addEventListener('i18n:changed', renderTeam);\n`;
  fs.writeFileSync('js/team.js', teamJS);
}

let clientsJS = fs.readFileSync('js/clients.js', 'utf-8');
if (!clientsJS.includes('i18n:changed')) {
  clientsJS += `\ndocument.addEventListener('i18n:changed', () => { if(typeof renderClientsMarquee === 'function') renderClientsMarquee(); });\n`;
  fs.writeFileSync('js/clients.js', clientsJS);
}

console.log('Complete coverage script finished.');
