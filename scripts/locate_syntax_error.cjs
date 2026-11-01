const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const scriptMatch = content.match(/<script(?![^>]*src=)([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  const code = scriptMatch[1];
  const lines = code.split('\n');
  
  // Try binary searching or testing line by line where it breaks
  let currentCode = '';
  for (let i = 0; i < lines.length; i++) {
    currentCode += lines[i] + '\n';
    try {
      // wrap in function with balanced brackets to test up to here if possible
    } catch (e) {}
  }

  // Use vm or eval to get the line number
  const vm = require('vm');
  try {
    new vm.Script(code);
  } catch (err) {
    console.error('Exact Stack / Line:');
    console.error(err.stack);
  }
}
