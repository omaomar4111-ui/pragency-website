const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
const match = regex.exec(html); // Script 1
const s1 = match[1];

fs.writeFileSync('temp_s1.js', s1, 'utf8');

const { execSync } = require('child_process');
try {
  const out = execSync('node --check temp_s1.js', { encoding: 'utf8' });
  console.log('Node check output:', out);
} catch (e) {
  console.error('Node check FAILED on Script #1:');
  console.error(e.output ? e.output.toString() : e.message);
}
