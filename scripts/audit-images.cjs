// scripts/audit-images.cjs
const fs = require('fs');

const pages = ['index.html', 'about.html', 'services.html', 'clients.html'];

pages.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const imgMatches = content.match(/<img[^>]*>/gi) || [];
  console.log(`\n📄 [${file}] Total <img> tags: ${imgMatches.length}`);
  
  let issues = 0;
  imgMatches.forEach(img => {
    const hasWidth = /width=[\"'][^\"']*[\"']/i.test(img);
    const hasHeight = /height=[\"'][^\"']*[\"']/i.test(img);
    const hasLoading = /loading=[\"'](lazy|eager)[\"']/i.test(img);
    const srcMatch = img.match(/src=[\"']([^\"']*)[\"']/i);
    const src = srcMatch ? srcMatch[1] : 'unknown';

    if (!hasWidth || !hasHeight || !hasLoading) {
      issues++;
      console.log(`   ⚠️ [${src}]: missing ${[!hasWidth && 'width', !hasHeight && 'height', !hasLoading && 'loading'].filter(Boolean).join(', ')}`);
    }
  });

  if (issues === 0) {
    console.log(`   ✅ All <img> tags have explicit width, height, and loading attributes.`);
  }
});
