const fs = require('fs');

const s1 = fs.readFileSync('temp_s1.js', 'utf8');

const idx = s1.indexOf('async function openLeadDetail');
console.log(s1.substring(idx, idx + 4000));
