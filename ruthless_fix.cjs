const fs = require('fs');

// 1. Fix functions/api/team.js (backend)
let apiTeam = fs.readFileSync('functions/api/team.js', 'utf-8');
if (!apiTeam.includes('name_en')) {
  apiTeam = apiTeam.replace(
    'SELECT id, name, role, bio, photo_url, linkedin_url FROM team_members',
    'SELECT id, name, name_en, role, role_en, bio, bio_en, photo_url, linkedin_url FROM team_members'
  );
  fs.writeFileSync('functions/api/team.js', apiTeam);
}

// 2. Fix js/team.js (frontend) to fetch from API and use _en fields
let jsTeam = fs.readFileSync('js/team.js', 'utf-8');

// If jsTeam doesn't already fetch, rewrite it completely to support API fetching + language toggle
const newJsTeam = `(async function() {
  'use strict';
  
  var ROLES = [
  {
    "id": 1,
    "roleEn": "Account Manager",
    "roleAr": "مدير حساب",
    "descAr": "مسؤول عن إدارة الحملات والتواصل اليومي.",
    "descEn": "Responsible for campaign management and daily communication.",
    "image": "role-01-account-manager.webp"
  },
  {
    "id": 2,
    "roleEn": "Content Creator",
    "roleAr": "صانع المحتوى",
    "descAr": "بيبتكر المحتوى اللي بيخلق تفاعل حقيقي.",
    "descEn": "Creates content that generates real engagement.",
    "image": "role-02-content-creator.webp"
  },
  {
    "id": 3,
    "roleEn": "Content Strategist",
    "roleAr": "استراتيجي المحتوى",
    "descAr": "بيحط الخطة اللي بتمشي عليها الكامبين.",
    "descEn": "Sets the strategy for the campaign.",
    "image": "role-03-content-strategist.webp"
  },
  {
    "id": 4,
    "roleEn": "Media Buyer",
    "roleAr": "خبير الإعلانات",
    "descAr": "بيدير الحملات المدفوعة لأعلى ROI.",
    "descEn": "Manages paid campaigns for highest ROI.",
    "image": "role-04-media-buyer.webp"
  }
];

  async function fetchTeam() {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        return data.data;
      }
    } catch(e) {}
    return null;
  }
  
  function basePath() {
    return (window.location.pathname.indexOf('/services/') > -1 ||
            window.location.pathname.indexOf('/blog/') > -1) ? '../' : '';
  }
  
  window.renderTeam = async function() {
    var grid = document.getElementById('teamGrid');
    if (!grid) return;
    
    // Fetch once and cache in window
    if (!window._teamData) {
      const apiData = await fetchTeam();
      window._teamData = (apiData && apiData.length > 0) ? apiData : ROLES;
    }
    
    var data = window._teamData;
    var bp = basePath();
    const lang = window.i18n ? window.i18n.get() : 'ar';
    
    grid.innerHTML = data.map(function(r) {
      // Map API fields (name, role, bio) or Fallback static fields (roleAr, descAr)
      var nameAr = r.name || r.roleEn || '';
      var nameEn = r.name_en || nameAr;
      
      var roleAr = r.role || r.roleAr || '';
      var roleEn = r.role_en || r.roleEn || roleAr;
      
      var descAr = r.bio || r.descAr || '';
      var descEn = r.bio_en || r.descEn || descAr;
      
      var imgUrl = r.photo_url || r.image;
      if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
        imgUrl = bp + 'assets/team/' + imgUrl;
      }
      
      var dName = (lang === 'en') ? nameEn : nameAr;
      var dRole = (lang === 'en') ? roleEn : roleAr;
      var dDesc = (lang === 'en') ? descEn : descAr;

      return '<article class="role-card" data-role-id="' + r.id + '">' +
             '  <div class="role-image-wrap">' +
             '    <div class="role-image">' +
             '      <img src="' + imgUrl + '" alt="' + dName + '" loading="lazy" width="300" height="300" style="width:100%;height:100%;object-fit:cover;" />' +
             '    </div>' +
             '  </div>' +
             '  <div class="role-info">' +
             '    <h3 class="role-name-en">' + dName + '</h3>' +
             '    <p class="role-name-ar">' + dRole + '</p>' +
             '    <p class="role-desc">' + dDesc + '</p>' +
             '  </div>' +
             '  <div class="role-line"></div>' +
             '</article>';
    }).join('');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.renderTeam);
  } else {
    window.renderTeam();
  }
})();

document.addEventListener('i18n:changed', () => {
  if (typeof window.renderTeam === 'function') window.renderTeam();
});
`;

fs.writeFileSync('js/team.js', newJsTeam);

// 3. Fix index.html Static text
let html = fs.readFileSync('index.html', 'utf-8');

// Hero Title
html = html.replace(/<h2 class="section-about-vr-title rv">[\s\S]*?شريكك في النمو[\s\S]*?<\/h2>/, '<h2 class="section-about-vr-title rv" data-i18n="hero.title">شريكك في النمو</h2>');
// Hero Sub
html = html.replace(/<p class="section-about-vr-lead rv">[\s\S]*?في PR Agency، بنؤمن إن التسويق مش مجرد <span class="accent">"محتوى شكله حلو"<\/span>\.[\s\S]*?<\/p>/, '<p class="section-about-vr-lead rv" data-i18n-html="hero.sub">في PR Agency، بنؤمن إن التسويق مش مجرد <span class="accent">"محتوى شكله حلو"</span>.</p>');

// Services Subtitle
html = html.replace(/<h2 class="section-title rv"><span data-i18n-html="services.title">حلول تسويق <span>متكاملة<\/span><\/span><\/h2>/, '<h2 class="section-title rv"><span data-i18n-html="services.sub">حلول تسويق <span>متكاملة</span></span></h2>');
html = html.replace(/<h2 class="section-title rv"><span data-i18n="services.title">حلول تسويق <span>متكاملة<\/span><\/span><\/h2>/, '<h2 class="section-title rv"><span data-i18n-html="services.sub">حلول تسويق <span>متكاملة</span></span></h2>');
html = html.replace(/<h2 class="section-title rv">حلول تسويق <span>متكاملة<\/span><\/h2>/, '<h2 class="section-title rv"><span data-i18n-html="services.sub">حلول تسويق <span>متكاملة</span></span></h2>');

// Clients Title/Sub
html = html.replace(/<div class="section-eyebrow rv">[\s\S]*?<svg class="svgi"><use href="#fa-handshake"><\/use><\/svg>[\s\S]*?شركاء نجاحنا[\s\S]*?<\/div>/, '<div class="section-eyebrow rv"><svg class="svgi"><use href="#fa-handshake"></use></svg> <span data-i18n="clients.eyebrow">شركاء نجاحنا</span></div>');
html = html.replace(/<h2 class="section-h2 rv">علامات تثق فينا<\/h2>/, '<h2 class="section-h2 rv" data-i18n="clients.title">علامات تثق فينا</h2>');

// Team Title/Sub
html = html.replace(/<div class="section-eyebrow rv">[\s\S]*?<svg class="svgi"><use href="#fa-users"><\/use><\/svg>[\s\S]*?فريقنا[\s\S]*?<\/div>/, '<div class="section-eyebrow rv"><svg class="svgi"><use href="#fa-users"></use></svg> <span data-i18n="team.eyebrow">فريقنا</span></div>');
html = html.replace(/<h2 class="section-h2 rv">الناس اللي بتشتغل على شغلك<\/h2>/, '<h2 class="section-h2 rv" data-i18n="team.title">الناس اللي بتشتغل على شغلك</h2>');
html = html.replace(/<p class="section-sub rv" style="margin:0 auto">[\s\S]*?أهل خبرة وشغف[\s\S]*?<\/p>/, '<p class="section-sub rv" style="margin:0 auto" data-i18n="team.sub">أهل خبرة وشغف...</p>'); // Just in case it says أهل خبرة وشغف
html = html.replace(/<p class="section-sub rv" style="margin:0 auto">[\s\S]*?كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء\.[\s\S]*?<\/p>/, '<p class="section-sub rv" style="margin:0 auto" data-i18n="team.sub">كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.</p>');


// 4. Update JSON files
const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

Object.assign(ar, {
  "hero.title": "شريكك في النمو",
  "hero.sub": "في PR Agency، بنؤمن إن التسويق مش مجرد <span class=\"accent\">\"محتوى شكله حلو\"</span>.",
  "services.sub": "حلول تسويق <span class=\"accent\">متكاملة</span>",
  "clients.eyebrow": "شركاء نجاحنا",
  "clients.title": "علامات تثق فينا",
  "team.eyebrow": "فريقنا",
  "team.title": "الناس اللي بتشتغل على شغلك",
  "team.sub": "كل واحد له دور محدد — فريق بيعرف شغله من الألف للياء.",
});

Object.assign(en, {
  "hero.title": "Your Partner in Growth",
  "hero.sub": "At PR Agency, we believe marketing isn't just <span class=\"accent\">\"nice-looking content\"</span>.",
  "services.sub": "Integrated Marketing <span class=\"accent\">Solutions</span>",
  "clients.eyebrow": "Our Partners",
  "clients.title": "Brands Trusting Us",
  "team.eyebrow": "Our Team",
  "team.title": "The People Working For You",
  "team.sub": "Everyone has a specific role — a team that knows its job inside out.",
});

fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2));

// Cache Busting
html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=61');
fs.writeFileSync('index.html', html);

const allHtmlFiles = [
  'about.html', 'services.html', 'clients.html', 'team.html',
  'contact.html', 'privacy.html', 'terms.html', '404.html', 'thank-you.html',
  ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)
];
allHtmlFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf-8');
    content = content.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=61');
    fs.writeFileSync(f, content);
  }
});

console.log('Ruthless audit and fix applied.');
