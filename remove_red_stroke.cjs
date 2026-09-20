const sharp = require('C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\node_modules\\sharp');
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\2d-marketing-website\\assets\\team';

const files = [
  'role-01-account-manager.webp',
  'role-02-content-creator.webp',
  'role-03-content-strategist.webp',
  'role-04-media-buyer.webp',
  'role-05-photographer.webp',
  'role-06-video-editor.webp',
  'role-07-graphic-designer.webp'
];

async function removeRed(src) {
  const backup = src + '.bak';
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(src, backup);
  }
  
  const sizeBefore = fs.statSync(src).size;
  
  // Read buffer first to avoid locking file
  const inputBuffer = fs.readFileSync(src);
  
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const rgba = Buffer.from(data);
  let redCount = 0;
  
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    
    // Red detection: high R, low G, low B
    if (r > 140 && g < 90 && b < 90) {
      rgba[i + 3] = 0;
      redCount++;
    }
  }

  const outBuf = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .webp({ quality: 95 })
    .toBuffer();
    
  fs.writeFileSync(src, outBuf);
  const sizeAfter = fs.statSync(src).size;
  
  return { redCount, sizeBefore, sizeAfter };
}

(async () => {
  console.log('START_PROCESSING');
  for (const f of files) {
    const src = path.join(dir, f);
    if (!fs.existsSync(src)) {
      console.log('MISSING:', f);
      continue;
    }
    const res = await removeRed(src);
    console.log(`FILE: ${f} | RED_PIXELS: ${res.redCount} | BEFORE: ${res.sizeBefore}B | AFTER: ${res.sizeAfter}B`);
  }
  console.log('DONE');
})();
