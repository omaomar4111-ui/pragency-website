const fs = require('fs');

const content = fs.readFileSync('portal-dashboard-2026.html', 'utf8');
const scriptMatch = content.match(/<script(?:\s+type="text\/javascript")?>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  const code = scriptMatch[1];
  const vm = require('vm');
  try {
    new vm.Script(code);
  } catch (err) {
    console.error('Portal dashboard error:\n', err.stack);
  }
}
