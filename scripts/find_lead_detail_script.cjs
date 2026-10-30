const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = regex.exec(html)) !== null) {
  count++;
  if (match[1].includes('openLeadDetail')) {
    console.log(`openLeadDetail found in Script #${count}`);
  }
}
