const fs = require('fs');

const s1 = fs.readFileSync('temp_s1.js', 'utf8');
const matches = [];
let pos = 0;
while (true) {
  const idx = s1.indexOf('openLeadDetail', pos);
  if (idx === -1) break;
  matches.push({ idx, text: s1.substring(Math.max(0, idx - 30), Math.min(s1.length, idx + 100)) });
  pos = idx + 14;
}

matches.forEach((m, i) => console.log(`Match ${i} at index ${m.idx}:\n${m.text}\n`));
