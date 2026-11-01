const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const target = `window.__2D={
  track:track,
  saveLocal:saveLocal,
  saveSupabase:saveSupabase,
  validatePhone:validatePhone,
  normalizePhone:normalizePhone
};`;

const replacement = `window.__2D={
  track: typeof track !== 'undefined' ? track : null
};`;

const isCRLF = code.includes('\r\n');
const targetNorm = isCRLF ? target.replace(/\n/g, '\r\n') : target.replace(/\r\n/g, '\n');
const repNorm = isCRLF ? replacement.replace(/\n/g, '\r\n') : replacement.replace(/\r\n/g, '\n');

if (code.includes(targetNorm)) {
  code = code.replace(targetNorm, repNorm);
  fs.writeFileSync('js/main.js', code, 'utf8');
  console.log('Successfully cleaned window.__2D in js/main.js!');
} else {
  console.log('Target not found');
}
