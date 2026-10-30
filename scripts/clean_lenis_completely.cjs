const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const idx = h.indexOf("typeof Lenis");
if (idx !== -1) {
  const start = h.lastIndexOf("<script", idx);
  const end = h.indexOf("</script>", idx) + 9;
  h = h.slice(0, start) + h.slice(end);
  fs.writeFileSync('index.html', h, 'utf8');
  console.log('Cleaned inline Lenis script block completely');
} else {
  console.log('No Lenis found');
}
