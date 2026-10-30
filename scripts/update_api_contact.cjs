const fs = require('fs');

let api = fs.readFileSync('functions/api/contact.js', 'utf8');

// 1. Destructure project_name
if (!api.includes('project_name')) {
  api = api.replace(
    /const\s*\{\s*name,\s*email,\s*phone,\s*service,\s*business,\s*budget,\s*message/,
    `const { name, project_name, email, phone, service, business, budget, message`
  );
}

// 2. Enhance Telegram Notification
const oldTg = '`📍 <b>المدينة:</b> ${visitorCity}, ${visitorCountry}\\n\\n` +';
const newTg = '`🏢 <b>اسم المشروع:</b> ${project_name || \'غير محدد\'}\\n` +\n' +
              '          `🎯 <b>التحدي / الهدف:</b> ${message || \'غير محدد\'}\\n` +\n' +
              '          `📍 <b>المدينة:</b> ${visitorCity}, ${visitorCountry}\\n\\n` +';

if (api.includes('visitorCity') && !api.includes('🏢 <b>اسم المشروع:</b>')) {
  api = api.replace(oldTg, newTg);
}

fs.writeFileSync('functions/api/contact.js', api, 'utf8');
console.log('Updated functions/api/contact.js for Telegram alerts!');
