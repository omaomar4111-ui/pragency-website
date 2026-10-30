const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const mIdx = html.indexOf('/* Modals responsive */');
console.log(html.substring(mIdx, mIdx + 600));
