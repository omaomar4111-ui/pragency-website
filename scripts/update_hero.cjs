const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace hero title in index.html
html = html.replace(
  /<h1 class="hero-vr-title">[\s\S]*?<\/h1>\s*<p class="hero-vr-sub"[^>]*>[\s\S]*?<\/p>/,
  `<h1 class="hero-vr-title">
        <span data-i18n="hero.title.line1">تسويق رقمي</span><br/>
        <span class="hero-vr-title-accent"><span data-i18n="hero.title.line2">بيجيب مبيعات،</span></span><br/>
        <span class="hero-vr-title-small"><span data-i18n="hero.title.line3">مش مجرد لايكات وأرقام وخلاص.</span></span>
      </h1>
      
      <p class="hero-vr-sub" data-i18n="hero.sub2">فريق متكامل في القاهرة لإدارة السوشيال ميديا، الميديا بايينج، وصناعة إعلانات فيديو تحقق أعلى عائد على استثمارك (ROAS).</p>`
);

// Remove pill badges from index.html
html = html.replace(/<div class="section-badge rv"[^>]*>[\s\S]*?<\/div>\s*/g, '');
html = html.replace(/<div class="section-badge"[^>]*>[\s\S]*?<\/div>\s*/g, '');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Updated index.html successfully!');
