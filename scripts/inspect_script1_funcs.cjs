const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const regex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
const match = regex.exec(html); // Script 1
const s1 = match[1];

const detailIdx = s1.indexOf('openLeadDetail(');
console.log('openLeadDetail in Script #1:\n', s1.substring(detailIdx - 50, detailIdx + 1200));

const renderTableIdx = s1.indexOf('function renderLeadsTable');
console.log('renderLeadsTable in Script #1:\n', s1.substring(renderTableIdx, renderTableIdx + 800));
