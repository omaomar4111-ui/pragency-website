const fs = require('fs');

const loginCode = fs.readFileSync('functions/api/admin/login.js', 'utf8');

const vIdx = loginCode.indexOf('verifyAdminToken');
console.log(loginCode.substring(vIdx, vIdx + 1200));
