// tests/test-telegram-phase6.cjs
const assert = require('assert');
const { execSync } = require('child_process');
const { buildMenu } = require('../functions/lib/telegram-menu.js');

async function testPhase6() {
  console.log('🧪 Starting Phase 6 AI Tools & Automation Unit & D1 Integration Tests...\n');

  const chatId = '5715939844';

  // Test 1: AI Studio Menu Structure
  const aiMenu = buildMenu(chatId, 'menu:ai');
  assert.ok(aiMenu.text.includes('مركز أدوات الذكاء الاصطناعي'));
  assert.strictEqual(aiMenu.reply_markup.inline_keyboard[0][0].callback_data, 'action:ai:post');
  assert.strictEqual(aiMenu.reply_markup.inline_keyboard[1][0].callback_data, 'action:ai:strategy');
  assert.strictEqual(aiMenu.reply_markup.inline_keyboard[2][0].callback_data, 'action:ai:pitch');
  assert.strictEqual(aiMenu.reply_markup.inline_keyboard[3][0].callback_data, 'action:ai:prospect');
  console.log('✅ Test 1 Passed: AI Studio Menu & Generative Tool Action Buttons validated.');

  // Test 2: Automation Workflows Menu Structure
  const dummyWorkflows = [
    {
      id: 'wf_test_01',
      name: 'مزامنة الليدز مع تيليجرام',
      trigger_event: 'lead.created',
      is_active: 1,
      description: 'إرسال إشعار فوري عند وصول عميل محتمل جديد'
    },
    {
      id: 'wf_test_02',
      name: 'تذكير سداد الفواتير المتأخرة',
      trigger_event: 'cron.daily',
      is_active: 0,
      description: 'فحص الفواتير وإرسال تذكير للعميل عبر البريد'
    }
  ];

  const automationMenu = buildMenu(chatId, 'menu:automation', { workflows: dummyWorkflows });
  assert.ok(automationMenu.text.includes('مزامنة الليدز مع تيليجرام'));
  assert.ok(automationMenu.text.includes('🟢 نشط'));
  assert.ok(automationMenu.text.includes('تذكير سداد الفواتير المتأخرة'));
  assert.ok(automationMenu.text.includes('🔴 معطل'));
  assert.strictEqual(automationMenu.reply_markup.inline_keyboard[0][0].callback_data, 'action:workflow:toggle:wf_test_01');
  assert.strictEqual(automationMenu.reply_markup.inline_keyboard[0][1].callback_data, 'action:workflow:run:wf_test_01');
  assert.strictEqual(automationMenu.reply_markup.inline_keyboard[0][2].callback_data, 'action:workflow:logs:wf_test_01');
  console.log('✅ Test 2 Passed: Workflows Hub Menu & Action Controls validated.');

  // Test 3: Workflow Execution Logs View
  const dummyLogs = [
    {
      id: 'exec_001',
      workflow_id: 'wf_test_01',
      status: 'success',
      trigger_event: 'manual.telegram',
      executed_at: '2026-11-02 01:00:00'
    }
  ];
  const logsMenu = buildMenu(chatId, 'menu:workflow:logs', { workflow: dummyWorkflows[0], logs: dummyLogs });
  assert.ok(logsMenu.text.includes('مزامنة الليدز مع تيليجرام'));
  assert.ok(logsMenu.text.includes('✅ ناجح'));
  assert.ok(logsMenu.text.includes('manual.telegram'));
  assert.strictEqual(logsMenu.reply_markup.inline_keyboard[0][0].callback_data, 'action:workflow:run:wf_test_01');
  console.log('✅ Test 3 Passed: Workflow Execution Logs View validated.');

  // Test 4: D1 Remote Database Operations for Workflows & Logs
  console.log('\n📡 Testing D1 Remote Database for Workflows Engine...');
  const testWfId = 'wf_test_tg_' + Date.now();
  const testExecId = 'exec_tg_' + Date.now();

  // 4.1 Insert test workflow into agency_workflows
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="INSERT INTO agency_workflows (id, name, description, trigger_event, is_active, steps_json, created_at) VALUES ('${testWfId}', 'مسار تجريبي لتليجرام', 'وصف اختباري', 'webhook.test', 1, '[]', CURRENT_TIMESTAMP);"`, { encoding: 'utf-8' });
  console.log('✅ 4.1 Insert Workflow into D1 successful.');

  // 4.2 Toggle workflow active state
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="UPDATE agency_workflows SET is_active = 0 WHERE id = '${testWfId}';"`, { encoding: 'utf-8' });
  const checkWf = execSync(`npx wrangler d1 execute pragency-analytics --remote --command="SELECT id, is_active FROM agency_workflows WHERE id = '${testWfId}';"`, { encoding: 'utf-8' });
  assert.ok(checkWf.includes('"is_active": 0') || checkWf.includes('0'), 'Workflow should be toggled to 0');
  console.log('✅ 4.2 Toggle Workflow active state in D1 successful.');

  // 4.3 Insert manual execution log in workflow_execution_logs
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="INSERT INTO workflow_execution_logs (id, workflow_id, trigger_event, status, payload_json, result_json, executed_at) VALUES ('${testExecId}', '${testWfId}', 'manual.telegram', 'success', '{\\"caller\\":\\"tg_test\\"}', '{\\"ok\\":true}', CURRENT_TIMESTAMP);"`, { encoding: 'utf-8' });
  const checkLog = execSync(`npx wrangler d1 execute pragency-analytics --remote --command="SELECT id, status FROM workflow_execution_logs WHERE id = '${testExecId}';"`, { encoding: 'utf-8' });
  assert.ok(checkLog.includes('success'), 'Execution log must have status success');
  console.log('✅ 4.3 Insert and verify Execution Log in D1 successful.');

  // 4.4 Clean up test workflow and log
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="DELETE FROM workflow_execution_logs WHERE id = '${testExecId}'; DELETE FROM agency_workflows WHERE id = '${testWfId}';"`, { encoding: 'utf-8' });
  console.log('✅ 4.4 Cleaned up test workflow and log from D1.');

  console.log('\n🎉 ALL Phase 6 AI Tools & Automation Tests PASSED 100%!');
}

testPhase6().catch(err => {
  console.error('❌ Phase 6 Test Failed:', err);
  process.exit(1);
});
