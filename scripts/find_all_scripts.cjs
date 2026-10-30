const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = regex.exec(html)) !== null) {
  count++;
  const src = match[0].includes('src=') ? match[0].match(/src="[^"]+"/)[0] : 'inline';
  console.log(`Script #${count} (${src}): length = ${match[1].length}`);
  
  if (!match[0].includes('src=')) {
    try {
      new Function(match[1]);
      console.log(`  ✓ Script #${count} syntax is VALID`);
    } catch (e) {
      console.error(`  ❌ Script #${count} SYNTAX ERROR:`, e.message);
      // Find line number of error
      const lines = match[1].split('\n');
      console.error('Error sample context:');
      // Let's write the inline script to a temp file and parse with node to get line number
      fs.writeFileSync('temp_script_debug.js', match[1], 'utf8');
      try {
        require('child_process').execSync('node --check temp_script_debug.js');
      } catch (err) {
        console.error(err.output ? err.output.toString() : err.message);
      }
    }
  }
}
