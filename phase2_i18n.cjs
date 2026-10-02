const fs = require('fs');

// ----------------------------------------------------
// TASK 1 & 2: Update HTML files with data-i18n
// ----------------------------------------------------
const htmlPatch = (file) => {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf-8');

  // Nav
  html = html.replace(/>الرئيسية</g, ' data-i18n="nav.home">الرئيسية<');
  html = html.replace(/>عن الوكالة</g, ' data-i18n="nav.about">عن الوكالة<');
  html = html.replace(/>الخدمات</g, ' data-i18n="nav.services">الخدمات<');
  html = html.replace(/>الفريق</g, ' data-i18n="nav.team">الفريق<');
  html = html.replace(/>العملاء</g, ' data-i18n="nav.clients">العملاء<');
  html = html.replace(/>الأسئلة الشائعة</g, ' data-i18n="nav.faq">الأسئلة الشائعة<');
  html = html.replace(/>تواصل</g, ' data-i18n="nav.contact">تواصل<');

  // Hero
  html = html.replace(/نحرّك براندك/g, '<span data-i18n="hero.title.line1">نحرّك براندك</span>');
  html = html.replace(/للأمام/g, '<span data-i18n="hero.title.line2">للأمام</span>');
  html = html.replace(/بسرعة وذكاء استراتيجي\./g, '<span data-i18n="hero.title.line3">بسرعة وذكاء استراتيجي.</span>');
  html = html.replace(/>استراتيجية واضحة \+ تنفيذ احترافي:</g, ' data-i18n="hero.sub">استراتيجية واضحة + تنفيذ احترافي:<');
  html = html.replace(/>اطلب عرض سعر</g, ' data-i18n="hero.cta">اطلب عرض سعر<');

  // About
  html = html.replace(/>شريكك في النمو</g, ' data-i18n="about.eyebrow">شريكك في النمو<');
  html = html.replace(/>في PR Agency، بنؤمن إن التسويق مش مجرد "محتوى شكله حلو"\.</g, ' data-i18n="about.lead">في PR Agency، بنؤمن إن التسويق مش مجرد "محتوى شكله حلو".<');
  html = html.replace(/>بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح\.</g, ' data-i18n="about.body">بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح.<');
  html = html.replace(/>شوف المزيد عن الوكالة</g, ' data-i18n="about.more">شوف المزيد عن الوكالة<');

  // Services
  html = html.replace(/>خدماتنا</g, ' data-i18n="services.eyebrow">خدماتنا<');
  html = html.replace(/حلول تسويق <span>متكاملة<\/span>/g, '<span data-i18n="services.title">حلول تسويق</span> <span>متكاملة</span>'); 
  html = html.replace(/>كل خدمة مصممة تحقق هدف محدد لنمو البزنس بتاعك</g, ' data-i18n="services.sub">كل خدمة مصممة تحقق هدف محدد لنمو البزنس بتاعك<');
  html = html.replace(/>شوف كل الخدمات/g, ' data-i18n="services.more">شوف كل الخدمات'); // intentionally omitting < to catch cases with spans inside

  // Values
  html = html.replace(/>ليه تتشارك معانا\؟</g, ' data-i18n="values.title">ليه تتشارك معانا؟<');

  // Clients
  html = html.replace(/>شركاء نجاحنا</g, ' data-i18n="clients.eyebrow">شركاء نجاحنا<');
  html = html.replace(/>علامات <span>تثق فينا<\/span></g, '><span data-i18n="clients.title">علامات تثق فينا</span><');
  html = html.replace(/>\+19 براند اشتغلنا معاهم في مجالات مختلفة\.</g, ' data-i18n="clients.sub">+19 براند اشتغلنا معاهم في مجالات مختلفة.<');
  html = html.replace(/>شوف كل شركاء نجاحنا/g, ' data-i18n="clients.more">شوف كل شركاء نجاحنا');

  // Team
  html = html.replace(/>فريقنا</g, ' data-i18n="team.eyebrow">فريقنا<');
  html = html.replace(/>الناس اللي <span>بتشتغل<\/span> على شغلك</g, '><span data-i18n="team.title">الناس اللي بتشتغل على شغلك</span><');
  html = html.replace(/>كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء\.</g, ' data-i18n="team.sub">كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.<');
  html = html.replace(/>تعرّف على كل أعضاء الفريق/g, ' data-i18n="team.more">تعرّف على كل أعضاء الفريق');

  // FAQ
  html = html.replace(/>استفساراتك مجابة</g, ' data-i18n="faq.eyebrow">استفساراتك مجابة<');
  html = html.replace(/>الأسئلة <span>الشائعة<\/span></g, '><span data-i18n="faq.title">الأسئلة الشائعة</span><');
  html = html.replace(/>جمعنا لك أبرز الأسئلة اللي ممكن تدور في بالك عن خدماتنا وطريقة عملنا\.</g, ' data-i18n="faq.sub">جمعنا لك أبرز الأسئلة اللي ممكن تدور في بالك عن خدماتنا وطريقة عملنا.<');

  // Contact
  html = html.replace(/>تواصل معانا النهارده</g, ' data-i18n="contact.eyebrow">تواصل معانا النهارده<');
  html = html.replace(/خلينا ناخد/g, '<span data-i18n="contact.title.line1">خلينا ناخد</span>');
  html = html.replace(/أول خطوة/g, '<span data-i18n="contact.title.line2">أول خطوة</span>');
  html = html.replace(/سوا\./g, '<span data-i18n="contact.title.line3">سوا.</span>');
  html = html.replace(/>ابعتلنا هدفك وميزانيتك الأولية، وهنرجعلك بخطة واضحة وجاهزة للتنفيذ\.</g, ' data-i18n="contact.lead">ابعتلنا هدفك وميزانيتك الأولية، وهنرجعلك بخطة واضحة وجاهزة للتنفيذ.<');

  // Form
  html = html.replace(/placeholder="اسمك الكامل"/g, 'data-i18n="form.name.ph" placeholder="اسمك الكامل"');
  html = html.replace(/placeholder="01xxxxxxxxx"/g, 'data-i18n="form.phone.ph" placeholder="01xxxxxxxxx"');
  html = html.replace(/placeholder="عيادة \/ جيم \/ عقارات \/ متجر"/g, 'data-i18n="form.business.ph" placeholder="عيادة / جيم / عقارات / متجر"');
  html = html.replace(/placeholder="مثال: 15,000 EGP"/g, 'data-i18n="form.budget.ph" placeholder="مثال: 15,000 EGP"');
  html = html.replace(/placeholder="عايز تقولنا إيه\؟ اكتب هنا\.\.\."/g, 'data-i18n="form.message.ph" placeholder="عايز تقولنا إيه؟ اكتب هنا..."');
  
  html = html.replace(/>الاسم \*</g, ' data-i18n="form.name">الاسم *<');
  html = html.replace(/>رقم الموبايل \*</g, ' data-i18n="form.phone">رقم الموبايل *<');
  html = html.replace(/>نوع النشاط \*</g, ' data-i18n="form.business">نوع النشاط *<');
  html = html.replace(/>الميزانية الشهرية</g, ' data-i18n="form.budget">الميزانية الشهرية<');
  html = html.replace(/>رسالتك</g, ' data-i18n="form.message">رسالتك<');
  html = html.replace(/>احصل على استشارة مجانية</g, ' data-i18n="form.submit">احصل على استشارة مجانية<');

  // Footer
  html = html.replace(/>شريكك في تحقيق النمو — بسرعة وذكاء استراتيجي\.</g, ' data-i18n="footer.tagline">شريكك في تحقيق النمو — بسرعة وذكاء استراتيجي.<');
  html = html.replace(/>روابط سريعة</g, ' data-i18n="footer.quickLinks">روابط سريعة<');
  html = html.replace(/>عندك مشروع\؟ يلا نبدأ</g, ' data-i18n="footer.project.title">عندك مشروع؟ يلا نبدأ<');
  html = html.replace(/>ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ\.</g, ' data-i18n="footer.project.desc">ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ.<');
  html = html.replace(/>سياسة الخصوصية</g, ' data-i18n="footer.privacy">سياسة الخصوصية<');
  html = html.replace(/>شروط الاستخدام</g, ' data-i18n="footer.terms">شروط الاستخدام<');
  html = html.replace(/>كل الحقوق محفوظة\.</g, ' data-i18n="footer.rights">كل الحقوق محفوظة.<');

  // Dedup in case some were applied twice
  html = html.replace(/data-i18n="[^"]+"\s+data-i18n="/g, 'data-i18n="');
  html = html.replace(/<span data-i18n="[^"]+"><span data-i18n="([^"]+)">([^<]+)<\/span><\/span>/g, '<span data-i18n="$1">$2</span>');

  fs.writeFileSync(file, html);
};

['index.html', 'about.html', 'services.html', 'clients.html', 'team.html'].forEach(htmlPatch);

// ----------------------------------------------------
// TASK 3: services/*.html data-i18n & Locales Update
// ----------------------------------------------------
const arLocales = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const enLocales = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

const servicesData = [
  {
    id: "social-media", prefix: "service.social",
    title: "إدارة السوشيال ميديا", title_en: "Social Media Management",
    sub: "إدارة السوشيال مش مجرد بوستات. دي استراتيجية كاملة.", sub_en: "Social media is not just posts. It's a complete strategy.",
    pts: [
      "خطط محتوى مبنية على أهدافك (وعي ← عملاء ← مبيعات)",
      "تصميمات متسقة وهوية بصرية قوية",
      "كابشنز احترافية مكتوبة لجمهورك بالظبط",
      "متابعة يومية للصفحات والتعليقات والرسائل",
      "تقارير شهرية توضح الأداء وفرص النمو"
    ],
    pts_en: [
      "Content plans based on your goals",
      "Consistent designs and strong visual identity",
      "Professional captions tailored for your audience",
      "Daily monitoring of pages, comments, and messages",
      "Monthly performance and growth reports"
    ],
    cta: "خلي حساباتك تشتغل بذكاء", cta_en: "Make your accounts work smart"
  },
  {
    id: "media-buying", prefix: "service.media",
    title: "الإعلانات المدفوعة", title_en: "Media Buying",
    sub: "الحملات المدفوعة أسرع طريقة للوصول لجمهورك، لكن بإدارة ذكية.", sub_en: "Paid campaigns are the fastest way to reach your audience, but with smart management.",
    pts: [
      "اختيار المنصة المناسبة (Meta، Google، TikTok)",
      "استهداف دقيق وتقسيم الجمهور لنتايج فعالة",
      "إعلانات جذابة ببصريات قوية وكوبي رايتنج",
      "مراقبة وتحسين لحظي للحملات",
      "تقارير ROI واضحة: شوف كل جنيه رجع كام"
    ],
    pts_en: [
      "Choosing the right platform (Meta, Google, TikTok)",
      "Precise targeting and audience segmentation",
      "Engaging ads with strong visuals and copywriting",
      "Real-time campaign monitoring and optimization",
      "Clear ROI reports: see where every penny goes"
    ],
    cta: "استثمر في إعلانات بتجيب نتيجة فعلاً", cta_en: "Invest in ads that actually work"
  },
  {
    id: "content-production", prefix: "service.content",
    title: "إنتاج المحتوى", title_en: "Content Production",
    sub: "المحتوى المرئي هو لغة اليوم، من غيره ما بيعيشش.", sub_en: "Visual content is today's language, without it, you don't exist.",
    pts: [
      "جلسات تصوير منتجات وفريق وlifestyle",
      "فيديوهات قصيرة للريلز والتيك توك والإعلانات",
      "تصوير تجاري عالي الجودة يدّي صوت للبراند",
      "مونتاج وموشن جرافيك بلمسة عصرية",
      "أسلوب بصري متسق مع هوية براندك"
    ],
    pts_en: [
      "Product, team, and lifestyle photoshoots",
      "Short videos for Reels, TikTok, and ads",
      "High-quality commercial photography",
      "Modern video editing and motion graphics",
      "Visual style consistent with your brand"
    ],
    cta: "محتوى بصري بيخلي الناس تفتكرك", cta_en: "Visual content that makes people remember you"
  },
  {
    id: "branding", prefix: "service.branding",
    title: "العلامة التجارية والهوية", title_en: "Branding & Identity",
    sub: "الهوية مش لوجو بس، دي شخصية براندك كاملة.", sub_en: "Identity is not just a logo, it's your complete brand personality.",
    pts: [
      "تصميم لوجو احترافي يعبّر عن شخصية براندك",
      "نظام ألوان وخطوط متكامل ومتسق",
      "دليل هوية شامل لكل التطبيقات",
      "تصميمات سوشيال ميديا متسقة مع الهوية",
      "تطبيق الهوية على كل نقاط التواصل"
    ],
    pts_en: [
      "Professional logo design reflecting your brand",
      "Integrated color and typography system",
      "Comprehensive identity guidelines",
      "Social media designs consistent with identity",
      "Identity application across all touchpoints"
    ],
    cta: "خلي براندك يتعرف عليه من أول نظرة", cta_en: "Make your brand recognizable at first glance"
  },
  {
    id: "strategy", prefix: "service.strategy",
    title: "استراتيجية التسويق", title_en: "Marketing Strategy",
    sub: "الاستراتيجية مش رفاهية، دي الفرق بين الشغل العشوائي والنتايج.", sub_en: "Strategy is not a luxury, it's the difference between random work and results.",
    pts: [
      "تحليل السوق والمنافسين بعمق",
      "تحديد الجمهور المستهدف بدقة",
      "خطة محتوى وقنوات متكاملة",
      "KPIs واضحة وأهداف قابلة للقياس",
      "مراجعة وتحسين مستمر للخطة"
    ],
    pts_en: [
      "In-depth market and competitor analysis",
      "Precise target audience definition",
      "Integrated content and channel plan",
      "Clear KPIs and measurable goals",
      "Continuous review and optimization"
    ],
    cta: "خطة تسويق بتوصل لهدفك", cta_en: "A marketing plan that reaches your goal"
  }
];

const baseHTML = fs.readFileSync('about.html', 'utf-8');
const head = baseHTML.substring(0, baseHTML.indexOf('<main'));
const foot = baseHTML.substring(baseHTML.indexOf('<footer'));

servicesData.forEach(srv => {
  arLocales[`${srv.prefix}.title`] = srv.title;
  enLocales[`${srv.prefix}.title`] = srv.title_en;
  arLocales[`${srv.prefix}.sub`] = srv.sub;
  enLocales[`${srv.prefix}.sub`] = srv.sub_en;
  arLocales[`${srv.prefix}.cta`] = srv.cta;
  enLocales[`${srv.prefix}.cta`] = srv.cta_en;
  srv.pts.forEach((pt, i) => {
    arLocales[`${srv.prefix}.pt${i+1}`] = pt;
    enLocales[`${srv.prefix}.pt${i+1}`] = srv.pts_en[i];
  });

  let listItems = '';
  servicesData.forEach(s => {
    let cls = s.id === srv.id ? 'active' : '';
    listItems += `<li><a href="/services/${s.id}" class="${cls}" data-i18n="${s.prefix}.title">${s.title}</a></li>`;
  });

  let pointItems = '';
  srv.pts.forEach((pt, i) => {
    pointItems += `<div class="point-item"><span class="point-num">0${i + 1}</span><span class="point-text" data-i18n="${srv.prefix}.pt${i+1}">${pt}</span></div>`;
  });

  const html = `
<main class="service-single">
  <div class="service-layout">
    <aside class="service-sidebar">
      <div class="sidebar-block">
        <h4 class="sidebar-title" data-i18n="nav.services">الخدمات</h4>
        <ul class="sidebar-list">
          ${listItems}
        </ul>
      </div>
      <div class="sidebar-block">
        <h4 class="sidebar-title" data-i18n="services.eyebrow">خدمات إضافية</h4>
        <ul class="sidebar-list">
          <li><a href="/services" data-i18n="services.more">كل الخدمات</a></li>
          <li><a href="/#register" data-i18n="nav.contact">تواصل معنا</a></li>
        </ul>
      </div>
    </aside>

    <div class="service-main">
      <div class="breadcrumb" style="margin-bottom:20px;font-size:14px">
        <a href="/" style="color:var(--c-p)" data-i18n="nav.home">الرئيسية</a> <span style="color:var(--c-w50)">·</span> <a href="/services" style="color:var(--c-p)" data-i18n="nav.services">الخدمات</a> <span style="color:var(--c-w50)">·</span> <span data-i18n="${srv.prefix}.title">${srv.title}</span>
      </div>
      <h1 class="service-title" data-i18n="${srv.prefix}.title">${srv.title}</h1>
      <p class="service-subtitle" data-i18n="${srv.prefix}.sub">${srv.sub}</p>

      <div class="service-points">
        ${pointItems}
      </div>

      <p class="service-cta-text" data-i18n="${srv.prefix}.cta">${srv.cta}</p>

      <a href="/#register" class="service-circle-cta">
        <span data-i18n="nav.contact">تواصل معنا</span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17L17 7M17 7H7M17 7V17"/>
        </svg>
      </a>
    </div>
  </div>
</main>
`;
  
  let finalHTML = head.replace(/<title>.*?<\/title>/, `<title>${srv.title} - PR Agency</title>`) + html + foot;
  // Apply the same generic replaces for nav/footer on this generated page
  finalHTML = finalHTML.replace(/href="css\//g, 'href="../css/');
  finalHTML = finalHTML.replace(/src="js\//g, 'src="../js/');
  finalHTML = finalHTML.replace(/href="assets\//g, 'href="../assets/');
  finalHTML = finalHTML.replace(/src="assets\//g, 'src="../assets/');

  fs.writeFileSync('services/' + srv.id + '.html', finalHTML);
});

fs.writeFileSync('locales/ar.json', JSON.stringify(arLocales, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(enLocales, null, 2));


// ----------------------------------------------------
// TASK 4: Admin UI
// ----------------------------------------------------
let adminJS = fs.readFileSync('functions/admin/index.js', 'utf-8');

// 4.1 Team Modal EN Fields
if (!adminJS.includes('id="team-name-en"')) {
  adminJS = adminJS.replace(
    /<label class="modal-field-label">الدور<\/label>([^]*?)<label class="modal-field-label">الصورة<\/label>/,
    `<label class="modal-field-label">الدور</label>$1<label class="modal-field-label">الاسم (إنجليزي)</label>
      <input type="text" id="team-name-en" class="modal-input" placeholder="English name" />
      <label class="modal-field-label">الدور (إنجليزي)</label>
      <input type="text" id="team-role-en" class="modal-input" placeholder="English role" />
      <label class="modal-field-label">نبذة (إنجليزي)</label>
      <textarea id="team-bio-en" class="modal-input" style="min-height:80px;resize:vertical" placeholder="English bio"></textarea>
      <label class="modal-field-label">الصورة</label>`
  );

  adminJS = adminJS.replace(/document.getElementById\('team-name'\)\.value = f\.name \|\| '';/g, `document.getElementById('team-name').value = f.name || '';\n    document.getElementById('team-name-en').value = f.name_en || '';`);
  adminJS = adminJS.replace(/document.getElementById\('team-role'\)\.value = f\.role \|\| '';/g, `document.getElementById('team-role').value = f.role || '';\n    document.getElementById('team-role-en').value = f.role_en || '';`);
  adminJS = adminJS.replace(/document.getElementById\('team-bio'\)\.value = f\.bio \|\| '';/g, `document.getElementById('team-bio').value = f.bio || '';\n    document.getElementById('team-bio-en').value = f.bio_en || '';`);
  
  adminJS = adminJS.replace(/document.getElementById\('team-name'\)\.value = '';/g, `document.getElementById('team-name').value = '';\n    document.getElementById('team-name-en').value = '';`);
  adminJS = adminJS.replace(/document.getElementById\('team-role'\)\.value = '';/g, `document.getElementById('team-role').value = '';\n    document.getElementById('team-role-en').value = '';`);
  adminJS = adminJS.replace(/document.getElementById\('team-bio'\)\.value = '';/g, `document.getElementById('team-bio').value = '';\n    document.getElementById('team-bio-en').value = '';`);

  adminJS = adminJS.replace(/const name = document\.getElementById\('team-name'\)\.value\.trim\(\);/, `const name = document.getElementById('team-name').value.trim();\n    const name_en = document.getElementById('team-name-en').value.trim();`);
  adminJS = adminJS.replace(/const role = document\.getElementById\('team-role'\)\.value\.trim\(\);/, `const role = document.getElementById('team-role').value.trim();\n    const role_en = document.getElementById('team-role-en').value.trim();`);
  adminJS = adminJS.replace(/const bio = document\.getElementById\('team-bio'\)\.value\.trim\(\);/, `const bio = document.getElementById('team-bio').value.trim();\n    const bio_en = document.getElementById('team-bio-en').value.trim();`);

  adminJS = adminJS.replace(/body = \{ name, role, bio, image_url, order_index \};/, `body = { name, name_en, role, role_en, bio, bio_en, image_url, order_index };`);
}

// 4.2 Clients Modal EN Fields
if (!adminJS.includes('id="client-name-en"')) {
  adminJS = adminJS.replace(
    /<label class="modal-field-label">اسم العميل<\/label>([^]*?)<label class="modal-field-label">شعار العميل<\/label>/,
    `<label class="modal-field-label">اسم العميل</label>$1<label class="modal-field-label">الاسم (إنجليزي)</label>
      <input type="text" id="client-name-en" class="modal-input" placeholder="English name" />
      <label class="modal-field-label">شعار العميل</label>`
  );

  adminJS = adminJS.replace(/document.getElementById\('client-name'\)\.value = c\.name \|\| '';/g, `document.getElementById('client-name').value = c.name || '';\n    document.getElementById('client-name-en').value = c.name_en || '';`);
  adminJS = adminJS.replace(/document.getElementById\('client-name'\)\.value = '';/g, `document.getElementById('client-name').value = '';\n    document.getElementById('client-name-en').value = '';`);
  adminJS = adminJS.replace(/const name = document\.getElementById\('client-name'\)\.value\.trim\(\);/, `const name = document.getElementById('client-name').value.trim();\n    const name_en = document.getElementById('client-name-en').value.trim();`);
  adminJS = adminJS.replace(/const body = \{ name: name, logo_url: logo_url, website_url: website_url, order_index: order_index \};/, `const body = { name: name, name_en: name_en, logo_url: logo_url, website_url: website_url, order_index: order_index };`);
}

// 4.3 FAQs Modal EN Fields
if (!adminJS.includes('id="faq-question-en"')) {
  adminJS = adminJS.replace(
    /<label class="modal-field-label">السؤال<\/label>([^]*?)<label class="modal-field-label">الترتيب<\/label>/,
    `<label class="modal-field-label">السؤال</label>$1<label class="modal-field-label">السؤال (إنجليزي)</label>
      <input type="text" id="faq-question-en" class="modal-input" placeholder="English question..." />
      <label class="modal-field-label">الإجابة (إنجليزي)</label>
      <textarea id="faq-answer-en" class="modal-input" style="min-height:100px;resize:vertical" placeholder="English answer..."></textarea>
      <label class="modal-field-label">الترتيب</label>`
  );

  adminJS = adminJS.replace(/document.getElementById\('faq-question'\)\.value = f\.question \|\| '';/g, `document.getElementById('faq-question').value = f.question || '';\n    document.getElementById('faq-question-en').value = f.question_en || '';`);
  adminJS = adminJS.replace(/document.getElementById\('faq-answer'\)\.value = f\.answer \|\| '';/g, `document.getElementById('faq-answer').value = f.answer || '';\n    document.getElementById('faq-answer-en').value = f.answer_en || '';`);
  
  adminJS = adminJS.replace(/document.getElementById\('faq-question'\)\.value = '';/g, `document.getElementById('faq-question').value = '';\n    document.getElementById('faq-question-en').value = '';`);
  adminJS = adminJS.replace(/document.getElementById\('faq-answer'\)\.value = '';/g, `document.getElementById('faq-answer').value = '';\n    document.getElementById('faq-answer-en').value = '';`);

  adminJS = adminJS.replace(/const q = document\.getElementById\('faq-question'\)\.value\.trim\(\);/, `const q = document.getElementById('faq-question').value.trim();\n    const q_en = document.getElementById('faq-question-en').value.trim();`);
  adminJS = adminJS.replace(/const a = document\.getElementById\('faq-answer'\)\.value\.trim\(\);/, `const a = document.getElementById('faq-answer').value.trim();\n    const a_en = document.getElementById('faq-answer-en').value.trim();`);
  
  adminJS = adminJS.replace(/const body = \{ question: q, answer: a, order_index: o \};/, `const body = { question: q, question_en: q_en, answer: a, answer_en: a_en, order_index: o };`);
}

fs.writeFileSync('functions/admin/index.js', adminJS);

// ----------------------------------------------------
// TASK 6: Cache Bump
// ----------------------------------------------------
const srvFiles = fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f);
const allHtmlFiles = [...fs.readdirSync('.').filter(f => f.endsWith('.html')), ...srvFiles];
allHtmlFiles.forEach(f => {
  let html = fs.readFileSync(f, 'utf-8');
  html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=56');
  fs.writeFileSync(f, html);
});

console.log('Phase 2 Complete');
