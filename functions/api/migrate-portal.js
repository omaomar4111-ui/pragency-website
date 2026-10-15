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
    `CREATE INDEX IF NOT EXISTS idx_deliverables_status ON portal_deliverables(status);`,

    // 4. Portfolio Brands
    `CREATE TABLE IF NOT EXISTS portfolio_brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name_ar TEXT NOT NULL,
      name_en TEXT,
      description_ar TEXT,
      description_en TEXT,
      logo_url TEXT,
      category TEXT,
      display_order INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );`,

    // 5. Portfolio Designs
    `CREATE TABLE IF NOT EXISTS portfolio_designs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL,
      title_ar TEXT,
      title_en TEXT,
      description_ar TEXT,
      description_en TEXT,
      image_url TEXT NOT NULL,
      thumbnail_url TEXT,
      r2_key TEXT,
      design_type TEXT,
      display_order INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES portfolio_brands(id) ON DELETE CASCADE
    );`,

    // Portfolio Indexes
    `CREATE INDEX IF NOT EXISTS idx_brands_slug ON portfolio_brands(slug);`,
    `CREATE INDEX IF NOT EXISTS idx_brands_published ON portfolio_brands(is_published);`,
    `CREATE INDEX IF NOT EXISTS idx_designs_brand ON portfolio_designs(brand_id);`,
    `CREATE INDEX IF NOT EXISTS idx_designs_published ON portfolio_designs(is_published);`
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
    // Seed Sample Portfolio Brands & Designs
    const brandCount = await db.prepare('SELECT count(*) as cnt FROM portfolio_brands').first();
    if (brandCount && brandCount.cnt === 0) {
      await db.prepare(`
        INSERT INTO portfolio_brands (slug, name_ar, name_en, description_ar, category, is_published, created_at)
        VALUES
        ('island-gym', 'Island Gym', 'Island Gym', 'نادي رياضي - إدارة سوشيال ميديا وإنتاج محتوى', 'social_media', 1, ?),
        ('nh-clinics', 'عيادات NH', 'NH Clinics', 'عيادات طبية - استراتيجية سوشيال ميديا وتصوير', 'social_media', 1, ?)
      `).bind(now, now).run();

      const b1 = await db.prepare('SELECT id FROM portfolio_brands WHERE slug = ?').bind('island-gym').first();
      const b2 = await db.prepare('SELECT id FROM portfolio_brands WHERE slug = ?').bind('nh-clinics').first();

      if (b1) {
        await db.prepare(`
          INSERT INTO portfolio_designs (brand_id, title_ar, title_en, description_ar, image_url, thumbnail_url, design_type, display_order, is_published, created_at)
          VALUES
          (?, 'بوست عروض الصيف 2026', 'Summer Offers 2026', 'حملة إعلانية ممولة عبر إنستجرام', '/assets/team/role-07-graphic-designer.webp', '/assets/team/role-07-graphic-designer.webp', 'social_media', 1, 1, ?),
          (?, 'ريلز تحدي اللياقة البدنية', 'Fitness Challenge Reel', 'فيديو تفاعلي للريلز والتيك توك', '/assets/team/role-06-video-editor.webp', '/assets/team/role-06-video-editor.webp', 'video', 2, 1, ?),
          (?, 'كاروسيل 5 نصائح للتغذية', '5 Nutrition Tips Carousel', 'محتوى تعليمي تفاعلي', '/assets/team/role-03-content-strategist.webp', '/assets/team/role-03-content-strategist.webp', 'social_media', 3, 1, ?),
          (?, 'ستوري استعراض الأجهزة الجديدة', 'New Equipment Story', 'تغطية مصورة داخل الفروع', '/assets/team/role-08-photographer.webp', '/assets/team/role-08-photographer.webp', 'social_media', 4, 1, ?)
        `).bind(b1.id, now, b1.id, now, b1.id, now, b1.id, now).run();
      }

      if (b2) {
        await db.prepare(`
          INSERT INTO portfolio_designs (brand_id, title_ar, title_en, description_ar, image_url, thumbnail_url, design_type, display_order, is_published, created_at)
          VALUES
          (?, 'إعلان خدمات العناية بالبشرة', 'Skincare Services Ad', 'إعلان موجه للمرأة مع عروض حصرية', '/assets/team/role-04-media-buyer.webp', '/assets/team/role-04-media-buyer.webp', 'ads', 1, 1, ?),
          (?, 'فيديو توعوي مع استشاري الجلدية', 'Doctor Awareness Video', 'سلسلة فيديوهات قصيرة مع الأطباء', '/assets/team/role-06-video-editor.webp', '/assets/team/role-06-video-editor.webp', 'video', 2, 1, ?),
          (?, 'كاروسيل نصائح العناية اليومية', 'Daily Skincare Tips', 'تصميمات بصرية متناسقة مع ألوان العيادة', '/assets/team/role-07-graphic-designer.webp', '/assets/team/role-07-graphic-designer.webp', 'social_media', 3, 1, ?),
          (?, 'ستوري قبل وبعد الحالات', 'Before & After Showcase', 'نتائج حقيقية موثقة للمرضى', '/assets/team/role-01-account-manager.webp', '/assets/team/role-01-account-manager.webp', 'social_media', 4, 1, ?)
        `).bind(b2.id, now, b2.id, now, b2.id, now, b2.id, now).run();
      }
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
