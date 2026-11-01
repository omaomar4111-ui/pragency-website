const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const fnFiles = getFiles('functions');
console.log('Auditing', fnFiles.length, 'Cloudflare Functions files for parsing/syntax errors...');

let errCount = 0;
// We can use node check by importing or using esprima/acorn/node --check via child_process
const { execSync } = require('child_process');
for (const file of fnFiles) {
  try {
    execSync(`node --check "${file}"`, { stdio: 'pipe' });
  } catch (e) {
    console.error(`❌ Syntax error in ${file}:`);
    console.error(e.stderr.toString());
    errCount++;
  }
}

console.log(`\nFunctions audit complete! Total errors: ${errCount}`);
