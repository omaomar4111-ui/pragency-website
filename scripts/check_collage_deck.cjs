const fs = require('fs');

const content = fs.readFileSync('collage-deck.html', 'utf8');
console.log('Collage deck title:', content.match(/<title>([^<]+)<\/title>/)?.[1]);
console.log('Script count:', (content.match(/<script/gi) || []).length);

const errs = [];
try {
  // Check syntax of script tags
  const scripts = [...content.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    new Function(s[1]);
  }
  console.log('All inline scripts in collage-deck.html parsed cleanly without syntax errors!');
} catch (e) {
  console.error('Syntax error in collage-deck script:', e.message);
}
