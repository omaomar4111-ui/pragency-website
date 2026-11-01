const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const navMatch = content.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
if (navMatch) {
  console.log('Nav links snippet:\n', navMatch[1]);
}

const footerMatch = content.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
if (footerMatch) {
  console.log('Footer snippet:\n', footerMatch[1].substring(0, 400));
}
