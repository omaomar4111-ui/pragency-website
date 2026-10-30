const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const matches = [];
let pos = 0;
while (true) {
  const idx = html.indexOf('إجراء', pos);
  if (idx === -1) break;
  matches.push(html.substring(Math.max(0, idx - 80), Math.min(html.length, idx + 350)));
  pos = idx + 5;
}

matches.forEach((m, i) => console.log(`=== MATCH ${i} ===\n${m}\n`));
