const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = regex.exec(html)) !== null) {
  count++;
  if (count === 2) {
    console.log('=== FULL SCRIPT #2 ===');
    console.log(match[1]);
  }
}
