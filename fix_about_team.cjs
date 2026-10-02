const fs = require('fs');

// 1. Process about.html
let about = fs.readFileSync('about.html', 'utf-8');

about = about.replace(
  '<p class="page-hero-subtitle">في PR Agency، بنؤمن إن التسويق مش مجرد "محتوى شكله حلو". التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح.</p>',
  '<p class="page-hero-subtitle" data-i18n="about.hero.subtitle">في PR Agency، بنؤمن إن التسويق مش مجرد "محتوى شكله حلو". التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح.</p>'
);

about = about.replace(
  '<p class="about-text">PR Agency وكالة تسويق متكاملة متخصصة في بناء وتنمية العلامات التجارية عبر استراتيجيات مبتكرة وتنفيذ احترافي. بنشتغل مع الشركات في مصر والخليج لتحقيق نتائج حقيقية وقابلة للقياس.</p>',
  '<p class="about-text" data-i18n="about.story.p1">PR Agency وكالة تسويق متكاملة متخصصة في بناء وتنمية العلامات التجارية عبر استراتيجيات مبتكرة وتنفيذ احترافي. بنشتغل مع الشركات في مصر والخليج لتحقيق نتائج حقيقية وقابلة للقياس.</p>'
);

about = about.replace(
  '<p class="about-text">فريقنا يجمع بين الخبرة الاستراتيجية والإبداع التقني لتقديم حلول تسويقية شاملة — من الإعلانات الممولة للإنتاج المرئي وإدارة السوشيال ميديا.</p>',
  '<p class="about-text" data-i18n="about.story.p2">فريقنا يجمع بين الخبرة الاستراتيجية والإبداع التقني لتقديم حلول تسويقية شاملة — من الإعلانات الممولة للإنتاج المرئي وإدارة السوشيال ميديا.</p>'
);

// Values Cards
about = about.replace(
  '<h3 class="about-value-title">استراتيجية مبنية على البيانات</h3>',
  '<h3 class="about-value-title" data-i18n="about.v1.title">استراتيجية مبنية على البيانات</h3>'
);
about = about.replace(
  '<p class="about-value-desc">كل قرار بناخده بيبقى مبني على تحليل حقيقي للسوق والجمهور المستهدف، مش مجرد حدس.</p>',
  '<p class="about-value-desc" data-i18n="about.v1.desc">كل قرار بناخده بيبقى مبني على تحليل حقيقي للسوق والجمهور المستهدف، مش مجرد حدس.</p>'
);

about = about.replace(
  '<h3 class="about-value-title">نتائج قابلة للقياس</h3>',
  '<h3 class="about-value-title" data-i18n="about.v2.title">نتائج قابلة للقياس</h3>'
);
about = about.replace(
  '<p class="about-value-desc">بنقيس كل حاجة — من تكلفة الإعلان لنسبة التحويل — عشان تشوف قيمة كل جنيه بتصرفه.</p>',
  '<p class="about-value-desc" data-i18n="about.v2.desc">بنقيس كل حاجة — من تكلفة الإعلان لنسبة التحويل — عشان تشوف قيمة كل جنيه بتصرفه.</p>'
);

about = about.replace(
  '<h3 class="about-value-title">شراكة حقيقية</h3>',
  '<h3 class="about-value-title" data-i18n="about.v3.title">شراكة حقيقية</h3>'
);
about = about.replace(
  '<p class="about-value-desc">بنتعامل مع كل عميل كأنه شريك — هدفه هدفنا، ونجاحه نجاحنا.</p>',
  '<p class="about-value-desc" data-i18n="about.v3.desc">بنتعامل مع كل عميل كأنه شريك — هدفه هدفنا، ونجاحه نجاحنا.</p>'
);

about = about.replace(
  '<h3 class="about-value-title">تنفيذ سريع واحترافي</h3>',
  '<h3 class="about-value-title" data-i18n="about.v4.title">تنفيذ سريع واحترافي</h3>'
);
about = about.replace(
  '<p class="about-value-desc">بنشتغل بسرعة من غير ما نضحي بالجودة — لأن السوق مش بيستنى.</p>',
  '<p class="about-value-desc" data-i18n="about.v4.desc">بنشتغل بسرعة من غير ما نضحي بالجودة — لأن السوق مش بيستنى.</p>'
);

// Stats labels
about = about.replace(
  '<span class="about-stat-label">علامة تجارية</span>',
  '<span class="about-stat-label" data-i18n="about.stat.brands">علامة تجارية</span>'
);
about = about.replace(
  '<span class="about-stat-label">متخصصين</span>',
  '<span class="about-stat-label" data-i18n="about.stat.experts">متخصصين</span>'
);
about = about.replace(
  '<span class="about-stat-label">خدمات متكاملة</span>',
  '<span class="about-stat-label" data-i18n="about.stat.services">خدمات متكاملة</span>'
);
about = about.replace(
  '<span class="about-stat-label">التزام بالنتائج</span>',
  '<span class="about-stat-label" data-i18n="about.stat.commitment">التزام بالنتائج</span>'
);

// CTA Section
about = about.replace(
  '<h2 class="page-cta-title">جاهز نبدأ مشروعك؟</h2>',
  '<h2 class="page-cta-title" data-i18n="about.cta.title">جاهز نبدأ مشروعك؟</h2>'
);
about = about.replace(
  '<p class="page-cta-desc">احصل على استشارة مجانية من فريق PR Agency</p>',
  '<p class="page-cta-desc" data-i18n="about.cta.desc">احصل على استشارة مجانية من فريق PR Agency</p>'
);
about = about.replace(
  /<a href="\/#register" class="btn btn-primary">([\s\S]*?)احصل على استشارة مجانية([\s\S]*?)<\/a>/,
  '<a href="/#register" class="btn btn-primary">\n        <span data-i18n="about.cta.btn">احصل على استشارة مجانية</span>\n        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">\n          <path d="M5 12h14M12 5l7 7-7 7"/>\n        </svg>\n      </a>'
);

// Footer in about.html
about = about.replace(
  '<h4 class="site-footer-heading">عندك مشروع؟ يلا نبدأ</h4>',
  '<h4 class="site-footer-heading" data-i18n="footer.project.title">عندك مشروع؟ يلا نبدأ</h4>'
);
about = about.replace(
  '<p class="site-footer-cta-text">\n          ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ.\n        </p>',
  '<p class="site-footer-cta-text" data-i18n="footer.project.cta">ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ.</p>'
);
about = about.replace(
  '<div class="site-footer-contact-label">المقر</div>',
  '<div class="site-footer-contact-label" data-i18n="footer.location">المقر</div>'
);
about = about.replace(
  '<span class="site-footer-contact-value">القاهرة — مصر</span>',
  '<span class="site-footer-contact-value" data-i18n="footer.location.val">القاهرة — مصر</span>'
);
about = about.replace(
  '<div class="site-footer-contact-label">اتصل بنا</div>',
  '<div class="site-footer-contact-label" data-i18n="footer.call">اتصل بنا</div>'
);
about = about.replace(
  '<div class="site-footer-contact-label">راسلنا على</div>',
  '<div class="site-footer-contact-label" data-i18n="footer.mail">راسلنا على</div>'
);
about = about.replace(
  '<span id="footer-year">2026</span> PR Agency — كل الحقوق محفوظة.',
  '<span id="footer-year">2026</span> PR Agency — <span data-i18n="footer.rights">كل الحقوق محفوظة.</span>'
);

fs.writeFileSync('about.html', about);
console.log('about.html updated with data-i18n');

// 2. Process team.html
let team = fs.readFileSync('team.html', 'utf-8');

team = team.replace(
  '<span class="team-hero-badge" style="display:inline-block;padding:6px 16px;border-radius:20px;background:rgba(109,40,217,0.2);border:1px solid rgba(168,85,247,0.4);color:var(--c-purple-l);font-size:13px;font-weight:700;margin-bottom:16px;">نخبة المبدعين</span>',
  '<span class="team-hero-badge" style="display:inline-block;padding:6px 16px;border-radius:20px;background:rgba(109,40,217,0.2);border:1px solid rgba(168,85,247,0.4);color:var(--c-purple-l);font-size:13px;font-weight:700;margin-bottom:16px;" data-i18n="team.page.badge">نخبة المبدعين</span>'
);

team = team.replace(
  '<p class="team-hero-subtitle">الناس اللي بتشتغل على شغلك بكل شغف واحترافية لتحقيق أعلى نتائج ممكنة لبراندك.</p>',
  '<p class="team-hero-subtitle" data-i18n="team.page.subtitle">الناس اللي بتشتغل على شغلك بكل شغف واحترافية لتحقيق أعلى نتائج ممكنة لبراندك.</p>'
);

// Footer in team.html
team = team.replace(
  '<h4 class="site-footer-heading">عندك مشروع؟ يلا نبدأ</h4>',
  '<h4 class="site-footer-heading" data-i18n="footer.project.title">عندك مشروع؟ يلا نبدأ</h4>'
);
team = team.replace(
  '<p class="site-footer-cta-text">\n          ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ.\n        </p>',
  '<p class="site-footer-cta-text" data-i18n="footer.project.cta">ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ.</p>'
);
team = team.replace(
  '<div class="site-footer-contact-label">المقر</div>',
  '<div class="site-footer-contact-label" data-i18n="footer.location">المقر</div>'
);
team = team.replace(
  '<span class="site-footer-contact-value">القاهرة — مصر</span>',
  '<span class="site-footer-contact-value" data-i18n="footer.location.val">القاهرة — مصر</span>'
);
team = team.replace(
  '<div class="site-footer-contact-label">اتصل بنا</div>',
  '<div class="site-footer-contact-label" data-i18n="footer.call">اتصل بنا</div>'
);
team = team.replace(
  '<div class="site-footer-contact-label">راسلنا على</div>',
  '<div class="site-footer-contact-label" data-i18n="footer.mail">راسلنا على</div>'
);
team = team.replace(
  '<span id="footer-year">2026</span> PR Agency — كل الحقوق محفوظة.',
  '<span id="footer-year">2026</span> PR Agency — <span data-i18n="footer.rights">كل الحقوق محفوظة.</span>'
);

fs.writeFileSync('team.html', team);
console.log('team.html updated with data-i18n');
