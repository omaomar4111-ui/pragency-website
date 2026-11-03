const esbuild = require('esbuild');
const fs = require('fs');

// 1. Minify main.css
const mainCss = fs.readFileSync('css/main.css', 'utf8');
const minMain = esbuild.transformSync(mainCss, { loader: 'css', minify: true });
fs.writeFileSync('css/main.min.css', minMain.code, 'utf8');
console.log('Created css/main.min.css (' + minMain.code.length + ' bytes)');

// 2. Minify pages.css
const pagesCss = fs.readFileSync('css/pages.css', 'utf8');
const minPages = esbuild.transformSync(pagesCss, { loader: 'css', minify: true });
fs.writeFileSync('css/pages.min.css', minPages.code, 'utf8');
console.log('Created css/pages.min.css (' + minPages.code.length + ' bytes)');
