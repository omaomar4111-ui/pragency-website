const fs = require('fs');
const content = fs.readFileSync('js/main.js', 'utf8');
const lines = content.split('\n');
console.log('Lines around 158:');
for (let i = 145; i < 175 && i < lines.length; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

const navMatch = content.indexOf('initNavActive');
console.log('initNavActive index:', navMatch);
if (navMatch !== -1) {
  console.log('Context:\n', content.substring(Math.max(0, navMatch - 150), navMatch + 150));
}
