const fs = require('fs');

const allHtmlFiles = [
  'index.html', 'about.html', 'services.html', 'clients.html', 'team.html',
  'contact.html', 'privacy.html', 'terms.html', '404.html', 'thank-you.html',
  ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)
];

const burgerButtonHtml = `<button class="hdr-burger" id="hdr-burger" aria-label="Menu">
      <svg viewBox="0 0 448 512" width="20" height="20" fill="currentColor">
        <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
      </svg>
    </button>`;

const mmenuDrawerHtml = `<div id="mmenu" aria-hidden="true"><div class="mmenu-panel">
  <div class="mmenu-head"><span style="font-weight:900;color:#fff" data-i18n="nav.menu">القائمة</span><button class="mmenu-close" aria-label="Close">✕</button></div>
  <div class="mmenu-links">
    <a href="/" data-i18n="nav.home">الرئيسية</a>
    <a href="/about.html" data-i18n="nav.about">عن الوكالة</a>
    <a href="/services.html" data-i18n="nav.services">الخدمات</a>
    <a href="/team" data-i18n="nav.team">الفريق</a>
    <a href="/clients.html" data-i18n="nav.clients">العملاء</a>
    <a href="/#register" data-i18n="nav.contact">تواصل</a>
  </div>
  <a href="/#register" class="btn btn-primary" style="justify-content:center;margin-top:auto;" data-i18n="nav.cta">ابدأ الآن</a>
</div></div>`;

allHtmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf-8');

  // 1. Remove Facebook Social Link in Footer
  // Matches: <a href="https://www.facebook.com/profile.php... </a>
  html = html.replace(/<a\s+href="https:\/\/www\.facebook\.com\/[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');

  // 2. Ensure Mobile Burger Button is present inside .hdr-actions
  if (!html.includes('id="hdr-burger"')) {
    html = html.replace(/(<div class="hdr-actions"[^>]*>)/i, `$1\n    ${burgerButtonHtml}`);
  }

  // 3. Ensure Mobile Drawer #mmenu is present right after </nav>
  if (!html.includes('id="mmenu"')) {
    html = html.replace(/(<\/nav>)/i, `$1\n\n${mmenuDrawerHtml}`);
  } else {
    // If it exists, make sure it has the standardized comprehensive links
    html = html.replace(/<div id="mmenu"[\s\S]*?<\/div><\/div>/i, mmenuDrawerHtml);
  }

  // 4. Update Cache Version to v=66
  html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=66');
  html = html.replace(/js\/main\.js\?v=\d+/g, 'js/main.js?v=66');
  html = html.replace(/js\/i18n\.js\?v=\d+/g, 'js/i18n.js?v=66');

  fs.writeFileSync(file, html);
});

console.log('Updated all HTML files: Burger added, drawer standardized, Facebook removed, cache bumped to v=66.');
