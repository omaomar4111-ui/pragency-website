// scripts/run-all-qa.cjs
// PR Agency OS - Central Automated QA Pipeline
const { execSync } = require('child_process');

console.log('═══════════════════════════════════════════════════════════════════');
console.log('          PR AGENCY OS — AUTOMATED QA TEST PIPELINE                ');
console.log('═══════════════════════════════════════════════════════════════════\n');

const testSuites = [
  { name: '1. Architecture Persona Boundary Check', cmd: 'node check-architecture.cjs' },
  { name: '2. Offline Sync Engine & Mutation Queue', cmd: 'node tests/test-offline-sync.cjs' },
  { name: '3. Security & Penetration Audit (19 Tests)', cmd: 'node tests/security-penetration-audit.cjs' },
  { name: '4. Autonomous AI Agents (Sales, Creative, Success)', cmd: 'node tests/test-agents-phase-c.cjs' },
  { name: '5. Telegram AI Chat Assistant & Skills Router', cmd: 'node tests/test-telegram-ai-chat.cjs' },
  { name: '6. Telegram Command Center Core Framework', cmd: 'node tests/test-telegram-phase1.cjs' }
];

let allPassed = true;
const results = [];

for (const suite of testSuites) {
  process.stdout.write(`⏳ Running [${suite.name}]... `);
  const startTime = Date.now();
  try {
    execSync(suite.cmd, { stdio: 'pipe', timeout: 30000 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ PASSED (${duration}s)`);
    results.push({ name: suite.name, status: 'PASSED', duration: `${duration}s` });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ FAILED (${duration}s)`);
    console.error(err.stdout ? err.stdout.toString() : err.message);
    results.push({ name: suite.name, status: 'FAILED', duration: `${duration}s` });
    allPassed = false;
  }
}

console.log('\n───────────────────────────────────────────────────────────────────');
console.log('                       QA PIPELINE SUMMARY                         ');
console.log('───────────────────────────────────────────────────────────────────');
results.forEach((r) => {
  const icon = r.status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} ${r.name.padEnd(52)} [${r.status}] (${r.duration})`);
});
console.log('───────────────────────────────────────────────────────────────────');

if (allPassed) {
  console.log('🎉 ALL QA PIPELINE SUITES COMPLETED WITH 100% SUCCESS! READY FOR PRODUCTION.');
  process.exit(0);
} else {
  console.error('⚠️ SOME QA PIPELINE SUITES FAILED. PLEASE REVIEW LOGS ABOVE.');
  process.exit(1);
}
