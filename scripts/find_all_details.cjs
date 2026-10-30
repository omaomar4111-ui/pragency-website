const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const matches = [];
let pos = 0;
while (true) {
  const idx = html.indexOf('تفاصيل', pos);
  if (idx === -1) break;
  matches.push({ idx, text: html.substring(Math.max(0, idx - 60), Math.min(html.length, idx + 100)) });
  pos = idx + 6;
}

matches.forEach((m, i) => console.log(`Match ${i}:\n${m.text}\n`));
