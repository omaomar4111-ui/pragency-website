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
    return new Response('Unauthorized Access to Portfolio Admin', {
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
  <title>PR Agency — إدارة معرض الأعمال</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
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
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-titles h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #fff;
    }
    .nav-links {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .btn {
      background: var(--purple);
      color: #fff;
      border: none;
      padding: 9px 18px;
      border-radius: 8px;
      font-family: inherit;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn:hover { background: #7c3aed; }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--card-border);
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }
    .btn-danger { background: #ef4444; }
    .btn-danger:hover { background: #dc2626; }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .tab-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 10px 24px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: var(--purple);
      color: #fff;
      border-color: var(--purple);
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    /* Tables */
    .table-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow-x: auto;
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
    }
    th, td {
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    th {
      background: rgba(139, 92, 246, 0.1);
      color: var(--purple-light);
      font-weight: 700;
    }
    tr:hover { background: rgba(255, 255, 255, 0.02); }
    .brand-thumb {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      object-fit: cover;
      background: rgba(255, 255, 255, 0.05);
    }

    /* Designs Grid */
    .designs-admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }
    .design-admin-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .design-admin-card img {
      width: 100%;
      height: 160px;
      object-fit: cover;
    }
    .design-admin-body {
      padding: 14px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .design-admin-body h4 {
      font-size: 1rem;
      margin-bottom: 6px;
    }
    .design-admin-body p {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-bottom: 12px;
      flex: 1;
    }
    .card-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    /* Modal Form */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      opacity: 0;
      visibility: hidden;
      transition: all 0.25s;
    }
    .modal-backdrop.open {
      opacity: 1;
      visibility: visible;
    }
    .modal-box {
      background: #14001F;
      border: 1px solid var(--purple);
      border-radius: 18px;
      max-width: 550px;
      width: 100%;
      padding: 24px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .form-group {
      margin-bottom: 14px;
    }
    .form-group label {
      display: block;
      font-size: 0.88rem;
      font-weight: 700;
      margin-bottom: 6px;
      color: var(--purple-light);
    }
    .form-control {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-family: inherit;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--purple);
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .form-row .form-group { flex: 1; }
  </style>
</head>
<body>

<div class="admin-container">
  <header>
    <div class="header-titles">
      <h1>🎨 إدارة معرض الأعمال (Portfolio CMS)</h1>
      <p style="color:var(--text-muted);font-size:0.9rem">إدارة البراندات وتصاميم الهوية والمحتوى مع رفع الصور على Cloudflare R2</p>
    </div>
    <div class="nav-links">
      <a href="/portfolio" target="_blank" class="btn btn-secondary">🌐 عرض المعرض العام</a>
      <a href="/admin" class="btn btn-secondary">📊 لوحة التحكم</a>
    </div>
  </header>

  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab('brands')">🏷️ البراندات (Brands)</button>
    <button class="tab-btn" onclick="switchTab('designs')">🖼️ التصاميم (Designs)</button>
  </div>

  <!-- BRANDS TAB -->
  <div id="tab-brands" class="tab-content active">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3>قائمة البراندات</h3>
      <button class="btn" onclick="openBrandModal()">+ إضافة براند جديد</button>
    </div>
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>الشعار</th>
            <th>الاسم (عربي)</th>
            <th>Slug</th>
            <th>القسم</th>
            <th>عدد التصاميم</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody id="brands-table-body">
          <tr><td colspan="7" style="text-align:center">جارٍ التحميل...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- DESIGNS TAB -->
  <div id="tab-designs" class="tab-content">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:10px">
        <h3>التصاميم</h3>
        <select id="filter-design-brand" class="form-control" style="width:200px" onchange="loadDesigns()">
          <option value="">كل البراندات</option>
        </select>
      </div>
      <button class="btn" onclick="openDesignModal()">+ إضافة تصميم جديد</button>
    </div>
    <div id="designs-grid-container" class="designs-admin-grid">
      <div style="grid-column:1/-1;text-align:center">جارٍ التحميل...</div>
    </div>
  </div>
</div>

<!-- BRAND MODAL -->
<div id="brand-modal" class="modal-backdrop">
  <div class="modal-box">
    <div class="modal-header">
      <h3 id="brand-modal-title">إضافة براند</h3>
      <button onclick="closeModal('brand-modal')" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer">×</button>
    </div>
    <form id="brand-form" onsubmit="saveBrand(event)">
      <input type="hidden" id="brand-id"/>
      <div class="form-group">
        <label>اسم البراند بالعربي *</label>
        <input type="text" id="brand-name-ar" class="form-control" required/>
      </div>
      <div class="form-group">
        <label>اسم البراند بالإنجليزي</label>
        <input type="text" id="brand-name-en" class="form-control"/>
      </div>
      <div class="form-group">
        <label>الـ Slug (رابط مختصر بالإنجليزية) *</label>
        <input type="text" id="brand-slug" class="form-control" placeholder="e.g. island-gym" required/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>القسم</label>
          <select id="brand-category" class="form-control">
            <option value="social_media">سوشيال ميديا</option>
            <option value="branding">هوية بصرية</option>
            <option value="ads">إعلانات</option>
            <option value="video">فيديو</option>
            <option value="other">أخرى</option>
          </select>
        </div>
        <div class="form-group">
          <label>الترتيب</label>
          <input type="number" id="brand-order" class="form-control" value="0"/>
        </div>
      </div>
      <div class="form-group">
        <label>شعار البراند (رفع ملف إلى R2 أو رابط)</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="brand-logo-url" class="form-control" placeholder="/assets/..."/>
          <input type="file" id="brand-logo-file" style="display:none" onchange="uploadLogoFile(this)"/>
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('brand-logo-file').click()">رفع</button>
        </div>
      </div>
      <div class="form-group">
        <label>الوصف بالعربي</label>
        <textarea id="brand-desc-ar" class="form-control" rows="2"></textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
        <button type="button" class="btn btn-secondary" onclick="closeModal('brand-modal')">إلغاء</button>
        <button type="submit" class="btn">حفظ البراند</button>
      </div>
    </form>
  </div>
</div>

<!-- DESIGN MODAL -->
<div id="design-modal" class="modal-backdrop">
  <div class="modal-box">
    <div class="modal-header">
      <h3 id="design-modal-title">إضافة تصميم</h3>
      <button onclick="closeModal('design-modal')" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer">×</button>
    </div>
    <form id="design-form" onsubmit="saveDesign(event)">
      <input type="hidden" id="design-id"/>
      <input type="hidden" id="design-r2-key"/>
      <div class="form-group">
        <label>اختر البراند *</label>
        <select id="design-brand-id" class="form-control" required></select>
      </div>
      <div class="form-group">
        <label>عنوان التصميم بالعربي</label>
        <input type="text" id="design-title-ar" class="form-control"/>
      </div>
      <div class="form-group">
        <label>عنوان التصميم بالإنجليزي</label>
        <input type="text" id="design-title-en" class="form-control"/>
      </div>
      <div class="form-group">
        <label>صورة التصميم (رفع ملف إلى R2 أو رابط صورة) *</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="design-image-url" class="form-control" placeholder="/assets/... أو رابط R2" required/>
          <input type="file" id="design-image-file" style="display:none" onchange="uploadDesignFile(this)"/>
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('design-image-file').click()">رفع ملف</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>نوع التصميم</label>
          <select id="design-type" class="form-control">
            <option value="social_media">سوشيال ميديا</option>
            <option value="branding">هوية بصرية</option>
            <option value="ads">إعلانات</option>
            <option value="video">فيديو</option>
            <option value="other">أخرى</option>
          </select>
        </div>
        <div class="form-group">
          <label>الترتيب</label>
          <input type="number" id="design-order" class="form-control" value="0"/>
        </div>
      </div>
      <div class="form-group">
        <label>الوصف بالعربي</label>
        <textarea id="design-desc-ar" class="form-control" rows="2"></textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
        <button type="button" class="btn btn-secondary" onclick="closeModal('design-modal')">إلغاء</button>
        <button type="submit" class="btn">حفظ التصميم</button>
      </div>
    </form>
  </div>
</div>

<script>
let brandsList = [];

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  if (tab === 'brands') {
    document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
    document.getElementById('tab-brands').classList.add('active');
    loadBrands();
  } else {
    document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
    document.getElementById('tab-designs').classList.add('active');
    loadDesigns();
  }
}

async function loadBrands() {
  const tbody = document.getElementById('brands-table-body');
  try {
    const res = await fetch('/api/admin/portfolio/brands');
    brandsList = await res.json();
    
    // Update filter dropdowns
    const brandSelect = document.getElementById('filter-design-brand');
    const modalSelect = document.getElementById('design-brand-id');
    brandSelect.innerHTML = '<option value="">كل البراندات</option>' + brandsList.map(b => '<option value="' + b.slug + '">' + b.name_ar + '</option>').join('');
    modalSelect.innerHTML = brandsList.map(b => '<option value="' + b.id + '">' + b.name_ar + '</option>').join('');

    if (brandsList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">لا توجد براندات مضافة.</td></tr>';
      return;
    }

    tbody.innerHTML = brandsList.map(b => '<tr>' +
      '<td><img src="' + (b.logo_url || '/assets/logos/pr-agency.webp') + '" class="brand-thumb"/></td>' +
      '<td><strong>' + b.name_ar + '</strong></td>' +
      '<td><code>' + b.slug + '</code></td>' +
      '<td>' + (b.category || '-') + '</td>' +
      '<td>' + (b.design_count || 0) + '</td>' +
      '<td>' + (b.is_published ? '✅ منشور' : '❌ مسودة') + '</td>' +
      '<td>' +
        '<button class="btn btn-secondary" style="padding:4px 8px;font-size:0.8rem;margin-left:6px" onclick="editBrand(' + b.id + ')">تعديل</button>' +
        '<button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem" onclick="deleteBrand(' + b.id + ')">حذف</button>' +
      '</td>' +
    '</tr>').join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red">فشل تحميل البراندات</td></tr>';
  }
}

async function loadDesigns() {
  const container = document.getElementById('designs-grid-container');
  const brandSlug = document.getElementById('filter-design-brand').value;
  try {
    const url = '/api/admin/portfolio/designs' + (brandSlug ? '?brand=' + brandSlug : '');
    const res = await fetch(url);
    const designs = await res.json();

    if (designs.length === 0) {
      container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px">لا توجد تصاميم.</div>';
      return;
    }

    container.innerHTML = designs.map(d => '<div class="design-admin-card">' +
      '<img src="' + (d.thumbnail_url || d.image_url) + '"/>' +
      '<div class="design-admin-body">' +
        '<h4>' + (d.title_ar || 'تصميم') + '</h4>' +
        '<p>' + (d.brand_name_ar ? 'البراند: ' + d.brand_name_ar : '') + '</p>' +
        '<div class="card-actions">' +
          '<button class="btn btn-secondary" style="padding:4px 8px;font-size:0.8rem" onclick="editDesign(' + d.id + ')">تعديل</button>' +
          '<button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem" onclick="deleteDesign(' + d.id + ')">حذف</button>' +
        '</div>' +
      '</div>' +
    '</div>').join('');
  } catch(e) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:red">فشل تحميل التصاميم</div>';
  }
}

function openBrandModal() {
  document.getElementById('brand-form').reset();
  document.getElementById('brand-id').value = '';
  document.getElementById('brand-modal-title').textContent = 'إضافة براند جديد';
  document.getElementById('brand-modal').classList.add('open');
}

function openDesignModal() {
  document.getElementById('design-form').reset();
  document.getElementById('design-id').value = '';
  document.getElementById('design-r2-key').value = '';
  document.getElementById('design-modal-title').textContent = 'إضافة تصميم جديد';
  document.getElementById('design-modal').classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

async function uploadLogoFile(input) {
  if (!input.files[0]) return;
  const fd = new FormData();
  fd.append('file', input.files[0]);
  try {
    const res = await fetch('/api/admin/portfolio/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      document.getElementById('brand-logo-url').value = data.url;
      alert('تم رفع الشعار بنجاح إلى R2!');
    } else {
      alert(data.error || 'فشل الرفع');
    }
  } catch(e) { alert('خطأ أثناء الرفع: ' + e.message); }
}

async function uploadDesignFile(input) {
  if (!input.files[0]) return;
  const fd = new FormData();
  fd.append('file', input.files[0]);
  try {
    const res = await fetch('/api/admin/portfolio/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      document.getElementById('design-image-url').value = data.url;
      document.getElementById('design-r2-key').value = data.key;
      alert('تم رفع التصميم بنجاح إلى R2!');
    } else {
      alert(data.error || 'فشل الرفع');
    }
  } catch(e) { alert('خطأ أثناء الرفع: ' + e.message); }
}

async function saveBrand(e) {
  e.preventDefault();
  const id = document.getElementById('brand-id').value;
  const payload = {
    name_ar: document.getElementById('brand-name-ar').value,
    name_en: document.getElementById('brand-name-en').value,
    slug: document.getElementById('brand-slug').value,
    category: document.getElementById('brand-category').value,
    display_order: document.getElementById('brand-order').value,
    logo_url: document.getElementById('brand-logo-url').value,
    description_ar: document.getElementById('brand-desc-ar').value
  };

  const method = id ? 'PUT' : 'POST';
  if (id) payload.id = id;

  const res = await fetch('/api/admin/portfolio/brands', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal('brand-modal');
    loadBrands();
  } else {
    alert('حدث خطأ أثناء حفظ البراند');
  }
}

async function saveDesign(e) {
  e.preventDefault();
  const id = document.getElementById('design-id').value;
  const payload = {
    brand_id: document.getElementById('design-brand-id').value,
    title_ar: document.getElementById('design-title-ar').value,
    title_en: document.getElementById('design-title-en').value,
    image_url: document.getElementById('design-image-url').value,
    r2_key: document.getElementById('design-r2-key').value,
    design_type: document.getElementById('design-type').value,
    display_order: document.getElementById('design-order').value,
    description_ar: document.getElementById('design-desc-ar').value
  };

  const method = id ? 'PUT' : 'POST';
  if (id) payload.id = id;

  const res = await fetch('/api/admin/portfolio/designs', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal('design-modal');
    loadDesigns();
  } else {
    alert('حدث خطأ أثناء حفظ التصميم');
  }
}

async function deleteBrand(id) {
  if (!confirm('هل أنت متأكد من حذف هذا البراند وكل تصاميمه؟')) return;
  await fetch('/api/admin/portfolio/brands?id=' + id, { method: 'DELETE' });
  loadBrands();
}

async function deleteDesign(id) {
  if (!confirm('هل أنت متأكد من حذف هذا التصميم؟')) return;
  await fetch('/api/admin/portfolio/designs?id=' + id, { method: 'DELETE' });
  loadDesigns();
}

// Initial load
loadBrands();
</script>

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
