const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const idx = content.indexOf("document.getElementById('addLeadForm')");
if (idx !== -1) {
  console.log(content.substring(Math.max(0, idx - 800), idx + 200));
}
