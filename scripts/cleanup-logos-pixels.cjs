const fs = require('fs');
const path = require('path');

const files = ['index.html', 'about.html', 'services.html', 'clients.html'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Header logo
  content = content.replace(
    /<img\s+src="assets\/logos\/pr-agency\.webp"\s+alt="PR Agency[^"]*"\s+class="hdr-logo"[^>]*\/>/g,
    '<img src="assets/logos/pr-agency.webp" alt="PR Agency — وكالة تسويق متكاملة في القاهرة" class="hdr-logo" width="60" height="60" loading="eager" />'
  );

  // 2. Footer logo in about, services, clients
  content = content.replace(
    /<img\s+src="assets\/logos\/pr-agency\.webp"\s+alt="PR Agency[^"]*"\s+class="site-footer-logo"\s*\r?\n?\s*onerror=/g,
    '<img src="assets/logos/pr-agency.webp" alt="PR Agency — وكالة تسويق متكاملة في القاهرة" class="site-footer-logo" width="160" height="40" loading="lazy" onerror='
  );

  // 3. Facebook pixel
  content = content.replace(
    /<img\s+height="1"\s+width="1"\s+style="display:none"\s+src="https:\/\/www\.facebook\.com\/tr\?id=1510619060791532&ev=PageView&noscript=1"[^>]*\/>/g,
    '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1510619060791532&ev=PageView&noscript=1" alt="" loading="lazy" />'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Cleaned up logos and pixels in ${file}`);
});
