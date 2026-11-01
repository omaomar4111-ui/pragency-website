const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const idx = content.indexOf('function openAddLeadModal');
if (idx !== -1) {
  console.log(content.substring(idx, idx + 600));
} else {
  console.log('openAddLeadModal NOT FOUND!');
}

const addBtnMatch = [...content.matchAll(/openAddLeadModal/g)];
console.log('Matches of openAddLeadModal:', addBtnMatch.length);
