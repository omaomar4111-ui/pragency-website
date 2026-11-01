// tests/test-telegram-phase1.cjs
const assert = require('assert');
const { buildMenu } = require('../functions/lib/telegram-menu.js');

async function runTests() {
  console.log('🧪 Starting Phase 1 Telegram Command Center Unit Tests...\n');

  // Test 1: Main Menu Structure
  const mainMenu = buildMenu('5715939844', 'menu:main');
  assert.strictEqual(mainMenu.chat_id, '5715939844');
  assert.ok(mainMenu.text.includes('مركز القيادة المركزي'));
  assert.strictEqual(mainMenu.reply_markup.inline_keyboard.length, 6, 'Main menu should have exactly 6 rows');

  const rows = mainMenu.reply_markup.inline_keyboard;
  assert.strictEqual(rows[0][0].text, '📊 نظرة عامة');
  assert.strictEqual(rows[0][0].callback_data, 'menu:overview');
  assert.strictEqual(rows[0][1].text, '📋 المهام');
  assert.strictEqual(rows[0][1].callback_data, 'menu:tasks');

  assert.strictEqual(rows[1][0].text, '👥 العملاء');
  assert.strictEqual(rows[1][0].callback_data, 'menu:clients');
  assert.strictEqual(rows[1][1].text, '💼 الليدز');
  assert.strictEqual(rows[1][1].callback_data, 'menu:leads');

  assert.strictEqual(rows[2][0].text, '🧾 الفواتير');
  assert.strictEqual(rows[2][0].callback_data, 'menu:invoices');
  assert.strictEqual(rows[2][1].text, '👤 الفريق');
  assert.strictEqual(rows[2][1].callback_data, 'menu:team');

  assert.strictEqual(rows[3][0].text, '📂 المشاريع');
  assert.strictEqual(rows[3][0].callback_data, 'menu:projects');
  assert.strictEqual(rows[3][1].text, '🤖 أدوات AI');
  assert.strictEqual(rows[3][1].callback_data, 'menu:ai');

  assert.strictEqual(rows[4][0].text, '⚙️ الأتمتة');
  assert.strictEqual(rows[4][0].callback_data, 'menu:automation');
  assert.strictEqual(rows[4][1].text, '📈 التقارير');
  assert.strictEqual(rows[4][1].callback_data, 'menu:reports');

  assert.strictEqual(rows[5][0].text, '⚙️ الإعدادات');
  assert.strictEqual(rows[5][0].callback_data, 'menu:settings');

  console.log('✅ Test 1 Passed: Main Menu 6-row Inline Keyboard validated.');

  // Test 2: Overview Menu Structure
  const overviewMenu = buildMenu('5715939844', 'menu:overview', {
    totalClients: 12,
    activeTasks: 5,
    paidInvoicesThisMonth: 8,
    paidAmountThisMonth: 145000,
    newLeadsThisWeek: 19
  });
  assert.ok(overviewMenu.text.includes('12 عميل'));
  assert.ok(overviewMenu.text.includes('5 مهمة'));
  assert.ok(overviewMenu.text.includes('19 ليد'));
  assert.ok(overviewMenu.text.includes('145,000'));
  assert.ok(overviewMenu.reply_markup.inline_keyboard.some(r => r.some(btn => btn.callback_data === 'menu:main')));
  console.log('✅ Test 2 Passed: Overview Menu correctly formats executive metrics & back button.');

  console.log('\n🎉 All Phase 1 Local Unit Tests PASSED Successfully!');
}

runTests().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
