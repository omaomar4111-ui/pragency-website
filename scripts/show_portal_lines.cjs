const fs = require('fs');
let content = fs.readFileSync('portal-dashboard-2026.html', 'utf8');
const lines = content.split(/\r?\n/);
for (let i = 1140; i < 1160; i++) {
  console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}
