const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'))
  .concat(fs.readdirSync('js').filter(f => f.endsWith('.js')).map(f => 'js/' + f));

const endpoints = new Set();
for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g);
    if (matches) {
      for (const m of matches) {
        const url = m.replace(/fetch\s*\(\s*['"`]/, '').replace(/['"`]/, '');
        if (url.startsWith('/') || url.startsWith('http')) {
          endpoints.add(url.split('?')[0]);
        }
      }
    }
  } catch (e) {}
}

console.log('All API endpoints fetched by frontend:');
console.log([...endpoints].sort());
