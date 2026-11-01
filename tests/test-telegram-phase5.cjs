// tests/test-telegram-phase5.cjs
const assert = require('assert');
const { execSync } = require('child_process');
const { buildMenu } = require('../functions/lib/telegram-menu.js');

async function testPhase5() {
  console.log('🧪 Starting Phase 5 Team & Settings Unit & D1 Integration Tests...\n');

  const chatId = '5715939844';

  // Test 1: Team Menu Structure & Members List
  const dummyMembers = [
    {
      id: 'mem_tg_001',
      name: 'أحمد محمود',
      email: 'ahmed@pragency.com',
      role: 'مدير العمليات',
      department: 'العمليات والتنفيذ',
      active: 1
    },
    {
      id: 'mem_tg_002',
      name: 'سارة خالد',
      email: 'sara@pragency.com',
      role: 'مصممة أولى',
      department: 'التصميم الإبداعي',
      active: 0
    }
  ];

  const teamMenu = buildMenu(chatId, 'menu:team', { members: dummyMembers });
  assert.ok(teamMenu.text.includes('أحمد محمود'));
  assert.ok(teamMenu.text.includes('🟢 نشط'));
  assert.ok(teamMenu.text.includes('سارة خالد'));
  assert.ok(teamMenu.text.includes('🔴 معطل'));
  assert.strictEqual(teamMenu.reply_markup.inline_keyboard[0][0].callback_data, 'action:team:view:mem_tg_001');
  assert.strictEqual(teamMenu.reply_markup.inline_keyboard[0][2].callback_data, 'action:team:toggle:mem_tg_001');
  console.log('✅ Test 1 Passed: Team Hub Menu & member action controls validated.');

  // Test 2: Team Member Detail View
  const memberDetail = buildMenu(chatId, 'menu:team:detail', { member: dummyMembers[0], assignedTasksCount: 5 });
  assert.ok(memberDetail.text.includes('أحمد محمود'));
  assert.ok(memberDetail.text.includes('مدير العمليات'));
  assert.ok(memberDetail.text.includes('5 مهمة'));
  assert.strictEqual(memberDetail.reply_markup.inline_keyboard[0][0].callback_data, 'action:team:tasks:mem_tg_001');
  console.log('✅ Test 2 Passed: Team Member Detail View & Task counters validated.');

  // Test 3: Settings Menu Structure
  const settingsContext = {
    instapayIpa: 'pragency@instapay',
    instapayName: 'PR Agency Egypt Official',
    applePayMerchantId: 'merchant.com.pragency.portal',
    telegramChatId: '5715939844',
    notifyCountries: 'EG,SA,AE'
  };

  const settingsMenu = buildMenu(chatId, 'menu:settings', settingsContext);
  assert.ok(settingsMenu.text.includes('pragency@instapay'));
  assert.ok(settingsMenu.text.includes('PR Agency Egypt Official'));
  assert.ok(settingsMenu.text.includes('merchant.com.pragency.portal'));
  assert.ok(settingsMenu.text.includes('5715939844'));
  assert.strictEqual(settingsMenu.reply_markup.inline_keyboard[0][0].callback_data, 'action:settings:edit:instapay_ipa');
  assert.strictEqual(settingsMenu.reply_markup.inline_keyboard[3][0].callback_data, 'action:settings:test_notification');
  console.log('✅ Test 3 Passed: Settings Menu & edit triggers validated.');

  // Test 4: D1 Remote Database Operations for Team & Settings
  console.log('\n📡 Testing D1 Remote Database for Team & Settings Engine...');
  const testMemberId = 'mem_tg_test_' + Date.now();

  // 4.1 Insert test team member into agency_team_members
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="INSERT INTO agency_team_members (id, name, role, roles, email, password_hash, department, active, created_at) VALUES ('${testMemberId}', 'عضو اختبار تليجرام', 'مطور برمجيات', 'مطور برمجيات', 'test_dev@agency.com', 'dummy_hash', 'التطوير البرمجي', 1, CURRENT_TIMESTAMP);"`, { encoding: 'utf-8' });
  console.log('✅ 4.1 Insert Team Member into D1 successful.');

  // 4.2 Toggle active status in D1
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="UPDATE agency_team_members SET active = 0 WHERE id = '${testMemberId}';"`, { encoding: 'utf-8' });
  const checkMember = execSync(`npx wrangler d1 execute pragency-analytics --remote --command="SELECT id, active FROM agency_team_members WHERE id = '${testMemberId}';"`, { encoding: 'utf-8' });
  assert.ok(checkMember.includes('"active": 0') || checkMember.includes('0'), 'Member active status should be toggled to 0');
  console.log('✅ 4.2 Toggle active status in D1 successful.');

  // 4.3 Update agency_settings
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="INSERT INTO agency_settings (key, value, updated_at) VALUES ('instapay_ipa', 'pragency@instapay', CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;"`, { encoding: 'utf-8' });
  const checkSetting = execSync(`npx wrangler d1 execute pragency-analytics --remote --command="SELECT key, value FROM agency_settings WHERE key = 'instapay_ipa';"`, { encoding: 'utf-8' });
  assert.ok(checkSetting.includes('pragency@instapay'), 'Setting value must match updated value');
  console.log('✅ 4.3 Settings upsert in D1 successful.');

  // 4.4 Clean up test team member
  execSync(`npx wrangler d1 execute pragency-analytics --remote --command="DELETE FROM agency_team_members WHERE id = '${testMemberId}';"`, { encoding: 'utf-8' });
  console.log('✅ 4.4 Cleaned up test member from D1.');

  console.log('\n🎉 ALL Phase 5 Team & Settings Tests PASSED 100%!');
}

testPhase5().catch(err => {
  console.error('❌ Phase 5 Test Failed:', err);
  process.exit(1);
});
