const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
const match = regex.exec(html); // Script 1
const s1 = match[1];

const fnDefIdx = s1.indexOf('function openLeadDetail(');
console.log('Definition of openLeadDetail in Script #1 at index', fnDefIdx);
console.log(s1.substring(fnDefIdx, fnDefIdx + 1200));
