// Migration: Add pdf_url column to client_invoices
// Route: POST /api/migrate-phase7
export async function onRequestPost(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ ok: false, error: 'No DB' }), { status: 500 });

  const results = [];
  const migrations = [
    `ALTER TABLE client_invoices ADD COLUMN pdf_url TEXT DEFAULT NULL`,
    `CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      created_at TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_invoice_items ON invoice_items(invoice_id);`
  ];

  for (const sql of migrations) {
    try {
      await db.prepare(sql).run();
      results.push({ sql: sql.slice(0, 60), status: 'OK' });
    } catch (e) {
      results.push({
        sql: sql.slice(0, 60),
        status: e.message.includes('duplicate') || e.message.includes('already exists')
          ? 'ALREADY EXISTS (OK)'
          : 'ERROR: ' + e.message
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
