const fs = require('fs');

const s1 = fs.readFileSync('temp_s1.js', 'utf8');

const matches = [];
let pos = 0;
while (true) {
  const idx = s1.indexOf('allLeads', pos);
  if (idx === -1) break;
  const snippet = s1.substring(Math.max(0, idx - 20), Math.min(s1.length, idx + 120));
  if (snippet.includes('=') || snippet.includes('fetch')) {
    matches.push({ idx, text: snippet });
  }
  pos = idx + 8;
}

matches.forEach((m, i) => console.log(`Match ${i}:\n${m.text}\n`));
