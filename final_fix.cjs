const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. About section titles & paragraphs (handles newlines)
html = html.replace(/<h2 class="section-about-vr-title rv">[\s\S]*?شريكك في النمو[\s\S]*?<\/h2>/, '<h2 class="section-about-vr-title rv" data-i18n="about.title">شريكك في النمو</h2>');
html = html.replace(/<p class="section-about-vr-lead rv">[\s\S]*?في PR Agency، بنؤمن إن التسويق مش مجرد <span class="accent">"محتوى شكله حلو"<\/span>\.[\s\S]*?<\/p>/, '<p class="section-about-vr-lead rv" data-i18n-html="about.lead">في PR Agency، بنؤمن إن التسويق مش مجرد <span class="accent">"محتوى شكله حلو"</span>.</p>');
html = html.replace(/<p class="section-about-vr-body rv">[\s\S]*?بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح\.[\s\S]*?<\/p>/, '<p class="section-about-vr-body rv" data-i18n="about.body">بالنسبة لنا، التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح.</p>');

// 2. Services section eyebrow / title / sub
// Check if they already have data-i18n, if not add it.
html = html.replace(/<div class="section-badge rv">خدماتنا<\/div>/, '<div class="section-badge rv" data-i18n="services.eyebrow">خدماتنا</div>');
html = html.replace(/<h2 class="section-title rv"><span data-i18n-html="services.title">حلول تسويق <span>متكاملة<\/span><\/span><\/h2>/, '<h2 class="section-title rv"><span data-i18n-html="services.title">حلول تسويق <span>متكاملة</span></span></h2>'); // this one was already ok, but let's make sure.
html = html.replace(/<p class="section-desc rv">كل خدمة مصممة تحقق هدف محدد لنمو البزنس[\s\S]*?<\/p>/, '<p class="section-desc rv" data-i18n="services.sub">كل خدمة مصممة تحقق هدف محدد لنمو البزنس الخاص بيك</p>');

// 3. Clients Section
html = html.replace(/شركاء نجاحنا/g, '<span data-i18n="clients.eyebrow">شركاء نجاحنا</span>');
html = html.replace(/<h2 class="section-h2 rv">علامات تثق فينا<\/h2>/g, '<h2 class="section-h2 rv" data-i18n="clients.title">علامات تثق فينا</h2>');
html = html.replace(/<p class="section-sub rv" style="margin:0 auto">[\s\S]*?\+19 براند اشتغلنا معاهم في مجالات مختلفة\.[\s\S]*?<\/p>/g, '<p class="section-sub rv" style="margin:0 auto" data-i18n="clients.sub">+19 براند اشتغلنا معاهم في مجالات مختلفة.</p>');

// 4. Team Section
html = html.replace(/فريقنا/g, '<span data-i18n="team.eyebrow">فريقنا</span>');
html = html.replace(/<h2 class="section-h2 rv">الناس اللي بتشتغل على شغلك<\/h2>/g, '<h2 class="section-h2 rv" data-i18n="team.title">الناس اللي بتشتغل على شغلك</h2>');
html = html.replace(/<p class="section-sub rv" style="margin:0 auto">[\s\S]*?كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء\.[\s\S]*?<\/p>/g, '<p class="section-sub rv" style="margin:0 auto" data-i18n="team.sub">كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.</p>');

// Clean up duplicate data-i18n if they got added inside spans by mistake
html = html.replace(/<span data-i18n="[^"]+">\s*<span data-i18n="[^"]+">([^<]+)<\/span>\s*<\/span>/g, '<span data-i18n="$1">$2</span>'); 

// Bump Cache
html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=60');

fs.writeFileSync('index.html', html);

// Update locales
const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

Object.assign(ar, {
  "clients.eyebrow": "شركاء نجاحنا",
  "clients.title": "علامات تثق فينا",
  "team.eyebrow": "فريقنا",
  "team.title": "الناس اللي بتشتغل على شغلك",
});

Object.assign(en, {
  "clients.eyebrow": "Our Partners",
  "clients.title": "Brands Trusting Us",
  "team.eyebrow": "Our Team",
  "team.title": "The People Working on Your Work",
});

fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2));

// Update other HTML pages cache to v=60
const allHtmlFiles = [
  'about.html', 'services.html', 'clients.html', 'team.html',
  'contact.html', 'privacy.html', 'terms.html', '404.html', 'thank-you.html',
  ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)
];
allHtmlFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf-8');
    content = content.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=60');
    fs.writeFileSync(f, content);
  }
});

console.log('Final fix applied successfully.');
