export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const body = await request.json().catch(() => ({}));

  if (!db) {
    return new Response(JSON.stringify({ ok: false, error: 'D1 binding not found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const queries = [
    // 1. Portal Clients
    `CREATE TABLE IF NOT EXISTS portal_clients (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_name TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      logo_url TEXT,
      brand_color TEXT DEFAULT '#8b5cf6',
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );`,

    // 2. Portal Deliverables (Calendar items)
    `CREATE TABLE IF NOT EXISTS portal_deliverables (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL, -- 'video' | 'design' | 'pdf'
      media_url TEXT NOT NULL,
      thumbnail_url TEXT,
      caption TEXT,
      hashtags TEXT,
      scheduled_date TEXT NOT NULL, -- 'YYYY-MM-DD'
      scheduled_time TEXT, -- 'HH:MM'
      platform TEXT DEFAULT 'instagram', -- 'instagram' | 'tiktok' | 'facebook' | 'all'
      status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
      client_feedback TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(client_id) REFERENCES portal_clients(id)
    );`,

    // 3. Portal Activity / Feedback History
    `CREATE TABLE IF NOT EXISTS portal_feedback_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deliverable_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      action TEXT NOT NULL, -- 'approved' | 'rejected' | 'commented'
      comment TEXT,
      created_at TEXT NOT NULL
    );`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_deliverables_client_date ON portal_deliverables(client_id, scheduled_date);`,
    `CREATE INDEX IF NOT EXISTS idx_deliverables_status ON portal_deliverables(status);`
  ];

  try {
    for (const q of queries) {
      await db.prepare(q).run();
    }

    // Seed / Upgrade Demo Client with Salted PBKDF2 / scrypt hash
    const passHash = 'scrypt:pbkdf2:100000:bc275953a30cdc8d9f7ab17386f2df01:f36c38f894139c14b869bfe5ffb0c7fec05de361031264632f9a6bba9f4f7f11';
    const clientId = 'c_demo_2026';
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT id FROM portal_clients WHERE email = ?').bind('client@demo.com').first();
    let seeded = false;

    if (!existing) {
      await db.prepare(`
        INSERT INTO portal_clients (id, company_name, contact_name, email, password_hash, logo_url, brand_color, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(clientId, 'Island Gym & Spa', 'كابتن أحمد سامي', 'client@demo.com', passHash, '/assets/logos/clients/client-14-island-gym.png', '#10b981', now).run();
    } else {
      await db.prepare('UPDATE portal_clients SET password_hash = ? WHERE email = ?').bind(passHash, 'client@demo.com').run();
    }

    // Seed Second Client (Client B) for Multi-Tenant Data Isolation Tests
    const clientBId = 'c_client_b_2026';
    const existingB = await db.prepare('SELECT id FROM portal_clients WHERE email = ?').bind('client_b@demo.com').first();
    if (!existingB) {
      await db.prepare(`
        INSERT INTO portal_clients (id, company_name, contact_name, email, password_hash, logo_url, brand_color, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(clientBId, 'Apex Real Estate', 'م. كريم محمود', 'client_b@demo.com', passHash, '/assets/logos/clients/client-10-apex.png', '#f59e0b', now).run();

      await db.prepare(`
        INSERT INTO portal_deliverables
        (id, client_id, title, type, media_url, thumbnail_url, caption, hashtags, scheduled_date, scheduled_time, platform, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind('del_client_b_confidential', clientBId, 'خطة إعلانات عقارية سرية خاصة بشركة Apex', 'pdf', '/assets/documents/PR_Agency_Portfolio_2026.pdf', '/assets/team/role-03-content-strategist.webp', 'خطة حملة إطلاق كمبوند العاصمة الإدارية', '#عقارات #Apex', '2026-10-30', '15:00', 'all', 'pending', now).run();
    }

    // Handle diagnostic read queries
    if (body.action === 'query' && body.sql) {
      const qRes = await db.prepare(body.sql).all();
      return new Response(JSON.stringify({ ok: true, data: qRes.results }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

    return new Response(JSON.stringify({
      ok: true,
      message: 'Client Portal schema migration and seeding completed successfully',
      seeded: true,
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
