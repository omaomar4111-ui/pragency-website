const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const fnIdx = html.indexOf('async function openLeadDetail');
if (fnIdx !== -1) {
  console.log(html.substring(fnIdx, fnIdx + 2500));
} else {
  console.log('function not found with async, searching openLeadDetail:');
  const idx2 = html.indexOf('openLeadDetail(');
  console.log(html.substring(idx2 - 50, idx2 + 1500));
}
