// tests/test-telegram-ai-chat.cjs
// Automated test suite for PR Agency OS Telegram AI Chat Assistant

const assert = require('assert');

async function runAiChatTests() {
  console.log('🤖 Starting Telegram AI Chat Assistant Test Suite...\n');

  // Dynamic import of ES modules
  const { handleAiChat, onRequestPost } = await import('../functions/api/telegram/ai-chat.js');
  const webhook = await import('../functions/api/telegram/webhook.js');

  const adminChatId = '5715939844';
  const unauthorizedChatId = '999999999';

  // In-memory mock database state
  const mockTasks = [
    { id: 'task_001', title: 'تصوير فيديو للعميل', priority: 'high', status: 'planned', planned_date: '2026-11-05' },
    { id: 'task_002', title: 'تصميم هوية بصرية', priority: 'medium', status: 'done', planned_date: '2026-11-01' }
  ];

  const mockClients = [
    { company_name: 'شركة الأمل للاستثمار' },
    { company_name: 'عيادات د. خالد التخصصية' },
    { company_name: 'مجموعة براندز ريتيل' }
  ];

  const mockInvoices = [
    { amount: 45000, status: 'paid', due_date: '2026-10-25' },
    { amount: 25000, status: 'pending', due_date: '2026-11-15' },
    { amount: 15000, status: 'overdue', due_date: '2026-10-01' }
  ];

  const mockLeads = [
    { id: 'lead_1', name: 'أحمد إبراهيم', company: 'شركة النور', pipeline_stage: 'new', created_at: new Date().toISOString() },
    { id: 'lead_2', name: 'سارة مراد', company: 'بيوتي كلينك', pipeline_stage: 'contacted', created_at: new Date().toISOString() }
  ];

  const createMockDb = () => ({
    prepare(query) {
      const q = query.trim();
      return {
        bind(...args) {
          return {
            async run() {
              if (q.includes('INSERT INTO tasks')) {
                mockTasks.push({
                  id: args[0],
                  project_id: args[1],
                  title: args[2],
                  description: args[3],
                  priority: args[4],
                  planned_date: args[5],
                  status: 'planned'
                });
                return { success: true };
              }
              return { success: true };
            },
            async first() { return null; },
            async all() { return { results: [] }; }
          };
        },
        async run() { return { success: true }; },
        async first() {
          if (q.includes('COUNT(*) as cnt FROM portal_clients')) {
            return { cnt: mockClients.length };
          }
          if (q.includes('client_invoices')) {
            const paid = mockInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
            const pending = mockInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);
            const overdue = mockInvoices.filter(i => i.status !== 'paid' && i.due_date < '2026-11-02').length;
            return {
              total_count: mockInvoices.length,
              paid_total: paid,
              pending_total: pending,
              overdue_count: overdue
            };
          }
          if (q.includes('COUNT(*) as cnt FROM sales_leads')) {
            return { cnt: mockLeads.length };
          }
          if (q.includes('COUNT(*) as cnt FROM tasks')) {
            if (q.includes("status = 'planned'")) {
              return { cnt: mockTasks.filter(t => t.status === 'planned').length };
            }
            if (q.includes("status = 'done'")) {
              return { cnt: mockTasks.filter(t => t.status === 'done').length };
            }
            if (q.includes("planned_date < date('now')")) {
              return { cnt: 0 };
            }
            return { cnt: mockTasks.length };
          }
          return { cnt: 0 };
        },
        async all() {
          if (q.includes('FROM portal_clients')) {
            return { results: mockClients };
          }
          if (q.includes('FROM sales_leads')) {
            return { results: mockLeads };
          }
          if (q.includes('FROM tasks')) {
            return { results: mockTasks.filter(t => t.status !== 'done') };
          }
          return { results: [] };
        }
      };
    }
  });

  const mockEnv = {
    DB: createMockDb(),
    ANALYTICS_DB: createMockDb(),
    TELEGRAM_CHAT_ID: adminChatId,
    TELEGRAM_BOT_TOKEN: 'test_bot_token'
  };

  // TEST 1: Security Barrier Check
  console.log('🔒 Test 1: Verifying security check for unauthorized chats...');
  const unauthorizedRes = await handleAiChat(mockEnv, unauthorizedChatId, 'مرحبا، اعرض العملاء');
  assert.strictEqual(unauthorizedRes.success, false, 'Unauthorized chat must fail');
  assert.ok(unauthorizedRes.text.includes('تنبيه أمني'), 'Must contain security warning');
  console.log('✅ Test 1 Passed: Unauthorized chat blocked successfully.');

  // TEST 2: Query Live Clients Count
  console.log('\n👥 Test 2: Natural Language query for clients ("عندي كام عميل؟")...');
  const clientQueryRes = await handleAiChat(mockEnv, adminChatId, 'عندي كام عميل؟');
  assert.strictEqual(clientQueryRes.success, true);
  assert.ok(clientQueryRes.text.includes('3 عميل') || clientQueryRes.text.includes('3'), 'Must contain accurate client count');
  assert.ok(clientQueryRes.text.includes('شركة الأمل للاستثمار'), 'Must list real clients');
  console.log('✅ Test 2 Passed: Clients query answered with live D1 data.');

  // TEST 3: Query Invoices & Revenue
  console.log('\n🧾 Test 3: Natural Language query for invoices ("اعرض الفواتير والتحصيل")...');
  const invoiceQueryRes = await handleAiChat(mockEnv, adminChatId, 'اعرض الفواتير والتحصيل');
  assert.strictEqual(invoiceQueryRes.success, true);
  assert.ok(invoiceQueryRes.text.includes('45,000') || invoiceQueryRes.text.includes('45000'), 'Must contain paid total');
  assert.ok(invoiceQueryRes.text.includes('client_invoices') || invoiceQueryRes.text.includes('الفواتير') || invoiceQueryRes.text.includes('محصل'));
  console.log('✅ Test 3 Passed: Revenue & invoice status answered accurately.');

  // TEST 4: Query Active Tasks
  console.log('\n📋 Test 4: Natural Language query for tasks ("عايز اعرف موقف المهام")...');
  const taskQueryRes = await handleAiChat(mockEnv, adminChatId, 'عايز اعرف موقف المهام الحالية');
  assert.strictEqual(taskQueryRes.success, true);
  assert.ok(taskQueryRes.text.includes('تصوير فيديو للعميل') || taskQueryRes.text.includes('موقف المهام'));
  console.log('✅ Test 4 Passed: Tasks queried and reported accurately.');

  // TEST 5: Action Execution ("أضف مهمة تصوير إعلان للعيادة")
  console.log('\n⚡ Test 5: Command Action Execution ("أضف مهمة تصوير إعلان تجاري للعيادة")...');
  const initialTaskCount = mockTasks.length;
  const addTaskRes = await handleAiChat(mockEnv, adminChatId, 'أضف مهمة تصوير إعلان تجاري للعيادة');
  assert.strictEqual(addTaskRes.success, true);
  assert.ok(addTaskRes.text.includes('تم إضافة المهمة بنجاح'), 'Must confirm task addition');
  assert.ok(mockTasks.length > initialTaskCount, 'Task must be inserted into tasks table');
  const lastTask = mockTasks[mockTasks.length - 1];
  assert.ok(lastTask.title.includes('تصوير إعلان تجاري للعيادة'));
  console.log('✅ Test 5 Passed: Natural language action created task in DB successfully.');

  // TEST 6: Content Generation using installed skills (Copywriting Post)
  console.log('\n✍️ Test 6: Skill Execution - Marketing Post ("اكتبلي بوست عن خدماتنا")...');
  const postGenRes = await handleAiChat(mockEnv, adminChatId, 'اكتبلي بوست عن خدماتنا التسويقية');
  assert.strictEqual(postGenRes.success, true);
  assert.ok(postGenRes.text.includes('PR Agency') || postGenRes.text.includes('التسويق'), 'Must generate PR Agency marketing copy');
  assert.ok(postGenRes.text.includes('تواصل') || postGenRes.text.includes('احجز') || postGenRes.text.includes('استشارة'), 'Must contain Call to Action');
  console.log('✅ Test 6 Passed: Copywriting skill generated high-converting post.');

  // TEST 7: Content Generation (YouTube / Reels Script)
  console.log('\n🎬 Test 7: Skill Execution - Video Script ("عايز سكريبت فيديو ريلز إعلاني")...');
  const scriptGenRes = await handleAiChat(mockEnv, adminChatId, 'عايز سكريبت فيديو ريلز إعلاني');
  assert.strictEqual(scriptGenRes.success, true);
  assert.ok(scriptGenRes.text.includes('فيديو') || scriptGenRes.text.includes('الخطاف') || scriptGenRes.text.includes('CTA'));
  console.log('✅ Test 7 Passed: YouTube/Video script skill generated properly.');

  // TEST 8: Full Webhook routing simulation
  console.log('\n🌐 Test 8: Telegram Webhook routing for non-command conversational text...');
  let sentTelegramPayload = null;
  global.fetch = async (url, options) => {
    if (url.includes('api.telegram.org')) {
      sentTelegramPayload = JSON.parse(options.body);
      return { ok: true, json: async () => ({ ok: true, result: {} }) };
    }
    return { ok: true, json: async () => ({}) };
  };

  const fakeWebhookRequest = new Request('https://pragency.pages.dev/api/telegram/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      update_id: 123456,
      message: {
        message_id: 777,
        chat: { id: parseInt(adminChatId, 10), type: 'private' },
        from: { id: parseInt(adminChatId, 10), first_name: 'Admin' },
        text: 'عندي كام عميل مسجلين حالياً؟',
        date: Math.floor(Date.now() / 1000)
      }
    })
  });

  const webhookResponse = await webhook.onRequestPost({ request: fakeWebhookRequest, env: mockEnv });
  assert.strictEqual(webhookResponse.status, 200);
  assert.ok(sentTelegramPayload !== null, 'Message must be dispatched to Telegram');
  assert.strictEqual(String(sentTelegramPayload.chat_id), adminChatId);
  assert.ok(sentTelegramPayload.text.includes('عميل'), 'Webhook must route to AI chat and deliver answer');
  console.log('✅ Test 8 Passed: Webhook seamlessly routed non-command chat message to AI assistant.');

  console.log('\n🎉 ALL 8 TESTS PASSED SUCCESSFULLY! 🚀');
}

runAiChatTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
