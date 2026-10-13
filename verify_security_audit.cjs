const fs = require('fs');

console.log('═══════════════════════════════════════');
console.log('   PART 1: SECURITY STATIC AUDIT');
console.log('═══════════════════════════════════════\n');

const code = fs.readFileSync('functions/api/portal/auth.js', 'utf8');

console.log('--- 1.1 Password Security ---');
console.log('Uses bcrypt:', code.includes('bcrypt'));
console.log('Uses argon2:', code.includes('argon2'));
console.log('Uses scrypt:', code.includes('scrypt'));
console.log('Uses SHA-256:', code.includes('sha256') || code.includes('SHA-256'));

console.log('\n--- 1.2 JWT Security ---');
console.log('JWT secret from env:', code.includes('env.JWT_SECRET') || code.includes('env.PORTAL_SECRET'));
console.log('JWT secret hardcoded:', /secret['"]\s*[:=]\s*['"][a-zA-Z0-9]/i.test(code));
const expMatch = code.match(/expiresIn['"]?\s*[:=]\s*['"]([^'"]+)/);
console.log('Token expiry:', expMatch ? expMatch[1] : 'NOT FOUND');

console.log('\n--- 1.5 SQL Injection Static Check ---');
const dir = 'functions/api/portal';
const files = fs.readdirSync(dir);
let sqlAllBound = true;
for (const file of files) {
  if (!file.endsWith('.js')) continue;
  const content = fs.readFileSync(`${dir}/${file}`, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('.prepare(') && line.includes('?') && !line.includes('.bind(')) {
      // Check next lines for .bind
      const block = lines.slice(i, i + 5).join(' ');
      if (!block.includes('.bind(')) {
        console.log(`POTENTIAL UNBOUND SQL: ${file}:${i + 1}: ${line.trim()}`);
        sqlAllBound = false;
      }
    }
  });
}
console.log('All parameterized queries use .bind():', sqlAllBound);
