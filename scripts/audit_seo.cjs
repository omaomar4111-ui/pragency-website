const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'about.html',
  'services.html',
  'portfolio.html',
  'contact.html',
  'services/social-media.html',
  'services/media-buying.html',
  'services/video-production.html',
  'services/branding.html',
  'services/web-development.html'
];

console.log('=== SEO AUDIT OF KEY PAGES ===\n');

files.forEach(f => {
  if (fs.existsSync(f)) {
    const html = fs.readFileSync(f, 'utf8');
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const schemaMatch = html.includes('application/ld+json');

    console.log(`Page: ${f}`);
    console.log(`  Title (${titleMatch ? titleMatch[1].length : 0} chars): ${titleMatch ? titleMatch[1] : 'MISSING'}`);
    console.log(`  Meta Desc (${descMatch ? descMatch[1].length : 0} chars): ${descMatch ? descMatch[1] : 'MISSING'}`);
    console.log(`  H1s (${h1Matches.length}): ${h1Matches.length ? h1Matches.join(' | ') : 'MISSING'}`);
    console.log(`  Canonical: ${canonicalMatch ? canonicalMatch[1] : 'MISSING'}`);
    console.log(`  Robots: ${robotsMatch ? robotsMatch[1] : 'Not specified'}`);
    console.log(`  Schema.org: ${schemaMatch ? 'YES' : 'NO'}`);
    console.log('--------------------------------------------------');
  }
});
