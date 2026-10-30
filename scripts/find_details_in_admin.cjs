const fs = require('fs');

const html = fs.readFileSync('admin-agency.html', 'utf8');

const matches = [];
let pos = 0;
while (true) {
  const idx = html.indexOf('تفاصيل', pos);
  if (idx === -1) break;
  matches.push(html.substring(Math.max(0, idx - 80), Math.min(html.length, idx + 150)));
  pos = idx + 6;
}

console.log('Occurrences of تفاصيل in admin-agency.html:\n');
matches.forEach((m, i) => console.log(`Match ${i}:\n${m}\n`));
