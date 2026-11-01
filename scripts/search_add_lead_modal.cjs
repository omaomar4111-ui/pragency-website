const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const matches = [...content.matchAll(/addLeadModal/g)];
console.log('Matches of addLeadModal:', matches.length);
for (const m of matches) {
  const start = Math.max(0, m.index - 50);
  console.log('Context:\n', content.substring(start, start + 150));
}
