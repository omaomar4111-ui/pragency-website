const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const needle = 'function init(){';
const idx = code.indexOf(needle);

if (idx !== -1) {
  const isCRLF = code.includes('\r\n');
  const eol = isCRLF ? '\r\n' : '\n';
  
  const additionalFuncs = [
    'function initFooterYear() {',
    '  var el = document.getElementById(\'year\') || document.querySelector(\'.current-year\') || document.querySelector(\'.footer-year\');',
    '  if (el) {',
    '    el.textContent = new Date().getFullYear();',
    '  }',
    '}',
    '',
    'function initBackToTop() {',
    '  var btn = document.getElementById(\'backToTop\') || document.querySelector(\'.back-to-top\');',
    '  if (!btn) return;',
    '  window.addEventListener(\'scroll\', function() {',
    '    if (window.scrollY > 400) {',
    '      btn.classList.add(\'visible\');',
    '    } else {',
    '      btn.classList.remove(\'visible\');',
    '    }',
    '  });',
    '  btn.addEventListener(\'click\', function(e) {',
    '    e.preventDefault();',
    '    window.scrollTo({ top: 0, behavior: \'smooth\' });',
    '  });',
    '}',
    ''
  ].join(eol);

  code = code.substring(0, idx) + additionalFuncs + code.substring(idx);
  fs.writeFileSync('js/main.js', code, 'utf8');
  console.log('Successfully injected initFooterYear and initBackToTop into js/main.js!');
} else {
  console.log('Needle not found');
}
