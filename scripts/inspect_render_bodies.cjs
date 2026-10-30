const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const r1 = html.indexOf('recentLeadsBody');
console.log('--- recentLeadsBody snippet: ---');
console.log(html.substring(r1, r1 + 1000));

const r2 = html.indexOf('leadsTableBody');
console.log('--- leadsTableBody snippet: ---');
console.log(html.substring(r2, r2 + 1000));
