const fs = require('fs');

const content = fs.readFileSync('sales-crm-2026.html', 'utf8');
const tables = [...content.matchAll(/<table[^>]*>/gi)];
console.log('Tables found:', tables.length);

const tbodies = [...content.matchAll(/<tbody[^>]*id=["']([^"']*)["']/gi)];
console.log('tbodies with id:', tbodies.map(m => m[1]));

const allTbodies = [...content.matchAll(/<tbody[^>]*>/gi)];
console.log('all tbodies count:', allTbodies.length);
