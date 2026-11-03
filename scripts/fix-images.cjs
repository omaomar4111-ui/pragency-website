// scripts/fix-images.cjs
// Ensures all <img> tags have explicit width, height, and loading attributes across all pages.

const fs = require('fs');

const pages = ['index.html', 'about.html', 'services.html', 'clients.html'];

pages.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // 1. Fix Facebook pixel noscript img
  content = content.replace(
    /(<img\s+height="1"\s+width="1"\s+style="display:none"\s+src="https:\/\/www\.facebook\.com\/tr[^"]*")(\s*\/?>)/gi,
    '$1 loading="lazy"$2'
  );

  // 2. Fix header / footer logo without dimensions or loading
  content = content.replace(
    /<img\s+src="assets\/logos\/pr-agency\.webp"\s+alt="PR Agency Logo"\s*\/?>/gi,
    '<img src="assets/logos/pr-agency.webp" alt="PR Agency Logo" width="160" height="40" loading="lazy"/>'
  );

  content = content.replace(
    /<img\s+src="assets\/logos\/pr-agency\.webp"\s+alt="PR Agency Logo"\s+class="ftr-logo-img"\s*\/?>/gi,
    '<img src="assets/logos/pr-agency.webp" alt="PR Agency Logo" class="ftr-logo-img" width="160" height="40" loading="lazy"/>'
  );

  // 3. Fix header logo missing loading
  content = content.replace(
    /(<img\s+src="assets\/logos\/pr-agency\.webp"\s+alt="PR Agency Logo"\s+class="hdr-logo-img"[^>]*)(>)/gi,
    (match, p1, p2) => {
      if (!p1.includes('loading=')) {
        return p1 + ' loading="eager"' + p2;
      }
      return match;
    }
  );

  // 4. In clients.html, add width and height to client-grid-img
  content = content.replace(
    /(<img\s+src="assets\/logos\/clients\/[^"]+"\s+alt="[^"]+"\s+class="client-grid-img"\s+loading="lazy")(\s*\/?>)/gi,
    '$1 width="200" height="100"$2'
  );

  // 5. In index.html, hero logo loading="eager"
  content = content.replace(
    /(<img\s+src="assets\/logos\/pr-agency\.webp"\s+alt="PR Agency — وكالة تسويق متكاملة في القاهرة")(\s+width="340"\s+height="206"\s*\/?>)/gi,
    '$1 loading="eager"$2'
  );

  // 6. Ensure hero preload and img src match path exactly
  content = content.replace(
    '<img \n            src="assets/images/hero-statue.webp"',
    '<img \n            src="/assets/images/hero-statue.webp"'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log(`✅ [${file}]: Applied explicit dimensions & loading attributes.`);
});
