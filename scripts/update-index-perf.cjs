const fs = require('fs');

let c = fs.readFileSync('index.html', 'utf8');

// 1. Minified CSS in head
c = c.replace(
  '<link rel="preload" href="css/main.css?v=122" as="style"/>',
  '<link rel="preload" href="css/main.min.css?v=124" as="style"/>'
);

c = c.replace(
  '<link rel="stylesheet" href="css/main.css?v=122"/>',
  '<link rel="stylesheet" href="css/main.min.css?v=124"/>'
);

c = c.replace(
  '<link rel="stylesheet" href="css/pages.css?v=122" media="print" onload="this.media=\'all\'"/>',
  '<link rel="stylesheet" href="css/pages.min.css?v=124" media="print" onload="this.media=\'all\'"/>'
);

// 2. Responsive hero image preload
c = c.replace(
  '<link rel="preload" as="image" href="assets/images/hero-statue.webp" type="image/webp" fetchpriority="high">',
  '<link rel="preload" as="image" href="assets/images/hero-statue-400w.webp" imagesrcset="assets/images/hero-statue-400w.webp 400w, assets/images/hero-statue-700w.webp 700w, assets/images/hero-statue.webp 1000w" imagesizes="(max-width: 600px) 360px, (max-width: 1024px) 700px, 1000px" fetchpriority="high">'
);

// 3. Responsive hero statue source
c = c.replace(
  '<source srcset="assets/images/hero-statue.webp" type="image/webp">',
  '<source type="image/webp" srcset="assets/images/hero-statue-400w.webp 400w, assets/images/hero-statue-700w.webp 700w, assets/images/hero-statue.webp 1000w" sizes="(max-width: 600px) 360px, (max-width: 1024px) 700px, 1000px">'
);

fs.writeFileSync('index.html', c, 'utf8');
console.log('Applied responsive image and minified CSS updates to index.html');
