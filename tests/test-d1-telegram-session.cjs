// tests/test-d1-telegram-session.cjs
// Verifies D1 remote database telegram_sessions operations
const { execSync } = require('child_process');

console.log('🔍 Testing telegram_sessions in Cloudflare D1 Remote Database...');

const testChatId = '5715939844';
const upsertSql = `INSERT INTO telegram_sessions (chat_id, current_menu, context_data, updated_at) VALUES ('${testChatId}', 'menu:main', '{\\"role\\":\\"SuperAdmin\\"}', CURRENT_TIMESTAMP) ON CONFLICT(chat_id) DO UPDATE SET current_menu = excluded.current_menu, context_data = excluded.context_data, updated_at = CURRENT_TIMESTAMP;`;

const upsertOutput = execSync(`npx wrangler d1 execute 2d-marketing-db --remote --command="${upsertSql}"`, { encoding: 'utf-8' });
console.log('✅ Upsert executed successfully.');

const selectOutput = execSync(`npx wrangler d1 execute 2d-marketing-db --remote --command="SELECT * FROM telegram_sessions WHERE chat_id = '${testChatId}';"`, { encoding: 'utf-8' });
console.log('✅ Query result from D1:');
console.log(selectOutput);

if (!selectOutput.includes('menu:main')) {
  console.error('❌ Session verification failed: menu:main not found.');
  process.exit(1);
}

console.log('🎉 D1 telegram_sessions table verified and functioning 100%!');
