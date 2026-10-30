const fs = require('fs');

const s1 = fs.readFileSync('temp_s1.js', 'utf8');
const idx = s1.indexOf('openLeadDetail(');
console.log(s1.substring(idx - 20, idx + 40));
