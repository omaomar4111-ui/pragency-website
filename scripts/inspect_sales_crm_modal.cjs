const fs = require('fs');

const salesCrm = fs.readFileSync('sales-crm-2026.html', 'utf8');
const modals = salesCrm.match(/id=["'][^"']*modal[^"']*["']/gi);
console.log('Modals in sales-crm:', modals);

const openLeadMatches = [...salesCrm.matchAll(/function\s+openLeadDetail[^{]*\{/g)];
console.log('openLeadDetail definitions:', openLeadMatches.length);
if (openLeadMatches.length > 0) {
  const idx = salesCrm.indexOf('function openLeadDetail');
  console.log('Snippet 1:\n', salesCrm.substring(idx, idx + 600));
}

// Let's check why 3 rows rendered
const indexLeads = salesCrm.indexOf('renderLeads');
if (indexLeads !== -1) {
  console.log('\nrenderLeads snippet:\n', salesCrm.substring(indexLeads, indexLeads + 1000));
}
