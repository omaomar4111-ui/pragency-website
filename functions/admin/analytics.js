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

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return new Response('Unauthorized Access to Analytics', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="PR Agency Analytics", charset="UTF-8"',
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  const db = env.ANALYTICS_DB || env.DB;
  if (!db) {
    return new Response('Database not bound', { status: 500 });
  }

  try {
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PR Agency — لوحة تحليلات متقدمة (Advanced Analytics)</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg: #0A0014;
      --card-bg: #14001F;
      --card-border: rgba(139, 92, 246, 0.2);
      --purple: #8B5CF6;
      --purple-light: #A78BFA;
      --text: #ffffff;
      --text-muted: rgba(255, 255, 255, 0.65);
      --font: 'Cairo', system-ui, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      padding: 30px 20px;
      min-height: 100vh;
    }
    .container { max-width: 1280px; margin: 0 auto; }
    header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px; flex-wrap: gap: 16px;
    }
    h1 { font-size: 26px; font-weight: 900; color: #fff; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .back-btn {
      padding: 8px 18px; border-radius: 8px; background: rgba(139, 92, 246, 0.15);
      color: #A78BFA; text-decoration: none; font-weight: 700; font-size: 14px;
      border: 1px solid rgba(139, 92, 246, 0.3); transition: all 0.2s;
    }
    .back-btn:hover { background: rgba(139, 92, 246, 0.3); color: #fff; }

    /* Date Filter Controls */
    .filter-bar {
      display: flex; gap: 8px; background: var(--card-bg);
      border: 1px solid var(--card-border); padding: 6px; border-radius: 12px;
      margin-bottom: 24px; align-items: center; width: fit-content;
    }
    .filter-btn {
      background: none; border: none; color: var(--text-muted);
      padding: 8px 16px; border-radius: 8px; font-family: var(--font);
      font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s;
    }
    .filter-btn.active, .filter-btn:hover {
      background: var(--purple); color: #fff;
    }

    /* Charts Grid */
    .charts-grid {
      display: grid; grid-template-columns: 2fr 1fr; gap: 20px;
      margin-bottom: 30px;
    }
    @media (max-width: 900px) {
      .charts-grid { grid-template-columns: 1fr; }
    }
    .chart-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 16px; padding: 22px; position: relative;
    }
    .chart-title {
      font-size: 16px; font-weight: 800; color: #E9D5FF; margin-bottom: 16px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .chart-container { position: relative; width: 100%; height: 280px; }

    /* Tables */
    .section-title { font-size: 18px; font-weight: 800; margin: 30px 0 16px; color: #E9D5FF; }
    .table-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 16px; overflow-x: auto; margin-bottom: 24px;
    }
    table { width: 100%; border-collapse: collapse; text-align: right; font-size: 14px; }
    th { background: rgba(139, 92, 246, 0.1); padding: 14px 18px; color: #A78BFA; font-weight: 700; }
    td { padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: var(--text-muted); }
    tr:hover td { background: rgba(139, 92, 246, 0.04); color: #fff; }
    .badge {
      display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
    }
    .badge-lead { background: rgba(16, 185, 129, 0.2); color: #34D399; }
    .badge-session { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .loading-state { text-align: center; padding: 40px; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>📈 لوحة التحليلات المتقدمة (Advanced Analytics)</h1>
        <p style="color:var(--text-muted);font-size:13px;margin-top:4px;">متابعة أداء الزوار والصفحات، والبلدان، وتفاعل العملاء المحتملين لحظياً</p>
      </div>
      <div class="header-actions">
        <a href="/admin" class="back-btn">لوحة التحكم الرئيسية ←</a>
      </div>
    </header>

    <!-- Date Filter -->
    <div class="filter-bar">
      <button class="filter-btn" data-range="today">اليوم</button>
      <button class="filter-btn" data-range="7d">آخر 7 أيام</button>
      <button class="filter-btn active" data-range="30d">آخر 30 يوم</button>
      <button class="filter-btn" data-range="all">الكل</button>
    </div>

    <!-- Charts Row 1: Line Chart (Visitors/Day) & Doughnut (Countries) -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">
          <span>📉 الزوار يومياً (Visitors per Day)</span>
          <span style="font-size:12px;color:var(--text-muted);" id="visitorsCountBadge">جاري التحميل...</span>
        </div>
        <div class="chart-container">
          <canvas id="visitorsLineChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">
          <span>🌍 أعلى البلدان (Top Countries)</span>
        </div>
        <div class="chart-container">
          <canvas id="countriesDoughnutChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Charts Row 2: Bar Chart (Top Pages) -->
    <div class="chart-card" style="margin-bottom: 30px;">
      <div class="chart-title">
        <span>📄 أعلى 5 صفحات زيارة (Top 5 Pages)</span>
      </div>
      <div class="chart-container">
        <canvas id="pagesBarChart"></canvas>
      </div>
    </div>

    <!-- Table 1: Recent Leads -->
    <div class="section-title">💼 أحدث طلبات العملاء (Recent Leads)</div>
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الهاتف</th>
            <th>المصدر</th>
            <th>الرسالة / التفاصيل</th>
            <th>التاريخ</th>
          </tr>
        </thead>
        <tbody id="leadsTableBody">
          <tr><td colspan="5" class="loading-state">جاري تحميل البيانات...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Table 2: Recent Sessions -->
    <div class="section-title">💬 أحدث جلسات التصفح والمساعد الذكي (Recent Sessions)</div>
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>معرف الجلسة / الزائر</th>
            <th>الموقع الجغرافي</th>
            <th>صفحة الدخول</th>
            <th>المشاهدات</th>
            <th>التوقيت</th>
          </tr>
        </thead>
        <tbody id="sessionsTableBody">
          <tr><td colspan="5" class="loading-state">جاري تحميل البيانات...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    let rawData = null;
    let lineChart = null;
    let barChart = null;
    let doughnutChart = null;

    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics-charts');
        if (!res.ok) throw new Error('Failed to load API');
        rawData = await res.json();
        renderAll('30d');
      } catch (err) {
        console.error(err);
        document.getElementById('leadsTableBody').innerHTML = '<tr><td colspan="5" style="color:#ef4444;text-align:center;">تعذر تحميل البيانات</td></tr>';
      }
    }

    function filterByDate(list, dateField, range) {
      if (!list || !Array.isArray(list)) return [];
      if (range === 'all') return list;
      const now = new Date();
      let cutoff = new Date();
      if (range === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (range === '7d') {
        cutoff.setDate(now.getDate() - 7);
      } else if (range === '30d') {
        cutoff.setDate(now.getDate() - 30);
      }
      return list.filter(item => {
        const d = new Date(item[dateField]);
        return d >= cutoff;
      });
    }

    function renderAll(range) {
      if (!rawData) return;

      // 1. Visitors Line Chart
      const filteredVisitors = filterByDate(rawData.visitors_per_day || [], 'date', range);
      const dates = filteredVisitors.map(v => v.date);
      const counts = filteredVisitors.map(v => v.visitors);
      const totalV = counts.reduce((a, b) => a + b, 0);
      document.getElementById('visitorsCountBadge').textContent = 'إجمالي: ' + totalV + ' زائر';

      const lineCtx = document.getElementById('visitorsLineChart').getContext('2d');
      if (lineChart) lineChart.destroy();
      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: dates.length ? dates : ['لا توجد بيانات'],
          datasets: [{
            label: 'الزوار الفريدين',
            data: counts.length ? counts : [0],
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#C084FC',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.6)' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.6)', stepSize: 1 }, beginAtZero: true }
          }
        }
      });

      // 2. Top Pages Bar Chart
      const top5Pages = (rawData.top_pages || []).slice(0, 5);
      const barCtx = document.getElementById('pagesBarChart').getContext('2d');
      if (barChart) barChart.destroy();
      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: top5Pages.map(p => p.page),
          datasets: [{
            label: 'المشاهدات',
            data: top5Pages.map(p => p.views),
            backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.8)' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.6)', stepSize: 1 }, beginAtZero: true }
          }
        }
      });

      // 3. Top Countries Doughnut Chart
      const countries = (rawData.top_countries || []).slice(0, 5);
      const doughnutCtx = document.getElementById('countriesDoughnutChart').getContext('2d');
      if (doughnutChart) doughnutChart.destroy();
      doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
          labels: countries.map(c => c.country),
          datasets: [{
            data: countries.map(c => c.count),
            backgroundColor: ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.8)', boxWidth: 12 } }
          }
        }
      });

      // 4. Recent Leads Table
      const filteredLeads = filterByDate(rawData.recent_leads || [], 'created_at', range);
      const leadsBody = document.getElementById('leadsTableBody');
      if (!filteredLeads.length) {
        leadsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;">لا توجد طلبات في هذه الفترة</td></tr>';
      } else {
        leadsBody.innerHTML = filteredLeads.map(l => `
          <tr>
            <td style="font-weight:700;color:#fff;">${l.name || 'عميل'}</td>
            <td><a href="tel:${l.phone || ''}" style="color:#A78BFA;text-decoration:none;">${l.phone || '-'}</a></td>
            <td><span class="badge badge-lead">${l.source || 'website'}</span></td>
            <td style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.message || '-'}</td>
            <td>${l.created_at ? new Date(l.created_at).toLocaleDateString('ar-EG') : '-'}</td>
          </tr>
        `).join('');
      }

      // 5. Recent Sessions Table
      const filteredSessions = filterByDate(rawData.recent_sessions || [], 'first_seen', range);
      const sessBody = document.getElementById('sessionsTableBody');
      if (!filteredSessions.length) {
        sessBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;">لا توجد جلسات مسجلة في هذه الفترة</td></tr>';
      } else {
        sessBody.innerHTML = filteredSessions.map(s => `
          <tr>
            <td><code>${(s.visitor_id || s.id || '').slice(0, 10)}</code></td>
            <td>${s.city ? s.city + '، ' : ''}${s.country || 'غير محدد'}</td>
            <td>${s.entry_page || '/'}</td>
            <td><span class="badge badge-session">${s.page_views || 1} صفحة</span></td>
            <td>${s.first_seen ? new Date(s.first_seen).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
          </tr>
        `).join('');
      }
    }

    // Filter Buttons Listener
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderAll(btn.dataset.range);
      });
    });

    fetchAnalytics();
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (err) {
    return new Response('Error loading analytics: ' + err.message, { status: 500 });
  }
}
