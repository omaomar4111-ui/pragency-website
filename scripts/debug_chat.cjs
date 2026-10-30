const fs = require('fs');

const code = fs.readFileSync('functions/api/chat.js', 'utf8');

// Test matching logic for "شغالين مع مصانع ؟"
const lines = code.split('\n');

console.log('Testing keyword matches for: "شغالين مع مصانع ؟"');

// Let us find the matchTopic function in chat.js
const matchTopicIdx = code.indexOf('function matchTopic');
console.log(code.slice(matchTopicIdx, matchTopicIdx + 800));
