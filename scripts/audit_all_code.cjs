const fs = require('fs');
const path = require('path');

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
console.log('Auditing', htmlFiles.length, 'HTML files for inline script errors...');

let totalErrors = 0;
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const scripts = [...content.matchAll(/<script(?:\s+type="text\/javascript")?>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((m, i) => {
    const code = m[1].trim();
    if (!code) return;
    try {
      new Function(code);
    } catch (e) {
      console.error(`❌ In ${file} (Script #${i+1}): ${e.message}`);
      totalErrors++;
    }
  });
}

const jsFiles = fs.readdirSync('js').filter(f => f.endsWith('.js'));
console.log('\nAuditing', jsFiles.length, 'JS files for syntax errors...');
for (const file of jsFiles) {
  const code = fs.readFileSync('js/' + file, 'utf8');
  try {
    new Function(code);
  } catch (e) {
    console.error(`❌ In js/${file}: ${e.message}`);
    totalErrors++;
  }
}

console.log(`\nAudit complete! Total syntax errors found: ${totalErrors}`);
