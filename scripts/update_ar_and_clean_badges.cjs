const fs = require('fs');

// 1. Update locales/ar.json
if (fs.existsSync('locales/ar.json')) {
  const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf8'));
  ar['hero.title.line1'] = "تسويق رقمي";
  ar['hero.title.line2'] = "بيجيب مبيعات،";
  ar['hero.title.line3'] = "مش مجرد لايكات وأرقام وخلاص.";
  ar['hero.title'] = "تسويق رقمي بيجيب مبيعات";
  ar['hero.sub2'] = "فريق متكامل في القاهرة لإدارة السوشيال ميديا، الميديا بايينج، وصناعة إعلانات فيديو تحقق أعلى عائد على استثمارك (ROAS).";
  fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2), 'utf8');
  console.log('Updated locales/ar.json');
}

// 2. Remove pill badges from about.html and team.html
['about.html', 'team.html'].forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/<span class="team-hero-badge"[\s\S]*?<\/span>\s*/g, '');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Removed team-hero-badge from ${file}`);
  }
});
