const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const modalIdx = html.indexOf('id="leadDetailModal"');
console.log('Snippet 300 chars before leadDetailModal:\n', html.substring(modalIdx - 300, modalIdx));
console.log('Snippet 300 chars after leadDetailModal:\n', html.substring(modalIdx, modalIdx + 300));
