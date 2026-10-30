// functions/api/admin/search.js
// Global Command Palette Search across Clients, Team Members, Sales Leads, and Projects

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const db2d = env.DB;

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  if (!q || q.length < 2) {
    return jsonResponse({
      success: true,
      results: { clients: [], team: [], leads: [], projects: [] }
    });
  }

  const term = `%${q}%`;

  try {
    // 1. Search Clients
    let clients = [];
    if (db) {
      const clientRes = await db.prepare(`
        SELECT id, company_name, contact_name, email, phone 
        FROM portal_clients 
        WHERE company_name LIKE ? OR contact_name LIKE ? OR email LIKE ?
        LIMIT 6
      `).bind(term, term, term).all().catch(() => ({ results: [] }));
      clients = (clientRes.results || []).map(c => ({
        id: c.id,
        title: c.company_name,
        subtitle: `${c.contact_name || ''} (${c.email || ''})`,
        type: 'client',
        targetTab: 'clients'
      }));
    }

    // 2. Search Team Members
    let team = [];
    if (db) {
      const teamRes = await db.prepare(`
        SELECT id, name, role, email 
        FROM agency_team_members 
        WHERE name LIKE ? OR email LIKE ? OR role LIKE ?
        LIMIT 6
      `).bind(term, term, term).all().catch(() => ({ results: [] }));
      team = (teamRes.results || []).map(t => ({
        id: t.id,
        title: t.name,
        subtitle: `${t.role} • ${t.email}`,
        type: 'team',
        targetTab: 'team'
      }));
    }

    // 3. Search Sales Leads
    let leads = [];
    if (db) {
      const leadsRes = await db.prepare(`
        SELECT id, name, company, phone, stage 
        FROM sales_leads 
        WHERE name LIKE ? OR company LIKE ? OR phone LIKE ?
        LIMIT 6
      `).bind(term, term, term).all().catch(() => ({ results: [] }));
      leads = (leadsRes.results || []).map(l => ({
        id: l.id,
        title: l.name,
        subtitle: `${l.company || 'شركة'} • المرحلة: ${l.stage || 'جديد'}`,
        type: 'lead',
        targetTab: 'sales'
      }));
    }

    // 4. Search Projects (from projects table in db2d / db)
    let projects = [];
    const projDb = db2d || db;
    if (projDb) {
      const projRes = await projDb.prepare(`
        SELECT id, name, key, client_name 
        FROM projects 
        WHERE name LIKE ? OR key LIKE ? OR client_name LIKE ?
        LIMIT 6
      `).bind(term, term, term).all().catch(() => ({ results: [] }));
      projects = (projRes.results || []).map(p => ({
        id: p.id,
        title: p.name,
        subtitle: `كود: ${p.key} • العميل: ${p.client_name || 'PR Agency'}`,
        type: 'project',
        targetTab: 'profitability'
      }));
    }

    return jsonResponse({
      success: true,
      query: q,
      totalCount: clients.length + team.length + leads.length + projects.length,
      results: { clients, team, leads, projects }
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
