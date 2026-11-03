const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(process.cwd(), reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

const PORT = 8899;

server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  const viewports = [
    { width: 320, height: 700, name: '320px-mobile-small' },
    { width: 375, height: 812, name: '375px-mobile' },
    { width: 768, height: 1024, name: '768px-tablet' },
    { width: 1024, height: 800, name: '1024px-laptop-small' },
    { width: 1440, height: 900, name: '1440px-desktop' },
    { width: 1920, height: 1080, name: '1920px-ultrawide' }
  ];

  const artifactDir = 'C:/Users/DELL/.gemini/antigravity/brain/fd959096-0c91-4379-a8f3-1452ce8eec36';
  if (!fs.existsSync('tests/screenshots')) {
    fs.mkdirSync('tests/screenshots', { recursive: true });
  }

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    // Verify zero horizontal scroll
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    console.log(`Viewport [${vp.width}x${vp.height}]: Horizontal overflow: ${hasHorizontalOverflow ? '❌ YES' : '✅ NO'}`);

    // Capture screenshot for requested widths
    if (vp.width === 1440 || vp.width === 768) {
      const screenshotPath = path.join('tests/screenshots', `fluid-homepage-${vp.width}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Captured screenshot: ${screenshotPath}`);

      // Copy to artifacts dir
      const destPath = path.join(artifactDir, `fluid-homepage-${vp.width}.png`);
      fs.copyFileSync(screenshotPath, destPath);
      console.log(`📁 Copied screenshot to artifacts: ${destPath}`);
    }
  }

  await browser.close();
  server.close(() => {
    console.log('✅ Fluid verification completed successfully.');
    process.exit(0);
  });
});
