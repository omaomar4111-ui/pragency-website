const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const fetchIdx = content.indexOf('async function fetchLeads');
if (fetchIdx !== -1) {
  console.log(content.substring(fetchIdx, fetchIdx + 1200));
}

const allLeadsInit = content.indexOf('let allLeads =');
if (allLeadsInit !== -1) {
  console.log(content.substring(allLeadsInit, allLeadsInit + 600));
}
