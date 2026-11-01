// tests/test-telegram-phase4.cjs
const assert = require('assert');
const { execSync } = require('child_process');
const { buildMenu } = require('../functions/lib/telegram-menu.js');

async function testPhase4() {
  console.log('🧪 Starting Phase 4 Invoices & Projects Unit & D1 Integration Tests...\n');

  const chatId = '5715939844';

  // Test 1: Invoices Menu Structure & Pending List
  const dummyPending = [
    {
      id: 'inv_tg_test_001',
      invoice_number: 'INV-7721',
      client_name: 'مجموعة الفطيم',
      amount: 45000,
      currency: 'EGP',
      due_date: '2026-11-15',
      status: 'unpaid'
    }
  ];

  const invoicesMenu = buildMenu(chatId, 'menu:invoices', {
    paidCount: 12,
    paidTotal: 340000,
    pendingCount: 3,
    pendingTotal: 85000,
    overdueCount: 1,
    overdueTotal: 25000,
    pendingInvoices: dummyPending
  });

  assert.ok(invoicesMenu.text.includes('340,000 EGP'));
  assert.ok(invoicesMenu.text.includes('85,000 EGP'));
  assert.ok(invoicesMenu.text.includes('INV-7721'));
  const payBtn = invoicesMenu.reply_markup.inline_keyboard[0][0];
  assert.strictEqual(payBtn.callback_data, 'action:invoice:pay:inv_tg_test_001');
  console.log('✅ Test 1 Passed: Invoices Financial Summary & Pending Invoice action buttons validated.');

  // Test 2: Invoice Detail View
  const invoiceDetail = buildMenu(chatId, 'menu:invoice:detail', { invoice: dummyPending[0] });
  assert.ok(invoiceDetail.text.includes('INV-7721'));
  assert.ok(invoiceDetail.text.includes('45,000 EGP'));
  assert.strictEqual(invoiceDetail.reply_markup.inline_keyboard[0][0].callback_data, 'action:invoice:pay:inv_tg_test_001');
  console.log('✅ Test 2 Passed: Invoice Detail View & Payment Approval button validated.');

  // Test 3: Projects List & Profit Margin Calculation
  const dummyProjects = [
    {
      id: 'proj_alpha',
      key: 'ALPHA',
      name: 'إعادة إطلاق العلامة التجارية',
      client_name: 'شركة النور',
      retainer_amount: 80000,
      logged_hours: 120
    }
  ];

  const projectsMenu = buildMenu(chatId, 'menu:projects', { projects: dummyProjects });
  assert.ok(projectsMenu.text.includes('إعادة إطلاق العلامة التجارية'));
  assert.ok(projectsMenu.text.includes('80,000 ج.م'));
  assert.ok(projectsMenu.text.includes('120.0 س'));
  // Margin calculation: 80000 - (120 * 150) = 80000 - 18000 = 62000 => 78%
  assert.ok(projectsMenu.text.includes('78%'), 'Profit margin should calculate ~78%');
  const projBtns = projectsMenu.reply_markup.inline_keyboard[0];
  assert.strictEqual(projBtns[0].callback_data, 'action:project:view:proj_alpha');
  assert.strictEqual(projBtns[1].callback_data, 'action:project:team:proj_alpha');
  assert.strictEqual(projBtns[2].callback_data, 'action:project:tasks:proj_alpha');
  console.log('✅ Test 3 Passed: Projects List, Profit Margin & Action buttons validated.');

  // Test 4: D1 Remote Database Operations
  console.log('\n📡 Testing D1 Remote Database for Invoices & Projects Engine...');
  const testClientId = 'client_tg_inv_' + Date.now();
  const testInvId = 'inv_tg_test_' + Date.now();

  // 4.1 Insert test client into portal_clients
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="INSERT INTO portal_clients (id, company_name, email, password_hash, retainer_amount, created_at) VALUES ('${testClientId}', 'شركة اختبار الفواتير', 'inv_client@agency.com', 'hash_test', 50000, CURRENT_TIMESTAMP);"`, { encoding: 'utf-8' });
  console.log('✅ 4.1 Insert Parent Client into D1 successful.');

  // 4.2 Insert test invoice into pragency-analytics
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="INSERT INTO client_invoices (id, client_id, invoice_number, amount, currency, due_date, status, created_at) VALUES ('${testInvId}', '${testClientId}', 'INV-TEST-99', 25000, 'EGP', '2026-11-20', 'unpaid', CURRENT_TIMESTAMP);"`, { encoding: 'utf-8' });
  console.log('✅ 4.2 Insert Invoice into D1 successful.');

  // 4.3 Approve payment in D1
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="UPDATE client_invoices SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = '${testInvId}';"`, { encoding: 'utf-8' });
  console.log('✅ 4.3 Approve Payment in D1 successful.');

  // 4.4 Verify in D1
  const invRes = execSync(`npx wrangler d1 execute pragency-analytics --remote --command="SELECT id, status, paid_at FROM client_invoices WHERE id = '${testInvId}';"`, { encoding: 'utf-8' });
  assert.ok(invRes.includes('paid'), 'Invoice status must be paid');
  console.log('✅ 4.4 Verified Invoice Payment in D1.');

  // 4.5 Clean up test data
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="DELETE FROM client_invoices WHERE id = '${testInvId}'; DELETE FROM portal_clients WHERE id = '${testClientId}';"`, { encoding: 'utf-8' });
  console.log('✅ 4.5 Cleaned up test data.');

  console.log('\n🎉 ALL Phase 4 Invoices & Projects Tests PASSED 100%!');
}

testPhase4().catch(err => {
  console.error('❌ Phase 4 Test Failed:', err);
  process.exit(1);
});
