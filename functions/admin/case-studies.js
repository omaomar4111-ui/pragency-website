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
    return new Response('Unauthorized Access to PR Agency Admin', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PR Agency — إدارة قصص النجاح (Case Studies)</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg: #0A0014;
      --card-bg: #14001F;
      --card-border: rgba(139, 92, 246, 0.15);
      --red: #8B5CF6;
      --text: #ffffff;
      --text-muted: rgba(255, 255, 255, 0.65);
      --green: #10b981;
      --font: 'Cairo', system-ui, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      padding: 24px;
      direction: rtl;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-links a {
      color: #A78BFA;
      text-decoration: none;
      font-weight: 700;
      margin-left: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 28px;
    }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
    }
    h2 { font-size: 1.25rem; font-weight: 800; margin-bottom: 18px; color: #fff; }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    input, select, textarea {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-family: var(--font);
      font-size: 0.9rem;
      outline: none;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--red);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      font-family: var(--font);
      font-weight: 800;
      cursor: pointer;
      font-size: 0.95rem;
    }
    .btn-primary { background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: #fff; }
    .btn-danger { background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 6px 12px; font-size: 0.8rem; }
    .btn-edit { background: rgba(139, 92, 246, 0.2); color: #C4B5FD; border: 1px solid rgba(139, 92, 246, 0.4); padding: 6px 12px; font-size: 0.8rem; }
    .list-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .list-item-title { font-weight: 800; font-size: 1rem; color: #fff; }
    .list-item-sub { font-size: 0.8rem; color: var(--text-muted); }
  </style>
</head>
<body>

<div class="header">
  <div>
    <h1 style="font-size:1.6rem;font-weight:900;">PR Agency — إدارة قصص النجاح (Case Studies)</h1>
    <p style="color:var(--text-muted);font-size:0.9rem;">إنشاء وتعديل ونشر دراسات الحالة على موقع الإنتاج</p>
  </div>
  <div class="header-links">
    <a href="/admin">← لوحة الرسائل</a>
    <a href="/case-studies" target="_blank">🌐 استعراض الصفحة العامة</a>
  </div>
</div>

<div class="grid">
  <!-- Form to Add/Edit -->
  <div class="card">
    <h2 id="formTitle">إضافة قصة نجاح جديدة</h2>
    <form id="csForm">
      <input type="hidden" id="csId" name="id" />

      <div class="form-group">
        <label>اسم العميل بالعربي *</label>
        <input type="text" id="clientName" name="client_name" required placeholder="مثال: عيادات NH" />
      </div>

      <div class="form-group">
        <label>اسم العميل بالإنجليزي</label>
        <input type="text" id="clientNameEn" name="client_name_en" placeholder="e.g. NH Clinics" />
      </div>

      <div class="form-group">
        <label>الرابط التعريفي (Slug) *</label>
        <input type="text" id="slug" name="slug" required placeholder="nh-clinics" dir="ltr" />
      </div>

      <div class="form-group">
        <label>مسار شعار العميل (Logo URL)</label>
        <input type="text" id="clientLogo" name="client_logo" placeholder="assets/logos/clients/client-05-nh-clinics.webp" dir="ltr" />
      </div>

      <div class="form-group">
        <label>نوع الخدمة</label>
        <select id="serviceType" name="service_type">
          <option value="Social Media">إدارة السوشيال ميديا (Social Media)</option>
          <option value="Media Buying">الإعلانات الممولة (Media Buying)</option>
          <option value="Video Production">الإنتاج والتصوير (Video Production)</option>
          <option value="Branding">الهوية البصرية (Branding)</option>
          <option value="Strategy">استراتيجية التسويق (Strategy)</option>
        </select>
      </div>

      <div class="form-group">
        <label>التحدي (بالعربي) *</label>
        <textarea id="challengeAr" name="challenge_ar" rows="2" required placeholder="المشكلة أو التحدي الذي واجهه العميل..."></textarea>
      </div>

      <div class="form-group">
        <label>الحل (بالعربي) *</label>
        <textarea id="solutionAr" name="solution_ar" rows="2" required placeholder="ما الذي قمنا بتنفيذه لمعالجة التحدي..."></textarea>
      </div>

      <div class="form-group">
        <label>النتائج المحققة (بالعربي) *</label>
        <textarea id="resultsAr" name="results_ar" rows="2" required placeholder="الأرقام والنمو المحقق..."></textarea>
      </div>

      <div class="form-group">
        <label>مؤشرات الأرقام (Metrics JSON)</label>
        <input type="text" id="metricsJson" name="metrics_json" dir="ltr" value='[{"label":"الحجوزات","value":"+250%"},{"label":"التفاعل","value":"+180%"}]' />
      </div>

      <div class="form-group">
        <label>شهادة أو رأي العميل</label>
        <textarea id="testimonialAr" name="testimonial_ar" rows="2" placeholder="رأي العميل في التعاون معنا..."></textarea>
      </div>

      <div class="form-group">
        <label>اسم صاحب الشهادة وصفته</label>
        <input type="text" id="testimonialAuthor" name="testimonial_author" placeholder="د. أحمد منصور — المدير التنفيذي" />
      </div>

      <div class="form-group" style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="isPublished" name="is_published" checked style="width:20px;height:20px;accent-color:var(--red);" />
        <label for="isPublished" style="margin:0;cursor:pointer;">نشر القصة فوراً (Published)</label>
      </div>

      <div style="display:flex;gap:10px;margin-top:20px;">
        <button type="submit" class="btn btn-primary" id="saveBtn">حفظ القصة 💾</button>
        <button type="button" class="btn" style="background:#333;color:#fff;" onclick="resetForm()">إلغاء</button>
      </div>
    </form>
  </div>

  <!-- Existing List -->
  <div class="card">
    <h2>قصص النجاح الحالية المسجلة</h2>
    <div id="caseList">جاري التحميل...</div>
  </div>
</div>

<script>
  async function loadStudies() {
    const list = document.getElementById('caseList');
    try {
      const res = await fetch('/api/admin/case-studies');
      const data = await res.json();
      list.innerHTML = '';
      if (!Array.isArray(data) || data.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);">لا توجد قصص نجاح مسجلة حتى الآن.</p>';
        return;
      }
      data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = \`
          <div>
            <div class="list-item-title">\${item.client_name} (\${item.slug})</div>
            <div class="list-item-sub">\${item.service_type || 'Marketing'} • \${item.is_published ? '🟢 منشور' : '⚪ مسودة'}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <a href="/case-studies/\${item.slug}" target="_blank" class="btn btn-edit" style="text-decoration:none;">عرض</a>
            <button class="btn btn-edit" onclick='editStudy(\${JSON.stringify(item)})'>تعديل</button>
            <button class="btn btn-danger" onclick="deleteStudy(\${item.id})">حذف</button>
          </div>
        \`;
        list.appendChild(div);
      });
    } catch (err) {
      list.innerHTML = '<p style="color:#EF4444;">حدث خطأ في تحميل البيانات.</p>';
    }
  }

  function editStudy(item) {
    document.getElementById('formTitle').textContent = 'تعديل: ' + item.client_name;
    document.getElementById('csId').value = item.id;
    document.getElementById('clientName').value = item.client_name;
    document.getElementById('clientNameEn').value = item.client_name_en || '';
    document.getElementById('slug').value = item.slug;
    document.getElementById('clientLogo').value = item.client_logo || '';
    document.getElementById('serviceType').value = item.service_type || 'Social Media';
    document.getElementById('challengeAr').value = item.challenge_ar || '';
    document.getElementById('solutionAr').value = item.solution_ar || '';
    document.getElementById('resultsAr').value = item.results_ar || '';
    document.getElementById('metricsJson').value = item.metrics_json || '[]';
    document.getElementById('testimonialAr').value = item.testimonial_ar || '';
    document.getElementById('testimonialAuthor').value = item.testimonial_author || '';
    document.getElementById('isPublished').checked = !!item.is_published;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    document.getElementById('formTitle').textContent = 'إضافة قصة نجاح جديدة';
    document.getElementById('csForm').reset();
    document.getElementById('csId').value = '';
  }

  async function deleteStudy(id) {
    if (!confirm('هل أنت متأكد من حذف قصة النجاح هذه؟')) return;
    const res = await fetch('/api/admin/case-studies?id=' + id, { method: 'DELETE' });
    if (res.ok) {
      loadStudies();
    } else {
      alert('فشل الحذف');
    }
  }

  document.getElementById('csForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('csId').value;
    const payload = {
      id: id ? parseInt(id) : undefined,
      client_name: document.getElementById('clientName').value,
      client_name_en: document.getElementById('clientNameEn').value,
      slug: document.getElementById('slug').value,
      client_logo: document.getElementById('clientLogo').value,
      service_type: document.getElementById('serviceType').value,
      challenge_ar: document.getElementById('challengeAr').value,
      solution_ar: document.getElementById('solutionAr').value,
      results_ar: document.getElementById('resultsAr').value,
      metrics_json: document.getElementById('metricsJson').value,
      testimonial_ar: document.getElementById('testimonialAr').value,
      testimonial_author: document.getElementById('testimonialAuthor').value,
      is_published: document.getElementById('isPublished').checked ? 1 : 0
    };

    const method = id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/case-studies', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('تم حفظ قصة النجاح بنجاح!');
      resetForm();
      loadStudies();
    } else {
      const err = await res.json();
      alert('خطأ: ' + (err.error || 'فشل الحفظ'));
    }
  });

  loadStudies();
</script>

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
