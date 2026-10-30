const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
const css = html.substring(styleStart, styleEnd);

const idx = css.indexOf('.modal-overlay');
console.log(css.substring(idx, idx + 600));
