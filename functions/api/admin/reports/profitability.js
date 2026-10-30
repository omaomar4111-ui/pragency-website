// functions/api/admin/reports/profitability.js
// Retainer vs Cost calculation (hours × hourly_cost), sorted by lowest profit margin first.
// Only includes 'approved' hours in cost calculations!

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { request, env, data } = context;
  const user = data?.adminUser;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: Admin authentication required' }, 401);
  }

  const url = new URL(request.url);
  const filterMonth = url.searchParams.get('month'); // e.g. "2026-10" or "current", "last"
  const globalCostParam = parseFloat(url.searchParams.get('hourly_cost')) || 150;

  try {
    let dateFilter = '';
    const params = [];

    const now = new Date();
    let currentMonthStr = now.toISOString().slice(0, 7);
    let lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let lastMonthStr = lastMonthDate.toISOString().slice(0, 7);

    if (filterMonth === 'last') {
      dateFilter = ' AND strftime("%Y-%m", te.date) = ? ';
      params.push(lastMonthStr);
    } else if (filterMonth === 'current') {
      dateFilter = ' AND strftime("%Y-%m", te.date) = ? ';
      params.push(currentMonthStr);
    } else if (filterMonth && filterMonth.match(/^\d{4}-\d{2}$/)) {
      dateFilter = ' AND strftime("%Y-%m", te.date) = ? ';
      params.push(filterMonth);
    }

    const query = `
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.key as project_key,
        p.client_name,
        p.retainer_amount,
        COUNT(DISTINCT t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_tasks,
        SUM(CASE WHEN t.status != 'done' AND t.planned_date < DATE('now') THEN 1 ELSE 0 END) as overdue_tasks,
        COALESCE(SUM(CASE WHEN te.status != 'rejected' THEN te.hours ELSE 0 END), 0) as total_hours,
        COALESCE(SUM(CASE WHEN te.status != 'rejected' THEN te.hours * COALESCE(te.hourly_cost, ?) ELSE 0 END), 0) as total_cost
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN time_entries te ON t.id = te.task_id ${dateFilter}
      GROUP BY p.id
    `;

    const bindArgs = [globalCostParam, ...params];
    const { results } = await env.DB.prepare(query).bind(...bindArgs).all();

    const report = (results || []).map(row => {
      const retainer = parseFloat(row.retainer_amount) || 0;
      const cost = parseFloat(row.total_cost) || 0;
      const netProfit = retainer - cost;
      const margin = retainer > 0 ? Math.round((netProfit / retainer) * 100) : (cost > 0 ? -100 : 0);
      const totalTasks = row.total_tasks || 0;
      const overdueTasks = row.overdue_tasks || 0;
      const delayRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;

      return {
        project_id: row.project_id,
        project_name: row.project_name,
        project_key: row.project_key,
        client_name: row.client_name || 'Direct Client',
        retainer_amount: retainer,
        total_hours: Math.round(row.total_hours * 10) / 10,
        total_cost: Math.round(cost),
        net_profit: Math.round(netProfit),
        margin_percent: margin,
        total_tasks: totalTasks,
        overdue_tasks: overdueTasks,
        delay_rate_percent: delayRate,
        health_status: margin < 0 ? 'critical' : (margin < 25 ? 'warning' : 'healthy')
      };
    });

    report.sort((a, b) => a.margin_percent - b.margin_percent);

    return jsonResponse({
      success: true,
      period: filterMonth || 'all_time',
      default_hourly_rate: globalCostParam,
      data: report
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
