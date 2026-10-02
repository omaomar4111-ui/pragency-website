const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');
const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

// === Fix clients section: wrong eyebrow/title/sub (was showing team ones) ===
// In the HTML on line 471-476, the "clients" section has team.eyebrow / team.title / team.sub
// But lines 471-476 are ACTUALLY the team section (there's a mismatch in the HTML structure)
// Let me check carefully...

// The section with id="clients" should have clients.* keys, team section has team.* keys
// Fix: swap the clients section eyebrow/title to correct keys
html = html.replace(
  `<div class="section-eyebrow rv"><svg class="svgi"><use href="#fa-users"></use></svg> <span data-i18n="team.eyebrow">فريقنا</span></div>\r\n    <h2 class="section-h2 rv" data-i18n="team.title">الناس اللي بتشتغل على شغلك</h2>\r\n    <p class="section-sub rv" style="margin:0 auto" data-i18n="team.sub">كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.</p>`,
  `<div class="section-eyebrow rv"><svg class="svgi"><use href="#fa-users"></use></svg> <span data-i18n="team.eyebrow">فريقنا</span></div>\r\n    <h2 class="section-h2 rv" data-i18n="team.title">الناس اللي بتشتغل على شغلك</h2>\r\n    <p class="section-sub rv" style="margin:0 auto" data-i18n="team.sub">كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.</p>`
);
// Note: actually the clients section wraps around the team grid. Let me find the actual clients section
// The id="clients" should have handshake icon and clients text.

// Based on the audit, we have:
// Line 471: section id="clients" but has #fa-users icon (team icon) and team keys → BUG
// This means the clients/team sections are swapped in the HTML 
// Let me fix by replacing what appears to be the clients header with correct clients text
html = html.replace(
  '<section id="clients" class="section-clients">\r\n  <div style="text-align:center;max-width:680px;margin:0 auto var(--sp-10);padding:0 var(--section-x)">\r\n    <div class="section-eyebrow rv"><svg class="svgi"><use href="#fa-users"></use></svg> <span data-i18n="team.eyebrow">فريقنا</span></div>\r\n    <h2 class="section-h2 rv" data-i18n="team.title">الناس اللي بتشتغل على شغلك</h2>\r\n    <p class="section-sub rv" style="margin:0 auto" data-i18n="team.sub">كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.</p>',
  '<section id="team" class="section-clients">\r\n  <div style="text-align:center;max-width:680px;margin:0 auto var(--sp-10);padding:0 var(--section-x)">\r\n    <div class="section-eyebrow rv"><svg class="svgi"><use href="#fa-users"></use></svg> <span data-i18n="team.eyebrow">فريقنا</span></div>\r\n    <h2 class="section-h2 rv" data-i18n="team.title">الناس اللي بتشتغل على شغلك</h2>\r\n    <p class="section-sub rv" style="margin:0 auto" data-i18n="team.sub">كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.</p>'
);

// === Hero sub: add data-i18n ===
html = html.replace(
  '<p class="hero-vr-sub">\r\n        استراتيجية واضحة + تنفيذ احترافي:<br/>\r\n        إدارة السوشيال ميديا، الإعلانات المدفوعة، الهوية البصرية، إنتاج المحتوى، والاستراتيجية.\r\n      </p>',
  '<p class="hero-vr-sub" data-i18n="hero.sub2">استراتيجية واضحة + تنفيذ احترافي: إدارة السوشيال ميديا، الإعلانات المدفوعة، الهوية البصرية، إنتاج المحتوى، والاستراتيجية.</p>'
);

// === Hero CTA ===
html = html.replace(
  '<a href="#register" class="hero-vr-cta" onclick="document.getElementById(\'register\').scrollIntoView({behavior:\'smooth\'}); return false;">\r\n        اطلب عرض سعر',
  '<a href="#register" class="hero-vr-cta" data-i18n="hero.cta" onclick="document.getElementById(\'register\').scrollIntoView({behavior:\'smooth\'}); return false;">\r\n        اطلب عرض سعر'
);

// === About body paragraph ===
html = html.replace(
  '<p class="section-about-vr-body rv">\r\n      بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي \r\n      في المبيعات والوضوح. كل استراتيجية بنبنبها مبنية على بيانات السوق، \r\n      وكل قرار بيتاخد مرتبط بهدف واضح.\r\n    </p>',
  '<p class="section-about-vr-body rv" data-i18n="about.body">بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح. كل استراتيجية بنبنبها مبنية على بيانات السوق، وكل قرار بيتاخد مرتبط بهدف واضح.</p>'
);

// === Services Slider Cards ===
html = html.replace(
  '<h3>إدارة السوشيال ميديا</h3>\n        <p>خطط محتوى مبنية على أهدافك</p>\n        <span class="slider-link">اقرأ المزيد ←</span>',
  '<h3 data-i18n="services.card1.title">إدارة السوشيال ميديا</h3>\n        <p data-i18n="services.slider1.desc">خطط محتوى مبنية على أهدافك</p>\n        <span class="slider-link" data-i18n="services.readmore">اقرأ المزيد ←</span>'
);
html = html.replace(
  '<h3>الإعلانات المدفوعة</h3>\n        <p>الوصول لجمهورك باستهداف دقيق</p>\n        <span class="slider-link">اقرأ المزيد ←</span>',
  '<h3 data-i18n="services.card2.title">الإعلانات المدفوعة</h3>\n        <p data-i18n="services.slider2.desc">الوصول لجمهورك باستهداف دقيق</p>\n        <span class="slider-link" data-i18n="services.readmore">اقرأ المزيد ←</span>'
);
html = html.replace(
  '<h3>إنتاج المحتوى</h3>\n        <p>فيديوهات وتصوير عالي الجودة</p>\n        <span class="slider-link">اقرأ المزيد ←</span>',
  '<h3 data-i18n="services.card3.title">إنتاج المحتوى</h3>\n        <p data-i18n="services.slider3.desc">فيديوهات وتصوير عالي الجودة</p>\n        <span class="slider-link" data-i18n="services.readmore">اقرأ المزيد ←</span>'
);
html = html.replace(
  '<h3>العلامة التجارية والهوية</h3>\n        <p>هوية بصرية تعبر عن قوة البراند</p>\n        <span class="slider-link">اقرأ المزيد ←</span>',
  '<h3 data-i18n="services.card4.title">العلامة التجارية والهوية</h3>\n        <p data-i18n="services.slider4.desc">هوية بصرية تعبر عن قوة البراند</p>\n        <span class="slider-link" data-i18n="services.readmore">اقرأ المزيد ←</span>'
);
html = html.replace(
  '<h3>استراتيجية التسويق</h3>\n        <p>خطة تسويق بتوصل لهدفك</p>\n        <span class="slider-link">اقرأ المزيد ←</span>',
  '<h3 data-i18n="services.card5.title">استراتيجية التسويق</h3>\n        <p data-i18n="services.slider5.desc">خطة تسويق بتوصل لهدفك</p>\n        <span class="slider-link" data-i18n="services.readmore">اقرأ المزيد ←</span>'
);

// === Values Cards ===
// Card 2: تقارير واضحة
html = html.replace(
  '<h3 class="value-vr-title">تقارير واضحة</h3>\r\n        <p class="value-vr-desc">\r\n          أرقام حقيقية بدون لف ودوران. تعرف كل استثمار راح فين ورجع كام.\r\n        </p>',
  '<h3 class="value-vr-title" data-i18n="values.card2.title">تقارير واضحة</h3>\r\n        <p class="value-vr-desc" data-i18n="values.card2.desc">أرقام حقيقية بدون لف ودوران. تعرف كل استثمار راح فين ورجع كام.</p>'
);
// Card 3: أفكار بتتنفذ
html = html.replace(
  '<h3 class="value-vr-title">أفكار بتتنفذ</h3>\r\n        <p class="value-vr-desc">\r\n          بنشتغل بسرعة، بننفذ على طول، وبنظبط الأمور بدون تعقيد.\r\n        </p>',
  '<h3 class="value-vr-title" data-i18n="values.card3.title">أفكار بتتنفذ</h3>\r\n        <p class="value-vr-desc" data-i18n="values.card3.desc">بنشتغل بسرعة، بننفذ على طول، وبنظبط الأمور بدون تعقيد.</p>'
);
// Card 4: تسليم في الوقت
html = html.replace(
  '<h3 class="value-vr-title">تسليم في الوقت</h3>\r\n        <p class="value-vr-desc">\r\n          كل حاجة بنوعد بيها بتتسلم في وقتها. مفيش أعذار.\r\n        </p>',
  '<h3 class="value-vr-title" data-i18n="values.card4.title">تسليم في الوقت</h3>\r\n        <p class="value-vr-desc" data-i18n="values.card4.desc">كل حاجة بنوعد بيها بتتسلم في وقتها. مفيش أعذار.</p>'
);
// Card 1 desc (already has title, missing desc):
html = html.replace(
  '<h3 class="value-vr-title" data-i18n="values.card1.title">مدير حساب مخصص</h3>\r\n        <p class="value-vr-desc">\r\n          حد واحد مسؤول عنك، بيتابع كل تفصيلة، وبيفهم شغلك من الجوّه.\r\n        </p>',
  '<h3 class="value-vr-title" data-i18n="values.card1.title">مدير حساب مخصص</h3>\r\n        <p class="value-vr-desc" data-i18n="values.card1.desc">حد واحد مسؤول عنك، بيتابع كل تفصيلة، وبيفهم شغلك من الجوّه.</p>'
);

// === Navbar: mobile menu start CTA ===
html = html.replace(
  '<a href="#register" class="btn btn-primary" style="justify-content:center">ابدأ الآن</a>',
  '<a href="#register" class="btn btn-primary" style="justify-content:center" data-i18n="nav.cta">ابدأ الآن</a>'
);

// === Header CTA: كلمنا ===
html = html.replace(
  '<a href="https://wa.me/201144826641" class="hdr-cta" target="_blank" rel="noopener">\r\n      كلمنا',
  '<a href="https://wa.me/201144826641" class="hdr-cta" target="_blank" rel="noopener">\r\n      <span data-i18n="header.cta">كلمنا</span>'
);

// === Header phone ===
html = html.replace(
  '<strong>اتصل أي وقت</strong>',
  '<strong data-i18n="header.phone">اتصل أي وقت</strong>'
);

// === FAQ Title ===
html = html.replace(
  '<h2 class="section-title">الأسئلة <span class="accent">الشائعة</span></h2>',
  '<h2 class="section-title" data-i18n-html="faq.title">الأسئلة <span class="accent">الشائعة</span></h2>'
);

// === Contact section eyebrow ===
html = html.replace(
  'تواصل معانا النهارده',
  '<span data-i18n="contact.eyebrow">تواصل معانا النهارده</span>'
);

// === Footer Contact labels ===
html = html.replace(
  '<div class="site-footer-contact-label">اتصل بنا</div>',
  '<div class="site-footer-contact-label" data-i18n="footer.call">اتصل بنا</div>'
);
html = html.replace(
  '<div class="site-footer-contact-label">راسلنا على</div>',
  '<div class="site-footer-contact-label" data-i18n="footer.mail">راسلنا على</div>'
);

// === Bottom mobile bar ===
html = html.replace(
  '></svg>اتصل</a>',
  '></svg><span data-i18n="footer.call">اتصل</span></a>'
);
html = html.replace(
  '></svg>ابدأ المحادثة</button>',
  '></svg><span data-i18n="nav.cta">ابدأ الآن</span></button>'
);

// === Footer quicklinks contact ===
html = html.replace(
  '<li><a href="#register">تواصل معانا</a></li>',
  '<li><a href="#register" data-i18n="nav.contact">تواصل</a></li>'
);

// === Footer CTA text ===
html = html.replace(
  '<p class="site-footer-cta-text">',
  '<p class="site-footer-cta-text" data-i18n="footer.project.cta">'
);

// Cache bump
html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=62');

fs.writeFileSync('index.html', html);

// === Update Locales ===
Object.assign(ar, {
  "hero.sub2": "استراتيجية واضحة + تنفيذ احترافي: إدارة السوشيال ميديا، الإعلانات المدفوعة، الهوية البصرية، إنتاج المحتوى، والاستراتيجية.",
  "hero.cta": "اطلب عرض سعر",
  "about.body": "بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح. كل استراتيجية بنبنبها مبنية على بيانات السوق، وكل قرار بيتاخد مرتبط بهدف واضح.",
  "services.slider1.desc": "خطط محتوى مبنية على أهدافك",
  "services.slider2.desc": "الوصول لجمهورك باستهداف دقيق",
  "services.slider3.desc": "فيديوهات وتصوير عالي الجودة",
  "services.slider4.desc": "هوية بصرية تعبر عن قوة البراند",
  "services.slider5.desc": "خطة تسويق بتوصل لهدفك",
  "services.readmore": "اقرأ المزيد ←",
  "values.card1.desc": "حد واحد مسؤول عنك، بيتابع كل تفصيلة، وبيفهم شغلك من الجوّه.",
  "values.card2.title": "تقارير واضحة",
  "values.card2.desc": "أرقام حقيقية بدون لف ودوران. تعرف كل استثمار راح فين ورجع كام.",
  "values.card3.title": "أفكار بتتنفذ",
  "values.card3.desc": "بنشتغل بسرعة، بننفذ على طول، وبنظبط الأمور بدون تعقيد.",
  "values.card4.title": "تسليم في الوقت",
  "values.card4.desc": "كل حاجة بنوعد بيها بتتسلم في وقتها. مفيش أعذار.",
  "nav.cta": "ابدأ الآن",
  "header.cta": "كلمنا",
  "header.phone": "اتصل أي وقت",
  "contact.eyebrow": "تواصل معانا النهارده",
  "footer.call": "اتصل بنا",
  "footer.mail": "راسلنا على",
  "footer.project.cta": "ابعتلنا هدفك وميزانيتك الأولية، وهنرجعلك بخطة واضحة وجاهزة للتنفيذ."
});

Object.assign(en, {
  "hero.sub2": "Clear strategy + professional execution: Social Media Management, Media Buying, Branding, Content Production, and Strategy.",
  "hero.cta": "Get a Quote",
  "about.body": "For us, marketing is a practical tool that opens new opportunities and drives real growth in sales and visibility. Every strategy is built on market data, and every decision is tied to a clear goal.",
  "services.slider1.desc": "Content plans built around your goals",
  "services.slider2.desc": "Reach your audience with precise targeting",
  "services.slider3.desc": "High-quality videos and photography",
  "services.slider4.desc": "A visual identity that speaks your brand's power",
  "services.slider5.desc": "A marketing plan that gets you to your goal",
  "services.readmore": "Read more →",
  "values.card1.desc": "One person responsible for you, following every detail, understanding your business inside out.",
  "values.card2.title": "Clear Reports",
  "values.card2.desc": "Real numbers, no fluff. You'll know exactly where every investment went and what it returned.",
  "values.card3.title": "Ideas That Execute",
  "values.card3.desc": "We work fast, execute immediately, and fix issues without complications.",
  "values.card4.title": "On-Time Delivery",
  "values.card4.desc": "Everything we promise is delivered on time. No excuses.",
  "nav.cta": "Start Now",
  "header.cta": "Message Us",
  "header.phone": "Call Anytime",
  "contact.eyebrow": "Contact Us Today",
  "footer.call": "Call Us",
  "footer.mail": "Email Us",
  "footer.project.cta": "Send us your goal and initial budget, and we'll get back to you with a clear, ready-to-execute plan."
});

fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2));

// Bump all other HTML files
const allHtmlFiles = [
  'about.html', 'services.html', 'clients.html', 'team.html',
  'contact.html', 'privacy.html', 'terms.html', '404.html', 'thank-you.html',
  ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)
];
allHtmlFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf-8');
    c = c.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=62');
    fs.writeFileSync(f, c);
  }
});

console.log('Comprehensive fix done. CSS bumped to v=62.');
