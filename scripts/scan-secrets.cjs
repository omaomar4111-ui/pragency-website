const fs = require('fs');
const path = require('path');

const secretPatterns = [
  { name: 'OpenAI API Key', regex: /sk-[A-Za-z0-9-_]{20,}/g },
  { name: 'Telegram Bot Token', regex: /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/g },
  { name: 'Generic Private Key', regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g }
];

const findings = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist' || f === '.wrangler') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full);
    } else if (stat.isFile() && /\.(js|cjs|html|json|env|md|txt)$/i.test(f)) {
      if (f === 'SECURITY_AUDIT_REPORT.md' || f === 'scan-secrets.cjs') continue;
      const content = fs.readFileSync(full, 'utf8');
      for (const sp of secretPatterns) {
        const matches = content.match(sp.regex);
        if (matches) {
          findings.push({ file: path.relative(process.cwd(), full), type: sp.name, count: matches.length });
        }
      }
    }
  }
}

scanDir('.');
console.log('Secrets scan result:');
console.log(JSON.stringify(findings, null, 2));
