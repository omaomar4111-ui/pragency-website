const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const outreachIdx = html.indexOf('function triggerAutoOutreach');
if (outreachIdx !== -1) {
  console.log(html.substring(outreachIdx, outreachIdx + 1500));
} else {
  console.log('triggerAutoOutreach definition not found');
}
