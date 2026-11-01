const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const idx = content.indexOf('function renderLeadsTable');
if (idx !== -1) {
  console.log(content.substring(idx + 300, idx + 1800));
}
