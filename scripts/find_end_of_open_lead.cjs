const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
const match = regex.exec(html); // Script 1
const s1 = match[1];

const idx = s1.indexOf('async function openLeadDetail');
const endFnIdx = s1.indexOf('function ', idx + 50);
console.log('--- Inside openLeadDetail template literal: ---');
console.log(s1.substring(idx + 5000, endFnIdx + 100));
