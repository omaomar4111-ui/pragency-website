const fs = require('fs');
const path = require('path');

if (!fs.existsSync('services')) {
  fs.mkdirSync('services');
}

const baseHTML = fs.readFileSync('about.html', 'utf-8');
const head = baseHTML.substring(0, baseHTML.indexOf('<main'));
const foot = baseHTML.substring(baseHTML.indexOf('<footer'));

const servicesIndex = `
<main class="services-page">
  <section class="page-hero">
    <div class="page-hero-container">
      <nav class="breadcrumb">
        <a href="/">الرئيسية</a> · <span>الخدمات</span>
      </nav>
      <h1 class="page-hero-title">الخدمات</h1>
    </div>
  </section>

  <section class="services-numbered">
    <h2 class="section-title rv" style="text-align:center;color:#fff">3 خدمات أساسية تحوّل براندك</h2>
    <div class="numbered-grid">
      <a href="/services/social-media" class="numbered-card rv">
        <span class="numbered-num">01</span>
        <h3 class="numbered-title">إدارة السوشيال ميديا</h3>
      </a>
      <a href="/services/media-buying" class="numbered-card rv">
        <span class="numbered-num">02</span>
        <h3 class="numbered-title">الإعلانات المدفوعة</h3>
      </a>
      <a href="/services/content-production" class="numbered-card rv">
        <span class="numbered-num">03</span>
        <h3 class="numbered-title">إنتاج المحتوى</h3>
      </a>
    </div>
  </section>

  <section class="why-services rv" style="padding: 60px 0;">
    <h2 class="section-title" style="text-align:center;color:#A78BFA">ليه الخدمات دي مهمة؟</h2>
    <p class="section-desc" style="text-align:center;max-width:600px;margin:16px auto">مهما كان مجالك، الخدمات دي بتضمنلك:</p>
    <ul class="why-list" style="text-align:center;">
      <li>✓ حضور قوي على السوشيال ميديا</li>
      <li>✓ وصول أسرع لجمهورك المستهدف</li>
      <li>✓ منتجاتك وخدماتك تظهر بأفضل شكل</li>
    </ul>
  </section>

  <section class="page-cta">
    <div class="page-cta-inner">
      <a href="/#register" class="btn btn-primary">احصل على استشارة مجانية</a>
    </div>
  </section>
</main>
`;

fs.writeFileSync('services/index.html', head.replace(/<title>.*?<\/title>/, '<title>الخدمات - PR Agency</title>') + servicesIndex + foot);
fs.writeFileSync('services.html', head.replace(/<title>.*?<\/title>/, '<title>الخدمات - PR Agency</title>') + servicesIndex + foot);

const servicesData = [
  {
    id: "social-media",
    title: "إدارة السوشيال ميديا",
    sub: "إدارة السوشيال مش مجرد بوستات. دي استراتيجية كاملة.",
    pts: [
      "خطط محتوى مبنية على أهدافك (وعي ← عملاء ← مبيعات)",
      "تصميمات متسقة وهوية بصرية قوية",
      "كابشنز احترافية مكتوبة لجمهورك بالظبط",
      "متابعة يومية للصفحات والتعليقات والرسائل",
      "تقارير شهرية توضح الأداء وفرص النمو"
    ],
    cta: "خلي حساباتك تشتغل بذكاء"
  },
  {
    id: "media-buying",
    title: "الإعلانات المدفوعة",
    sub: "الحملات المدفوعة أسرع طريقة للوصول لجمهورك، لكن بإدارة ذكية.",
    pts: [
      "اختيار المنصة المناسبة (Meta، Google، TikTok)",
      "استهداف دقيق وتقسيم الجمهور لنتايج فعالة",
      "إعلانات جذابة ببصريات قوية وكوبي رايتنج",
      "مراقبة وتحسين لحظي للحملات",
      "تقارير ROI واضحة: شوف كل جنيه رجع كام"
    ],
    cta: "استثمر في إعلانات بتجيب نتيجة فعلاً"
  },
  {
    id: "content-production",
    title: "إنتاج المحتوى",
    sub: "المحتوى المرئي هو لغة اليوم، من غيره ما بيعيشش.",
    pts: [
      "جلسات تصوير منتجات وفريق وlifestyle",
      "فيديوهات قصيرة للريلز والتيك توك والإعلانات",
      "تصوير تجاري عالي الجودة يدّي صوت للبراند",
      "مونتاج وموشن جرافيك بلمسة عصرية",
      "أسلوب بصري متسق مع هوية براندك"
    ],
    cta: "محتوى بصري بيخلي الناس تفتكرك"
  },
  {
    id: "branding",
    title: "العلامة التجارية والهوية",
    sub: "الهوية مش لوجو بس، دي شخصية براندك كاملة.",
    pts: [
      "تصميم لوجو احترافي يعبّر عن شخصية براندك",
      "نظام ألوان وخطوط متكامل ومتسق",
      "دليل هوية شامل لكل التطبيقات",
      "تصميمات سوشيال ميديا متسقة مع الهوية",
      "تطبيق الهوية على كل نقاط التواصل"
    ],
    cta: "خلي براندك يتعرف عليه من أول نظرة"
  },
  {
    id: "strategy",
    title: "استراتيجية التسويق",
    sub: "الاستراتيجية مش رفاهية، دي الفرق بين الشغل العشوائي والنتايج.",
    pts: [
      "تحليل السوق والمنافسين بعمق",
      "تحديد الجمهور المستهدف بدقة",
      "خطة محتوى وقنوات متكاملة",
      "KPIs واضحة وأهداف قابلة للقياس",
      "مراجعة وتحسين مستمر للخطة"
    ],
    cta: "خطة تسويق بتوصل لهدفك"
  }
];

servicesData.forEach(srv => {
  let listItems = '';
  servicesData.forEach(s => {
    let cls = s.id === srv.id ? 'active' : '';
    listItems += '<li><a href="/services/' + s.id + '" class="' + cls + '">' + s.title + '</a></li>';
  });

  let pointItems = '';
  srv.pts.forEach((pt, i) => {
    pointItems += '<div class="point-item"><span class="point-num">0' + (i + 1) + '</span><span class="point-text">' + pt + '</span></div>';
  });

  const html = `
<main class="service-single">
  <div class="service-layout">
    <aside class="service-sidebar">
      <div class="sidebar-block">
        <h4 class="sidebar-title">الخدمات</h4>
        <ul class="sidebar-list">
          ${listItems}
        </ul>
      </div>
      <div class="sidebar-block">
        <h4 class="sidebar-title">خدمات إضافية</h4>
        <ul class="sidebar-list">
          <li><a href="/services">كل الخدمات</a></li>
          <li><a href="/#register">تواصل معنا</a></li>
        </ul>
      </div>
    </aside>

    <div class="service-main">
      <div class="breadcrumb" style="margin-bottom:20px;font-size:14px">
        <a href="/" style="color:var(--c-p)">الرئيسية</a> <span style="color:var(--c-w50)">·</span> <a href="/services" style="color:var(--c-p)">الخدمات</a> <span style="color:var(--c-w50)">·</span> <span>${srv.title}</span>
      </div>
      <h1 class="service-title">${srv.title}</h1>
      <p class="service-subtitle">${srv.sub}</p>

      <div class="service-points">
        ${pointItems}
      </div>

      <p class="service-cta-text">${srv.cta}</p>

      <a href="/#register" class="service-circle-cta">
        <span>تواصل معنا</span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17L17 7M17 7H7M17 7V17"/>
        </svg>
      </a>
    </div>
  </div>
</main>
`;
  
  fs.writeFileSync('services/' + srv.id + '.html', head.replace(/<title>.*?<\/title>/, '<title>' + srv.title + ' - PR Agency</title>') + html + foot);
});
