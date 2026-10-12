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

    // Seed Demo Client if none exists
    const existing = await db.prepare('SELECT id FROM portal_clients WHERE email = ?').bind('client@demo.com').first();
    let seeded = false;
      const clientId = 'c_demo_2026';
      // Correct SHA-256 of "demo123": d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791
      const passHash = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791';
      const now = new Date().toISOString();

      if (!existing) {
        await db.prepare(`
          INSERT INTO portal_clients (id, company_name, contact_name, email, password_hash, logo_url, brand_color, active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        `).bind(clientId, 'Island Gym & Spa', 'كابتن أحمد سامي', 'client@demo.com', passHash, '/assets/logos/clients/client-14-island-gym.png', '#10b981', now).run();
      } else {
        await db.prepare('UPDATE portal_clients SET password_hash = ? WHERE email = ?').bind(passHash, 'client@demo.com').run();
      }

      // Seed sample calendar items for current month
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');

      const sampleItems = [
        {
          id: 'del_1_' + Date.now(),
          title: 'فيديو ريلز: أقوى تمرينات حرق الدهون لعام 2026 🔥',
          type: 'video',
          media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail_url: '/assets/team/role-06-video-editor.webp',
          caption: 'مستعد توصل لأفضل فورمة في حياتك؟ 💪 التمارين دي هتغير أسلوب تدريبك 180 درجة.\nاحجز جلستك التدريبية الأولى مجاناً النهاردة!',
          hashtags: '#IslandGym #Fitness2026 #تمرين #جيم #لياقة_بدنية',
          scheduled_date: `${yyyy}-${mm}-15`,
          scheduled_time: '18:00',
          platform: 'instagram',
          status: 'pending'
        },
        {
          id: 'del_2_' + Date.now(),
          title: 'بوست كاروسيل: دليلك الشامل للتغذية السليمة 🥗',
          type: 'design',
          media_url: '/assets/team/role-07-graphic-designer.webp',
          thumbnail_url: '/assets/team/role-07-graphic-designer.webp',
          caption: '5 قواعد أساسية في نظامك الغذائي هتضاعف طاقتك ونتائج تمرينك في الجيم.\nاسحب الصور وتعرف عليها بالتفصيل 👉',
          hashtags: '#تغذية_صحية #جيم #نظام_غذائي #IslandGym',
          scheduled_date: `${yyyy}-${mm}-18`,
          scheduled_time: '19:30',
          platform: 'instagram',
          status: 'pending'
        },
        {
          id: 'del_3_' + Date.now(),
          title: 'برزنتيشن وخطة المحتوى الشهرية (PDF) 📊',
          type: 'pdf',
          media_url: '/assets/documents/PR_Agency_Portfolio_2026.pdf',
          thumbnail_url: '/assets/team/role-03-content-strategist.webp',
          caption: 'تقرير الأداء الشهري ومقترحات الحملة الإعلانية القادمة للربع الأخير.',
          hashtags: '#استراتيجية #PR_Agency',
          scheduled_date: `${yyyy}-${mm}-22`,
          scheduled_time: '14:00',
          platform: 'all',
          status: 'pending'
        }
      ];

      for (const item of sampleItems) {
        await db.prepare(`
          INSERT INTO portal_deliverables 
          (id, client_id, title, type, media_url, thumbnail_url, caption, hashtags, scheduled_date, scheduled_time, platform, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(item.id, clientId, item.title, item.type, item.media_url, item.thumbnail_url, item.caption, item.hashtags, item.scheduled_date, item.scheduled_time, item.platform, item.status, now).run();
      }

      seeded = true;

    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

    return new Response(JSON.stringify({
      ok: true,
      message: 'Client Portal schema migration and seeding completed successfully',
      seeded,
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
