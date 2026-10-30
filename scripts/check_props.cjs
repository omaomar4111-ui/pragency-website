const fs = require('fs');

const html = fs.readFileSync('sales-crm-2026.html', 'utf8');

const s1 = html.indexOf('<script>');
const s1End = html.indexOf('</script>');
const script = html.substring(s1, s1End);

const idx = script.indexOf('async function openLeadDetail');
const detailCode = script.substring(idx, idx + 4500);

['challenge_notes', 'notes', 'source_type', 'service_interested', 'budget_tier'].forEach(prop => {
  console.log(`Prop ${prop} inside openLeadDetail:`, detailCode.includes(prop));
});
