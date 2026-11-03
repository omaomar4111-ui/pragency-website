const { execSync } = require('child_process');
const fs = require('fs');

console.log('Running Lighthouse Audit for Desktop...');
execSync(
  'npx lighthouse https://pragency.pages.dev/ --output=json --output-path=lighthouse-desktop.json --preset=desktop --chrome-flags="--headless=new --no-sandbox"',
  { stdio: 'inherit' }
);

console.log('Running Lighthouse Audit for Mobile...');
execSync(
  'npx lighthouse https://pragency.pages.dev/ --output=json --output-path=lighthouse-mobile.json --form-factor=mobile --chrome-flags="--headless=new --no-sandbox"',
  { stdio: 'inherit' }
);

function summarize(reportPath, label) {
  const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const cats = data.categories;
  console.log(`\n═════════════ ${label} ═════════════`);
  console.log(`Performance:    ${Math.round(cats.performance.score * 100)}/100`);
  console.log(`Accessibility:  ${Math.round(cats.accessibility.score * 100)}/100`);
  console.log(`Best Practices: ${Math.round(cats['best-practices'].score * 100)}/100`);
  console.log(`SEO:            ${Math.round(cats.seo.score * 100)}/100`);
  
  const audits = data.audits;
  console.log(`FCP: ${audits['first-contentful-paint'].displayValue}`);
  console.log(`LCP: ${audits['largest-contentful-paint'].displayValue}`);
  console.log(`TBT: ${audits['total-blocking-time'].displayValue}`);
  console.log(`CLS: ${audits['cumulative-layout-shift'].displayValue}`);
  console.log(`Speed Index: ${audits['speed-index'].displayValue}`);
}

summarize('lighthouse-desktop.json', 'LIGHTHOUSE DESKTOP SCORES');
summarize('lighthouse-mobile.json', 'LIGHTHOUSE MOBILE SCORES');
