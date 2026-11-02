// tests/test-agents-phase-c.cjs
// Verification suite for Phase C: Full AI Agents Integration (Creative, Sales, Client Success)
const assert = require('assert');
const { execSync } = require('child_process');
const path = require('path');

async function run() {
  console.log('🧪 Starting Phase C Autonomous Agents Verification Suite...\n');

  // 1. Check schema columns in Remote D1
  console.log('1. Verifying D1 Schema (tasks.ai_brief, agent_pending_actions.related_id, processed_at)...');
  try {
    const taskCols = execSync('npx wrangler d1 execute 2d-marketing-db --remote --command="PRAGMA table_info(tasks);"', { encoding: 'utf8' });
    assert(taskCols.includes('ai_brief'), 'tasks table must contain ai_brief column');
    console.log('   ✅ tasks.ai_brief column verified.');

    const actionCols = execSync('npx wrangler d1 execute pragency-analytics --remote --command="PRAGMA table_info(agent_pending_actions);"', { encoding: 'utf8' });
    assert(actionCols.includes('related_id'), 'agent_pending_actions must contain related_id column');
    assert(actionCols.includes('processed_at'), 'agent_pending_actions must contain processed_at column');
    console.log('   ✅ agent_pending_actions.related_id & processed_at columns verified.');
  } catch (e) {
    console.error('   ❌ Schema check failed:', e.message);
    process.exit(1);
  }

  // 2. Test Creative Agent Logic
  console.log('\n2. Verifying Creative Agent Synthesis...');
  const creativeModule = await import('../functions/api/internal/agents/creative-agent.js');
  const briefTest = creativeModule.synthesizeCreativeBrief({
    title: 'تصوير فيديو ريلز إعلاني للعيادة (Reels)',
    description: 'فيديو ترويجي لخدمات زراعة الأسنان في 60 ثانية'
  });

  assert(briefTest.includes('بريف إبداعي ذكي'), 'Brief must include title header');
  assert(briefTest.includes('Reels'), 'Brief must detect video format');
  assert(briefTest.includes('الخطاف الأولي'), 'Brief must include 3-second hook');
  assert(briefTest.includes('مخطط المشاهد'), 'Brief must include scene flow');
  assert(briefTest.includes('النص الإعلاني'), 'Brief must include copy script');
  console.log('   ✅ Creative Agent brief synthesis verified.');

  // 3. Test Architecture Linter
  console.log('\n3. Verifying Architecture Boundary...');
  const linterOutput = execSync('node check-architecture.cjs', { encoding: 'utf8' });
  assert(linterOutput.includes('PASSED'), 'Architecture check must pass');
  console.log('   ✅ Architecture check verified zero leakage.');

  console.log('\n🎉 ALL PHASE C CHECKS PASSED SUCCESSFULLY!\n');
}

run().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
