const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const tIdx = html.indexOf('<tbody id="recentLeadsBody">');
console.log('HTML in recentLeadsBody:\n', html.substring(tIdx, tIdx + 400));
