const fs = require('fs');

const code = fs.readFileSync('functions/api/admin/sales/leads.js', 'utf8');

const getIdx = code.indexOf('onRequestGet');
console.log(code.substring(getIdx, getIdx + 1200));
