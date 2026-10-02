const fs = require('fs');

// 1. Add CSS for services page rv fix
let css = fs.readFileSync('css/pages.css', 'utf-8');
if (!css.includes('.services-page .rv')) {
  css += '\n\n/* Fix reveal for services page */\n.services-page .rv {\n  opacity: 1 !important;\n  transform: none !important;\n}\n';
  fs.writeFileSync('css/pages.css', css);
}

// 2. Fix relative paths in services/*.html
const srvFiles = fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f);
srvFiles.forEach(f => {
  let html = fs.readFileSync(f, 'utf-8');
  
  // Replace css/ to ../css/ (only if not already ../css/ or /css/)
  html = html.replace(/(href|src)=["']css\//g, '$1="../css/');
  html = html.replace(/(href|src)=["']js\//g, '$1="../js/');
  html = html.replace(/(href|src)=["']assets\//g, '$1="../assets/');
  
  fs.writeFileSync(f, html);
});

// 3. Bump cache everywhere
const allHtml = [
  ...fs.readdirSync('.').filter(f => f.endsWith('.html')),
  ...srvFiles
];
allHtml.forEach(f => {
  let html = fs.readFileSync(f, 'utf-8');
  html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=54');
  fs.writeFileSync(f, html);
});

console.log('Fixes applied successfully.');
