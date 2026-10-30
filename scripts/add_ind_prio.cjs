const fs = require('fs');

let chatCode = fs.readFileSync('functions/api/chat.js', 'utf8');

// Insert 'industries' into TOPIC_PRIORITY near the top right after comparison
chatCode = chatCode.replace(
  "  'comparison',",
  "  'comparison',\n  'industries',"
);

fs.writeFileSync('functions/api/chat.js', chatCode, 'utf8');
console.log('Added industries to TOPIC_PRIORITY!');
