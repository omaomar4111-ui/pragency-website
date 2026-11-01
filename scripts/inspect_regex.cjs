const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const scriptMatch = content.match(/<script(?![^>]*src=)([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  console.log('scriptMatch[0] start:', JSON.stringify(scriptMatch[0].substring(0, 30)));
  console.log('scriptMatch[1] start:', JSON.stringify(scriptMatch[1].substring(0, 30)));
}
