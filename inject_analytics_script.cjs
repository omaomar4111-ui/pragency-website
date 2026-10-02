const fs = require('fs');

const allHtmlFiles = [
  'index.html', 'about.html', 'services.html', 'clients.html', 'team.html',
  'contact.html', 'privacy.html', 'terms.html', '404.html', 'thank-you.html',
  ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)
];

const analyticsScript = `\n<script src="/js/analytics.js?v=67" defer></script>`;

allHtmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf-8');

  // Inject analytics script before </body> if not present
  if (!html.includes('js/analytics.js')) {
    html = html.replace('</body>', `${analyticsScript}\n</body>`);
  }

  // Update Cache Version to v=67
  html = html.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=67');
  html = html.replace(/js\/main\.js\?v=\d+/g, 'js/main.js?v=67');
  html = html.replace(/js\/i18n\.js\?v=\d+/g, 'js/i18n.js?v=67');
  html = html.replace(/js\/team\.js\?v=\d+/g, 'js/team.js?v=67');

  fs.writeFileSync(file, html);
});

console.log('Injected analytics.js and bumped cache to v=67 across all HTML files.');
