const fs = require('fs');

const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

const content = `// Auto-generated locale bundles for Edge execution
export const ar = ${JSON.stringify(ar)};
export const en = ${JSON.stringify(en)};
`;

fs.writeFileSync('functions/locales_data.js', content, 'utf-8');
console.log('functions/locales_data.js created successfully.');
