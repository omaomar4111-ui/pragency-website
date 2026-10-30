const fs = require('fs');

const code = fs.readFileSync('functions/api/chat.js', 'utf8');

// Let's test what normalizedMsg produces for "شغالين مع مصانع ؟"
const GULF_TO_STANDARD_MAP = [
  [/\b(ابي|ابغي|ودي)\b/g, 'عايز'],
  [/\b(شلون|شلونكم)\b/g, 'ازاي'],
  [/\b(وايد|كثير|حيل كثير)\b/g, 'كتير'],
  [/\b(جم|كم سعر|كم يكلف|كم الاسعار)\b/g, 'بكام'],
  [/\b(الحين|توا)\b/g, 'دلوقتي'],
  [/\b(تسوي|تسوو|تسوى|يسوون|يسوي)\b/g, 'تعمل'],
  [/\b(عقب|تالي|بعدين|وعقب)\b/g, 'بعد كده'],
  [/\b(صج|والله)\b/g, 'بجد'],
  [/\b(تكفى)\b/g, 'لو سمحت'],
  [/\b(ما عندي فلوس)\b/g, 'مش قادر'],
  [/\b(ماشاءالله)\b/g, 'ماشاء الله']
];

function normalizeDialect(msg) {
  let text = msg.toLowerCase().trim();
  text = text.replace(/[\u064B-\u0652]/g, '');
  text = text.replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  return text;
}

const input = "شغالين مع مصانع ؟";
const norm = normalizeDialect(input);
console.log('Input:', input);
console.log('Normalized:', norm);

// Check which keyword in KEYWORD_MAP matches
const TOPIC_PRIORITY = [
  'objection',
  'buying_intent',
  'comparison',
  'process',
  'video',
  'branding',
  'media_buying',
  'social_media',
  'strategy',
  'pricing',
  'portfolio',
  'team',
  'about',
  'location',
  'contact',
  'greeting',
  'thanks',
  'services'
];

// Let's read all of KEYWORD_MAP from chat.js
const kwIdx = code.indexOf('const KEYWORD_MAP =');
const kwEnd = code.indexOf('const TOPIC_PRIORITY =');
eval(code.slice(kwIdx, kwEnd));

console.log('\nMatching against KEYWORD_MAP:');
for (const topic of TOPIC_PRIORITY) {
  const keywords = KEYWORD_MAP[topic] || [];
  for (const kw of keywords) {
    const cleanKw = kw.toLowerCase().trim();
    if (norm.includes(cleanKw)) {
      console.log(`MATCHED! Topic: "${topic}", Keyword: "${cleanKw}"`);
      break;
    }
  }
}
