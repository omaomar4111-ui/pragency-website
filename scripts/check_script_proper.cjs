const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const scriptMatches = [...content.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];

scriptMatches.forEach((m, idx) => {
  const code = m[1];
  try {
    new Function(code);
    console.log(`Script ${idx + 1} syntax: VALID (${code.length} chars)`);
  } catch (err) {
    console.error(`Script ${idx + 1} syntax ERROR:`, err.message);
  }
});
