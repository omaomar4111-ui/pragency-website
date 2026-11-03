const sharp = require('sharp');
const fs = require('fs');

async function run() {
  console.log('Generating responsive images...');
  
  // 1. Hero statue 400w
  await sharp('assets/images/hero-statue.webp')
    .resize(400)
    .webp({ quality: 80, effort: 6 })
    .toFile('assets/images/hero-statue-400w.webp');
  console.log('Created hero-statue-400w.webp, size:', fs.statSync('assets/images/hero-statue-400w.webp').size);

  // 2. Hero statue 700w
  await sharp('assets/images/hero-statue.webp')
    .resize(700)
    .webp({ quality: 82, effort: 6 })
    .toFile('assets/images/hero-statue-700w.webp');
  console.log('Created hero-statue-700w.webp, size:', fs.statSync('assets/images/hero-statue-700w.webp').size);

  // 3. PR Agency Logo 200w
  await sharp('assets/logos/pr-agency.webp')
    .resize(200)
    .webp({ quality: 80, effort: 6 })
    .toFile('assets/logos/pr-agency-200w.webp');
  console.log('Created pr-agency-200w.webp, size:', fs.statSync('assets/logos/pr-agency-200w.webp').size);
}

run().catch(console.error);
