const fs = require('fs');
let code = fs.readFileSync('functions/admin/index.js', 'utf-8');

if (!code.includes("switchTab('faqs')")) {
  code = code.replace(
    `<button class="cms-tab-btn" onclick="switchTab('layout')">📐 الترتيب</button>`,
    `<button class="cms-tab-btn" onclick="switchTab('faqs')">❓ الأسئلة الشائعة</button>\n    <button class="cms-tab-btn" onclick="switchTab('layout')">📐 الترتيب</button>`
  );
}

if (!code.includes('id="panel-faqs"')) {
  const faqPanelHTML = `
  <!-- ═══════════════════════════════════ -->
  <!-- TAB: FAQS                           -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel" id="panel-faqs">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:800;color:#fff">❓ إدارة الأسئلة الشائعة</h2>
      <button class="btn btn-primary" onclick="openFaqModal()">+ إضافة سؤال جديد</button>
    </div>
    <div class="table-wrap">
      <div class="table-container">
        <table class="cms-table">
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>السؤال</th>
              <th>الإجابة</th>
              <th>الترتيب</th>
              <th>الحالة</th>
              <th style="text-align:center">الإجراءات</th>
            </tr>
          </thead>
          <tbody id="faqsTableBody">
            <tr><td colspan="6" class="empty-state">جارٍ تحميل الأسئلة...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- FAQ Modal -->
  <div class="modal-overlay" id="faqModal" onclick="if(event.target===this) closeFaqModal()">
    <div class="modal-card">
      <h3 class="modal-title" id="faqModalTitle">إضافة سؤال جديد</h3>
      <input type="hidden" id="faqModalId" />
      <label class="modal-field-label">السؤال</label>
      <input type="text" id="faq-question" class="modal-input" placeholder="اكتب السؤال هنا..." />
      <label class="modal-field-label">الإجابة</label>
      <textarea id="faq-answer" class="modal-input" style="min-height:100px;resize:vertical" placeholder="اكتب الإجابة هنا..."></textarea>
      <label class="modal-field-label">الترتيب</label>
      <input type="number" id="faq-order" class="modal-input" value="0" />
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeFaqModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="saveFaq()">حفظ</button>
      </div>
    </div>
  </div>
`;
  code = code.replace(/<script>\s*let/, faqPanelHTML + '\n<script>\nlet');
}

if (!code.includes("faqs']")) {
  code = code.replace(
    /const CMS_TABS = \['dashboard','messages','analytics','settings','content','clients','team','theme','layout'\];/,
    "const CMS_TABS = ['dashboard','messages','analytics','settings','content','clients','team','theme','layout','faqs'];"
  );
}

if (!code.includes('fetchCmsFaqs()')) {
  code = code.replace(
    /if \(name === 'layout'\) fetchCmsLayout\(\);/,
    "if (name === 'layout') fetchCmsLayout();\n    if (name === 'faqs') fetchCmsFaqs();"
  );
}

if (!code.includes('async function fetchCmsFaqs()')) {
  const faqJS = `
  // ═══════════════════════════════════════════════
  // FAQS TAB
  // ═══════════════════════════════════════════════
  let cmsFaqs = [];
  async function fetchCmsFaqs() {
    try {
      const res = await fetch('/api/admin/faqs', { headers: cmsAuth() });
      const json = await res.json();
      if (!json.success) return;
      cmsFaqs = json.data || [];
      renderFaqsTable();
    } catch(e) { showToast('خطأ في تحميل الأسئلة الشائعة'); }
  }

  function renderFaqsTable() {
    const tb = document.getElementById('faqsTableBody');
    if (!tb) return;
    if (!cmsFaqs.length) {
      tb.innerHTML = '<tr><td colspan="6" class="empty-state">لا يوجد أسئلة — أضف أول سؤال!</td></tr>';
      return;
    }
    tb.innerHTML = cmsFaqs.map(f => \`
      <tr>
        <td style="color:var(--text-sub);font-family:monospace">\${f.id}</td>
        <td style="font-weight:700;color:#fff">\${escapeHtml(f.question)}</td>
        <td style="color:var(--text-muted);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="\${escapeHtml(f.answer)}">\${escapeHtml(f.answer)}</td>
        <td>\${f.order_index}</td>
        <td><span class="clickable-status" onclick="toggleFaqStatus(\${f.id},\${f.is_active?0:1})" style="padding:3px 9px;border-radius:99px;font-size:12px;font-weight:700;\${f.is_active?'background:rgba(16,185,129,0.15);color:#34d399':'background:rgba(107,114,128,0.15);color:#9ca3af'}">\${f.is_active?'نشط ▾':'مخفي ▾'}</span></td>
        <td>
          <div style="display:flex;gap:6px;justify-content:center">
            <button class="act-btn act-note" onclick="editFaq(\${f.id})">✏️</button>
            <button class="act-btn act-del" onclick="deleteFaq(\${f.id})">🗑️</button>
          </div>
        </td>
      </tr>\`).join('');
  }

  function openFaqModal() {
    document.getElementById('faqModalId').value = '';
    document.getElementById('faqModalTitle').textContent = 'إضافة سؤال جديد';
    document.getElementById('faq-question').value = '';
    document.getElementById('faq-answer').value = '';
    document.getElementById('faq-order').value = 0;
    document.getElementById('faqModal').classList.add('open');
  }

  function editFaq(id) {
    const f = cmsFaqs.find(x => x.id === id);
    if (!f) return;
    document.getElementById('faqModalId').value = id;
    document.getElementById('faqModalTitle').textContent = 'تعديل السؤال';
    document.getElementById('faq-question').value = f.question || '';
    document.getElementById('faq-answer').value = f.answer || '';
    document.getElementById('faq-order').value = f.order_index || 0;
    document.getElementById('faqModal').classList.add('open');
  }

  function closeFaqModal() { document.getElementById('faqModal').classList.remove('open'); }

  async function saveFaq() {
    const id = document.getElementById('faqModalId').value;
    const q = document.getElementById('faq-question').value.trim();
    const a = document.getElementById('faq-answer').value.trim();
    const o = parseInt(document.getElementById('faq-order').value) || 0;
    if (!q || !a) { showToast('⚠️ السؤال والإجابة مطلوبان'); return; }

    try {
      const url = '/api/admin/faqs';
      const method = id ? 'PUT' : 'POST';
      const body = { question: q, answer: a, order_index: o };
      if (id) body.id = id;
      const res = await fetch(url, { method, headers: cmsAuth(), body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) { closeFaqModal(); fetchCmsFaqs(); showToast('✅ تم الحفظ!'); }
      else showToast('❌ ' + (json.error || 'خطأ'));
    } catch(e) { showToast('❌ ' + e.message); }
  }

  async function toggleFaqStatus(id, newStatus) {
    try {
      const f = cmsFaqs.find(x => x.id === id);
      if(!f) return;
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: cmsAuth(),
        body: JSON.stringify({ id: id, question: f.question, answer: f.answer, order_index: f.order_index, is_active: newStatus })
      });
      const json = await res.json();
      if (json.success) { fetchCmsFaqs(); showToast('✓ تم تغيير الحالة'); }
      else { showToast('❌ ' + (json.error || 'خطأ')); }
    } catch(e) { showToast('❌ ' + e.message); }
  }

  async function deleteFaq(id) {
    if (!confirm('هل تريد حذف هذا السؤال نهائياً؟')) return;
    try {
      await fetch('/api/admin/faqs?id=' + id, { method: 'DELETE', headers: cmsAuth() });
      fetchCmsFaqs(); showToast('🗑️ تم الحذف');
    } catch(e) { showToast('❌ ' + e.message); }
  }
`;
  code = code.replace('// ═══════════════════════════════════════════════\n  // EXPORT JSON', faqJS + '\n  // ═══════════════════════════════════════════════\n  // EXPORT JSON');
}

fs.writeFileSync('functions/admin/index.js', code);
console.log('Admin updated!');
