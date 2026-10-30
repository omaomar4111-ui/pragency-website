const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const modalIdx = html.indexOf('id="leadDetailModal"');
console.log(html.substring(modalIdx - 50, modalIdx + 100));
