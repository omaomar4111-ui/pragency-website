const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const s1 = html.indexOf('<script>');
const s1End = html.indexOf('</script>');
const script = html.substring(s1, s1End);

const loadIdx = script.indexOf('DOMContentLoaded') !== -1 ? script.indexOf('DOMContentLoaded') : script.indexOf('window.onload');
console.log('Window load snippet:');
if (loadIdx !== -1) {
  console.log(script.substring(loadIdx - 50, loadIdx + 500));
} else {
  console.log('DOMContentLoaded not found, finding refreshAll or refreshDashboard calls:');
  const rIdx = script.indexOf('refreshDashboard()');
  console.log(script.substring(rIdx - 50, rIdx + 400));
}
