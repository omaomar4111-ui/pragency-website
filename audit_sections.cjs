const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

const s1 = html.indexOf('<section id="services"');
console.log(html.substring(s1, s1 + 400));

const s2 = html.indexOf('<section id="clients"');
console.log(html.substring(s2, s2 + 400));

const s3 = html.indexOf('<section id="team"');
console.log(html.substring(s3, s3 + 400));

