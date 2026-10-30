const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const modalIdx = html.indexOf('id="leadDetailModal"');
console.log('--- leadDetailModal in HTML: ---');
console.log(html.substring(modalIdx, modalIdx + 600));

// Check openModal definition
const openModalIdx = html.indexOf('function openModal');
console.log('--- openModal definition: ---');
console.log(html.substring(openModalIdx, openModalIdx + 300));
