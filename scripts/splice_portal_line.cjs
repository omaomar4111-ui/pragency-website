const fs = require('fs');
let content = fs.readFileSync('portal-dashboard-2026.html', 'utf8');
const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';
const lines = content.split(/\r?\n/);

if (lines[1150] === '    }') {
  lines.splice(1150, 1);
  fs.writeFileSync('portal-dashboard-2026.html', lines.join(eol), 'utf8');
  console.log('Successfully removed extraneous brace from portal-dashboard-2026.html!');
} else {
  console.log('Line 1151 was:', lines[1150]);
}
