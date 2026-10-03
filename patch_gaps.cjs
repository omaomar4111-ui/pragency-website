const fs = require('fs');
let code = fs.readFileSync('functions/api/chat.js', 'utf8');

// 1. Ensure dialect mapping has تسوون directly
code = code.replace(
  "['تسوي', 'بتعملوا']",
  "['تسوون', 'بتعملوا']"
);

// Add direct entries in KEYWORD_MAP
// Services: add 'تسوون'
code = code.replace(
  "'بتقدموا ايه',",
  "'بتقدموا ايه', 'تسوون', 'وش تسوون', 'بتسووا',"
);

// Social Media: add 'محتوي' and 'محتوى'
code = code.replace(
  "'محتوى',",
  "'محتوى', 'محتوي', 'محتاج محتوى', 'عايز محتوى',"
);

// Location: add 'فين' standalone
code = code.replace(
  "'فين مكانكم',",
  "'فين مكانكم', 'فين', 'وين',"
);

// Process: add 'ازاي' & 'طب ازاي'
code = code.replace(
  "'طريقه العمل',",
  "'طريقه العمل', 'ازاي', 'طب ازاي', 'كيف',"
);

// Follow up fallback to services
code = code.replace(
  "if (!topic) {\n        topic = detectTopic(normalized);\n      }",
  "if (!topic) {\n        topic = detectTopic(normalized);\n      }\n      if (!topic && isFollowUp) {\n        topic = 'services';\n      }"
);

fs.writeFileSync('functions/api/chat.js', code, 'utf8');
console.log('100% gap patch complete');
