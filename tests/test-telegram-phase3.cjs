// tests/test-telegram-phase3.cjs
const assert = require('assert');
const { execSync } = require('child_process');
const { buildMenu } = require('../functions/lib/telegram-menu.js');

async function testPhase3() {
  console.log('🧪 Starting Phase 3 Clients & Leads Unit & D1 Integration Tests...\n');

  const chatId = '5715939844';

  // Test 1: Clients List view
  const dummyClients = [
    {
      id: 'client_tg_001',
      company_name: 'شركة الأفق للاستشارات',
      contact_name: 'د. خالد إبراهيم',
      email: 'khaled@alofok.com',
      retainer_amount: 45000
    }
  ];
  const clientsMenu = buildMenu(chatId, 'menu:clients', { clients: dummyClients });
  assert.ok(clientsMenu.text.includes('شركة الأفق للاستشارات'));
  const clientBtns = clientsMenu.reply_markup.inline_keyboard[0];
  assert.strictEqual(clientBtns[0].callback_data, 'action:client:view:client_tg_001');
  assert.strictEqual(clientBtns[2].callback_data, 'action:client:delete:client_tg_001');
  console.log('✅ Test 1 Passed: Clients Menu with detail/portal/delete controls validated.');

  // Test 2: Client Detail view
  const clientDetail = buildMenu(chatId, 'menu:client:detail', {
    client: dummyClients[0],
    activeDeliverables: 3,
    unpaidInvoices: 1
  });
  assert.ok(clientDetail.text.includes('45,000 ج.م'));
  assert.ok(clientDetail.text.includes('3 تسليمة'));
  assert.ok(clientDetail.text.includes('1 فاتورة'));
  console.log('✅ Test 2 Passed: Client Detail view validated.');

  // Test 3: Leads List & Stage Changing
  const dummyLead = {
    id: 'lead_tg_001',
    name: 'م. أحمد الشريف',
    project_name: 'حملة تسويق عقاري',
    phone: '01000000000',
    budget_tier: 'Tier A (100k+)',
    pipeline_stage: 'contacted'
  };
  const leadsMenu = buildMenu(chatId, 'menu:leads', { leads: [dummyLead] });
  assert.ok(leadsMenu.text.includes('م. أحمد الشريف'));
  const leadBtns = leadsMenu.reply_markup.inline_keyboard[0];
  assert.strictEqual(leadBtns[0].callback_data, 'action:lead:stage:lead_tg_001');
  assert.strictEqual(leadBtns[1].callback_data, 'action:lead:msg:lead_tg_001');
  assert.strictEqual(leadBtns[2].callback_data, 'action:lead:delete:lead_tg_001');

  const stageMenu = buildMenu(chatId, 'menu:lead:stages', { lead: dummyLead });
  assert.ok(stageMenu.text.includes('تغيير مرحلة الصفقة'));
  assert.strictEqual(stageMenu.reply_markup.inline_keyboard[0][0].callback_data, 'action:lead:setstage:lead_tg_001:new');
  assert.strictEqual(stageMenu.reply_markup.inline_keyboard[1][1].callback_data, 'action:lead:setstage:lead_tg_001:won');
  console.log('✅ Test 3 Passed: Leads Pipeline & Stage selection controls validated.');

  // Test 4: D1 Remote CRUD operations
  console.log('\n📡 Testing D1 Remote Database for Clients & Leads Engine...');
  const testClientId = 'client_tg_' + Date.now();
  const testLeadId = 'lead_tg_' + Date.now();

  // 4.1 Insert test client in pragency-analytics
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="INSERT INTO portal_clients (id, company_name, contact_name, email, password_hash, retainer_amount, created_at) VALUES ('${testClientId}', 'شركة تليجرام التجريبية', 'مسؤول الاختبار', 'tg_test@agency.com', 'hash_test', 30000, CURRENT_TIMESTAMP);"`, { encoding: 'utf-8' });
  console.log('✅ 4.1 Insert Client into D1 successful.');

  // 4.2 Insert test lead in pragency-analytics
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="INSERT INTO sales_leads (id, name, project_name, phone, source_type, pipeline_stage, created_at, updated_at) VALUES ('${testLeadId}', 'ليد اختبار تليجرام', 'مشروع إعلاني', '0123456789', 'telegram', 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"`, { encoding: 'utf-8' });
  console.log('✅ 4.2 Insert Lead into D1 successful.');

  // 4.3 Update lead pipeline stage
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="UPDATE sales_leads SET pipeline_stage = 'won', updated_at = CURRENT_TIMESTAMP WHERE id = '${testLeadId}';"`, { encoding: 'utf-8' });
  console.log('✅ 4.3 Update Lead Stage to won in D1 successful.');

  // 4.4 Verify in D1
  const leadRes = execSync(`npx wrangler d1 execute pragency-analytics --remote --command="SELECT id, pipeline_stage FROM sales_leads WHERE id = '${testLeadId}';"`, { encoding: 'utf-8' });
  assert.ok(leadRes.includes('won'), 'Lead stage should be won');
  console.log('✅ 4.4 Verified Lead stage transition in D1.');

  // 4.5 Clean up
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="DELETE FROM portal_clients WHERE id = '${testClientId}'; DELETE FROM sales_leads WHERE id = '${testLeadId}';"`, { encoding: 'utf-8' });
  console.log('✅ 4.5 Cleaned up test data.');

  console.log('\n🎉 ALL Phase 3 Clients & Leads Tests PASSED 100%!');
}

testPhase3().catch(err => {
  console.error('❌ Phase 3 Test Failed:', err);
  process.exit(1);
});
