const fs = require('fs');
const content = fs.readFileSync('js/main.js', 'utf8');
const idx = content.indexOf('function init(){');
console.log(content.substring(idx, idx + 400));
