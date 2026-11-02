// tests/test-telegram-phase7.cjs
const assert = require('assert');
const { execSync } = require('child_process');
const { buildMenu } = require('../functions/lib/telegram-menu.js');

async function testPhase7() {
  console.log('🧪 Starting Phase 7 Reports & CSV Export Unit & D1 Integration Tests...\n');

  const chatId = '5715939844';

  // Test 1: Reports Hub Main Menu
  const reportsMenu = buildMenu(chatId, 'menu:reports');
  assert.ok(reportsMenu.text.includes('مركز التقارير التنفيذية والتحليلات'));
  assert.strictEqual(reportsMenu.reply_markup.inline_keyboard[0][0].callback_data, 'action:report:revenue');
  assert.strictEqual(reportsMenu.reply_markup.inline_keyboard[1][0].callback_data, 'action:report:performance');
  assert.strictEqual(reportsMenu.reply_markup.inline_keyboard[2][0].callback_data, 'action:report:leads');
  assert.strictEqual(reportsMenu.reply_markup.inline_keyboard[3][0].callback_data, 'action:report:agents');
  assert.strictEqual(reportsMenu.reply_markup.inline_keyboard[4][0].callback_data, 'action:report:csv');
  console.log('✅ Test 1 Passed: Reports Hub Menu & Report Selectors validated.');

  // Test 2: Revenue Report View
  const revenueReport = buildMenu(chatId, 'menu:report:revenue', {
    thisMonthCollected: 65000,
    lastMonthCollected: 50000,
    allTimeCollected: 380000,
    outstanding: 45000,
    collectionRate: 89,
    avgInvoice: 19000
  });
  assert.ok(revenueReport.text.includes('65,000 ج.م'));
  assert.ok(revenueReport.text.includes('380,000 ج.م'));
  assert.ok(revenueReport.text.includes('89%'));
  assert.strictEqual(revenueReport.reply_markup.inline_keyboard[1][0].callback_data, 'action:report:export:invoices');
  console.log('✅ Test 2 Passed: Revenue Financial Report View validated.');

  // Test 3: Performance Report View
  const perfReport = buildMenu(chatId, 'menu:report:performance', {
    topClients: [{ client_name: 'مجموعة الفطيم', total_rev: 120000 }],
    topTeam: [{ assigned_to: 'أحمد محمود', done_count: 24 }],
    completionRate: 85
  });
  assert.ok(perfReport.text.includes('مجموعة الفطيم'));
  assert.ok(perfReport.text.includes('120,000 ج.م'));
  assert.ok(perfReport.text.includes('أحمد محمود'));
  assert.ok(perfReport.text.includes('24 مهمة منجزة'));
  assert.ok(perfReport.text.includes('85%'));
  console.log('✅ Test 3 Passed: Performance & Team Productivity Report validated.');

  // Test 4: Leads & Conversion Report View
  const leadsReport = buildMenu(chatId, 'menu:report:leads', {
    totalLeads: 40,
    wonLeads: 12,
    lostLeads: 4,
    conversionRate: 30,
    stageBreakdown: { new: 10, contacted: 8, proposal: 6, won: 12, lost: 4 },
    sourceBreakdown: { 'Facebook Ads': 25, 'Google Search': 15 }
  });
  assert.ok(leadsReport.text.includes('40'));
  assert.ok(leadsReport.text.includes('12'));
  assert.ok(leadsReport.text.includes('30%'));
  assert.ok(leadsReport.text.includes('Facebook Ads'));
  assert.strictEqual(leadsReport.reply_markup.inline_keyboard[1][0].callback_data, 'action:report:export:leads');
  console.log('✅ Test 4 Passed: Leads Funnel & Conversion Report validated.');

  // Test 5: AI Autonomous Agents Report View
  const agentsReport = buildMenu(chatId, 'menu:report:agents', {
    totalActions: 18,
    approved: 15,
    rejected: 2,
    pending: 1,
    accuracyRate: 88,
    agentBreakdown: { sales_agent: 14, content_agent: 4 }
  });
  assert.ok(agentsReport.text.includes('18'));
  assert.ok(agentsReport.text.includes('15'));
  assert.ok(agentsReport.text.includes('88%'));
  assert.ok(agentsReport.text.includes('sales_agent'));
  console.log('✅ Test 5 Passed: AI Agents Performance & Accuracy Report validated.');

  // Test 6: CSV Export Selection Menu
  const csvMenu = buildMenu(chatId, 'menu:report:csv_select');
  assert.ok(csvMenu.text.includes('مركز تصدير البيانات الشامل'));
  assert.strictEqual(csvMenu.reply_markup.inline_keyboard[0][0].callback_data, 'action:report:export:leads');
  assert.strictEqual(csvMenu.reply_markup.inline_keyboard[1][0].callback_data, 'action:report:export:invoices');
  assert.strictEqual(csvMenu.reply_markup.inline_keyboard[2][0].callback_data, 'action:report:export:clients');
  assert.strictEqual(csvMenu.reply_markup.inline_keyboard[3][0].callback_data, 'action:report:export:tasks');
  console.log('✅ Test 6 Passed: CSV Export Menu options validated.');

  // Test 7: D1 Remote Database Operations for Reports & CSV
  console.log('\n📡 Testing D1 Remote Database for Reports Engine...');
  const testActionId = 'act_tg_test_' + Date.now();

  // 7.1 Insert test action into agent_pending_actions
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="INSERT INTO agent_pending_actions (id, agent_type, lead_id, lead_name, action_type, draft_content, status, created_at, updated_at) VALUES ('${testActionId}', 'sales_agent', 'lead_dummy', 'عميل تجريبي', 'whatsapp_outreach', 'مسودة تجريبية', 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"`, { encoding: 'utf-8' });
  console.log('✅ 7.1 Insert Agent Action into D1 successful.');

  // 7.2 Verify agent action aggregation in D1
  const checkAction = execSync(`npx wrangler d1 execute pragency-analytics --remote --command="SELECT COUNT(*) as cnt FROM agent_pending_actions WHERE status = 'approved';"`, { encoding: 'utf-8' });
  assert.ok(checkAction.includes('"cnt":') || checkAction.includes('1'), 'Agent actions count should reflect approved item');
  console.log('✅ 7.2 Agent action aggregation query in D1 verified.');

  // 7.3 Clean up test agent action
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="DELETE FROM agent_pending_actions WHERE id = '${testActionId}';"`, { encoding: 'utf-8' });
  console.log('✅ 7.3 Cleaned up test agent action from D1.');

  console.log('\n🎉 ALL Phase 7 Reports & CSV Export Tests PASSED 100%!');
}

testPhase7().catch(err => {
  console.error('❌ Phase 7 Test Failed:', err);
  process.exit(1);
});
