const checkSessions = async () => {
  const { execSync } = require('child_process');
  const sql = "PRAGMA table_info(sessions);";
  const cmd = `npx wrangler d1 execute pragency-analytics --remote --command="${sql}"`;
  try {
    const out = execSync(cmd, { encoding: 'utf8' });
    console.log('Sessions schema:\n', out);
  } catch (e) {
    console.error('Error:', e.message);
  }
};
checkSessions();
