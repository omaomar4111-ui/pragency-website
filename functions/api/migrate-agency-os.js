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
    // 1. Team Users & Roles (Super Admin, Strategist, Copywriter, Designer, Video Creator, Account Manager, Sales)
    `CREATE TABLE IF NOT EXISTS agency_team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      roles TEXT NOT NULL, -- JSON array: e.g. ["copywriter", "videographer"] or ["account_manager"]
      department TEXT NOT NULL, -- 'creative' | 'sales' | 'management'
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );`,

    // 2. System Audit Logs (Every upload, approval, rejection, and report edit tracked with timestamp & author)
    `CREATE TABLE IF NOT EXISTS system_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL, -- 'upload' | 'internal_approve' | 'client_approve' | 'client_reject' | 'report_published' | 'lead_assigned'
      target_type TEXT NOT NULL, -- 'deliverable' | 'strategy' | 'report' | 'lead'
      target_id TEXT NOT NULL,
      client_id TEXT,
      details TEXT, -- JSON details or descriptive text
      ip_address TEXT,
      created_at TEXT NOT NULL
    );`,

    // 3. Client Strategies & Live Roadmaps (Directly written on the site, no Word/PDF needed)
    `CREATE TABLE IF NOT EXISTS client_strategies (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      title TEXT NOT NULL,
      market_analysis TEXT,
      target_personas TEXT,
      content_pillars TEXT,
      quarterly_goals TEXT,
      created_by TEXT NOT NULL,
      status TEXT DEFAULT 'draft', -- 'draft' | 'under_review' | 'published_to_client'
      approved_by_am TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(client_id) REFERENCES portal_clients(id)
    );`,

    // 4. In-App Performance & Client Live Reports
    `CREATE TABLE IF NOT EXISTS client_reports (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      month_year TEXT NOT NULL, -- '2026-10'
      title TEXT NOT NULL,
      reach_metric INTEGER DEFAULT 0,
      engagement_metric INTEGER DEFAULT 0,
      leads_generated INTEGER DEFAULT 0,
      ad_spend REAL DEFAULT 0.0,
      roas REAL DEFAULT 0.0,
      executive_summary TEXT, -- Written live on site
      next_month_plan TEXT,
      status TEXT DEFAULT 'draft', -- 'draft' | 'approved_by_am' | 'published'
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(client_id) REFERENCES portal_clients(id)
    );`,

    // 5. Smart Sales CRM & Leads Distribution
    `CREATE TABLE IF NOT EXISTS sales_leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      project_name TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      source_type TEXT NOT NULL, -- 'meta_ad' | 'tiktok_ad' | 'google_ad' | 'client_referral' | 'website_form' | 'chatbot'
      source_details TEXT, -- e.g. "Referral from Dr. Ahmed" or "Ad Campaign: Q4 Clinic Scaling"
      service_interested TEXT,
      budget_tier TEXT,
      challenge_notes TEXT,
      assigned_sales_id TEXT,
      assigned_sales_name TEXT,
      pipeline_stage TEXT DEFAULT 'new', -- 'new' | 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'won' | 'lost'
      last_followup_at TEXT,
      next_followup_due TEXT,
      followup_status TEXT DEFAULT 'pending', -- 'pending' | 'completed' | 'overdue'
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    // 6. Voice-to-Text & Lead Follow-ups History
    `CREATE TABLE IF NOT EXISTS lead_followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL,
      sales_id TEXT NOT NULL,
      sales_name TEXT NOT NULL,
      call_outcome TEXT NOT NULL, -- 'interested' | 'callback' | 'no_answer' | 'not_fit'
      transcribed_text TEXT, -- Raw speech to text or notes
      formatted_notes TEXT NOT NULL, -- Clean organized structured bullet points
      next_action TEXT,
      next_action_date TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(lead_id) REFERENCES sales_leads(id)
    );`,

    // 7. Client Financials & Payment Reminders
    `CREATE TABLE IF NOT EXISTS client_invoices (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'EGP',
      due_date TEXT NOT NULL, -- 'YYYY-MM-DD'
      status TEXT DEFAULT 'unpaid', -- 'unpaid' | 'paid' | 'overdue'
      paid_at TEXT,
      notes TEXT,
      reminder_sent_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(client_id) REFERENCES portal_clients(id)
    );`
  ];

  const results = [];
  for (const query of queries) {
    try {
      await db.prepare(query).run();
      results.push({ query: query.slice(0, 45) + '...', ok: true });
    } catch (e) {
      results.push({ query: query.slice(0, 45) + '...', ok: false, error: e.message });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
