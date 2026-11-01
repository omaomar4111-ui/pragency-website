const fs = require('fs');
const content = fs.readFileSync('js/main.js', 'utf8');

const fns = [
  'initLoader',
  'initProgressBar',
  'initHeader',
  'initMobileMenu',
  'initNavActive',
  'initFooterYear',
  'initBackToTop',
  'initParticles',
  'initCursor',
  'initRipple'
];

for (const fn of fns) {
  const isDef = content.includes('function ' + fn);
  console.log(`${fn}: ${isDef ? 'EXISTS' : '❌ MISSING'}`);
}
