const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const idx = content.indexOf('function openLeadDetail');
console.log(content.substring(idx - 20, idx + 300));
