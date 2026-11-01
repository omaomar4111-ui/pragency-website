// tests/test-telegram-phase2.cjs
const assert = require('assert');
const { execSync } = require('child_process');
const { buildMenu } = require('../functions/lib/telegram-menu.js');

async function testPhase2() {
  console.log('🧪 Starting Phase 2 Tasks Management Unit & D1 Integration Tests...\n');

  const chatId = '5715939844';

  // Test 1: Task Menu structure
  const tasksMenu = buildMenu(chatId, 'menu:tasks');
  assert.ok(tasksMenu.text.includes('إدارة المهام والعمليات اليومية'));
  const taskRows = tasksMenu.reply_markup.inline_keyboard;
  assert.strictEqual(taskRows[0][0].callback_data, 'menu:tasks:add');
  assert.strictEqual(taskRows[1][0].callback_data, 'menu:tasks:today');
  assert.strictEqual(taskRows[1][1].callback_data, 'menu:tasks:overdue');
  assert.strictEqual(taskRows[2][0].callback_data, 'menu:tasks:done');
  assert.strictEqual(taskRows[2][1].callback_data, 'menu:tasks:stats');
  assert.strictEqual(taskRows[3][0].callback_data, 'menu:main');
  console.log('✅ Test 1 Passed: Tasks Root Menu correctly validated.');

  // Test 2: Task List view with per-task controls
  const dummyTask = {
    id: 'test_task_999',
    title: 'تصميم هوية بصرية لعميل VIP',
    status: 'in-progress',
    priority: 'high',
    assigned_to: 'Super Admin',
    planned_date: '2026-11-02'
  };
  const listView = buildMenu(chatId, 'menu:tasks:list', {
    title: 'مهام اليوم المجدولة',
    tasks: [dummyTask],
    listType: 'today'
  });
  assert.ok(listView.text.includes('تصميم هوية بصرية'));
  const itemRow = listView.reply_markup.inline_keyboard[0];
  assert.strictEqual(itemRow[0].callback_data, 'action:task:done:test_task_999');
  assert.strictEqual(itemRow[1].callback_data, 'action:task:timer:test_task_999');
  assert.strictEqual(itemRow[2].callback_data, 'action:task:edit:test_task_999');
  assert.strictEqual(itemRow[3].callback_data, 'action:task:delete:test_task_999');
  console.log('✅ Test 2 Passed: Task item controls (Done, Timer, Edit, Delete) validated.');

  // Test 3: Task Stats view
  const statsView = buildMenu(chatId, 'menu:tasks:stats', {
    planned: 4,
    inProgress: 2,
    done: 9,
    overdue: 1,
    weekHours: 32.5
  });
  assert.ok(statsView.text.includes('4 مهمة'));
  assert.ok(statsView.text.includes('32.5 ساعة'));
  console.log('✅ Test 3 Passed: Tasks Stats view validated.');

  // Test 4: D1 Remote CRUD operations
  console.log('\n📡 Testing D1 Remote Database CRUD for Telegram Tasks Engine...');
  const testId = 'task_tg_test_' + Date.now();
  
  // 4.1 Insert Task
  execSync(`npx wrangler d1 execute 2d-marketing-db --remote --command="INSERT INTO tasks (id, project_id, title, status, priority, planned_date, assigned_to) VALUES ('${testId}', 'proj_agency', 'مهمة فحص تليجرام المؤتمتة', 'planned', 'urgent', date('now'), 'Super Admin');"`, { encoding: 'utf-8' });
  console.log('✅ 4.1 Insert Task into D1 successful.');

  // 4.2 Update Task Status (Done)
  execSync(`npx wrangler d1 execute 2d-marketing-db --remote --command="UPDATE tasks SET status = 'done', done_at = CURRENT_TIMESTAMP WHERE id = '${testId}';"`, { encoding: 'utf-8' });
  console.log('✅ 4.2 Mark Task as Done in D1 successful.');

  // 4.3 Log Time Entry
  const timeId = 'time_tg_' + Date.now();
  execSync(`npx wrangler d1 execute 2d-marketing-db --remote --command="INSERT INTO time_entries (id, task_id, user_id, user_name, hours, hourly_cost, date, notes) VALUES ('${timeId}', '${testId}', 'admin', 'Super Admin', 1.5, 150, date('now'), 'اختبار تايمر تليجرام');"`, { encoding: 'utf-8' });
  console.log('✅ 4.3 Log Task Timer in D1 successful.');

  // 4.4 Verify in D1
  const selectRes = execSync(`npx wrangler d1 execute 2d-marketing-db --remote --command="SELECT t.id, t.status, COALESCE(SUM(te.hours), 0) as total_hours FROM tasks t LEFT JOIN time_entries te ON t.id = te.task_id WHERE t.id = '${testId}' GROUP BY t.id;"`, { encoding: 'utf-8' });
  assert.ok(selectRes.includes('done'), 'Task status should be done');
  assert.ok(selectRes.includes('1.5'), 'Task hours should be 1.5');
  console.log('✅ 4.4 Verified D1 Task & Time Entries.');

  // 4.5 Clean up test records
  execSync(`npx wrangler d1 execute 2d-marketing-db --remote --command="DELETE FROM tasks WHERE id = '${testId}'; DELETE FROM time_entries WHERE id = '${timeId}';"`, { encoding: 'utf-8' });
  console.log('✅ 4.5 Cleaned up test data.');

  console.log('\n🎉 ALL Phase 2 Tasks Management Tests PASSED 100%!');
}

testPhase2().catch(err => {
  console.error('❌ Phase 2 Test Failed:', err);
  process.exit(1);
});
