function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Basic ')) return false;
  try {
    const base64 = authHeader.slice(6).trim();
    const decoded = atob(base64);
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return false;
    return decoded.slice(colonIdx + 1) === PASS;
  } catch (e) {
    return false;
  }
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    // 1. Total counts & summary stats
    const totalStmt = env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN COALESCE(status, 'new') = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN COALESCE(status, 'new') = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
        SUM(CASE WHEN COALESCE(status, 'new') = 'closed' THEN 1 ELSE 0 END) as closed_count,
        SUM(CASE WHEN COALESCE(starred, 0) = 1 THEN 1 ELSE 0 END) as starred_count
      FROM contacts
    `);

    // 2. Last 7 days breakdown
    const sevenDaysStmt = env.DB.prepare(`
      SELECT 
        DATE(created_at) as day, 
        COUNT(*) as count 
      FROM contacts 
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);

    // 3. Top UTM campaigns
    const campaignsStmt = env.DB.prepare(`
      SELECT 
        COALESCE(NULLIF(utm_campaign, ''), 'Direct / None') as campaign,
        COUNT(*) as count
      FROM contacts
      GROUP BY campaign
      ORDER BY count DESC
      LIMIT 10
    `);

    // 4. Breakdown by Business / Service
    const businessStmt = env.DB.prepare(`
      SELECT 
        COALESCE(NULLIF(business, ''), 'Unspecified') as business,
        COUNT(*) as count
      FROM contacts
      GROUP BY business
      ORDER BY count DESC
      LIMIT 10
    `);

    // 5. Breakdown by Budget
    const budgetStmt = env.DB.prepare(`
      SELECT 
        COALESCE(NULLIF(budget, ''), 'Unspecified') as budget,
        COUNT(*) as count
      FROM contacts
      GROUP BY budget
      ORDER BY count DESC
      LIMIT 10
    `);

    // 6. Breakdown by Lead Source
    const sourceStmt = env.DB.prepare(`
      SELECT 
        COALESCE(NULLIF(lead_source, ''), 'website') as source,
        COUNT(*) as count
      FROM contacts
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `);

    const [totalsRes, sevenDaysRes, campaignsRes, businessRes, budgetRes, sourceRes] = await Promise.all([
      totalStmt.first().catch(() => ({ total: 0, new_count: 0, contacted_count: 0, closed_count: 0, starred_count: 0 })),
      sevenDaysStmt.all().catch(() => ({ results: [] })),
      campaignsStmt.all().catch(() => ({ results: [] })),
      businessStmt.all().catch(() => ({ results: [] })),
      budgetStmt.all().catch(() => ({ results: [] })),
      sourceStmt.all().catch(() => ({ results: [] }))
    ]);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        total: totalsRes?.total || 0,
        new: totalsRes?.new_count || 0,
        contacted: totalsRes?.contacted_count || 0,
        closed: totalsRes?.closed_count || 0,
        starred: totalsRes?.starred_count || 0
      },
      last7Days: sevenDaysRes.results || [],
      campaigns: campaignsRes.results || [],
      businessBreakdown: businessRes.results || [],
      budgetBreakdown: budgetRes.results || [],
      sourceBreakdown: sourceRes.results || []
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
