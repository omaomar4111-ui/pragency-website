const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = regex.exec(html)) !== null) {
  count++;
  console.log(`=== SCRIPT #${count} (Length: ${match[1].length}) ===`);
  console.log('First 300 chars:\n', match[1].substring(0, 300));
  console.log('Last 200 chars:\n', match[1].substring(match[1].length - 200));
}
