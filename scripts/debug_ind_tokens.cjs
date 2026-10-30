const fs = require('fs');

let chatCode = fs.readFileSync('functions/api/chat.js', 'utf8');

const startIdx = chatCode.indexOf('const KEYWORD_MAP = {');
const endIdx = chatCode.indexOf('const TOPIC_PRIORITY = [');
const mapCode = chatCode.slice(startIdx, endIdx);

const startPrio = chatCode.indexOf('const TOPIC_PRIORITY = [');
const endPrio = chatCode.indexOf('function detectLang');
const prioCode = chatCode.slice(startPrio, endPrio);

const fn = new Function(`${mapCode}; return KEYWORD_MAP;`);
const map = fn();

console.log('Industries keywords in map:', map.industries);

const msg = "شغالين مع مصانع ؟";
const cleanMsg = msg.replace(/[؟?.,!]/g, ' ');
const tokens = cleanMsg.split(/\s+/).filter(Boolean);
console.log('Tokens:', tokens);

for (const kw of map.industries) {
  if (tokens.includes(kw)) {
    console.log(`Matched token: "${kw}"`);
  }
}
