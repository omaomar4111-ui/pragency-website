const fs = require('fs');

const js = fs.readFileSync('js/admin.js', 'utf8');

const matches = [];
let pos = 0;
while (true) {
  const idx = js.indexOf('تفاصيل', pos);
  if (idx === -1) break;
  matches.push(js.substring(Math.max(0, idx - 80), Math.min(js.length, idx + 150)));
  pos = idx + 6;
}

console.log('Occurrences of تفاصيل in js/admin.js:\n');
matches.forEach((m, i) => console.log(`Match ${i}:\n${m}\n`));
