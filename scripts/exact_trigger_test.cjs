const fs = require('fs');

let chatCode = fs.readFileSync('functions/api/chat.js', 'utf8');

// Let's isolate KEYWORD_MAP directly
const startIdx = chatCode.indexOf('const KEYWORD_MAP = {');
const endIdx = chatCode.indexOf('const TOPIC_PRIORITY = [');
const mapCode = chatCode.slice(startIdx, endIdx);

// Execute mapCode safely
const fn = new Function(mapCode + '; return KEYWORD_MAP;');
const KEYWORD_MAP = fn();

const input = "شغالين مع مصانع ؟";
console.log('Testing query:', input);

for (const [topic, words] of Object.entries(KEYWORD_MAP)) {
  for (const w of words) {
    if (input.includes(w)) {
      console.log(`FOUND TRIGGER! Topic: [${topic}], Keyword: [${w}]`);
    }
  }
}
