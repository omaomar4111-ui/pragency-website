const fs = require('fs');

let chatCode = fs.readFileSync('functions/api/chat.js', 'utf8');

// Check why industries was not detected
console.log('Industries in KEYWORD_MAP:', chatCode.includes("industries: ["));
console.log('Industries in TOPIC_PRIORITY:', chatCode.includes("'industries'"));
