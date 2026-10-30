const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
const match = regex.exec(html); // Script 1
const s1 = match[1];

const idx1 = s1.indexOf('recentLeadsBody');
if (idx1 !== -1) {
  console.log('recentLeadsBody in Script 1:\n', s1.substring(idx1 - 100, idx1 + 600));
}

const idx2 = s1.indexOf('leadsTableBody');
if (idx2 !== -1) {
  console.log('leadsTableBody in Script 1:\n', s1.substring(idx2 - 100, idx2 + 600));
}
