const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');

const fns = ['loadReports', 'loadOverdue', 'populateLeadSelect', 'openModal', 'closeModal', 'openLeadDetail', 'openAddLeadModal'];
for (const fn of fns) {
  const exists = content.includes('function ' + fn);
  console.log(`Function ${fn}: ${exists ? 'EXISTS' : 'MISSING'}`);
}
