const fs = require('fs');

let chatCode = fs.readFileSync('functions/api/chat.js', 'utf8');

const startIdx = chatCode.indexOf('const KEYWORD_MAP = {');
const endIdx = chatCode.indexOf('const TOPIC_PRIORITY = [');
const mapCode = chatCode.slice(startIdx, endIdx);

const startPrio = chatCode.indexOf('const TOPIC_PRIORITY = [');
const endPrio = chatCode.indexOf('function detectLang');
const prioCode = chatCode.slice(startPrio, endPrio);

const fn = new Function(`${prioCode}; return TOPIC_PRIORITY;`);
const prio = fn();
console.log('TOPIC_PRIORITY:', prio);
