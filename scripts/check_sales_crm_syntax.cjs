const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const scripts = [...content.matchAll(/<script(?![^>]*src=)([\s\S]*?)<\/script>/gi)];
console.log('Inline scripts count:', scripts.length);

scripts.forEach((s, idx) => {
  try {
    new Function(s[1]);
    console.log(`Script ${idx + 1} syntax: VALID`);
  } catch (e) {
    console.error(`Script ${idx + 1} syntax ERROR:`, e.message);
  }
});
