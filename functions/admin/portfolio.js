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
  <title>PR Agency — إدارة معرض الأعمال والتصاميم</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg: #0A0014;
      --card-bg: #14001F;
      --card-border: rgba(139, 92, 246, 0.2);
      --purple: #8B5CF6;
      --purple-light: #A78BFA;
      --green: #22c55e;
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
      max-width: 1300px;
      margin: 0 auto;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
    }
    .header-titles h1 {
      font-size: 1.8rem;
      font-weight: 900;
      color: #fff;
    }
    .nav-links {
      display: flex;
      gap: 10px;
    }
    .btn {
      background: var(--purple);
      color: #fff;
      border: none;
      padding: 9px 18px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn:hover { background: #7C3AED; }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); border: 1px solid var(--card-border); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }
    .btn-danger { background: #ef4444; }
    .btn-danger:hover { background: #dc2626; }
    .btn-success { background: #10b981; }
    .btn-success:hover { background: #059669; }

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

    /* Drop Zone */
    .drop-zone {
      border: 2px dashed rgba(139, 92, 246, 0.4);
      border-radius: 16px;
      padding: 32px 20px;
      text-align: center;
      background: rgba(139, 92, 246, 0.03);
      cursor: pointer;
      transition: all 0.25s ease;
      margin-bottom: 20px;
      position: relative;
    }
    .drop-zone:hover, .drop-zone.dragover, .drop-zone.drag-over {
      border-color: var(--purple);
      background: rgba(139, 92, 246, 0.1);
      transform: scale(1.005);
    }
    .drop-zone-icon {
      font-size: 2.4rem;
      margin-bottom: 10px;
      display: inline-block;
    }
    .drop-zone-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
    }
    .drop-zone-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
    }

    /* Modal Inline Designs Section */
    .brand-designs-section {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }
    .section-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
    }
    .section-hint {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 14px;
    }
    #brand-drop-zone {
      border: 2px dashed rgba(139, 92, 246, 0.45);
      border-radius: 14px;
      padding: 26px 16px;
      text-align: center;
      cursor: pointer;
      background: rgba(139, 92, 246, 0.04);
      transition: all 0.2s ease;
      margin-bottom: 16px;
    }
    #brand-drop-zone:hover, #brand-drop-zone.drag-over {
      border-color: var(--purple);
      background: rgba(139, 92, 246, 0.12);
    }
    #brand-designs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      max-height: 420px;
      overflow-y: auto;
      padding: 4px;
    }
    .design-thumb {
      position: relative;
      aspect-ratio: 1;
      border-radius: 10px;
      overflow: hidden;
      background: #1a0f2e;
      border: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .design-thumb img, .design-thumb video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .design-thumb .delete-btn {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.9);
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.85;
      transition: opacity 0.2s;
      z-index: 3;
    }
    .design-thumb:hover .delete-btn {
      opacity: 1;
    }
    .design-thumb .video-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0, 0, 0, 0.75);
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      z-index: 2;
    }
    .design-thumb-footer {
      position: relative;
      z-index: 2;
      background: linear-gradient(180deg, transparent 0%, rgba(10, 0, 20, 0.95) 100%);
      padding: 8px 6px 6px;
    }
    .design-thumb-title {
      background: transparent;
      border: 1px solid transparent;
      border-radius: 4px;
      color: #fff;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      width: 100%;
      padding: 2px 4px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .design-thumb-title:focus {
      background: rgba(0, 0, 0, 0.8);
      border-color: var(--purple);
      outline: none;
    }
    .design-thumb-uploading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      text-align: center;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--purple-light);
    }

    /* Preview Grid for Multi Upload */
    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 16px;
      margin-bottom: 20px;
    }
    .preview-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .preview-card img, .preview-card video {
      width: 100%;
      height: 140px;
      object-fit: cover;
      background: #0f0017;
    }
    .preview-card-body {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .preview-card-title-input {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 6px 8px;
      color: #fff;
      font-family: inherit;
      font-size: 0.8rem;
      width: 100%;
    }
    .preview-remove-btn {
      position: absolute;
      top: 6px;
      left: 6px;
      background: rgba(239, 68, 68, 0.85);
      color: #fff;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      z-index: 2;
    }

    /* Grid for Designs Tab */
    .designs-admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }
    .design-admin-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.2s;
    }
    .design-admin-card.selected {
      border-color: var(--purple-light);
      box-shadow: 0 0 16px rgba(139, 92, 246, 0.4);
    }
    .design-checkbox {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 20px;
      height: 20px;
      accent-color: var(--purple);
      cursor: pointer;
      z-index: 2;
    }
    .design-admin-card img, .design-admin-card video {
      width: 100%;
      height: 180px;
      object-fit: cover;
      background: #0f0017;
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .design-admin-body p {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-bottom: 12px;
      flex: 1;
    }
    .card-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    /* Modals */
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
      max-width: 760px;
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
      border-radius: 10px;
      padding: 10px 14px;
      color: #fff;
      font-family: inherit;
      font-size: 0.95rem;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--purple);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .toggle-switch {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    .toggle-switch input {
      accent-color: var(--purple);
      width: 20px;
      height: 20px;
    }
    .upload-progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      margin-top: 14px;
      overflow: hidden;
      display: none;
    }
    .upload-progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--purple), #10b981);
      transition: width 0.3s ease;
    }
    .badge-pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .badge-pub { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-draft { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
  </style>
</head>
<body>

<div class="admin-container">
  <header>
    <div class="header-titles">
      <h1>🎨 إدارة معرض الأعمال (Portfolio CMS)</h1>
      <p style="color:var(--text-muted);font-size:0.9rem">إدارة البراندات وتصاميم الهوية والمحتوى مع رفع الصور والفيديوهات على Cloudflare R2 والتحكم الكامل في النشر</p>
    </div>
    <div class="nav-links">
      <a href="/portfolio" target="_blank" class="btn btn-secondary">🌐 عرض المعرض العام</a>
      <a href="/admin" class="btn btn-secondary">📊 لوحة التحكم الرئيسية</a>
    </div>
  </header>

  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab('brands')">🏷️ البراندات والعملاء (Clients / Brands)</button>
    <button class="tab-btn" onclick="switchTab('designs')">🖼️ التصاميم والأعمال (Designs)</button>
  </div>

  <!-- 1. BRANDS TAB -->
  <div id="tab-brands" class="tab-content active">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <h3>قائمة البراندات والعملاء</h3>
      <button class="btn" onclick="openBrandModal()">+ إضافة براند / عميل جديد</button>
    </div>
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>الشعار</th>
            <th>الاسم (عربي / إنجليزي)</th>
            <th>Slug الرابط</th>
            <th>السنة</th>
            <th>الخدمة</th>
            <th>عدد التصاميم</th>
            <th>حالة النشر</th>
            <th>إجراءات سريعة</th>
          </tr>
        </thead>
        <tbody id="brands-table-body">
          <tr><td colspan="8" style="text-align:center">جارٍ التحميل...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 2. DESIGNS TAB -->
  <div id="tab-designs" class="tab-content">
    
    <!-- Fast Upload Zone -->
    <div class="drop-zone" id="drop-zone" onclick="document.getElementById('fast-file-input').click()">
      <span class="drop-zone-icon">📸</span>
      <div class="drop-zone-title">اسحب وأفلت التصاميم أو الفيديوهات هنا للرفع السريع</div>
      <div class="drop-zone-desc">يدعم: JPG, PNG, WebP, GIF, MP4, WebM (حتى 50MB للفيديو) — معاينة فورية وتعديل العناوين</div>
      <input type="file" id="fast-file-input" multiple accept="image/*,video/*" style="display:none" onchange="handleFastFilesSelect(this.files)"/>
    </div>

    <!-- Active Upload Panel -->
    <div id="fast-upload-panel" style="display:none;background:var(--card-bg);border:1px solid var(--purple);border-radius:16px;padding:20px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
        <h4 style="color:#fff;display:flex;align-items:center;gap:8px">
          <span>🚀 تجهيز رفع</span>
          <span id="fast-files-count" class="badge-pill badge-pub">0 ملفات</span>
        </h4>
        <div style="display:flex;gap:12px;align-items:center">
          <label style="font-size:0.85rem;color:var(--purple-light)">البراند المستهدف:</label>
          <select id="fast-target-brand" class="form-control" style="width:200px" required></select>
        </div>
      </div>

      <div id="fast-preview-grid" class="preview-grid"></div>

      <div class="upload-progress-bar" id="fast-progress-bar">
        <div class="upload-progress-fill" id="fast-progress-fill"></div>
      </div>
      <div id="fast-status-text" style="font-size:0.85rem;margin-top:8px;color:var(--purple-light)"></div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
        <button type="button" class="btn btn-secondary" onclick="cancelFastUpload()">إلغاء وتفريغ</button>
        <button type="button" id="btn-start-fast-upload" class="btn btn-success" onclick="executeFastUpload()">بدء الرفع وحفظ الكل</button>
      </div>
    </div>

    <!-- Toolbar -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:12px">
        <h3>معرض التصاميم المرفوعة</h3>
        <select id="filter-design-brand" class="form-control" style="width:200px" onchange="loadDesigns()">
          <option value="">كل البراندات</option>
        </select>
        <button id="btn-bulk-delete" class="btn btn-danger" style="display:none" onclick="bulkDeleteSelectedDesigns()">🗑️ حذف المحددة (<span id="selected-count">0</span>)</button>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn" onclick="openDesignModal()">+ إضافة تصميم فردي يدوي</button>
      </div>
    </div>

    <div id="designs-grid-container" class="designs-admin-grid">
      <div style="grid-column:1/-1;text-align:center">جارٍ التحميل...</div>
    </div>
  </div>
</div>

<!-- BRAND MODAL (ONE-STOP-SHOP: BRAND INFO + INLINE DESIGNS UPLOAD) -->
<div id="brand-modal" class="modal-backdrop">
  <div class="modal-box">
    <div class="modal-header">
      <h3 id="brand-modal-title">إضافة براند جديد</h3>
      <button onclick="closeModal('brand-modal')" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer">×</button>
    </div>
    <form id="brand-form" onsubmit="saveBrand(event)">
      <input type="hidden" id="brand-id"/>
      
      <div class="form-row">
        <div class="form-group">
          <label>اسم البراند بالعربي *</label>
          <input type="text" id="brand-name-ar" class="form-control" required oninput="autoGenerateSlug(this.value)"/>
        </div>
        <div class="form-group">
          <label>اسم البراند بالإنجليزي</label>
          <input type="text" id="brand-name-en" class="form-control" oninput="if(!document.getElementById('brand-slug').value) autoGenerateSlug(this.value)"/>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Slug الرابط (مثال: island-gym) *</label>
          <input type="text" id="brand-slug" class="form-control" required/>
        </div>
        <div class="form-group">
          <label>سنة المشروع (Year) *</label>
          <input type="number" id="brand-year" class="form-control" value="2026" required/>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>الخدمة المنفذة بالعربي (مثال: إدارة السوشيال ميديا والهوية)</label>
          <input type="text" id="brand-service-ar" class="form-control" placeholder="Social Media & Content Direction"/>
        </div>
        <div class="form-group">
          <label>الخدمة بالإنجليزي (اختياري)</label>
          <input type="text" id="brand-service-en" class="form-control" placeholder="Brand Identity & Marketing"/>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>القسم / التصنيف</label>
          <select id="brand-category" class="form-control">
            <option value="social_media">سوشيال ميديا (Social Media)</option>
            <option value="branding">هوية بصرية (Branding)</option>
            <option value="ads">إعلانات ممولة (Paid Ads)</option>
            <option value="video">فيديو وتصوير (Video Production)</option>
            <option value="other">خدمات متكاملة (Other)</option>
          </select>
        </div>
        <div class="form-group">
          <label>الترتيب في العرض</label>
          <input type="number" id="brand-order" class="form-control" value="0"/>
        </div>
      </div>

      <div class="form-group">
        <label>شعار البراند (رفع ملف صورة أو رابط مباشر)</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="brand-logo-url" class="form-control" placeholder="/assets/logos/... أو رابط صورة"/>
          <input type="file" id="brand-logo-file" accept="image/*" style="display:none" onchange="uploadLogoFile(this)"/>
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('brand-logo-file').click()">رفع لوجو</button>
        </div>
        <div id="brand-logo-preview-wrap" style="margin-top:8px;display:none">
          <img id="brand-logo-preview" src="" style="width:60px;height:60px;border-radius:8px;object-fit:cover;border:1px solid var(--purple)"/>
        </div>
      </div>

      <div class="form-group">
        <label>قصة المشروع وتفاصيله بالعربي (Story AR - تظهر في العمود الأيمن مع الخط الأخضر)</label>
        <textarea id="brand-story-ar" class="form-control" rows="3" placeholder="اكتب تفاصيل الرحلة التسويقية، التحديات التي واجهت البراند، والنتائج الاستثنائية التي حققها..."></textarea>
      </div>

      <div class="form-group">
        <label>قصة المشروع بالإنجليزي (Story EN - اختياري)</label>
        <textarea id="brand-story-en" class="form-control" rows="2" placeholder="Case study overview, strategic growth and deliverables..."></textarea>
      </div>

      <div class="form-group">
        <label>الوصف المختصر (Meta Description / Snippet)</label>
        <textarea id="brand-desc-ar" class="form-control" rows="2" placeholder="نبذة مختصرة لسيو ومحركات البحث"></textarea>
      </div>

      <!-- DESIGNS SECTION INSIDE BRAND MODAL -->
      <div class="brand-designs-section" id="modal-brand-designs-wrapper">
        <h3 class="section-title">تصاميم البراند (Brand Deliverables & Gallery)</h3>
        <p class="section-hint" id="brand-designs-hint">اسحب الصور أو الفيديوهات هنا، أو اضغط للاختيار</p>

        <!-- Drop Zone Inside Modal -->
        <div id="brand-drop-zone" class="drop-zone" onclick="triggerBrandFileInput()">
          <div class="drop-zone-icon">📷</div>
          <h4 style="color:#fff;font-size:1.05rem;margin-bottom:4px">اسحب الملفات هنا أو اضغط للاختيار</h4>
          <p style="font-size:0.82rem;color:var(--text-muted)">يدعم: JPG, PNG, WebP, GIF, MP4 — حتى 50MB لكل ملف</p>
          <input type="file" id="brand-file-input" multiple accept="image/*,video/*" style="display:none" onchange="handleBrandFiles(this.files)"/>
        </div>

        <div id="brand-modal-upload-progress" class="upload-progress-bar" style="margin-bottom:12px">
          <div class="upload-progress-fill" id="brand-modal-progress-fill"></div>
        </div>
        <div id="brand-modal-status-text" style="font-size:0.82rem;margin-bottom:12px;color:var(--purple-light)"></div>

        <!-- Preview Grid of Uploaded Designs -->
        <div id="brand-designs-grid" class="designs-grid">
          <!-- Populated dynamically -->
        </div>
      </div>

      <div class="form-group" style="margin-top:20px">
        <label class="toggle-switch">
          <input type="checkbox" id="brand-is-published"/>
          <span>نشر البراند في المعرض العام فوراً (Default: غير منشور لحين الانتهاء)</span>
        </label>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px">
        <button type="button" class="btn btn-secondary" onclick="closeModal('brand-modal')">إغلاق</button>
        <button type="submit" class="btn" id="btn-save-brand-main">حفظ البراند</button>
      </div>
    </form>
  </div>
</div>

<!-- SINGLE DESIGN MODAL -->
<div id="design-modal" class="modal-backdrop">
  <div class="modal-box">
    <div class="modal-header">
      <h3 id="design-modal-title">إضافة تصميم جديد</h3>
      <button onclick="closeModal('design-modal')" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer">×</button>
    </div>
    <form id="design-form" onsubmit="saveDesign(event)">
      <input type="hidden" id="design-id"/>
      <input type="hidden" id="design-r2-key"/>
      <div class="form-group">
        <label>اختر البراند / العميل *</label>
        <select id="design-brand-id" class="form-control" required></select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>عنوان التصميم بالعربي</label>
          <input type="text" id="design-title-ar" class="form-control"/>
        </div>
        <div class="form-group">
          <label>عنوان التصميم بالإنجليزي</label>
          <input type="text" id="design-title-en" class="form-control"/>
        </div>
      </div>
      <div class="form-group">
        <label>صورة أو فيديو التصميم (رفع ملف أو رابط) *</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="design-image-url" class="form-control" placeholder="/assets/... أو رابط الصورة/الفيديو" required/>
          <input type="file" id="design-image-file" accept="image/*,video/*" style="display:none" onchange="uploadSingleDesignFile(this)"/>
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
        <label>الوصف بالعربي (اختياري)</label>
        <textarea id="design-desc-ar" class="form-control" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label class="toggle-switch">
          <input type="checkbox" id="design-is-published" checked/>
          <span>نشر التصميم في صفحة البراند</span>
        </label>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px">
        <button type="button" class="btn btn-secondary" onclick="closeModal('design-modal')">إلغاء</button>
        <button type="submit" class="btn">حفظ التصميم</button>
      </div>
    </form>
  </div>
</div>

<script>
let brandsList = [];
let designsList = [];
let selectedDesignIds = new Set();
let pendingFastFiles = [];
let modalBrandDesigns = [];

// Drag & Drop Setup for Designs Tab
const dropZone = document.getElementById('drop-zone');
if (dropZone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    });
  });
  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFastFilesSelect(files);
    }
  });
}

// Drag & Drop Setup for Brand Modal
const brandDropZone = document.getElementById('brand-drop-zone');
if (brandDropZone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    brandDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      brandDropZone.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    brandDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      brandDropZone.classList.remove('drag-over');
    });
  });
  brandDropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleBrandFiles(files);
    }
  });
}

function triggerBrandFileInput() {
  const brandId = document.getElementById('brand-id').value;
  if (!brandId) {
    alert('يرجى حفظ بيانات البراند الأساسية أولاً قبل رفع التصاميم');
    return;
  }
  document.getElementById('brand-file-input').click();
}

async function loadModalBrandDesigns(brandId) {
  const grid = document.getElementById('brand-designs-grid');
  const hint = document.getElementById('brand-designs-hint');
  if (!brandId) {
    hint.innerHTML = '<span style="color:#f59e0b">⚠️ احفظ بيانات البراند أولاً لتفعيل رفع التصاميم المباشر</span>';
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem">القسم غير نشط حالياً — اضغط "حفظ البراند" أولاً.</div>';
    return;
  }

  hint.textContent = 'اسحب الصور أو الفيديوهات هنا، أو اضغط للاختيار';
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem">جارٍ تحميل تصاميم البراند...</div>';

  try {
    const res = await fetch('/api/admin/portfolio/designs?brand_id=' + brandId);
    modalBrandDesigns = await res.json();

    if (!modalBrandDesigns || modalBrandDesigns.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem">لا توجد تصاميم مضافة لهذا البراند حتى الآن. اسحب الملفات لمنطقة الرفع بالأعلى.</div>';
      return;
    }

    renderModalBrandDesigns();
  } catch (err) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#ef4444;font-size:0.85rem">خطأ في تحميل التصاميم: ' + err.message + '</div>';
  }
}

function renderModalBrandDesigns() {
  const grid = document.getElementById('brand-designs-grid');
  if (!modalBrandDesigns || modalBrandDesigns.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem">لا توجد تصاميم مضافة لهذا البراند حتى الآن.</div>';
    return;
  }

  grid.innerHTML = modalBrandDesigns.map(d => {
    const isVideo = d.media_type === 'video' || (d.video_url && d.video_url.length > 0) || (d.image_url && d.image_url.match(/\\.(mp4|webm|mov)$/i));
    const mediaSrc = d.thumbnail_url || d.image_url;
    const title = d.title_ar || d.title_en || 'تصميم';

    return '<div class="design-thumb" id="thumb-design-' + d.id + '">' +
      '<button type="button" class="delete-btn" onclick="deleteModalDesign(' + d.id + ')" title="حذف">✕</button>' +
      (isVideo ? '<span class="video-badge">▶ فيديو</span><video src="' + (d.video_url || d.image_url) + '" muted playsinline preload="metadata"></video>' : '<img src="' + mediaSrc + '" loading="lazy" alt=""/>') +
      '<div class="design-thumb-footer">' +
        '<input type="text" class="design-thumb-title" value="' + title.replace(/"/g, '&quot;') + '" onblur="inlineSaveDesignTitle(' + d.id + ', this.value)" onkeydown="if(event.key===\\'Enter\\'){this.blur();}" title="اضغط للتعديل"/>' +
      '</div>' +
    '</div>';
  }).join('');
}

async function handleBrandFiles(files) {
  const brandId = document.getElementById('brand-id').value;
  if (!brandId) {
    alert('احفظ البراند أولاً قبل رفع التصاميم');
    return;
  }

  const incoming = Array.from(files);
  if (incoming.length === 0) return;

  const progressBar = document.getElementById('brand-modal-upload-progress');
  const progressFill = document.getElementById('brand-modal-progress-fill');
  const statusText = document.getElementById('brand-modal-status-text');

  progressBar.style.display = 'block';
  progressFill.style.width = '10%';
  statusText.textContent = '🚀 جارٍ رفع ' + incoming.length + ' ملف...';

  const grid = document.getElementById('brand-designs-grid');

  for (let i = 0; i < incoming.length; i++) {
    const file = incoming[i];
    const isVideo = file.type.startsWith('video/');
    const cleanTitle = file.name.replace(/\\.[^/.]+$/, "");

    statusText.textContent = 'جارٍ رفع ملف (' + (i + 1) + ' من ' + incoming.length + '): ' + file.name;

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('brand_id', brandId);

      const res = await fetch('/api/admin/portfolio/upload', {
        method: 'POST',
        body: fd
      });

      const data = await res.json();
      if (!data.success && !data.url) {
        throw new Error(data.error || 'فشل الرفع');
      }

      const mediaUrl = data.url || (data.files && data.files[0] ? data.files[0].url : null);
      const mediaType = isVideo ? 'video' : 'image';

      // Save design to D1
      const saveRes = await fetch('/api/admin/portfolio/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          title_ar: cleanTitle,
          title_en: cleanTitle,
          image_url: mediaUrl,
          video_url: isVideo ? mediaUrl : null,
          media_type: mediaType,
          design_type: isVideo ? 'video' : 'social_media',
          is_published: 1
        })
      });

      const saveData = await saveRes.json();
      if (saveData.success) {
        modalBrandDesigns.unshift({
          id: saveData.id,
          brand_id: brandId,
          title_ar: cleanTitle,
          image_url: mediaUrl,
          video_url: isVideo ? mediaUrl : null,
          media_type: mediaType,
          is_published: 1
        });
        renderModalBrandDesigns();
      }

      const pct = Math.round(((i + 1) / incoming.length) * 100);
      progressFill.style.width = pct + '%';

    } catch (err) {
      console.error(err);
      alert('خطأ أثناء رفع الملف ' + file.name + ': ' + err.message);
    }
  }

  statusText.textContent = '✅ اكتمل رفع وحفظ كل الملفات بنجاح!';
  setTimeout(() => {
    progressBar.style.display = 'none';
    statusText.textContent = '';
    loadDesigns(); // Sync designs tab
  }, 1500);
}

async function inlineSaveDesignTitle(id, newTitle) {
  if (!newTitle || !newTitle.trim()) return;
  try {
    await fetch('/api/admin/portfolio/designs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title_ar: newTitle.trim(), title_en: newTitle.trim() })
    });
    const found = modalBrandDesigns.find(d => d.id === id);
    if (found) {
      found.title_ar = newTitle.trim();
      found.title_en = newTitle.trim();
    }
  } catch (err) {
    console.error('Failed to update design title:', err);
  }
}

async function deleteModalDesign(id) {
  if (!confirm('هل تريد بالتأكيد حذف هذا التصميم؟')) return;
  try {
    await fetch('/api/admin/portfolio/designs?id=' + id, { method: 'DELETE' });
    modalBrandDesigns = modalBrandDesigns.filter(d => d.id !== id);
    renderModalBrandDesigns();
    loadDesigns(); // sync
  } catch (err) {
    alert('فشل الحذف: ' + err.message);
  }
}

function handleFastFilesSelect(fileList) {
  const incoming = Array.from(fileList);
  if (incoming.length === 0) return;
  
  if (pendingFastFiles.length + incoming.length > 20) {
    alert('الحد الأقصى للرفع المجمع هو 20 ملفاً في المرة الواحدة');
  }

  incoming.slice(0, 20 - pendingFastFiles.length).forEach(file => {
    const id = 'f_' + Math.random().toString(36).substr(2, 9);
    const objectUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\\.[^/.]+$/, "");
    const isVideo = file.type.startsWith('video/');
    pendingFastFiles.push({
      id,
      file,
      objectUrl,
      title: cleanName,
      isVideo
    });
  });

  renderFastPreviewGrid();
}

function renderFastPreviewGrid() {
  const panel = document.getElementById('fast-upload-panel');
  const countBadge = document.getElementById('fast-files-count');
  const grid = document.getElementById('fast-preview-grid');
  
  if (pendingFastFiles.length === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  countBadge.textContent = pendingFastFiles.length + ' ملفات';

  grid.innerHTML = pendingFastFiles.map((item, idx) => 
    '<div class="preview-card" id="card-' + item.id + '">' +
      '<button class="preview-remove-btn" type="button" onclick="removePendingFile(\\\'' + item.id + '\\\')">✕</button>' +
      (item.isVideo ? '<video src="' + item.objectUrl + '" muted playsinline></video>' : '<img src="' + item.objectUrl + '" alt="Preview"/>') +
      '<div class="preview-card-body">' +
        '<input type="text" class="preview-card-title-input" value="' + item.title.replace(/"/g, '&quot;') + '" oninput="updatePendingTitle(\\\'' + item.id + '\\\', this.value)" placeholder="عنوان التصميم..."/>' +
      '</div>' +
    '</div>'
  ).join('');
}

function removePendingFile(id) {
  pendingFastFiles = pendingFastFiles.filter(item => item.id !== id);
  renderFastPreviewGrid();
}

function updatePendingTitle(id, val) {
  const found = pendingFastFiles.find(item => item.id === id);
  if (found) found.title = val;
}

function cancelFastUpload() {
  pendingFastFiles = [];
  renderFastPreviewGrid();
  document.getElementById('fast-progress-bar').style.display = 'none';
  document.getElementById('fast-status-text').textContent = '';
  document.getElementById('fast-file-input').value = '';
}

async function executeFastUpload() {
  if (pendingFastFiles.length === 0) return alert('لا توجد ملفات للرفع');
  const targetBrandId = document.getElementById('fast-target-brand').value;
  if (!targetBrandId) return alert('يرجى اختيار البراند المستهدف أولاً');

  const btnStart = document.getElementById('btn-start-fast-upload');
  const progressBar = document.getElementById('fast-progress-bar');
  const progressFill = document.getElementById('fast-progress-fill');
  const statusText = document.getElementById('fast-status-text');

  btnStart.disabled = true;
  progressBar.style.display = 'block';
  progressFill.style.width = '15%';
  statusText.textContent = '🚀 جارٍ رفع ' + pendingFastFiles.length + ' ملف إلى Cloudflare R2...';

  const fd = new FormData();
  pendingFastFiles.forEach(item => {
    fd.append('files', item.file);
  });

  try {
    const uploadRes = await fetch('/api/admin/portfolio/upload', { method: 'POST', body: fd });
    const uploadData = await uploadRes.json();

    if (!uploadData.success && (!uploadData.files || uploadData.files.length === 0)) {
      throw new Error(uploadData.error || 'فشل الرفع');
    }

    progressFill.style.width = '65%';
    statusText.textContent = '✅ تم رفع ' + uploadData.uploadedCount + ' ملف. جارٍ تسجيل التصاميم في قاعدة البيانات...';

    const itemsToInsert = [];
    const uploadedFiles = uploadData.files || [];

    uploadedFiles.forEach((fileRes, idx) => {
      if (fileRes.success) {
        const matchingPending = pendingFastFiles[idx];
        const title = matchingPending ? matchingPending.title : (fileRes.name ? fileRes.name.replace(/\\.[^/.]+$/, "") : 'تصميم #' + (idx + 1));
        const mediaType = fileRes.media_type || (matchingPending && matchingPending.isVideo ? 'video' : 'image');
        
        itemsToInsert.push({
          brand_id: targetBrandId,
          title_ar: title,
          title_en: title,
          image_url: fileRes.url,
          thumbnail_url: fileRes.url,
          video_url: mediaType === 'video' ? fileRes.url : null,
          media_type: mediaType,
          r2_key: fileRes.key,
          file_size: fileRes.size || 0,
          design_type: mediaType === 'video' ? 'video' : 'social_media',
          display_order: idx + 1,
          is_published: 1
        });
      }
    });

    if (itemsToInsert.length === 0) {
      throw new Error('لم ينجح رفع أي ملف للحفظ');
    }

    const saveRes = await fetch('/api/admin/portfolio/designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemsToInsert)
    });

    if (!saveRes.ok) throw new Error('فشل حفظ التصاميم في قاعدة البيانات');

    progressFill.style.width = '100%';
    statusText.textContent = '🎉 اكتمل الرفع والحفظ بنجاح (' + itemsToInsert.length + ' تصميم)!';
    
    setTimeout(() => {
      cancelFastUpload();
      btnStart.disabled = false;
      loadDesigns();
      loadBrands();
    }, 1200);

  } catch (err) {
    alert('حدث خطأ أثناء الرفع: ' + err.message);
    btnStart.disabled = false;
    statusText.textContent = '❌ حدث خطأ: ' + err.message;
  }
}

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

function autoGenerateSlug(val) {
  if (!val) return;
  const slugField = document.getElementById('brand-slug');
  const slug = val.toLowerCase().trim().replace(/[^\\w\\s-]/g, '').replace(/[\\s_-]+/g, '-');
  slugField.value = slug;
}

async function loadBrands() {
  const tbody = document.getElementById('brands-table-body');
  try {
    const res = await fetch('/api/admin/portfolio/brands');
    brandsList = await res.json();
    
    const filterSelect = document.getElementById('filter-design-brand');
    const modalSelect = document.getElementById('design-brand-id');
    const fastBrandSelect = document.getElementById('fast-target-brand');
    
    const optionsHtml = brandsList.map(b => '<option value="' + b.id + '">' + b.name_ar + ' (' + (b.name_en || b.slug) + ')</option>').join('');
    filterSelect.innerHTML = '<option value="">كل البراندات</option>' + brandsList.map(b => '<option value="' + b.slug + '">' + b.name_ar + '</option>').join('');
    modalSelect.innerHTML = optionsHtml;
    fastBrandSelect.innerHTML = optionsHtml;

    if (brandsList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">لا توجد براندات مضافة حتى الآن. اضغط على "إضافة براند جديد".</td></tr>';
      return;
    }

    tbody.innerHTML = brandsList.map(b => '<tr>' +
      '<td><img src="' + (b.brand_logo_url || b.logo_url || '/assets/logos/pr-agency.webp') + '" class="brand-thumb"/></td>' +
      '<td><strong>' + b.name_ar + '</strong>' + (b.name_en ? '<div style="font-size:0.8rem;color:var(--text-muted)">' + b.name_en + '</div>' : '') + '</td>' +
      '<td><code>' + b.slug + '</code></td>' +
      '<td>' + (b.year || '2026') + '</td>' +
      '<td>' + (b.service_ar || b.category || '-') + '</td>' +
      '<td>' + (b.design_count || 0) + '</td>' +
      '<td>' + (b.is_published ? '<span class="badge-pill badge-pub">منشور</span>' : '<span class="badge-pill badge-draft">مسودة / مخفي</span>') + '</td>' +
      '<td>' +
        '<div style="display:flex;gap:6px">' +
          '<a href="/portfolio/' + b.slug + '" target="_blank" class="btn btn-secondary" style="padding:4px 8px;font-size:0.8rem">معاينة</a>' +
          '<button class="btn btn-secondary" style="padding:4px 8px;font-size:0.8rem" onclick="toggleBrandPublish(' + b.id + ', ' + (b.is_published ? 0 : 1) + ')">' + (b.is_published ? 'إخفاء' : 'نشر') + '</button>' +
          '<button class="btn btn-secondary" style="padding:4px 8px;font-size:0.8rem" onclick="editBrand(' + b.id + ')">تعديل</button>' +
          '<button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem" onclick="deleteBrand(' + b.id + ')">حذف</button>' +
        '</div>' +
      '</td>' +
    '</tr>').join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:red">فشل تحميل البراندات: ' + e.message + '</td></tr>';
  }
}

async function toggleBrandPublish(id, newStatus) {
  try {
    await fetch('/api/admin/portfolio/brands', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_published: newStatus })
    });
    loadBrands();
  } catch (e) { alert('خطأ في تغيير الحالة'); }
}

async function loadDesigns() {
  const container = document.getElementById('designs-grid-container');
  const brandSlug = document.getElementById('filter-design-brand').value;
  selectedDesignIds.clear();
  updateBulkDeleteBtn();

  try {
    const url = '/api/admin/portfolio/designs' + (brandSlug ? '?brand=' + brandSlug : '');
    const res = await fetch(url);
    designsList = await res.json();

    if (designsList.length === 0) {
      container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">لا توجد تصاميم للبراند المحدد. اسحب الملفات لمنطقة الرفع بالأعلى لإضافتها فوراً.</div>';
      return;
    }

    container.innerHTML = designsList.map(d => {
      const isVideo = d.media_type === 'video' || (d.video_url && d.video_url.length > 0) || (d.image_url && d.image_url.match(/\\.(mp4|webm|mov)$/i));
      return '<div class="design-admin-card" id="card-design-' + d.id + '">' +
        '<input type="checkbox" class="design-checkbox" onchange="toggleSelectDesign(' + d.id + ', this.checked)"/>' +
        (isVideo ? '<video src="' + (d.video_url || d.image_url) + '" muted playsinline></video>' : '<img src="' + (d.thumbnail_url || d.image_url) + '" loading="lazy"/>') +
        '<div class="design-admin-body">' +
          '<h4>' + (d.title_ar || d.title_en || 'تصميم') + (isVideo ? ' (فيديو)' : '') + '</h4>' +
          '<p>البراند: ' + (d.brand_name_ar || '-') + '<br>الترتيب: ' + (d.display_order || 0) + '</p>' +
          '<div class="card-actions">' +
            '<button class="btn btn-secondary" style="padding:4px 8px;font-size:0.8rem" onclick="toggleDesignPublish(' + d.id + ', ' + (d.is_published ? 0 : 1) + ')">' + (d.is_published ? 'إخفاء' : 'نشر') + '</button>' +
            '<button class="btn btn-secondary" style="padding:4px 8px;font-size:0.8rem" onclick="editDesign(' + d.id + ')">تعديل</button>' +
            '<button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem" onclick="deleteDesign(' + d.id + ')">حذف</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:red">فشل تحميل التصاميم: ' + e.message + '</div>';
  }
}

function toggleSelectDesign(id, checked) {
  if (checked) selectedDesignIds.add(id);
  else selectedDesignIds.delete(id);
  const card = document.getElementById('card-design-' + id);
  if (card) card.classList.toggle('selected', checked);
  updateBulkDeleteBtn();
}

function updateBulkDeleteBtn() {
  const btn = document.getElementById('btn-bulk-delete');
  const countSpan = document.getElementById('selected-count');
  countSpan.textContent = selectedDesignIds.size;
  btn.style.display = selectedDesignIds.size > 0 ? 'inline-flex' : 'none';
}

async function bulkDeleteSelectedDesigns() {
  if (selectedDesignIds.size === 0) return;
  if (!confirm('هل أنت متأكد من حذف ' + selectedDesignIds.size + ' تصميم دفعة واحدة؟')) return;
  const idsArray = Array.from(selectedDesignIds);
  try {
    await fetch('/api/admin/portfolio/designs?ids=' + idsArray.join(','), { method: 'DELETE' });
    selectedDesignIds.clear();
    loadDesigns();
  } catch(e) { alert('فشل الحذف المجمع: ' + e.message); }
}

async function toggleDesignPublish(id, newStatus) {
  try {
    await fetch('/api/admin/portfolio/designs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_published: newStatus })
    });
    loadDesigns();
  } catch (e) { alert('خطأ في تغيير الحالة'); }
}

function openBrandModal() {
  document.getElementById('brand-form').reset();
  document.getElementById('brand-id').value = '';
  document.getElementById('brand-year').value = '2026';
  document.getElementById('brand-service-ar').value = '';
  document.getElementById('brand-service-en').value = '';
  document.getElementById('brand-story-ar').value = '';
  document.getElementById('brand-story-en').value = '';
  document.getElementById('brand-is-published').checked = false;
  document.getElementById('brand-logo-preview-wrap').style.display = 'none';
  document.getElementById('brand-modal-title').textContent = 'إضافة براند جديد';
  
  loadModalBrandDesigns(null);
  document.getElementById('brand-modal').classList.add('open');
}

function editBrand(id) {
  const b = brandsList.find(x => x.id === id);
  if (!b) return;
  document.getElementById('brand-id').value = b.id;
  document.getElementById('brand-name-ar').value = b.name_ar || '';
  document.getElementById('brand-name-en').value = b.name_en || '';
  document.getElementById('brand-slug').value = b.slug || '';
  document.getElementById('brand-year').value = b.year || '2026';
  document.getElementById('brand-service-ar').value = b.service_ar || '';
  document.getElementById('brand-service-en').value = b.service_en || '';
  document.getElementById('brand-story-ar').value = b.story_ar || '';
  document.getElementById('brand-story-en').value = b.story_en || '';
  document.getElementById('brand-category').value = b.category || 'social_media';
  document.getElementById('brand-order').value = b.display_order || 0;
  document.getElementById('brand-logo-url').value = b.brand_logo_url || b.logo_url || '';
  document.getElementById('brand-desc-ar').value = b.description_ar || '';
  document.getElementById('brand-is-published').checked = !!b.is_published;
  
  const logoSrc = b.brand_logo_url || b.logo_url;
  if (logoSrc) {
    document.getElementById('brand-logo-preview').src = logoSrc;
    document.getElementById('brand-logo-preview-wrap').style.display = 'block';
  } else {
    document.getElementById('brand-logo-preview-wrap').style.display = 'none';
  }

  document.getElementById('brand-modal-title').textContent = 'تعديل البراند: ' + b.name_ar;
  loadModalBrandDesigns(b.id);
  document.getElementById('brand-modal').classList.add('open');
}

function openDesignModal() {
  document.getElementById('design-form').reset();
  document.getElementById('design-id').value = '';
  document.getElementById('design-r2-key').value = '';
  document.getElementById('design-is-published').checked = true;
  document.getElementById('design-modal-title').textContent = 'إضافة تصميم جديد';
  
  const currentBrandSlug = document.getElementById('filter-design-brand').value;
  if (currentBrandSlug) {
    const found = brandsList.find(b => b.slug === currentBrandSlug);
    if (found) document.getElementById('design-brand-id').value = found.id;
  }
  document.getElementById('design-modal').classList.add('open');
}

function editDesign(id) {
  const d = designsList.find(x => x.id === id);
  if (!d) return;
  document.getElementById('design-id').value = d.id;
  document.getElementById('design-brand-id').value = d.brand_id;
  document.getElementById('design-title-ar').value = d.title_ar || '';
  document.getElementById('design-title-en').value = d.title_en || '';
  document.getElementById('design-image-url').value = d.image_url || '';
  document.getElementById('design-r2-key').value = d.r2_key || '';
  document.getElementById('design-type').value = d.design_type || 'social_media';
  document.getElementById('design-order').value = d.display_order || 0;
  document.getElementById('design-desc-ar').value = d.description_ar || '';
  document.getElementById('design-is-published').checked = !!d.is_published;
  document.getElementById('design-modal-title').textContent = 'تعديل التصميم';
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
      document.getElementById('brand-logo-preview').src = data.url;
      document.getElementById('brand-logo-preview-wrap').style.display = 'block';
      alert('تم رفع الشعار بنجاح!');
    } else {
      alert(data.error || 'فشل الرفع');
    }
  } catch(e) { alert('خطأ أثناء الرفع: ' + e.message); }
}

async function uploadSingleDesignFile(input) {
  if (!input.files[0]) return;
  const fd = new FormData();
  fd.append('file', input.files[0]);
  try {
    const res = await fetch('/api/admin/portfolio/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      document.getElementById('design-image-url').value = data.url;
      document.getElementById('design-r2-key').value = data.key;
      if (!document.getElementById('design-title-ar').value) {
        document.getElementById('design-title-ar').value = input.files[0].name.replace(/\\.[^/.]+$/, "");
      }
      alert('تم رفع الملف بنجاح!');
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
    year: document.getElementById('brand-year').value,
    service_ar: document.getElementById('brand-service-ar').value,
    service_en: document.getElementById('brand-service-en').value,
    story_ar: document.getElementById('brand-story-ar').value,
    story_en: document.getElementById('brand-story-en').value,
    category: document.getElementById('brand-category').value,
    display_order: document.getElementById('brand-order').value,
    logo_url: document.getElementById('brand-logo-url').value,
    brand_logo_url: document.getElementById('brand-logo-url').value,
    description_ar: document.getElementById('brand-desc-ar').value,
    is_published: document.getElementById('brand-is-published').checked ? 1 : 0
  };

  const method = id ? 'PUT' : 'POST';
  if (id) payload.id = id;

  const res = await fetch('/api/admin/portfolio/brands', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    const newId = id || data.id;
    if (newId) {
      document.getElementById('brand-id').value = newId;
      loadModalBrandDesigns(newId);
    }
    loadBrands();
    alert('تم حفظ بيانات البراند بنجاح!');
  } else {
    const d = await res.json().catch(() => ({}));
    alert(d.error || 'حدث خطأ أثناء حفظ البراند');
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
    description_ar: document.getElementById('design-desc-ar').value,
    is_published: document.getElementById('design-is-published').checked ? 1 : 0
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
