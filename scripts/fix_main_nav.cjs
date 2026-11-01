const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const needle = 'function init(){';
const idx = code.indexOf(needle);

if (idx !== -1) {
  const isCRLF = code.includes('\r\n');
  const eol = isCRLF ? '\r\n' : '\n';
  
  const navFunc = [
    'function initNavActive(){',
    '  var path = (window.location.pathname.replace(/^\\/|\\.html$/g, \'\') || \'index\');',
    '  document.querySelectorAll(\'nav a, .nav-links a, .header-nav a\').forEach(function(a){',
    '    var href = ((a.getAttribute(\'href\') || \'\').replace(/^\\/|\\.html$/g, \'\') || \'index\');',
    '    if(href === path){',
    '      a.classList.add(\'active\');',
    '    }',
    '  });',
    '}',
    ''
  ].join(eol);

  code = code.substring(0, idx) + navFunc + code.substring(idx);
  fs.writeFileSync('js/main.js', code, 'utf8');
  console.log('Successfully injected initNavActive into js/main.js!');
} else {
  console.log('Needle not found');
}
