const fs = require('fs');

let c = fs.readFileSync('index.html', 'utf8');

// Match preload
c = c.replace(
  '<link rel="preload" as="image" href="/assets/images/hero-statue.webp" type="image/webp" fetchpriority="high">',
  '<link rel="preload" as="image" href="assets/images/hero-statue.webp" type="image/webp" fetchpriority="high">'
);

// Match source srcset
c = c.replace(
  '<source srcset="assets/images/hero-statue.webp?v=117" type="image/webp">',
  '<source srcset="assets/images/hero-statue.webp" type="image/webp">'
);

c = c.replace(
  '<source srcset="assets/logos/pr-agency.webp?v=116" type="image/webp">',
  '<source srcset="assets/logos/pr-agency.webp" type="image/webp">'
);

fs.writeFileSync('index.html', c, 'utf8');
console.log('Synchronized hero image & logo preloads and sources!');
