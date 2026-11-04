const fs = require('fs');
const path = require('path');

const patterns = [
  { name: 'Telegram Bot Token', regex: /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/g },
  { name: 'OpenAI API Key', regex: /sk-[A-Za-z0-9-_]{20,}/g },
  { name: 'Stripe Secret Key', regex: /sk_(?:live|test)_[0-9a-zA-Z]{24,}/g },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Generic Private Key', regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g },
  { name: 'Hardcoded JWT Secret', regex: /(?:jwt_secret|jwtSecret)\s*[:=]\s*['"`](?!process\.env)[^'"`]{8,}['"`]/gi },
  { name: 'Hardcoded Password/Token Assignment', regex: /(?:api_key|apiKey|auth_token|authToken|client_secret|clientSecret)\s*[:=]\s*['"`](?!process\.env|\$|YOUR_|INSERT_|test|xxx|GTM-|G-|PIXEL_)[^'"`]{16,}['"`]/gi }
];

const results = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', '.wrangler'].includes(entry.name)) continue;
      walk(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.js', '.cjs', '.ts', '.json', '.toml', '.yaml', '.yml', '.html'].includes(ext)) continue;
      if (entry.name === 'deep-secrets-audit.cjs' || entry.name === 'scan-secrets.cjs' || entry.name === 'SECURITY_AUDIT_REPORT.md') continue;

      const content = fs.readFileSync(full, 'utf8');
      for (const p of patterns) {
        let match;
        while ((match = p.regex.exec(content)) !== null) {
          // Exclude typical false positives (like GTM container or Clarity IDs)
          const matchedStr = match[0];
          if (matchedStr.includes('GTM-') || matchedStr.includes('clarity') || matchedStr.includes('facebook') || matchedStr.includes('mask-buyer')) continue;
          
          results.push({
            file: path.relative(process.cwd(), full),
            pattern: p.name,
            snippet: matchedStr.substring(0, 30) + '...'
          });
        }
      }
    }
  }
}

walk('.');
console.log(JSON.stringify(results, null, 2));
