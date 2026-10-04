const fs = require('fs');
let content = fs.readFileSync('functions/admin/index.js', 'utf8');

const target = `<button class="cms-tab-btn" onclick="switchTab('messages')">📨 الرسائل</button>`;
const replacement = `${target}\n    <a href="/admin/case-studies" class="cms-tab-btn" style="text-decoration:none;display:inline-flex;align-items:center;">💼 قصص النجاح</a>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('functions/admin/index.js', content, 'utf8');
  console.log('✅ Admin navigation updated with Case Studies link');
} else {
  console.log('Target not found');
}
