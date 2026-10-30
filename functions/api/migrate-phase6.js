// Migration: Add Versioning & Threaded Feedback support (Phase 6)
// Route: POST /api/migrate-phase6
export async function onRequestPost(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ ok: false, error: 'No DB' }), { status: 500 });

  const results = [];

  const migrations = [
    // 1. Add version column to portal_deliverables
    `ALTER TABLE portal_deliverables ADD COLUMN version INTEGER DEFAULT 1`,
    // 2. Add parent_asset_id column to link V1, V2, V3 together
    `ALTER TABLE portal_deliverables ADD COLUMN parent_asset_id TEXT DEFAULT NULL`,
    // 3. Create asset_feedback table for threaded conversations
    `CREATE TABLE IF NOT EXISTS asset_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL,
      parent_asset_id TEXT DEFAULT NULL,
      author_role TEXT NOT NULL, -- 'client', 'team', 'account_manager', 'admin'
      author_name TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,
    // 4. Index for fast feedback thread lookups
    `CREATE INDEX IF NOT EXISTS idx_asset_feedback ON asset_feedback(asset_id, created_at);`,
    `CREATE INDEX IF NOT EXISTS idx_parent_asset ON portal_deliverables(parent_asset_id);`
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
