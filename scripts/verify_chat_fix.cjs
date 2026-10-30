const fs = require('fs');

let chatCode = fs.readFileSync('functions/api/chat.js', 'utf8');

// Test the updated detectTopic logic
const startIdx = chatCode.indexOf('const KEYWORD_MAP = {');
const endIdx = chatCode.indexOf('const TOPIC_PRIORITY = [');
const mapCode = chatCode.slice(startIdx, endIdx);

const startPrio = chatCode.indexOf('const TOPIC_PRIORITY = [');
const endPrio = chatCode.indexOf('function detectLang');
const prioCode = chatCode.slice(startPrio, endPrio);

const startDetect = chatCode.indexOf('function detectTopic');
const endDetect = chatCode.indexOf('function pickResponse');
const detectCode = chatCode.slice(startDetect, endDetect);

const testEnv = new Function(`
  ${mapCode}
  ${prioCode}
  ${detectCode}
  return { detectTopic };
`)();

const query1 = "شغالين مع مصانع ؟";
const query2 = "اسعاركم غاليه اوي";
const query3 = "عايز اعمل لوجو";

console.log(`Query: "${query1}" => Detected Topic:`, testEnv.detectTopic(query1));
console.log(`Query: "${query2}" => Detected Topic:`, testEnv.detectTopic(query2));
console.log(`Query: "${query3}" => Detected Topic:`, testEnv.detectTopic(query3));
