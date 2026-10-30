const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Remove Lenis script block completely
const lenisRegex = /<!-- Lenis Luxury Smooth Scroll -->[\s\S]*?<\/script>\s*/gi;
html = html.replace(lenisRegex, '');

// Also clean any standalone Lenis references
html = html.replace(/<script[^>]*lenis[^>]*>[\s\S]*?<\/script>/gi, '');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Removed Lenis from index.html');
