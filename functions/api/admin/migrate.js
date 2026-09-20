function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  try {
    const decoded = atob(auth.slice(6).trim());
    const idx = decoded.indexOf(':');
    if (idx === -1) return false;
    return decoded.slice(idx + 1) === PASS;
  } catch (e) { return false; }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'DB not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const statements = [
    `CREATE TABLE IF NOT EXISTS site_content (id INTEGER PRIMARY KEY AUTOINCREMENT, section TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(section, key))`,
    `CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, logo_url TEXT NOT NULL, website_url TEXT, order_index INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS team_members (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT NOT NULL, bio TEXT, photo_url TEXT, linkedin_url TEXT, order_index INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS site_theme (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT NOT NULL, label TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS site_layout (id INTEGER PRIMARY KEY AUTOINCREMENT, section_id TEXT NOT NULL UNIQUE, label TEXT NOT NULL, order_index INTEGER DEFAULT 0, is_visible INTEGER DEFAULT 1, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `INSERT OR IGNORE INTO site_theme (key, value, label) VALUES ('primary_color', '#8B5CF6', 'اللون الرئيسي')`,
    `INSERT OR IGNORE INTO site_theme (key, value, label) VALUES ('secondary_color', '#6D28D9', 'اللون الثانوي')`,
    `INSERT OR IGNORE INTO site_theme (key, value, label) VALUES ('accent_color', '#A78BFA', 'لون التمييز')`,
    `INSERT OR IGNORE INTO site_theme (key, value, label) VALUES ('bg_dark', '#0A0612', 'خلفية داكنة')`,
    `INSERT OR IGNORE INTO site_layout (section_id, label, order_index, is_visible) VALUES ('hero', 'Hero Section', 1, 1)`,
    `INSERT OR IGNORE INTO site_layout (section_id, label, order_index, is_visible) VALUES ('clients', 'Client Logos', 2, 1)`,
    `INSERT OR IGNORE INTO site_layout (section_id, label, order_index, is_visible) VALUES ('services', 'Our Services', 3, 1)`,
    `INSERT OR IGNORE INTO site_layout (section_id, label, order_index, is_visible) VALUES ('about', 'About Us', 4, 1)`,
    `INSERT OR IGNORE INTO site_layout (section_id, label, order_index, is_visible) VALUES ('team', 'Our Team', 5, 1)`,
    `INSERT OR IGNORE INTO site_layout (section_id, label, order_index, is_visible) VALUES ('contact', 'Contact Form', 6, 1)`
  ];

  const results = [];
  for (const sql of statements) {
    try {
      await env.DB.prepare(sql).run();
      results.push({ sql: sql.substring(0, 50) + '...', status: 'OK' });
    } catch (err) {
      results.push({ sql: sql.substring(0, 50) + '...', status: 'ERROR', error: err.message });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
