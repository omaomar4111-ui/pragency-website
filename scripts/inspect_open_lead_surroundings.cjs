const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
const match = regex.exec(html); // Script 1
const s1 = match[1];

const idx = s1.indexOf('async function openLeadDetail');
console.log('--- 500 chars before openLeadDetail ---');
console.log(s1.substring(idx - 500, idx));
console.log('--- 1500 chars after openLeadDetail ---');
console.log(s1.substring(idx, idx + 1500));
