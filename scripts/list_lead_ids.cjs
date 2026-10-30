const { execSync } = require('child_process');
const res = execSync('npx wrangler d1 execute pragency-analytics --remote --command="SELECT id, name FROM sales_leads LIMIT 10;"', { encoding: 'utf8' });
console.log(res);
