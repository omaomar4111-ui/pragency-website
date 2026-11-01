const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const idx = content.indexOf('function refreshDashboard');
if (idx !== -1) {
  console.log(content.substring(idx + 700, idx + 1600));
}
