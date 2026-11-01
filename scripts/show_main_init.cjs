const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');
const idx = code.indexOf('initNavActive();');
console.log(JSON.stringify(code.substring(idx - 100, idx + 50)));
