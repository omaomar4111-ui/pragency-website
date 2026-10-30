const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log('--- 1. Scanning Internal Links in HTML Files ---');
const missingLinks = [];
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const matches = [...content.matchAll(/href=["'](\/[a-zA-Z0-9_\-\.\/]+)["']/g)];
  matches.forEach(m => {
    let link = m[1].split('#')[0].split('?')[0];
    if (link.startsWith('/api/') || link.startsWith('/assets/') || link.startsWith('/css/') || link.startsWith('/js/') || link.startsWith('/icons/') || link.startsWith('/lp/')) return;
    if (link === '/') return;
    
    let target = link.startsWith('/') ? link.slice(1) : link;
    if (!target.endsWith('.html') && !target.includes('.')) {
      if (fs.existsSync(path.join(rootDir, target + '.html'))) return;
      if (fs.existsSync(path.join(rootDir, target, 'index.html'))) return;
    }
    if (!fs.existsSync(path.join(rootDir, target))) {
      missingLinks.push({ file, link, fullTarget: target });
    }
  });
});
console.log('Missing/Unresolved internal links:', missingLinks);

console.log('\n--- 2. Scanning fetch() Endpoints in HTML & JS ---');
function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== '.git' && e.name !== '.wrangler' && e.name !== 'scripts') {
        files = files.concat(getFiles(full));
      }
    } else if (e.name.endsWith('.html') || e.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

const allCodeFiles = getFiles(rootDir);
const apiDir = path.join(rootDir, 'functions', 'api');
const missingApiEndpoints = [];

allCodeFiles.forEach(f => {
  if (f.includes('functions') || f.includes('scripts')) return;
  const content = fs.readFileSync(f, 'utf8');
  const matches = [...content.matchAll(/fetch\s*\(\s*[`'"](\/api\/[a-zA-Z0-9_\-\.\/]+)[`'"]/g)];
  matches.forEach(m => {
    const endpoint = m[1].split('?')[0];
    const rel = endpoint.replace('/api/', '');
    const parts = rel.split('/');
    
    const directJs = path.join(apiDir, rel + '.js');
    const indexJs = path.join(apiDir, rel, 'index.js');
    
    let exists = fs.existsSync(directJs) || fs.existsSync(indexJs);
    if (!exists && parts.length > 1) {
      const parentDir = path.join(apiDir, parts.slice(0, -1).join(path.sep));
      if (fs.existsSync(parentDir)) {
        const pEntries = fs.readdirSync(parentDir);
        if (pEntries.some(pe => pe.startsWith('[') && pe.endsWith('].js'))) {
          exists = true;
        }
      }
    }

    if (!exists) {
      missingApiEndpoints.push({ file: path.relative(rootDir, f), endpoint });
    }
  });
});

console.log('Missing/Unresolved API endpoints called by frontend:');
console.log(missingApiEndpoints);
