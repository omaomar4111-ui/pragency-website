const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');

// Look for Arabic text inside tags THAT DON'T ALREADY HAVE data-i18n nearby
// Strategy: find all text nodes (> Arabic <) where the parent opening tag has no data-i18n
const lineArr = html.split('\n');
const arRange = /[\u0600-\u06FF]/;
const results = [];

lineArr.forEach((line, i) => {
  if (arRange.test(line)) {
    // Check if line has data-i18n
    if (!line.includes('data-i18n') && !line.includes('<!--') && !line.includes('//') && !line.includes('ld+json')) {
      // Is it actual visible text?
      const stripped = line.replace(/<[^>]+>/g, '').trim();
      if (stripped.length > 2 && arRange.test(stripped)) {
        results.push({ lineNum: i+1, text: stripped.substring(0, 100), raw: line.trim().substring(0, 120) });
      }
    }
  }
});

console.log('=== Lines with Arabic text WITHOUT data-i18n ===');
results.forEach(r => console.log(`Line ${r.lineNum}: ${r.raw}`));
console.log('\nTotal:', results.length);
