// Migration: Add missing columns to portal_clients
// POST /api/migrate-phase5
export async function onRequestPost(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return new Response(JSON.stringify({ ok: false, error: 'No DB' }), { status: 500 });

  const results = [];

  // Add phone column if missing
  const migrations = [
    `ALTER TABLE portal_clients ADD COLUMN phone TEXT DEFAULT ''`,
  ];

  for (const sql of migrations) {
    try {
      await db.prepare(sql).run();
      results.push({ sql: sql.slice(0, 60), status: 'OK' });
    } catch (e) {
      // Column already exists = fine
      results.push({ sql: sql.slice(0, 60), status: e.message.includes('duplicate') || e.message.includes('already exists') ? 'ALREADY EXISTS (OK)' : 'ERROR: ' + e.message });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
