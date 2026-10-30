const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
const scriptContent = html.substring(scriptStart + 8, scriptEnd);

try {
  new Function(scriptContent);
  console.log('Script syntax is VALID!');
} catch (e) {
  console.error('SYNTAX ERROR DETECTED IN SCRIPT:');
  console.error(e.message);
  console.error(e.stack);
}
