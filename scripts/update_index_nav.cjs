const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const targetNav = `<div class="hdr-nav">
    <a href="/" data-i18n="nav.home">الرئيسية</a>
    <a href="/about.html" data-i18n="nav.about">من نحن</a>
    <a href="/services.html" data-i18n="nav.services">الخدمات</a>
    <!-- PORTFOLIO_LINK_HIDDEN: <a href="/portfolio" data-i18n="nav.portfolio">معرض الأعمال</a> -->
    <a href="/team" data-i18n="nav.team">الفريق</a>
    <a href="/clients.html" data-i18n="nav.clients">العملاء</a>
    <a href="#register" data-i18n="nav.contact">تواصل</a>
  </div>`;

const repNav = `<div class="hdr-nav">
    <a href="/" data-i18n="nav.home">الرئيسية</a>
    <a href="/about.html" data-i18n="nav.about">من نحن</a>
    <a href="/services.html" data-i18n="nav.services">الخدمات</a>
    <a href="/audit.html" style="color:#818cf8;font-weight:700;">فحص الأمان 12</a>
    <a href="/loyalty.html" style="color:#fbbf24;font-weight:700;">كروت المحفظة</a>
    <a href="/team" data-i18n="nav.team">الفريق</a>
    <a href="/clients.html" data-i18n="nav.clients">العملاء</a>
    <a href="#register" data-i18n="nav.contact">تواصل</a>
  </div>`;

const isCRLF = content.includes('\r\n');
const targetNorm = isCRLF ? targetNav.replace(/\n/g, '\r\n') : targetNav.replace(/\r\n/g, '\n');
const repNorm = isCRLF ? repNav.replace(/\n/g, '\r\n') : repNav.replace(/\r\n/g, '\n');

if (content.includes(targetNorm)) {
  content = content.replace(targetNorm, repNorm);
  fs.writeFileSync('index.html', content, 'utf8');
  console.log('Successfully updated navbar in index.html!');
} else {
  console.log('Target nav not matched directly');
}
