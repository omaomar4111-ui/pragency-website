const fs = require('fs');

const content = fs.readFileSync('portal-dashboard-2026.html', 'utf8');
const scriptMatch = content.match(/<script(?:\s+type="text\/javascript")?>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  const lines = scriptMatch[1].split('\n');
  for (let i = 360; i < 395 && i < lines.length; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
