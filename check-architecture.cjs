/**
 * check-architecture.cjs
 * Architecture & Persona Boundary Linter
 * Ensures that internal admin tools and links never leak into public marketing pages.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_PAGES = [
  'index.html',
  'about.html',
  'services.html',
  'clients.html',
  'team.html',
  'contact.html',
  'case-studies.html',
  'portfolio.html'
];

const FORBIDDEN_PATTERNS = [
  { pattern: /website-factory\.html/i, name: 'Link to website-factory.html' },
  { pattern: /audit\.html/i, name: 'Link to audit.html' },
  { pattern: /مصنع المواقع/i, name: 'Label "مصنع المواقع"' },
  { pattern: /فحص الأمان 12/i, name: 'Label "فحص الأمان 12"' },
  { pattern: /admin-agency\.html/i, name: 'Direct link to admin-agency.html' }
];

let totalViolations = 0;

console.log('🔍 Running Architecture Boundary Check on Public Pages...\n');

PUBLIC_PAGES.forEach((file) => {
  const filePath = path.resolve(__dirname, file);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    // Only check navigation and body content (ignore scripts or explanatory meta comments if any)
    FORBIDDEN_PATTERNS.forEach(({ pattern, name }) => {
      if (pattern.test(line)) {
        console.error(`❌ VIOLATION in ${file}:${idx + 1} -> Found forbidden: ${name}`);
        console.error(`   Line content: ${line.trim()}`);
        totalViolations++;
      }
    });
  });
});

if (totalViolations > 0) {
  console.error(`\n🚨 FAILED: ${totalViolations} architecture boundary violation(s) found! Build blocked.`);
  process.exit(1);
} else {
  console.log('✅ PASSED: All public pages strictly adhere to persona boundaries. No admin tools leaked.');
  process.exit(0);
}
