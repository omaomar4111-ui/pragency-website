const fs = require('fs');
const content = fs.readFileSync('functions/locales_data.js', 'utf8');
const dollar = String.fromCharCode(36);
console.log('Contains $1K:', content.includes(dollar + '1K'));
console.log('Total dollar occurrences in locales_data.js:', content.split(dollar).length - 1);

const index = fs.readFileSync('index.html', 'utf8');
console.log('Contains $1K in index.html:', index.includes(dollar + '1K'));
console.log('Contains $3K in index.html:', index.includes(dollar + '3K'));
console.log('Contains $10K in index.html:', index.includes(dollar + '10K'));
