const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'functions', 'api');

function getApiFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  list.forEach(file => {
    const full = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getApiFiles(full));
    } else if (file.name.endsWith('.js')) {
      results.push(full);
    }
  });
  return results;
}

const apiFiles = getApiFiles(apiDir);
console.log(`Auditing ${apiFiles.length} API files for try/catch and error handling...`);

const issues = [];

apiFiles.forEach(f => {
  const relPath = path.relative(rootDir, f);
  const content = fs.readFileSync(f, 'utf8');

  // Check if it exports onRequest or onRequestGet/Post etc.
  const hasHandler = /export\s+async\s+function\s+onRequest/i.test(content) || /export\s+function\s+onRequest/i.test(content);
  if (!hasHandler) return;

  // Check if DB queries exist
  const hasDb = /db\.prepare|env\.DB|env\.ANALYTICS_DB/i.test(content);
  if (hasDb) {
    // Check if there is a try-catch block
    if (!content.includes('try {') && !content.includes('try{')) {
      issues.push({ file: relPath, issue: 'Database calls without try/catch block' });
    }
    // Check if any raw query concatenates without bind
    const badConcatenation = /prepare\s*\(\s*`[^`]*\$\{/g.test(content) || /prepare\s*\(\s*['"][^'"]*\+/g.test(content);
    if (badConcatenation) {
      issues.push({ file: relPath, issue: 'Potential SQL injection: Query string concatenation in prepare()' });
    }
  }
});

console.log('Issues found:', issues.length);
console.log(JSON.stringify(issues, null, 2));
