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
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      last_message_at TEXT NOT NULL,
      message_count INTEGER DEFAULT 0,
      country TEXT,
      city TEXT,
      user_agent TEXT,
      is_lead INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    );`,
    `CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      source TEXT DEFAULT 'chatbot',
      created_at TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      country TEXT,
      city TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);`,
    `CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);`
  ];

  try {
    const results = [];
    for (const q of queries) {
      const res = await db.prepare(q).run();
      results.push(res);
    }

    // Verify by listing tables
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

    return new Response(JSON.stringify({
      ok: true,
      message: 'Chatbot tables created successfully in D1',
      tables: tables.results
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: err.message,
      stack: err.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
