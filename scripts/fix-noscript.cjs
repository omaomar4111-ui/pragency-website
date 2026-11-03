const fs = require('fs');

['about.html', 'services.html', 'clients.html'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(
    /<noscript><img[\s\S]*?facebook\.com\/tr[\s\S]*?<\/noscript>/g,
    '<noscript><img height="1" width="1" style="display:none" loading="lazy" alt="Facebook Pixel" src="https://www.facebook.com/tr?id=1510619060791532&amp;ev=PageView&amp;noscript=1" /></noscript>'
  );
  fs.writeFileSync(f, c, 'utf8');
  console.log(`Updated noscript in ${f}`);
});
