const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
const match = regex.exec(html); // Script 1
const s1 = match[1];

const idx2 = s1.indexOf('leadsTableBody');
console.log('leadsTableBody rendering snippet:\n', s1.substring(idx2, idx2 + 1000));
