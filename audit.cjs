const fs = require('fs');
const s = fs.readFileSync('services.html', 'utf-8');
const start = s.indexOf('3 خدمات');
console.log(s.substring(start - 200, start + 2000));
