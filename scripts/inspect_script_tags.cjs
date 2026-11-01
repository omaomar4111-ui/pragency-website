const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const scriptIdx = content.indexOf('<script');
const allScripts = [...content.matchAll(/<script[^>]*>/gi)];
console.log('All script tags:');
allScripts.forEach(s => {
  const start = s.index;
  console.log('Tag at index', start, ':', content.substring(start, start + 80));
});
