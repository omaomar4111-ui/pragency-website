export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ ok: false, error: 'D1 binding not found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const queries = [
    `CREATE TABLE IF NOT EXISTS email_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      email TEXT NOT NULL,
      template TEXT NOT NULL,
      send_at TEXT NOT NULL,
      sent_at TEXT,
      status TEXT DEFAULT 'pending'
    );`,
    `CREATE INDEX IF NOT EXISTS idx_email_queue_status_send ON email_queue(status, send_at);`
  ];

  try {
    const results = [];
    for (const q of queries) {
      const res = await db.prepare(q).run();
      results.push(res);
    }

    // Attempt to add lead_score column to sessions table if not present
    let leadScoreAdded = false;
    try {
      await db.prepare('ALTER TABLE sessions ADD COLUMN lead_score INTEGER DEFAULT 0;').run();
      leadScoreAdded = true;
    } catch (colErr) {
      // Column might already exist
      leadScoreAdded = colErr.message.includes('duplicate column');
    }

    // Verify tables
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

    return new Response(JSON.stringify({
      ok: true,
      message: 'Phase 5 schema migration completed successfully',
      leadScoreAdded,
      tables: tables.results
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
