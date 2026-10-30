const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const fetchIdx = html.indexOf('async function fetchLeads');
console.log(html.substring(fetchIdx, fetchIdx + 1200));
