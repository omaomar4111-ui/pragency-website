const fs = require('fs');

const allHtmlFiles = [
  'index.html', 'about.html', 'services.html', 'clients.html', 'team.html',
  'contact.html', 'privacy.html', 'terms.html', '404.html', 'thank-you.html',
  ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)
];

allHtmlFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf-8');
    content = content.replace(/css\/pages\.css\?v=\d+/g, 'css/pages.css?v=65');
    content = content.replace(/js\/i18n\.js\?v=\d+/g, 'js/i18n.js?v=65');
    content = content.replace(/js\/team\.js\?v=\d+/g, 'js/team.js?v=65');
    fs.writeFileSync(f, content);
  }
});

console.log('Bumped cache to v=65 across all HTML files.');
