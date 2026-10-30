const fs = require('fs');

const code = fs.readFileSync('functions/api/chat.js', 'utf8');

// Search how topic matching is done
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('TOPIC_PRIORITY') || l.includes('match') || l.includes('intent') || l.includes('keywords')) {
    if (i > 390 && i < 480) console.log(`${i+1}: ${l}`);
  }
});
