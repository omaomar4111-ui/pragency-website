const fs = require('fs');

// Check coverage in index.html
const html = fs.readFileSync('index.html', 'utf-8');
const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

// Find all data-i18n keys used in HTML
const i18nKeys = [...html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map(m => m[1]);

const missingAR = i18nKeys.filter(k => !ar[k]);
const missingEN = i18nKeys.filter(k => !en[k]);

console.log('=== Keys in index.html missing from ar.json ===');
missingAR.forEach(k => console.log('  MISSING AR:', k));

console.log('=== Keys in index.html missing from en.json ===');
missingEN.forEach(k => console.log('  MISSING EN:', k));

console.log('\nTotal keys in index.html:', i18nKeys.length);
console.log('Missing from AR:', missingAR.length);
console.log('Missing from EN:', missingEN.length);

// Also check for Arabic text without data-i18n
const arTextPattern = />[^<]*[\u0600-\u06FF][^<]*</g;
const matches = [...html.matchAll(arTextPattern)];
console.log('\n=== Arabic text potentially without translation ===');
let count = 0;
matches.forEach(m => {
  const txt = m[0].trim();
  if (txt.length > 5 && !txt.includes('data-i18n') && !txt.includes('<!--')) {
    count++;
    if (count <= 30) console.log('  ', txt.substring(0, 80));
  }
});
console.log('Total unchecked:', count);
