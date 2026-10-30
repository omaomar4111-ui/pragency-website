const fs = require('fs');

const s1 = fs.readFileSync('temp_s1.js', 'utf8');

const idx = s1.indexOf('function fetchLeads');
console.log('fetchLeads part 2 in Script 1:\n', s1.substring(idx + 500, idx + 1200));
