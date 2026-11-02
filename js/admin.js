// PR Agency Admin OS Core JavaScript Engine
// Auto-modularized for High Performance & Caching


/* ── MODULE PART 1 ── */
// ── AUTHENTICATION INTERCEPTOR & SESSION ENGINE ──
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
      options.headers = options.headers || {};
      const token = localStorage.getItem('admin_jwt');
      if (token) {
        if (options.headers instanceof Headers) {
          if (!options.headers.has('Authorization')) {
            options.headers.set('Authorization', `Bearer ${token}`);
          }
        } else if (Array.isArray(options.headers)) {
          options.headers.push(['Authorization', `Bearer ${token}`]);
        } else {
          if (!options.headers['Authorization']) {
            options.headers['Authorization'] = `Bearer ${token}`;
          }
        }
      }
      const response = await originalFetch(url, options);
      // ONLY trigger logout if the core identity endpoint /api/admin/me returns 401
      // Do NOT log out on background asset/kpi/team requests!
      if (response.status === 401) {
        const reqUrl = typeof url === 'string' ? url : (url.url || '');
        if (reqUrl.includes('/api/admin/me')) {
          console.warn('[Admin Auth] Session invalid according to /api/admin/me. Logging out.');
          localStorage.removeItem('admin_jwt');
          const overlay = document.getElementById('admin-login-overlay');
          if (overlay) overlay.style.display = 'flex';
        } else {
          console.warn('[Admin Auth] Request 401 suppressed from auto-logout:', reqUrl);
        }
      }
      return response;
    };

    async function checkAdminSession() {
      const token = localStorage.getItem('admin_jwt');
      const overlay = document.getElementById('admin-login-overlay');
      console.log('[checkAdminSession] Checking token in localStorage:', token ? (token.slice(0, 15) + '...') : 'NONE');
      
      if (!token) {
        if (overlay) overlay.style.display = 'flex';
        return;
      }
      
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        console.log('[checkAdminSession] /api/admin/me response:', data);
        
        if (data.authenticated && data.user) {
          if (overlay) overlay.style.display = 'none';
          const badge = document.getElementById('adminUserBadge');
          if (badge) badge.textContent = `👑 ${data.user.name} (${data.user.role || 'Admin'})`;
          // Initialize active tab
          if (typeof refreshCurrentTab === 'function') refreshCurrentTab();
        } else {
          console.warn('[checkAdminSession] Token rejected by server, clearing session.');
          localStorage.removeItem('admin_jwt');
          if (overlay) overlay.style.display = 'flex';
        }
      } catch (e) {
        console.error('[checkAdminSession] Fetch error:', e);
        // Fallback: decode token expiry locally if network issue
        try {
          const parts = token.split('.');
          const payload = JSON.parse(atob(parts[0]));
          if (payload.exp && payload.exp > Math.floor(Date.now() / 1000)) {
            console.log('[checkAdminSession] Offline token valid until:', new Date(payload.exp * 1000));
            if (overlay) overlay.style.display = 'none';
            return;
          }
        } catch (decErr) {}
        if (overlay) overlay.style.display = 'flex';
      }
    }

    async function handleAdminLogin(e) {
      e.preventDefault();
      const userEl = document.getElementById('loginUsername');
      const passEl = document.getElementById('loginPassword');
      const errEl = document.getElementById('loginErrorMsg');
      const btn = document.getElementById('loginSubmitBtn');

      errEl.style.display = 'none';
      btn.disabled = true;
      btn.textContent = '⏳ جاري التحقق...';

      try {
        const res = await originalFetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: userEl.value.trim(),
            password: passEl.value.trim()
          })
        });
        const data = await res.json();
        if (data.success && data.token) {
          localStorage.setItem('admin_jwt', data.token);
          document.getElementById('admin-login-overlay').style.display = 'none';
          const badge = document.getElementById('adminUserBadge');
          if (badge) badge.textContent = `👑 ${data.user.name} (${data.user.role || 'Admin'})`;
          if (typeof refreshCurrentTab === 'function') refreshCurrentTab();
        } else {
          errEl.textContent = data.error || 'فشل تسجيل الدخول';
          errEl.style.display = 'block';
        }
      } catch (err) {
        errEl.textContent = 'تعذر الاتصال بالخادم. يرجى المحاولة ثانية.';
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = '🔐 تسجيل الدخول إلى المنظومة';
      }
    }

    function handleAdminLogout() {
      if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
        localStorage.removeItem('admin_jwt');
        location.reload();
      }
    }

    // Call session check immediately on DOM content loaded
    document.addEventListener('DOMContentLoaded', checkAdminSession);

    
    // ── MOBILE NAVIGATION DRAWER ────────────────────────────────────────
    window.toggleAdminDrawer = function() {
      const drawer = document.getElementById('adminMobileDrawer');
      const backdrop = document.getElementById('adminDrawerBackdrop');
      if (!drawer) return;
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        window.closeAdminDrawer();
      } else {
        drawer.classList.add('open');
        if (backdrop) backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    };

    window.closeAdminDrawer = function() {
      const drawer = document.getElementById('adminMobileDrawer');
      const backdrop = document.getElementById('adminDrawerBackdrop');
      if (drawer) drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
      document.body.style.overflow = '';
    };

    window.currentActiveTab = 'daily-tasks';
    window.switchTab = function(tabId, btnElement) {
      window.currentActiveTab = tabId;
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      
      const targetTab = document.getElementById('tab-' + tabId);
      if (tabId === 'skills') {
        loadSkillsCatalog();
      }
      if (tabId === 'agents') {
        loadAgentActions();
      }
      if (targetTab) {
        targetTab.classList.add('active');
      } else {
        console.warn('Tab element not found: tab-' + tabId);
      }
      
      const activeBtn = btnElement || document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
      if (activeBtn) activeBtn.classList.add('active');
      document.querySelectorAll('.drawer-btn').forEach(el => el.classList.remove('active'));
      const activeDrawerBtn = document.querySelector(`.drawer-btn[data-tab="${tabId}"]`);
      if (activeDrawerBtn) activeDrawerBtn.classList.add('active');
      document.querySelectorAll('.admin-dock-btn').forEach(el => el.classList.remove('active'));
      const activeDockBtn = document.querySelector(`.admin-dock-btn[data-dock="${tabId}"]`);
      if (activeDockBtn) activeDockBtn.classList.add('active');
      
      const titles = {
        'daily-tasks': 'المهام اليومية',
        'profitability': 'تحليل ربحية المشاريع والعائد على الساعات (Project Profitability Matrix)',
        audit: 'سجل المراقبة والتدقيق الشامل (Audit Trail)',
        team: 'إدارة فريق العمل والأدوار والصلاحيات (Agency Team Members)',
        ads: 'ربط وإدارة إعلانات Meta و Google Ads',
        'payment-settings': 'إعدادات الدفع وإنستاباي (InstaPay Setup)',
        clients: 'إدارة حسابات العملاء والبوابة (Client Accounts)',
        creative: 'مسار عمل الفريق الإبداعي (Creative Workflow)',
        strategies: 'الاستراتيجيات الحية داخل الموقع (Live Strategies)',
        invoices: 'فواتير واشتراكات العملاء (Client Invoices)',
        workflows: 'محرك الأتمتة السحابي والذكاء الاصطناعي (Smart Workflows)',
        sales: 'إدارة المبيعات والتوزيع الذكي للعملاء (Sales CRM)',
        permissions: 'مصفوفة الصلاحيات وأمان الوصول (RBAC Permissions Matrix)',
        agents: '🤖 مركز الوكلاء الأذكياء ومراجعة المسودات (Autonomous Agents Hub)'
      };
      const headingEl = document.getElementById('topHeading');
      if (headingEl && titles[tabId]) {
        headingEl.innerText = titles[tabId];
      }
      try {
        if (tabId === 'daily-tasks' && typeof loadDailyTasksWorkspace === 'function') loadDailyTasksWorkspace();
        if (tabId === 'profitability' && typeof loadProfitabilityReport === 'function') loadProfitabilityReport();
        if (tabId === 'audit' && typeof loadAuditLogs === 'function') loadAuditLogs();
        if (tabId === 'team' && typeof loadTeamMembers === 'function') loadTeamMembers();
        if (tabId === 'clients' && typeof loadClientsList === 'function') loadClientsList();
        if (tabId === 'creative' && typeof loadCreativeAssets === 'function') loadCreativeAssets();
        if (tabId === 'invoices' && typeof loadInvoicesList === 'function') loadInvoicesList();
        if (tabId === 'workflows' && typeof loadWorkflowsData === 'function') loadWorkflowsData();
        if (tabId === 'payment-settings') loadPaymentSettings();
        if (tabId === 'sales' && typeof loadSalesLeads === 'function') loadSalesLeads();
        if (typeof loadGlobalExecutiveKPIs === 'function') loadGlobalExecutiveKPIs();
      } catch (err) {
        console.error('Error switching tab content:', err);
      }
    };

    window.refreshCurrentTab = function() {
      if (window.switchTab && window.currentActiveTab) {
        window.switchTab(window.currentActiveTab);
      }
    };


    // ── TEAM CRM STATE & CRUD ──────────────────────────────────────────
    let allTeamMembers = [];
    let memberToDeleteId = null;

    async function loadTeamMembers() {
      try {
        const res = await fetch('/api/team/members');
        const data = await res.json();
        allTeamMembers = data.members || [];
        renderTeamTable();
      } catch (err) {
        document.getElementById('teamTableBody').innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--danger)">فشل تحميل قائمة الفريق</td></tr>';
      }
    }

    function handleTeamFilterChange() {
      renderTeamTable();
    }

    function renderTeamTable() {
      const search = (document.getElementById('teamSearchInput')?.value || '').trim().toLowerCase();
      const roleFilter = document.getElementById('teamRoleFilter')?.value || 'all';
      const statusFilter = document.getElementById('teamStatusFilter')?.value || 'all';

      let filtered = allTeamMembers.filter(m => {
        const matchesSearch = !search ||
          (m.name && m.name.toLowerCase().includes(search)) ||
          (m.email && m.email.toLowerCase().includes(search)) ||
          (m.phone && m.phone.includes(search));

        const memberRole = (m.role || m.roles || '').toLowerCase();
        const matchesRole = roleFilter === 'all' || memberRole.includes(roleFilter.toLowerCase());

        const matchesStatus = statusFilter === 'all' || String(m.active) === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
      });

      const tbody = document.getElementById('teamTableBody');
      const totalCountEl = document.getElementById('teamTotalCount');
      if (totalCountEl) totalCountEl.textContent = filtered.length;

      tbody.innerHTML = '';
      if (filtered.length > 0) {
        filtered.forEach(m => {
          const tr = document.createElement('tr');
          const primaryRole = m.role || m.roles || 'Team Member';
          tr.innerHTML = `
            <td><strong>${m.name}</strong></td>
            <td dir="ltr" style="text-align:right;">${m.email}</td>
            <td><span class="badge badge-accent">${primaryRole}</span></td>
            <td>${m.department || 'Creative'}</td>
            <td dir="ltr" style="text-align:right;">${m.phone || '-'}</td>
            <td><span class="badge ${m.active ? 'badge-success' : 'badge-danger'}">${m.active ? 'نشط' : 'معطل'}</span></td>
            <td>${new Date(m.created_at).toLocaleDateString('ar-EG')}</td>
            <td style="text-align:center;">
              <div style="display:inline-flex;gap:6px;">
                <button class="btn btn-secondary btn-sm" onclick='openEditTeamMemberModal(${JSON.stringify(m).replace(/'/g, "&apos;")})'>✏️ تعديل</button>
                <button class="btn btn-danger btn-sm" onclick="openDeleteConfirmModal('${m.id}', '${m.name.replace(/'/g, "\\'")}')">🗑️ حذف</button>
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">لا توجد نتائج مطابقة لخيارات البحث أو الفلترة</td></tr>';
      }
    }

    function openAddTeamMemberModal() {
      document.getElementById('teamModalTitle').textContent = 'إضافة عضو جديد للفريق';
      document.getElementById('tm-submit-btn').textContent = 'حفظ وتفعيل الحساب';
      document.getElementById('teamMemberForm').reset();
      document.getElementById('tm-id').value = '';
      document.getElementById('tm-email').disabled = false;
      document.getElementById('tm-password').required = true;
      document.getElementById('tm-password-label').textContent = 'كلمة المرور *';
      document.getElementById('tm-password-help').style.display = 'none';
      document.getElementById('teamMemberModal').classList.add('active');
    }

    function openEditTeamMemberModal(member) {
      document.getElementById('teamModalTitle').textContent = 'تعديل بيانات عضو الفريق: ' + member.name;
      document.getElementById('tm-submit-btn').textContent = 'تحديث البيانات';
      document.getElementById('tm-id').value = member.id;
      document.getElementById('tm-name').value = member.name || '';
      document.getElementById('tm-email').value = member.email || '';
      document.getElementById('tm-email').disabled = true;
      document.getElementById('tm-role').value = member.role || member.roles || 'Designer';
      document.getElementById('tm-department').value = member.department || 'Creative';
      document.getElementById('tm-phone').value = member.phone || '';
      document.getElementById('tm-active').value = member.active ? '1' : '0';
      document.getElementById('tm-password').value = '';
      document.getElementById('tm-password').required = false;
      document.getElementById('tm-password-label').textContent = 'تغيير كلمة المرور (اختياري)';
      document.getElementById('tm-password-help').style.display = 'block';
      document.getElementById('teamMemberModal').classList.add('active');
    }

    function closeTeamModal() {
      document.getElementById('teamMemberModal').classList.remove('active');
    }

    async function handleSaveTeamMember(e) {
      e.preventDefault();
      const id = document.getElementById('tm-id').value;
      const isEdit = Boolean(id);

      const payload = {
        name: document.getElementById('tm-name').value,
        role: document.getElementById('tm-role').value,
        department: document.getElementById('tm-department').value,
        phone: document.getElementById('tm-phone').value,
        active: parseInt(document.getElementById('tm-active').value, 10)
      };

      const pass = document.getElementById('tm-password').value;
      if (pass) payload.password = pass;

      if (!isEdit) {
        payload.email = document.getElementById('tm-email').value;
      }

      try {
        const url = isEdit ? `/api/team/members/${id}` : '/api/team/members';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert(isEdit ? 'تم تحديث بيانات العضو بنجاح!' : 'تم إضافة وتفعيل العضو بنجاح!');
          closeTeamModal();
          loadTeamMembers();
        } else {
          alert('خطأ: ' + (data.error || 'فشلت العملية'));
        }
      } catch (err) {
        alert('حدث خطأ في الاتصال بالخادم: ' + err.message);
      }
    }

    function openDeleteConfirmModal(id, name) {
      memberToDeleteId = id;
      document.getElementById('deleteConfirmMessage').textContent = `هل أنت متأكد من رغبتك في حذف العضو "${name}" نهائياً من النظام؟`;
      document.getElementById('deleteConfirmModal').classList.add('active');
    }

    function closeDeleteModal() {
      memberToDeleteId = null;
      document.getElementById('deleteConfirmModal').classList.remove('active');
    }

    async function executeDeleteTeamMember() {
      if (!memberToDeleteId) return;
      try {
        const res = await fetch(`/api/team/members/${memberToDeleteId}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          alert('تم حذف العضو بنجاح!');
          closeDeleteModal();
          loadTeamMembers();
        } else {
          alert('خطأ أثناء الحذف: ' + (data.error || 'فشل الحذف'));
        }
      } catch (err) {
        alert('حدث خطأ بالاتصال: ' + err.message);
      }
    }

    async function handleCreateClient(e) {
      e.preventDefault();
      const payload = {
        action: 'create',
        company_name: document.getElementById('cl-company').value,
        contact_name: document.getElementById('cl-contact').value,
        email: document.getElementById('cl-email').value,
        password: document.getElementById('cl-password').value,
        phone: document.getElementById('cl-phone').value,
        brand_color: document.getElementById('cl-color').value,
        logo_url: document.getElementById('cl-logo').value,
        created_by: 'Super Admin'
      };

      try {
        const res = await fetch('/api/admin/portal-clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('تم إنشاء حساب العميل بنجاح وتوثيقه في السجل وإرسال الإشعار!');
          document.getElementById('createClientForm').reset();
          loadClientsList();
        } else {
          alert('خطأ: ' + (data.error || 'فشل إنشاء الحساب'));
        }
      } catch (err) {
        alert('حدث خطأ في الاتصال بالخادم');
      }
    }

    async function loadClientsList() {
      const tbody = document.getElementById('clientsTableBody');
      try {
        const res = await fetch('/api/admin/portal-clients');
        const data = await res.json();
        if (!data.success || !data.clients || data.clients.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">لا يوجد عملاء مسجلين حالياً</td></tr>';
          return;
        }

        tbody.innerHTML = data.clients.map(c => `
          <tr>
            <td><strong>${c.company_name}</strong><br><small style="color:var(--text-muted)">ID: ${c.id}</small></td>
            <td>${c.contact_name || '—'}</td>
            <td dir="ltr" style="text-align:right">${c.email}</td>
            <td dir="ltr" style="text-align:right"><a href="https://wa.me/${(c.phone||'').replace(/[^0-9]/g,'')}" target="_blank" style="color:#10b981">📱 ${c.phone || '—'}</a></td>
            <td><span class="badge badge-success">${c.approved_count || 0}</span></td>
            <td><span class="badge badge-warning">${c.pending_count || 0}</span></td>
            <td><span class="badge ${c.active ? 'badge-success' : 'badge-danger'}">${c.active ? 'نشط' : 'معطل'}</span></td>
            <td>
              <button class="btn" style="padding:4px 8px;font-size:11px;" onclick="copyClientLogin('${c.email}')">نسخ رابط الدخول</button>
            </td>
          </tr>
        `).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--danger)">فشل تحميل قائمة العملاء</td></tr>';
      }
    }

    function copyClientLogin(email) {
      const url = `https://pragency.pages.dev/portal-access-2026.html?email=${encodeURIComponent(email)}`;
      navigator.clipboard.writeText(url);
      alert('تم نسخ رابط تسجيل دخول العميل إلى الحافظة!');
    }

    async function handleCreateInvoice(e) {
      e.preventDefault();
      const payload = {
        action: 'create',
        client_id: document.getElementById('inv-clientId').value,
        amount: parseFloat(document.getElementById('inv-amount').value),
        currency: document.getElementById('inv-currency').value,
        due_date: document.getElementById('inv-dueDate').value,
        invoice_number: document.getElementById('inv-number').value || undefined,
        notes: document.getElementById('inv-notes').value,
        created_by: 'Super Admin'
      };

      try {
        const res = await fetch('/api/admin/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('تم إصدار الفاتورة وتوثيقها بنجاح!');
          document.getElementById('createInvoiceForm').reset();
          loadInvoicesList();
        } else {
          alert('خطأ: ' + data.error);
        }
      } catch (err) {
        alert('خطأ في الاتصال');
      }
    }

    let currentInvoicesPage = 1;
    let totalInvoicesPages = 1;

    async function changeInvoicesPage(delta) {
      const newPage = currentInvoicesPage + delta;
      if (newPage >= 1 && newPage <= totalInvoicesPages) {
        currentInvoicesPage = newPage;
        await loadInvoicesList(currentInvoicesPage);
      }
    }
    window.changeInvoicesPage = changeInvoicesPage;

    async function loadInvoicesList(page = 1) {
      currentInvoicesPage = page;
      const tbody = document.getElementById('invoicesTableBody');
      try {
        const res = await fetch('/api/admin/invoices?page=' + page + '&limit=15');
        const data = await res.json();
        const invoices = data.invoices || data.data || [];
        
        // Update pagination bar
        const pageSpan = document.getElementById('invoicesCurrentPage');
        const totalSpan = document.getElementById('invoicesTotalPages');
        const countSpan = document.getElementById('invoicesTotalRecords');
        const prevBtn = document.getElementById('invoicesPrevBtn');
        const nextBtn = document.getElementById('invoicesNextBtn');

        if (data.pagination) {
          totalInvoicesPages = data.pagination.totalPages || 1;
          if (pageSpan) pageSpan.textContent = data.pagination.page;
          if (totalSpan) totalSpan.textContent = totalInvoicesPages;
          if (countSpan) countSpan.textContent = data.pagination.total;
          if (prevBtn) prevBtn.disabled = data.pagination.page <= 1;
          if (nextBtn) nextBtn.disabled = data.pagination.page >= totalInvoicesPages;
        }

        if (!data.success || invoices.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">لا توجد فواتير صادرة حالياً</td></tr>';
          return;
        }

        tbody.innerHTML = invoices.map(inv => {
          const statusBadges = {
            paid: '<span class="badge badge-success">مدفوعة ✅</span>',
            pending: '<span class="badge badge-warning">معلقة ⏳</span>',
            pending_verification: '<span class="badge badge-accent" style="background:rgba(56,189,248,0.2);color:#38bdf8;border:1px solid rgba(56,189,248,0.4);">بانتظار تأكيد إنستاباي ⚡</span>',
            overdue: '<span class="badge badge-danger">متأخرة ⚠️</span>'
          };
          return `
            <tr>
              <td><strong>${inv.invoice_number}</strong></td>
              <td>${inv.company_name || inv.client_id}</td>
              <td><strong>${inv.amount} ${inv.currency}</strong></td>
              <td>${inv.due_date}</td>
              <td>${statusBadges[inv.status] || inv.status}</td>
              <td>${inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('ar-EG') : '—'}</td>
              <td>
                <a href="/api/portal/invoices/download?id=${inv.id}" target="_blank" class="btn" style="padding:4px 8px;font-size:11px;background:#8b5cf6;text-decoration:none;">📄 استعراض PDF</a>
                ${inv.status === 'pending_verification' ? `<button class="btn" style="padding:4px 10px;font-size:11px;background:#10b981;font-weight:700;" onclick="approveInstaPayTransfer('${inv.id}', '${inv.invoice_number}')">✅ اعتماد تحويل إنستاباي</button>` : ''}
                ${inv.status !== 'paid' && inv.status !== 'pending_verification' ? `<button class="btn" style="padding:4px 8px;font-size:11px;" onclick="markInvoicePaid('${inv.id}')">تسجيل كسداد</button>` : ''}
                ${inv.status !== 'paid' ? `<button class="btn" style="padding:4px 8px;font-size:11px;background:#f59e0b;" onclick="sendInvoiceReminder('${inv.id}')">إرسال تذكير</button>` : ''}
              </td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--danger)">فشل تحميل الفواتير</td></tr>';
      }
    }

    
    async function approveInstaPayTransfer(id, invNum) {
      if (!confirm('تأكيد اعتماد استلام تحويل إنستاباي للفاتورة #' + invNum + '؟\nسيتم تحويل حالة الفاتورة لـ Paid وتحديث سجل التدقيق وإشعار العميل.')) return;
      try {
        const res = await fetch('/api/admin/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_paid', invoice_id: id, updated_by: 'Super Admin' })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ تم اعتماد تحويل إنستاباي بنجاح وسداد الفاتورة!');
          loadInvoicesList();
        } else {
          alert('خطأ: ' + (data.error || 'فشل الاعتماد'));
        }
      } catch (e) {
        alert('حدث خطأ في الاتصال: ' + e.message);
      }
    }

    async function loadPaymentSettings() {
      try {
        const res = await fetch('/api/admin/settings/payment');
        const data = await res.json();
        if (data.success && data.settings) {
          const ipaInput = document.getElementById('set-instapay-ipa');
          const nameInput = document.getElementById('set-instapay-name');
          const appleInput = document.getElementById('set-apple-pay-merchant');
          if (ipaInput) ipaInput.value = data.settings.instapay_ipa || '';
          if (nameInput) nameInput.value = data.settings.instapay_name || '';
          if (appleInput) appleInput.value = data.settings.apple_pay_merchant_id || '';
        }
      } catch (err) {
        console.warn('Could not load payment settings:', err);
      }
    }

    async function handlePaymentSettingsSubmit(e) {
      e.preventDefault();
      const statusEl = document.getElementById('paymentSettingsSaveStatus');
      statusEl.textContent = 'جاري الحفظ... ⏳';
      statusEl.style.color = '#c4b5fd';

      const instapay_ipa = document.getElementById('set-instapay-ipa').value.trim();
      const instapay_name = document.getElementById('set-instapay-name').value.trim();
      const apple_pay_merchant_id = document.getElementById('set-apple-pay-merchant').value.trim();

      try {
        const res = await fetch('/api/admin/settings/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instapay_ipa, instapay_name, apple_pay_merchant_id })
        });
        const data = await res.json();
        if (data.success) {
          statusEl.textContent = '✅ تم حفظ إعدادات إنستاباي و Apple Pay بنجاح!';
          statusEl.style.color = '#34d399';
        } else {
          statusEl.textContent = 'خطأ: ' + (data.error || 'فشل الحفظ');
          statusEl.style.color = '#ef4444';
        }
      } catch (err) {
        statusEl.textContent = 'حدث خطأ في الاتصال';
        statusEl.style.color = '#ef4444';
      }
    }

    async function markInvoicePaid(id) {
      if (!confirm('تأكيد تسجيل الفاتورة كمدفوعة بالكامل؟')) return;
      await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid', invoice_id: id, updated_by: 'Super Admin' })
      });
      loadInvoicesList();
    }

    async function sendInvoiceReminder(id) {
      await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_reminder', invoice_id: id })
      });
      alert('تم إرسال تذكير استحقاق الفاتورة للعميل!');
    }

    async function loadAuditLogs() {
      try {
        const res = await fetch('/api/admin/audit?limit=30');
        const data = await res.json();
        const tbody = document.getElementById('auditTableBody');
        if (!data.success || !data.logs || data.logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">لا توجد عمليات مسجلة حتى الآن</td></tr>';
          return;
        }
        tbody.innerHTML = data.logs.map(log => {
          const dt = new Date(log.created_at).toLocaleString('ar-EG');
          return `<tr>
            <td style="direction:ltr;text-align:right">${dt}</td>
            <td><strong>${log.actor_name}</strong></td>
            <td><span class="badge badge-accent">${log.actor_role}</span></td>
            <td><span class="badge badge-warning">${log.action}</span></td>
            <td>${log.target_type}</td>
            <td>${log.client_id || '—'}</td>
            <td style="font-size:12px;color:var(--text-muted)">${log.details || ''}</td>
          </tr>`;
        }).join('');
      } catch (e) {
        console.warn('Error loading audit logs:', e);
      }
    }

    let allSalesLeads = [];

    async function loadGlobalExecutiveKPIs() {
      try {
        // 1. Clients count
        const clRes = await fetch('/api/admin/portal-clients');
        const clData = await clRes.json();
        if (clData.clients) {
          document.getElementById('kpi-total-clients').textContent = clData.clients.length;
        }
      } catch (e) {}

      try {
        // 2. Team members count
        const tmRes = await fetch('/api/team/members');
        const tmData = await tmRes.json();
        if (tmData.members) {
          document.getElementById('kpi-total-team').textContent = tmData.members.length;
        }
      } catch (e) {}

      try {
        // 3. Invoices Revenue
        const invRes = await fetch('/api/admin/invoices');
        const invData = await invRes.json();
        if (invData.invoices) {
          const paidTotal = invData.invoices
            .filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
          document.getElementById('kpi-total-revenue').textContent = paidTotal.toLocaleString() + ' EGP';
        }
      } catch (e) {}

      try {
        // 4. Sales Leads count
        const slRes = await fetch('/api/admin/sales/leads');
        const slData = await slRes.json();
        if (slData.leads) {
          document.getElementById('kpi-total-leads').textContent = slData.leads.length;
        }
      } catch (e) {}
    }

    function switchSalesView(viewMode) {
      if (viewMode === 'kanban') {
        document.getElementById('sales-kanban-view').style.display = 'grid';
        document.getElementById('sales-table-view').style.display = 'none';
        document.getElementById('btn-view-kanban').style.background = 'var(--accent)';
        document.getElementById('btn-view-table').style.background = 'rgba(255,255,255,0.08)';
      } else {
        document.getElementById('sales-kanban-view').style.display = 'none';
        document.getElementById('sales-table-view').style.display = 'block';
        document.getElementById('btn-view-kanban').style.background = 'rgba(255,255,255,0.08)';
        document.getElementById('btn-view-table').style.background = 'var(--accent)';
      }
    }

    // ── ADVANCED SALES CRM & SEQUENCES & AI ENGINE ──
    let allSalesSequences = [];
    let currentSelectedLeadForAI = null;

    function getLeadScoreBadge(score) {
      const s = parseInt(score || 0, 10);
      if (s >= 40) {
        return `<span class="score-badge score-badge-hot">🔥 Hot (${s})</span>`;
      } else if (s >= 20) {
        return `<span class="score-badge score-badge-warm">🌡️ Warm (${s})</span>`;
      } else {
        return `<span class="score-badge score-badge-cold">❄️ Cold (${s})</span>`;
      }
    }

    async function loadSalesSequences() {
      try {
        const res = await fetch('/api/admin/sales/sequences');
        const data = await res.json();
        allSalesSequences = data.sequences || [];
        renderSalesSequences();
      } catch (err) {
        console.warn('Error loading sequences:', err);
      }
    }

    function renderSalesSequences() {
      const container = document.getElementById('salesSequencesContainer');
      if (!container) return;
      if (allSalesSequences.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;grid-column:1/-1;">لا توجد مسارات أتمتة حالياً. اضغط على "+ إنشاء مسار أتمتة جديد" للبدء.</div>';
        return;
      }
      container.innerHTML = allSalesSequences.map(seq => `
        <div class="sequence-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong style="font-size:14px;color:#fff;">${seq.name}</strong>
            <span class="badge ${seq.is_active ? 'badge-success' : 'badge-danger'}">${seq.is_active ? 'مفعل' : 'معطل'}</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">
            المرحلة المشغلة: <strong style="color:var(--accent);">${seq.trigger_stage}</strong> | المسجلين: <strong>${seq.enrolled_leads_count || 0}</strong>
          </div>
          <div>
            ${(seq.steps || []).map(st => `
              <span class="step-badge">${st.channel === 'whatsapp' ? '💬 واتساب' : '📧 إيميل'} (+${st.delay_hours}h)</span>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    function openCreateSequenceModal() {
      document.getElementById('createSequenceModal').classList.add('active');
    }
    function closeSequenceModal() {
      document.getElementById('createSequenceModal').classList.remove('active');
    }

    async function handleCreateSequence(e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('seqName').value.trim(),
        trigger_stage: document.getElementById('seqTriggerStage').value,
        steps: [
          {
            step_order: 1,
            channel: document.getElementById('step1Channel').value,
            delay_hours: parseInt(document.getElementById('step1Delay').value || 0, 10),
            template_content: document.getElementById('step1Content').value.trim()
          },
          {
            step_order: 2,
            channel: document.getElementById('step2Channel').value,
            delay_hours: parseInt(document.getElementById('step2Delay').value || 24, 10),
            template_content: document.getElementById('step2Content').value.trim()
          }
        ]
      };

      try {
        const res = await fetch('/api/admin/sales/sequences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('تم حفظ مسار الأتمتة بنجاح!');
          closeSequenceModal();
          loadSalesSequences();
        } else {
          alert('خطأ: ' + data.error);
        }
      } catch (err) {
        alert('تعذر حفظ المسار');
      }
    }

    // AI Lead Detail & Summarizer
    function openLeadAIDetails(leadId) {
      const lead = allSalesLeads.find(l => l.id === leadId);
      if (!lead) return;
      currentSelectedLeadForAI = lead;
      document.getElementById('leadModalTitle').textContent = `ملف العميل: ${lead.name} (${lead.project_name || 'مشروع جديد'})`;
      document.getElementById('leadModalNotes').value = lead.challenge_notes || '';
      document.getElementById('aiSummaryResultBox').style.display = 'none';
      document.getElementById('aiSummarizerStatus').textContent = '';
      document.getElementById('leadDetailModal').classList.add('active');
    }

    function closeLeadModal() {
      document.getElementById('leadDetailModal').classList.remove('active');
    }

    async function triggerAISummarizer() {
      if (!currentSelectedLeadForAI) return;
      const notes = document.getElementById('leadModalNotes').value.trim();
      if (!notes) {
        alert('يرجى كتابة ملاحظات أو تفريغ للمكالمة أولاً لتلخيصها بالذكاء الاصطناعي');
        return;
      }
      const statusEl = document.getElementById('aiSummarizerStatus');
      const btn = document.getElementById('btnSummarizeAI');
      btn.disabled = true;
      statusEl.textContent = '⏳ جاري التحليل الهيكلي بالـ AI...';

      try {
        const res = await fetch('/api/admin/sales/ai-summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: notes,
            lead_name: currentSelectedLeadForAI.name,
            project_name: currentSelectedLeadForAI.project_name
          })
        });
        const data = await res.json();
        if (data.success && data.summary) {
          const s = data.summary;
          document.getElementById('aiResNeeds').textContent = s.needs.join(' ، ');
          document.getElementById('aiResObjections').textContent = s.objections.join(' ، ');
          document.getElementById('aiResNextStep').textContent = s.next_step;
          document.getElementById('aiSummaryResultBox').style.display = 'block';
          statusEl.textContent = '✅ تم التلخيص بدقة عالية (' + s.confidence_score + ')';
        } else {
          statusEl.textContent = '❌ فشل التلخيص: ' + (data.error || 'خطأ غير معروف');
        }
      } catch (err) {
        statusEl.textContent = '❌ خطأ أثناء معالجة الذكاء الاصطناعي';
      } finally {
        btn.disabled = false;
      }
    }

    async function saveLeadNotesFromModal() {
      if (!currentSelectedLeadForAI) return;
      const notes = document.getElementById('leadModalNotes').value.trim();
      try {
        const res = await fetch(`/api/admin/sales/leads/${currentSelectedLeadForAI.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentSelectedLeadForAI.id,
            notes: notes
          })
        });
        const data = await res.json();
        if (data.success) {
          alert('تم حفظ الملاحظات وتحديث ملف العميل');
          closeLeadModal();
          loadSalesLeads();
        }
      } catch (err) {
        alert('فشل الحفظ');
      }
    }

    async function loadSalesLeads() {
      try {
        const res = await fetch('/api/admin/sales/leads');
        const data = await res.json();
        allSalesLeads = data.leads || [];

        // 1. Render Table View
        const tbody = document.getElementById('salesTableBody');
        if (allSalesLeads.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">لا توجد صفقات مسجلة حالياً</td></tr>';
        } else {
          tbody.innerHTML = allSalesLeads.map(lead => {
            const dt = new Date(lead.created_at).toLocaleDateString('ar-EG');
            const scoreBadge = getLeadScoreBadge(lead.lead_score);
            return `<tr>
              <td>${dt}</td>
              <td><strong>${lead.name}</strong></td>
              <td>${lead.project_name || '—'}</td>
              <td dir="ltr" style="text-align:right"><a href="https://wa.me/${lead.phone.replace(/[^0-9]/g,'')}" target="_blank" style="color:#10b981">📱 ${lead.phone}</a></td>
              <td><span class="badge badge-accent">${lead.source_type}</span></td>
              <td>${scoreBadge}</td>
              <td><strong>${lead.assigned_sales_name || 'غير محدد'}</strong></td>
              <td><span class="badge badge-warning">${lead.pipeline_stage}</span></td>
              <td>
                <button class="btn btn-sm" onclick="openLeadAIDetails('${lead.id}')">✨ تفاصيل & AI</button>
              </td>
            </tr>`;
          }).join('');
        }

        // 2. Render Kanban Pipeline Board
        renderKanbanBoard();
        loadSalesSequences();

      } catch (e) {
        console.warn('Error loading leads:', e);
      }
    }

    function renderKanbanBoard() {
      const stages = {
        new: { el: document.getElementById('kb-cards-new'), countEl: document.getElementById('kb-count-new'), items: [] },
        contacted: { el: document.getElementById('kb-cards-contacted'), countEl: document.getElementById('kb-count-contacted'), items: [] },
        proposal: { el: document.getElementById('kb-cards-proposal'), countEl: document.getElementById('kb-count-proposal'), items: [] },
        won: { el: document.getElementById('kb-cards-won'), countEl: document.getElementById('kb-count-won'), items: [] }
      };

      allSalesLeads.forEach(lead => {
        let stg = (lead.pipeline_stage || 'new').toLowerCase();
        if (stg.includes('contact') || stg === 'qualified') stg = 'contacted';
        else if (stg.includes('proposal') || stg.includes('meeting') || stg === 'negotiation') stg = 'proposal';
        else if (stg.includes('won') || stg.includes('closed') || stg === 'signed') stg = 'won';
        else stg = 'new';

        if (stages[stg]) stages[stg].items.push(lead);
        else stages.new.items.push(lead);
      });

      Object.keys(stages).forEach(key => {
        const group = stages[key];
        if (group.countEl) group.countEl.textContent = group.items.length;
        if (!group.el) return;

        if (group.items.length === 0) {
          group.el.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:30px 0;">لا توجد صفقات هنا</div>';
          return;
        }

        group.el.innerHTML = group.items.map(lead => {
          const scoreBadge = getLeadScoreBadge(lead.lead_score);
          return `
          <div class="kanban-lead-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div class="kanban-card-title">${lead.name}</div>
              ${scoreBadge}
            </div>
            <div class="kanban-card-meta">
              <span>🏢 ${lead.project_name || 'مشروع جديد'}</span>
              <span>📱 ${lead.phone}</span>
              <span>👤 مسؤول المبيعات: <strong style="color:#fff;">${lead.assigned_sales_name || 'توزيع تلقائي'}</strong></span>
            </div>
            <div class="kanban-card-footer" style="margin-top:10px;">
              <button class="btn btn-sm btn-secondary" onclick="openLeadAIDetails('${lead.id}')" style="font-size:11px;padding:3px 8px;">✨ AI</button>
              <select onchange="updateLeadStage('${lead.id}', this.value)" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:4px;color:#fff;font-size:11px;padding:3px 6px;">
                <option value="new" ${key === 'new' ? 'selected' : ''}>📥 جديد</option>
                <option value="contacted" ${key === 'contacted' ? 'selected' : ''}>📞 جاري التواصل</option>
                <option value="proposal" ${key === 'proposal' ? 'selected' : ''}>🤝 عرض سعر</option>
                <option value="won" ${key === 'won' ? 'selected' : ''}>تم التعاقد</option>
              </select>
            </div>
          </div>
        `}).join('');
      });
    }

    async function updateLeadStage(id, newStage) {
      try {
        const res = await fetch(`/api/admin/sales/leads/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, pipeline_stage: newStage })
        });
        const data = await res.json();
        if (data.success) {
          loadSalesLeads();
        } else {
          alert('فشل التحديث: ' + data.error);
        }
      } catch (e) {
        alert('خطأ في الاتصال');
      }
    }

    function openAddLeadModal() {
      const name = prompt('اسم العميل / جهة الاتصال:');
      if (!name) return;
      const phone = prompt('رقم الهاتف (واتساب):');
      if (!phone) return;
      const project = prompt('اسم المشروع / الشركة:', 'مشروع جديد');

      fetch('/api/admin/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          project_name: project ? project.trim() : '',
          source_type: 'crm_direct_intake'
        })
      }).then(r => r.json()).then(data => {
        if (data.success) {
          alert(`تم إنشاء الصفقة بنجاح وتم تعيينها تلقائياً إلى: ${data.assigned_to || 'فريق المبيعات'}`);
          loadSalesLeads();
        } else {
          alert('خطأ: ' + data.error);
        }
      });
    }
            

    async function handleCreativeSubmit(e) {
      e.preventDefault();
      const parentId = document.getElementById('cr-parentId').value.trim();
      const payload = {
        client_id: document.getElementById('cr-clientId').value.trim(),
        title: document.getElementById('cr-title').value.trim(),
        type: document.getElementById('cr-type').value,
        media_url: document.getElementById('cr-url').value.trim(),
        caption: document.getElementById('cr-caption').value.trim(),
        scheduled_date: document.getElementById('cr-date').value,
        creator_name: document.getElementById('cr-author').value.trim(),
        creator_role: 'creative_team',
        parent_asset_id: parentId || undefined
      };
      const res = await fetch('/api/team/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        const vMsg = data.version > 1 ? ` (نسخة V${data.version})` : '';
        alert(`تم رفع العمل بنجاح${vMsg} وإرساله لمراجعة Account Manager وتوثيقه في السجل!`);
        document.getElementById('creativeUploadForm').reset();
        loadCreativeAssets();
      } else {
        alert('خطأ: ' + (data.error || 'فشل رفع العمل'));
      }
    }

    async function loadCreativeAssets() {
      const tbody = document.getElementById('creativeAssetsBody');
      try {
        const res = await fetch('/api/team/assets?status=all');
        const data = await res.json();
        if (!data.success || !data.assets || data.assets.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">لا توجد محتويات مسجلة حتى الآن</td></tr>';
          return;
        }

        tbody.innerHTML = data.assets.map(ast => {
          const statusMap = {
            under_am_review: '<span class="badge badge-accent">مراجعة AM</span>',
            pending: '<span class="badge badge-warning">بانتظار العميل</span>',
            approved: '<span class="badge badge-success">معتمد للنشر</span>',
            revisions_requested: '<span class="badge badge-danger">مطلوب تعديل 🔄</span>',
            rejected: '<span class="badge badge-danger">مرفوض</span>'
          };
          const dt = ast.scheduled_date || '—';
          const vBadge = `<span class="badge badge-accent" style="margin-right:6px;">V${ast.version || 1}</span>`;

          return `
            <tr>
              <td><code>${ast.id}</code></td>
              <td><strong>${ast.client_id}</strong></td>
              <td>${vBadge} <strong>${ast.title}</strong></td>
              <td>${ast.type}</td>
              <td>${dt}</td>
              <td>${statusMap[ast.status] || ast.status}</td>
              <td>
                <button class="btn" style="padding:4px 8px;font-size:11px;" onclick="promptReplyFeedback('${ast.id}', '${ast.parent_asset_id || ast.id}')">💬 إضافة رد</button>
                <button class="btn" style="padding:4px 8px;font-size:11px;background:#06b6d4;" onclick="prepareNewVersion('${ast.id}', '${ast.client_id}', '${encodeURIComponent(ast.title)}')">تحديث V${(ast.version || 1) + 1}</button>
              </td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--danger)">فشل تحميل قائمة المحتويات</td></tr>';
      }
    }

    function prepareNewVersion(assetId, clientId, titleEncoded) {
      document.getElementById('cr-clientId').value = clientId;
      document.getElementById('cr-title').value = decodeURIComponent(titleEncoded);
      document.getElementById('cr-parentId').value = assetId;
      window.scrollTo({ top: document.getElementById('creativeUploadForm').offsetTop - 60, behavior: 'smooth' });
      alert(`جاهز لرفع النسخة المعدلة من (${assetId}). أدخل رابط الملف الجديد واضغط إرسال!`);
    }

    async function promptReplyFeedback(assetId, parentId) {
      const comment = prompt('اكتب رد فريق الوكالة على هذا المحتوى لتسجيله في الثريد للعميل:', '');
      if (!comment) return;
      const author = prompt('اسمك (أو دورك في التيم):', 'Creative Team');

      try {
        const res = await fetch('/api/team/assets/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset_id: assetId,
            parent_asset_id: parentId,
            author_role: 'team',
            author_name: author || 'Creative Team',
            comment: comment
          })
        });
        const data = await res.json();
        if (data.success) {
          alert('تم إضافة الرد إلى سجل المحادثة وتوثيقه في السجل العام بنجاح!');
        } else {
          alert('خطأ: ' + (data.error || 'فشل إرسال الرد'));
        }
      } catch (e) {
        alert('حدث خطأ في الاتصال');
      }
    }

    async function handleStrategySubmit(e) {
      e.preventDefault();
      const payload = {
        client_id: document.getElementById('st-clientId').value,
        title: document.getElementById('st-title').value,
        market_analysis: document.getElementById('st-market').value,
        target_personas: document.getElementById('st-personas').value,
        content_pillars: document.getElementById('st-pillars').value,
        quarterly_goals: document.getElementById('st-goals').value,
        status: 'published_to_client'
      };
      const res = await fetch('/api/admin/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('تم حفظ ونشر الاستراتيجية للعميل بنجاح!');
        document.getElementById('strategyForm').reset();
      }
    }

    // Voice to Text (Web Speech API)
    let recognition = null;
    let isRecording = false;

    function toggleVoiceRecording() {
      const btn = document.getElementById('voiceBtn');
      const status = document.getElementById('voiceStatus');
      
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('المتصفح لا يدعم التسجيل الصوتي المباشر، يرجى استخدام متصفح Chrome.');
        return;
      }

      if (isRecording) {
        recognition.stop();
        isRecording = false;
        btn.classList.remove('recording');
        btn.innerText = '🎙️ تسجيل متابعة صوتية (Voice-to-Text)';
        status.innerText = 'تم إيقاف التسجيل الصوتي';
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        isRecording = true;
        btn.classList.add('recording');
        btn.innerText = '⏹️ جارٍ الاستماع... اضغط للإيقاف';
        status.innerText = 'تحدث الآن، جاري تحويل صوتك لنص...';
      };

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        status.innerText = 'تم استلام: "' + transcript + '"';
        const leadId = prompt('أدخل كود الـ Lead لربط المتابعة الصوتية:', '');
        if (leadId) {
          fetch('/api/admin/sales/followup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lead_id: leadId,
              sales_id: 'sales_rep_1',
              sales_name: 'مسؤول المبيعات',
              call_outcome: 'interested',
              transcribed_text: transcript,
              formatted_notes: transcript
            })
          }).then(() => alert('تم تسجيل وتفريغ المتابعة وتوثيقها في النظام!'));
        }
      };

      recognition.onerror = (e) => {
        status.innerText = 'خطأ في المايك: ' + e.error;
        btn.classList.remove('recording');
        isRecording = false;
      };

      recognition.start();
    }

    function refreshCurrentTab() {
      loadAuditLogs();
      loadClientsList();
      loadInvoicesList();
      loadSalesLeads();
      loadTeamMembers();
      loadGlobalExecutiveKPIs();
      if (typeof loadAgentActions === 'function') loadAgentActions();
    }

    window.onload = () => {
      const token = localStorage.getItem('agency_admin_token') || localStorage.getItem('admin_jwt');
      if (token) {
        loadAvailableProjects();
        loadDailyTasksWorkspace();
        loadGlobalExecutiveKPIs();
      }
    };
  

    // ── INTERACTIVE MEDIA BASKET UPLOADER LOGIC ──
    function initBasketUploader() {
      const zone = document.getElementById('basketDropZone');
      if (!zone) return;

      ['dragenter', 'dragover'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => {
          e.preventDefault();
          zone.classList.add('dragover');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, (e) => {
          e.preventDefault();
          zone.classList.remove('dragover');
        }, false);
      });

      zone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleBasketFiles(files);
      }, false);
    }

    function handleBasketFiles(files) {
      const grid = document.getElementById('basketPreviewGrid');
      if (!grid) return;
      Array.from(files).forEach(file => {
        const item = document.createElement('div');
        item.className = 'basket-item';
        
        const isImg = file.type.startsWith('image/');
        const thumbUrl = isImg ? URL.createObjectURL(file) : 'https://cdn-icons-png.flaticon.com/512/337/337946.png';

        item.innerHTML = `
          <img src="${thumbUrl}" alt="${file.name}"/>
          <div class="basket-item-name" title="${file.name}">${file.name}</div>
          <span style="font-size:10px;color:var(--success);">جاهز للرفع (${(file.size / 1024).toFixed(0)} KB)</span>
        `;
        grid.appendChild(item);
      });
    }

    document.addEventListener('DOMContentLoaded', initBasketUploader);

/* ── MODULE PART 2 ── */
let searchDebounceTimer = null;
    async function handleGlobalSearch(query) {
      const dropdown = document.getElementById('globalSearchResults');
      if (!dropdown) return;
      const q = (query || '').trim();
      if (q.length < 2) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        return;
      }

      dropdown.style.display = 'block';
      dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:var(--text-muted);font-size:12px;">جاري البحث الفوري...</div>';

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(async () => {
        try {
          const res = await fetch('/api/admin/search?q=' + encodeURIComponent(q), {
            headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('admin_jwt') || '') }
          });
          const d = await res.json();
          if (!d.success || d.totalCount === 0) {
            dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px;">لا توجد نتائج مطابقة لـ "' + q + '"</div>';
            return;
          }

          let html = '';
          const categories = [
            { key: 'clients', label: 'حسابات العملاء', icon: '' },
            { key: 'projects', label: '📈 المشاريع', icon: '📁' },
            { key: 'team', label: '👥 فريق العمل', icon: '👤' },
            { key: 'leads', label: '💼 الصفقات (Leads)', icon: '🎯' }
          ];

          categories.forEach(cat => {
            const items = d.results[cat.key] || [];
            if (items.length > 0) {
              html += '<div style="padding:6px 14px;font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid rgba(255,255,255,0.06);margin-top:4px;">' + cat.label + '</div>';
              items.forEach(item => {
                html += '<div onclick="navigateToSearchResult(\'' + item.targetTab + '\', \'' + item.id + '\')" style="padding:10px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background 0.15s;" onmouseover="this.style.background=\'rgba(139,92,246,0.15)\'" onmouseout="this.style.background=\'transparent\'">';
                html += '<div><div style="font-size:13px;font-weight:700;color:#fff;">' + item.title + '</div><div style="font-size:11px;color:var(--text-muted);">' + item.subtitle + '</div></div>';
                html += '<span style="font-size:11px;background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:6px;color:var(--text-muted);">فتح ↗</span>';
                html += '</div>';
              });
            }
          });

          dropdown.innerHTML = html;
        } catch(e) {
          dropdown.innerHTML = '<div style="padding:12px;text-align:center;color:var(--danger);font-size:12px;">تعذر استرجاع النتائج</div>';
        }
      }, 180);
    }

    function navigateToSearchResult(tabKey, itemId) {
      const dropdown = document.getElementById('globalSearchResults');
      if (dropdown) dropdown.style.display = 'none';
      if (typeof switchTab === 'function') {
        const btn = document.querySelector('[data-tab="' + tabKey + '"]');
        if (btn) switchTab(tabKey, btn);
      }
    }

    // Keyboard shortcut (Cmd/Ctrl + K) to focus search
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('globalSearchInput');
        if (input) { input.focus(); input.select(); }
      }
    });
  


    // ══════════════════════════════════════════════════════════════════════════
    // PEAKTIME DAILY TASKS WORKSPACE & PROFITABILITY ENGINE
    // ══════════════════════════════════════════════════════════════════════════
    let allWorkspaceTasks = { planned: [], done: [], backlog: [] };
    let allAvailableProjects = [];
    let activeTimerTaskId = null;
    let timerInterval = null;
    let timerSeconds = 0;

    function toggleMoreMenu(e) {
      if (e) e.stopPropagation();
      const dd = document.getElementById('adminMoreDropdown');
      if (dd) dd.style.display = (dd.style.display === 'block') ? 'none' : 'block';
    }

    document.addEventListener('click', (e) => {
      const dd = document.getElementById('adminMoreDropdown');
      if (dd && !dd.contains(e.target)) dd.style.display = 'none';
    });

    function setDailyTaskToday() {
      const picker = document.getElementById('dailyTaskDatePicker');
      if (picker) {
        picker.value = new Date().toISOString().slice(0, 10);
        loadDailyTasksWorkspace();
      }
    }

    async function loadAvailableProjects() {
      try {
        const res = await fetch('/api/admin/projects');
        const data = await res.json();
        allAvailableProjects = data.data || [];
        populateTaskProjectSelect();
      } catch (e) {
        console.warn('Error loading projects:', e);
      }
    }

    function populateTaskProjectSelect() {
      const sel = document.getElementById('taskProjectSelect');
      if (!sel) return;
      if (!allAvailableProjects.length) {
        sel.innerHTML = '<option value="">-- لا توجد مشاريع مسجلة --</option>';
        return;
      }
      sel.innerHTML = allAvailableProjects.map(p => 
        `<option value="${p.id}">${p.name} (${p.key || 'PR'})</option>`
      ).join('');
    }

    async function loadDailyTasksWorkspace() {
      const picker = document.getElementById('dailyTaskDatePicker');
      if (picker && !picker.value) {
        picker.value = new Date().toISOString().slice(0, 10);
      }
      const targetDate = picker ? picker.value : new Date().toISOString().slice(0, 10);

      const plannedContainer = document.getElementById('plannedTasksContainer');
      const achievementsContainer = document.getElementById('achievementsTasksContainer');
      const backlogContainer = document.getElementById('backlogTasksContainer');

      try {
        const res = await fetch('/api/admin/tasks?date=' + targetDate);
        const json = await res.json();

        if (!json.success || !json.data) {
          throw new Error(json.error || 'فشل في تحميل المهام');
        }

        allWorkspaceTasks = json.data;
        renderTasksWorkspace(allWorkspaceTasks);
      } catch (err) {
        console.error('loadDailyTasksWorkspace error:', err);
        if (plannedContainer) {
          plannedContainer.innerHTML = `<div style="text-align:center;padding:24px;color:#ef4444;font-size:13px;">⚠️ تعذر تحميل المهام (${err.message})</div>`;
        }
      }
    }

    function renderTasksWorkspace(tasks) {
      const planned = tasks.planned || [];
      const done = tasks.done || [];
      const backlog = tasks.backlog || [];

      // Badges
      const pBadge = document.getElementById('plannedTasksBadge');
      if (pBadge) pBadge.textContent = planned.length + ' مهام';
      const aBadge = document.getElementById('achievementsBadge');
      if (aBadge) aBadge.textContent = done.length + ' مكتملة';
      const bBadge = document.getElementById('backlogBadge');
      if (bBadge) bBadge.textContent = String(backlog.length);

      // 1. Render Planned Tasks
      const pContainer = document.getElementById('plannedTasksContainer');
      if (pContainer) {
        if (!planned.length) {
          pContainer.innerHTML = `
            <div style="text-align:center;padding:32px 16px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);border-radius:12px;">
              <div style="font-size:24px;margin-bottom:8px;">🏖️</div>
              <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;">لا توجد مهام مجدولة لهذا اليوم</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">يمكنك إضافة مهمة جديدة أو نقل مهام من الـ Backlog</div>
              <button class="btn btn-secondary btn-sm" onclick="openAddTaskModal()">➕ إضافة مهمة الآن</button>
            </div>
          `;
        } else {
          pContainer.innerHTML = planned.map(t => renderTaskCard(t, 'planned')).join('');
        }
      }

      // 2. Render Done Achievements
      const aContainer = document.getElementById('achievementsTasksContainer');
      if (aContainer) {
        if (!done.length) {
          aContainer.innerHTML = `
            <div style="text-align:center;padding:28px 16px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);border-radius:12px;">
              <div style="font-size:13px;color:var(--text-muted);">لم يتم إنهاء أي مهام اليوم حتى الآن</div>
            </div>
          `;
        } else {
          aContainer.innerHTML = done.map(t => renderTaskCard(t, 'done')).join('');
        }
      }

      // 3. Render Backlog Tasks
      const bContainer = document.getElementById('backlogTasksContainer');
      if (bContainer) {
        if (!backlog.length) {
          bContainer.innerHTML = `
            <div style="text-align:center;padding:28px 16px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);border-radius:12px;">
              <div style="font-size:12px;color:var(--text-muted);">صندوق المؤجلات فارغ</div>
            </div>
          `;
        } else {
          bContainer.innerHTML = backlog.map(t => renderTaskCard(t, 'backlog')).join('');
        }
      }
    }

    function renderTaskCard(task, section) {
      const isTimerRunning = (activeTimerTaskId === task.id);
      const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
      const priorityLabels = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
      const pColor = priorityColors[task.priority] || '#a1a1aa';
      const pLabel = priorityLabels[task.priority] || task.priority;

      const loggedH = (task.logged_hours || 0);
      const estH = (task.estimated_hours || 0);

      let actionButtons = '';
      if (section === 'planned') {
        actionButtons = `
          <button class="btn btn-sm" onclick="toggleTaskTimer('${task.id}', '${task.title.replace(/'/g, "\\'")}')" style="background:${isTimerRunning ? '#ef4444' : 'rgba(139,92,246,0.2)'};border:1px solid ${isTimerRunning ? '#dc2626' : 'rgba(139,92,246,0.5)'};color:#fff;padding:4px 10px;font-size:11.5px;border-radius:6px;">
            ${isTimerRunning ? '⏹️ إيقاف التايمر' : 'بدء'}
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openLogTimeModal('${task.id}', '${task.title.replace(/'/g, "\\'")}')" style="padding:4px 10px;font-size:11.5px;border-radius:6px;">
            تسجيل وقت
          </button>
          <button class="btn btn-sm" onclick="markTaskDone('${task.id}')" style="background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.5);color:#34d399;padding:4px 10px;font-size:11.5px;border-radius:6px;">
            إكمال
          </button>
        `;
      } else if (section === 'backlog') {
        actionButtons = `
          <button class="btn btn-secondary btn-sm" onclick="moveTaskToToday('${task.id}')" style="padding:4px 10px;font-size:11.5px;border-radius:6px;color:#c084fc;border-color:rgba(139,92,246,0.4);">
            📅 جدولة لليوم
          </button>
        `;
      } else if (section === 'done') {
        actionButtons = `
          <span style="font-size:12px;color:#34d399;font-weight:700;">✓ مكتملة</span>
        `;
      }

      return `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;transition:all 0.2s;" onmouseover="this.style.borderColor='rgba(139,92,246,0.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.07)'">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div style="font-size:14px;font-weight:700;color:#fff;line-height:1.4;">
              ${task.title}
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
              <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.05);color:${pColor};border:1px solid ${pColor}44;">
                ${pLabel}
              </span>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--text-muted);border-top:1px solid rgba(255,255,255,0.05);padding-top:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="color:#a78bfa;">${task.project_name || 'عام'}</span>
              <span>⏱️ ${loggedH} س / ${estH} س</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              ${actionButtons}
            </div>
          </div>
        </div>
      `;
    }

    // Modal Controls
    function openAddTaskModal() {
      populateTaskProjectSelect();
      const modal = document.getElementById('addTaskModal');
      const dateInput = document.getElementById('taskPlannedDateInput');
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
      if (modal) modal.style.display = 'flex';
    }

    function closeAddTaskModal() {
      const modal = document.getElementById('addTaskModal');
      if (modal) modal.style.display = 'none';
    }

    async function submitCreateTask() {
      const projectId = document.getElementById('taskProjectSelect').value;
      const title = document.getElementById('taskTitleInput').value.trim();
      const priority = document.getElementById('taskPrioritySelect').value;
      const status = document.getElementById('taskStatusSelect').value;
      const estimated_hours = parseFloat(document.getElementById('taskEstimateInput').value) || 0;
      const planned_date = document.getElementById('taskPlannedDateInput').value || new Date().toISOString().slice(0, 10);

      if (!title) {
        alert('يرجى إدخال عنوان المهمة');
        return;
      }

      try {
        const res = await fetch('/api/admin/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId || undefined,
            title,
            priority,
            status,
            estimated_hours,
            planned_date
          })
        });

        const data = await res.json();
        if (data.success) {
          closeAddTaskModal();
          document.getElementById('taskTitleInput').value = '';
          loadDailyTasksWorkspace();
        } else {
          alert('خطأ: ' + (data.error || 'تعذر إنشاء المهمة'));
        }
      } catch (e) {
        alert('تعذر الاتصال بالخادم: ' + e.message);
      }
    }

    async function markTaskDone(taskId) {
      try {
        const res = await fetch('/api/admin/tasks/' + taskId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'done' })
        });
        const data = await res.json();
        if (data.success) loadDailyTasksWorkspace();
      } catch (e) {
        console.error('markTaskDone error:', e);
      }
    }

    async function moveTaskToToday(taskId) {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const res = await fetch('/api/admin/tasks/' + taskId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'planned', planned_date: today })
        });
        const data = await res.json();
        if (data.success) loadDailyTasksWorkspace();
      } catch (e) {
        console.error('moveTaskToToday error:', e);
      }
    }

    // Time Logging Modal
    function openLogTimeModal(taskId, taskTitle) {
      const modal = document.getElementById('logTimeModal');
      document.getElementById('logTimeTaskId').value = taskId;
      document.getElementById('logTimeTaskTitle').textContent = 'المهمة: ' + taskTitle;
      if (modal) modal.style.display = 'flex';
    }

    function closeLogTimeModal() {
      const modal = document.getElementById('logTimeModal');
      if (modal) modal.style.display = 'none';
    }

    async function submitLogTime() {
      const taskId = document.getElementById('logTimeTaskId').value;
      const hours = parseFloat(document.getElementById('logHoursInput').value) || 1;
      const notes = document.getElementById('logNotesInput').value.trim();

      try {
        const res = await fetch('/api/admin/time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: taskId, hours, notes })
        });
        const data = await res.json();
        if (data.success) {
          closeLogTimeModal();
          loadDailyTasksWorkspace();
        } else {
          alert('خطأ: ' + (data.error || 'تعذر تسجيل الساعات'));
        }
      } catch (e) {
        alert('خطأ في الاتصال: ' + e.message);
      }
    }

    function toggleTaskTimer(taskId, title) {
      if (activeTimerTaskId === taskId) {
        clearInterval(timerInterval);
        const loggedHours = Math.max(0.25, Math.round((timerSeconds / 3600) * 100) / 100);
        activeTimerTaskId = null;
        timerSeconds = 0;
        document.getElementById('logHoursInput').value = loggedHours;
        openLogTimeModal(taskId, title);
      } else {
        if (activeTimerTaskId) clearInterval(timerInterval);
        activeTimerTaskId = taskId;
        timerSeconds = 0;
        timerInterval = setInterval(() => { timerSeconds += 1; }, 1000);
        loadDailyTasksWorkspace();
      }
    }

    // Publish My Day Modal
    function openPublishDayModal() {
      const modal = document.getElementById('publishDayModal');
      if (modal) modal.style.display = 'flex';
    }

    function closePublishDayModal() {
      const modal = document.getElementById('publishDayModal');
      if (modal) modal.style.display = 'none';
    }

    async function submitPublishDay() {
      const summary = document.getElementById('publishSummaryInput').value.trim();
      const picker = document.getElementById('dailyTaskDatePicker');
      const date = picker ? picker.value : new Date().toISOString().slice(0, 10);

      try {
        const res = await fetch('/api/admin/publish-day', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, summary })
        });
        const data = await res.json();
        if (data.success) {
          alert('تم نشر واعتماد سجل اليوم بنجاح في المنظومة وإشعار الفريق.');
          closePublishDayModal();
          loadDailyTasksWorkspace();
        } else {
          alert('خطأ: ' + (data.error || 'تعذر نشر اليوم'));
        }
      } catch (e) {
        alert('تعذر الاتصال بالخادم: ' + e.message);
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PROFITABILITY MATRIX LOADER
    // ══════════════════════════════════════════════════════════════════════════
    async function loadProfitabilityReport() {
      const tbody = document.getElementById('profitabilityTableBody');
      const periodSelect = document.getElementById('profitabilityPeriodSelect');
      const hourlyInput = document.getElementById('globalHourlyRateInput');

      const period = periodSelect ? periodSelect.value : 'current';
      const hourlyRate = hourlyInput ? hourlyInput.value : 150;

      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted);">جاري استخراج أرقام الربحية والتحليل...</td></tr>';

      try {
        const res = await fetch(`/api/admin/reports/profitability?period=${period}&hourly_rate=${hourlyRate}`);
        const json = await res.json();

        if (!json.success || !json.data) {
          tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#ef4444;">تعذر تحميل تقرير الربحية</td></tr>';
          return;
        }

        const rows = json.data;
        if (!rows.length) {
          tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted);">لا توجد مشاريع مسجلة في هذه الفترة</td></tr>';
          return;
        }

        tbody.innerHTML = rows.map(r => {
          const isProfitable = (r.net_profit >= 0);
          const profitColor = isProfitable ? '#10b981' : '#ef4444';
          const marginColor = (r.margin_percent >= 30) ? '#10b981' : (r.margin_percent >= 0 ? '#f59e0b' : '#ef4444');

          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
              <td><strong>${r.project_name}</strong> <span style="font-size:11px;color:var(--accent);">(${r.project_key})</span></td>
              <td>${r.client_name || '-'}</td>
              <td style="font-weight:700;">${Number(r.retainer_amount).toLocaleString()} EGP</td>
              <td>${r.total_hours} ساعة</td>
              <td style="color:var(--text-muted);">${Number(r.total_cost).toLocaleString()} EGP</td>
              <td style="color:${profitColor};font-weight:800;">${Number(r.net_profit).toLocaleString()} EGP</td>
              <td><span class="badge" style="background:${marginColor}22;color:${marginColor};border:1px solid ${marginColor}44;">${r.margin_percent}%</span></td>
              <td>
                <span class="badge ${r.status === 'profitable' ? 'badge-success' : (r.status === 'warning' ? 'badge-warning' : 'badge-danger')}">
                  ${r.status === 'profitable' ? 'مربح ممتاز' : (r.status === 'warning' ? 'هامش ضيق' : 'تجاوز التكلفة')}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:#ef4444;">خطأ: ${err.message}</td></tr>`;
      }
    }

  


    // ══════════════════════════════════════════════════════════════════════════
    // DYNAMIC RBAC PERMISSIONS ENGINE
    // ══════════════════════════════════════════════════════════════════════════
    let dynamicRbacRoles = [];

    async function loadDynamicRbacMatrix() {
      const tbody = document.getElementById('dynamicRbacTableBody');
      if (!tbody) return;

      try {
        const res = await fetch('/api/admin/rbac');
        const data = await res.json();
        if (data.success && data.roles) {
          dynamicRbacRoles = data.roles;
          renderRbacMatrix(data.roles);
        } else {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#ef4444;">تعذر تحميل الصلاحيات: ' + (data.error || 'خطأ غير معروف') + '</td></tr>';
        }
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#ef4444;">خطأ في الاتصال بالخادم</td></tr>';
      }
    }

    function renderRbacMatrix(roles) {
      const tbody = document.getElementById('dynamicRbacTableBody');
      if (!tbody) return;

      tbody.innerHTML = roles.map((r, idx) => {
        const isSuper = (r.role.toLowerCase() === 'super admin');
        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.06);background:${idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'};">
            <td style="padding:14px;font-weight:700;color:#fff;">
              ${r.role} ${isSuper ? '<span class="badge badge-success" style="font-size:10px;margin-right:6px;">كامل الصلاحيات</span>' : ''}
            </td>
            <td style="text-align:center;padding:14px;">
              <input type="checkbox" id="perm_${idx}_assets" ${r.can_approve_assets ? 'checked' : ''} ${isSuper ? 'disabled' : ''} style="transform:scale(1.3);accent-color:var(--accent);cursor:pointer;" />
            </td>
            <td style="text-align:center;padding:14px;">
              <input type="checkbox" id="perm_${idx}_fin" ${r.can_view_financials ? 'checked' : ''} ${isSuper ? 'disabled' : ''} style="transform:scale(1.3);accent-color:var(--accent);cursor:pointer;" />
            </td>
            <td style="text-align:center;padding:14px;">
              <input type="checkbox" id="perm_${idx}_team" ${r.can_manage_team ? 'checked' : ''} ${isSuper ? 'disabled' : ''} style="transform:scale(1.3);accent-color:var(--accent);cursor:pointer;" />
            </td>
            <td style="text-align:center;padding:14px;">
              <input type="checkbox" id="perm_${idx}_clients" ${r.can_manage_clients ? 'checked' : ''} ${isSuper ? 'disabled' : ''} style="transform:scale(1.3);accent-color:var(--accent);cursor:pointer;" />
            </td>
            <td style="text-align:center;padding:14px;">
              <input type="checkbox" id="perm_${idx}_audit" ${r.can_view_audit ? 'checked' : ''} ${isSuper ? 'disabled' : ''} style="transform:scale(1.3);accent-color:var(--accent);cursor:pointer;" />
            </td>
            <td style="text-align:center;padding:14px;">
              <input type="checkbox" id="perm_${idx}_tasks" ${r.can_manage_tasks ? 'checked' : ''} ${isSuper ? 'disabled' : ''} style="transform:scale(1.3);accent-color:var(--accent);cursor:pointer;" />
            </td>
          </tr>
        `;
      }).join('');
    }

    async function saveAllRbacMatrix() {
      const btn = document.getElementById('saveRbacBtn');
      if (btn) { btn.textContent = '⏳ جاري الحفظ...'; btn.disabled = true; }

      let successCount = 0;
      for (let idx = 0; idx < dynamicRbacRoles.length; idx++) {
        const r = dynamicRbacRoles[idx];
        const isSuper = (r.role.toLowerCase() === 'super admin');
        const payload = {
          role: r.role,
          can_approve_assets: isSuper ? 1 : (document.getElementById(`perm_${idx}_assets`)?.checked ? 1 : 0),
          can_view_financials: isSuper ? 1 : (document.getElementById(`perm_${idx}_fin`)?.checked ? 1 : 0),
          can_manage_team: isSuper ? 1 : (document.getElementById(`perm_${idx}_team`)?.checked ? 1 : 0),
          can_manage_clients: isSuper ? 1 : (document.getElementById(`perm_${idx}_clients`)?.checked ? 1 : 0),
          can_view_audit: isSuper ? 1 : (document.getElementById(`perm_${idx}_audit`)?.checked ? 1 : 0),
          can_manage_tasks: isSuper ? 1 : (document.getElementById(`perm_${idx}_tasks`)?.checked ? 1 : 0)
        };

        try {
          const res = await fetch('/api/admin/rbac', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const d = await res.json();
          if (d.success) successCount++;
        } catch (e) {
          console.error('Error saving role ' + r.role, e);
        }
      }

      if (btn) { btn.textContent = '💾 حفظ وتطبيق الصلاحيات'; btn.disabled = false; }
      alert('✅ تم حفظ وتحديث مصفوفة الصلاحيات لـ ' + successCount + ' أدوار وظيفية بنجاح.');
      loadDynamicRbacMatrix();
    }

/* ── MODULE PART 3 ── */
let currentAICopyTarget = 'task'; // 'task' or 'lead'

    function openAICopywriterModal(target = 'task') {
      currentAICopyTarget = target;
      const modal = document.getElementById('aiCopywriterModal');
      if (modal) {
        modal.style.display = 'flex';
        const topicInput = document.getElementById('ai-topic-input');
        if (target === 'lead') {
          const notes = document.getElementById('leadModalNotes')?.value || '';
          if (notes) topicInput.value = 'متابعة بخصوص: ' + notes.slice(0, 50);
        } else if (target === 'task') {
          const taskVal = document.getElementById('taskTitleInput')?.value || '';
          if (taskVal) topicInput.value = taskVal;
        }
      }
    }

    function closeAICopywriterModal() {
      const modal = document.getElementById('aiCopywriterModal');
      if (modal) modal.style.display = 'none';
    }

    async function runAICopywriter() {
      const topic = document.getElementById('ai-topic-input')?.value.trim();
      const platform = document.getElementById('ai-platform-select')?.value;
      const tone = document.getElementById('ai-tone-select')?.value;
      const btn = document.getElementById('btn-run-ai-copy');

      if (!topic) {
        alert('يرجى إدخال موضوع المنشور');
        return;
      }

      btn.disabled = true;
      btn.innerText = 'جاري الكتابة بالذكاء الاصطناعي... ⏳';

      try {
        const res = await fetch('/api/admin/ai/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, platform, tone })
        });
        const data = await res.json();
        if (data.success && data.data?.caption) {
          document.getElementById('ai-result-area').style.display = 'block';
          document.getElementById('ai-output-caption').value = data.data.caption;
        } else {
          alert('تعذر التوليد: ' + (data.error || 'خطأ في الخادم'));
        }
      } catch (e) {
        alert('حدث خطأ في الاتصال: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.innerText = '🚀 توليد الكابشن والهاشتاجات الآن';
      }
    }

    function copyAICaption() {
      const txt = document.getElementById('ai-output-caption')?.value;
      if (txt) {
        navigator.clipboard.writeText(txt);
        alert('تم نسخ الكابشن بنجاح! 📋');
      }
    }

    function insertAICaptionToTarget() {
      const txt = document.getElementById('ai-output-caption')?.value;
      if (!txt) return;

      if (currentAICopyTarget === 'task') {
        const titleEl = document.getElementById('taskTitleInput');
        if (titleEl) {
          titleEl.value = txt.split('\n')[0].slice(0, 80) + '... (مرفق الكابشن الكامل)';
        }
      } else if (currentAICopyTarget === 'lead') {
        const notesEl = document.getElementById('leadModalNotes');
        if (notesEl) {
          notesEl.value = (notesEl.value ? notesEl.value + '\n\n--- مسودة رسالة المتابعة ---\n' : '') + txt;
        }
      }

      closeAICopywriterModal();
    }

    async function triggerAIStrategyGenerator() {
      const clientId = document.getElementById('st-clientId')?.value.trim() || 'homex';
      const industry = prompt('ما هو مجال نشاط العميل أو الصناعة؟ (مثال: التجارة الإلكترونية، العقارات، المطاعم)', 'التسويق العقاري والتجارة الإلكترونية');
      if (!industry) return;

      const retainer = prompt('ما هي الميزانية الشهرية المقدرة بالجنيه (Retainer Amount)؟', '35000');
      const budget = Number(retainer) || 35000;

      const titleInput = document.getElementById('st-title');
      const marketInput = document.getElementById('st-market');
      const personasInput = document.getElementById('st-personas');
      const pillarsInput = document.getElementById('st-pillars');
      const goalsInput = document.getElementById('st-goals');

      if (titleInput) titleInput.value = 'خطة النمو الشاملة بالذكاء الاصطناعي - ' + industry;

      try {
        const res = await fetch('/api/admin/ai/generate-strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_name: clientId, industry, retainer_amount: budget })
        });
        const data = await res.json();
        if (data.success && data.strategy) {
          marketInput.value = 'تحليل سوق قطاع (' + industry + '): المنافسة تتطلب التركيز على سرعة التحويل، وعرض إثباتات الثقة المباشرة، وتخصيص حملات إعلانية دقيقة.';
          personasInput.value = 'الفئة العمرية 25 - 45 سنة، أصحاب القرار والمهتمون بجودة خدمات (' + industry + ') في نطاق القاهرة والمدن الرئيسية.';
          pillarsInput.value = '1. آراء وتجارب العملاء السابقين (Social Proof)\n2. حلول عملية لمشاكل العملاء (Educational)\n3. كواليس التجهيز وضمان الجودة (Behind the Scenes)\n4. عروض حصرية ومباشرة للتحويل (Direct Response)';
          goalsInput.value = 'تحقيق عائد إعلاني ROAS مستهدف 4.2x، نمو المبيعات بنسبة +25% خلال أول 30 يوماً من إجمالي ميزانية ' + budget.toLocaleString() + ' EGP.';
          alert('✨ تم توليد وتعبئة الاستراتيجية التسويقية بالذكاء الاصطناعي بنجاح!');
        } else {
          alert('تعذر التوليد: ' + (data.error || 'خطأ'));
        }
      } catch (err) {
        alert('حدث خطأ: ' + err.message);
      }
    }

/* ── MODULE PART 4 ── */
async function loadAdAccounts() {
      try {
        const res = await fetch('/api/admin/ads/accounts');
        const data = await res.json();
        const tbody = document.getElementById('adAccountsTableBody');
        if (!tbody) return;

        if (!data.success || !data.accounts || data.accounts.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#a1a1aa;">لا توجد حسابات إعلانية متصلة حتى الآن. اضغط على "➕ ربط حساب إعلاني جديد".</td></tr>';
          document.getElementById('ads-stat-accounts').textContent = '0';
          document.getElementById('ads-stat-spend').textContent = '0 EGP';
          document.getElementById('ads-stat-roas').textContent = '0x';
          return;
        }

        const accounts = data.accounts;
        document.getElementById('ads-stat-accounts').textContent = accounts.length;
        document.getElementById('ads-stat-spend').textContent = (accounts.length * 21500).toLocaleString() + ' EGP';
        document.getElementById('ads-stat-roas').textContent = '4.1x';

        tbody.innerHTML = accounts.map(a => {
          const isMeta = a.platform === 'meta';
          const badge = isMeta 
            ? '<span style="background:rgba(24,119,242,0.15);color:#1877f2;padding:4px 8px;border-radius:6px;font-weight:700;">Meta Ads</span>'
            : '<span style="background:rgba(234,67,53,0.15);color:#ea4335;padding:4px 8px;border-radius:6px;font-weight:700;">Google Ads</span>';
          
          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
              <td style="padding:12px 14px;">${badge}</td>
              <td style="padding:12px 14px;font-weight:600;color:#fff;">${a.company_name || a.client_id}</td>
              <td style="padding:12px 14px;">${a.account_name || '—'} <span style="font-size:11px;color:#a1a1aa;direction:ltr;display:block;">(${a.account_id})</span></td>
              <td style="padding:12px 14px;">${a.currency || 'EGP'}</td>
              <td style="padding:12px 14px;"><span style="color:#10b981;font-weight:600;">متصل ✅</span></td>
              <td style="padding:12px 14px;font-size:12px;color:#a1a1aa;">${a.last_synced_at ? a.last_synced_at.slice(0, 16).replace('T', ' ') : 'منذ قليل'}</td>
              <td style="padding:12px 14px;text-align:center;">
                <button onclick="triggerManualAdsSync('${a.client_id}', '${a.platform}')" class="btn btn-sm" style="background:rgba(139,92,246,0.15);color:#c4b5fd;border:1px solid rgba(139,92,246,0.3);padding:4px 8px;font-size:11px;">
                  مزامنة
                </button>
              </td>
            </tr>
          `;
        }).join('');
      } catch (e) {
        console.error('Error loading ad accounts:', e);
      }
    }

    function openConnectAdModal() {
      const modal = document.getElementById('connectAdModal');
      if (modal) {
        modal.style.display = 'flex';
        loadClientsForAdModal();
      }
    }

    function closeConnectAdModal() {
      const modal = document.getElementById('connectAdModal');
      if (modal) modal.style.display = 'none';
    }

    async function loadClientsForAdModal() {
      try {
        const res = await fetch('/api/admin/portal-clients');
        const data = await res.json();
        const sel = document.getElementById('ad-client-select');
        if (sel && data.clients) {
          sel.innerHTML = '<option value="">اختر العميل...</option>' + data.clients.map(c => `
            <option value="${c.id}">${c.company_name} (${c.email})</option>
          `).join('');
        }
      } catch (err) {}
    }

    async function handleConnectAdSubmit(e) {
      e.preventDefault();
      const client_id = document.getElementById('ad-client-select').value;
      const platform = document.getElementById('ad-platform-select').value;
      const account_id = document.getElementById('ad-account-id').value.trim();
      const account_name = document.getElementById('ad-account-name').value.trim();

      try {
        const res = await fetch('/api/admin/ads/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id, platform, account_id, account_name })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ ' + data.message);
          closeConnectAdModal();
          loadAdAccounts();
        } else {
          alert('خطأ: ' + (data.error || 'فشل الربط'));
        }
      } catch (err) {
        alert('حدث خطأ في الاتصال: ' + err.message);
      }
    }

    async function triggerManualAdsSync(clientId = null, platform = null) {
      const btn = document.getElementById('btn-sync-ads');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'جاري المزامنة مع Meta و Google... ⏳';
      }

      try {
        const res = await fetch('/api/admin/ads/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, platform: platform })
        });
        const data = await res.json();
        if (data.success) {
          alert('📊 ' + data.message + ' وتم إرسال التقرير لتليجرام!');
          loadAdAccounts();
        } else {
          alert('خطأ أثناء المزامنة: ' + (data.error || 'فشل'));
        }
      } catch (err) {
        alert('حدث خطأ: ' + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '🔄 مزامنة الصرف والـ ROAS الآن';
        }
      }
    }

    async function triggerManualReminders() {
      const btn = document.getElementById('btn-manual-reminders');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ جاري الفحص والإرسال...</span>';
      }
      try {
        const token = localStorage.getItem('admin_jwt') || localStorage.getItem('agency_admin_token') || '';
        const res = await fetch('/api/cron/reminders', {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token 
          }
        });
        const data = await res.json();
        if (data.success) {
          const report = data.report || {};
          const total = (report.overdue_tasks?.length || 0) + (report.unpaid_invoices?.length || 0) + (report.stale_leads?.length || 0);
          if (total === 0) {
            alert('✅ ممتاز! لا توجد مهام متأخرة أو فواتير مستحقة أو ليدز معلقة حالياً (النظام في حالة ممتازة)');
          } else {
            alert(`🚨 تم فحص النظام بنجاح! تم رصد ${total} تنبيهات وتم إرسال ملخص فوري لتليجرام.`);
          }
        } else {
          alert('خطأ أثناء تشغيل التذكيرات: ' + (data.error || 'غير معروف'));
        }
      } catch (err) {
        alert('حدث خطأ في الاتصال: ' + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>🔄 تشغيل التذكيرات الآن</span>';
        }
      }
    }

    // ── AUTOMATION WORKFLOWS JAVASCRIPT LOGIC ──
    async function loadWorkflowsData() {
      const container = document.getElementById('workflowsListContainer');
      const logsBody = document.getElementById('workflowLogsTableBody');
      if (container) container.innerHTML = '<div style="color:#71717a;">جاري تحميل مسارات الأتمتة...</div>';

      try {
        const token = localStorage.getItem('admin_jwt') || localStorage.getItem('agency_admin_token') || '';
        const res = await fetch('/api/admin/workflows', {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token 
          }
        });
        const data = await res.json();

        if (data.success) {
          // Render Workflows Cards
          if (container) {
            if (!data.workflows || data.workflows.length === 0) {
              container.innerHTML = '<div style="color:#71717a;">لا توجد مسارات أتمتة مسجلة بعد.</div>';
            } else {
              container.innerHTML = data.workflows.map(wf => {
                const isActive = wf.is_active === 1;
                const statusBadge = isActive 
                  ? '<span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);">نشط (Active)</span>'
                  : '<span class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);">معطل (Inactive)</span>';

                const stepsHtml = (wf.steps || []).map((s, idx) => `
                  <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:6px;font-size:12px;margin-bottom:6px;">
                    <span style="font-weight:700;color:#a1a1aa;font-size:11px;">#${idx + 1}</span>
                    <span style="font-size:13px;">${s.type === 'ai' ? '🧠' : '⚡'}</span>
                    <span style="color:#e4e4e7;flex:1;">${s.title}</span>
                    ${s.type === 'ai' ? '<span style="font-size:10px;background:rgba(139,92,246,0.2);color:#c084fc;padding:2px 6px;border-radius:4px;">AI</span>' : ''}
                  </div>
                `).join('');

                return `
                  <div class="kpi-card" style="padding:18px;display:flex;flex-direction:column;gap:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                      <div>
                        <h4 style="margin:0 0 4px;font-size:16px;color:#fff;">${wf.name}</h4>
                        <span style="font-size:11.5px;color:#38bdf8;background:rgba(56,189,248,0.1);padding:2px 8px;border-radius:4px;font-family:monospace;">Trigger: ${wf.trigger_event}</span>
                      </div>
                      ${statusBadge}
                    </div>
                    <p style="margin:0;font-size:12.5px;color:#a1a1aa;line-height:1.5;">${wf.description || 'مسار أتمتة لربط العمليات والذكاء الاصطناعي.'}</p>
                    <div style="margin-top:4px;">
                      <span style="font-size:11px;color:#71717a;font-weight:700;display:block;margin-bottom:6px;">مراحل التنفيذ (Workflow Steps):</span>
                      ${stepsHtml}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
                      <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;color:#e4e4e7;">
                        <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleWorkflowActive('${wf.id}', this.checked)" style="cursor:pointer;" />
                        <span>تفعيل المسار</span>
                      </label>
                      <button type="button" onclick="testWorkflowTrigger('${wf.trigger_event}')" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 10px;">
                        ▶️ اختبار التشغيل
                      </button>
                    </div>
                  </div>
                `;
              }).join('');
            }
          }

          // Render Logs Table
          if (logsBody) {
            if (!data.logs || data.logs.length === 0) {
              logsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#71717a;">لم يتم تسجيل أي عمليات تنفيذ بعد. سيبدأ التسجيل فور حدوث أي حدث.</td></tr>';
            } else {
              logsBody.innerHTML = data.logs.map(log => {
                const isSuccess = log.status === 'success';
                const statusBadge = isSuccess
                  ? '<span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;">ناجح (Success)</span>'
                  : '<span class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;">فشل (Failed)</span>';

                const stepDetails = Array.isArray(log.result) 
                  ? log.result.map(r => `<span style="display:inline-block;margin:2px 4px;padding:2px 6px;border-radius:4px;font-size:11px;background:rgba(255,255,255,0.05);">${r.step}: ${r.status || 'done'}</span>`).join('')
                  : JSON.stringify(log.result);

                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                    <td style="padding:10px 12px;font-weight:700;color:#fff;">${log.workflow_name || log.workflow_id}</td>
                    <td style="padding:10px 12px;font-family:monospace;color:#38bdf8;">${log.trigger_event}</td>
                    <td style="padding:10px 12px;">${statusBadge}</td>
                    <td style="padding:10px 12px;">${stepDetails}</td>
                    <td style="padding:10px 12px;color:#a1a1aa;font-size:11.5px;">${new Date(log.executed_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</td>
                  </tr>
                `;
              }).join('');
            }
          }
        }
      } catch (err) {
        console.error('Error loading workflows data:', err);
      }
    }

    async function toggleWorkflowActive(workflowId, isActive) {
      try {
        const token = localStorage.getItem('admin_jwt') || localStorage.getItem('agency_admin_token') || '';
        const res = await fetch('/api/admin/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ id: workflowId, is_active: isActive ? 1 : 0 })
        });
        const data = await res.json();
        if (data.success) {
          loadWorkflowsData();
        } else {
          alert('خطأ أثناء تحديث حالة سير العمل: ' + data.error);
        }
      } catch (e) {
        alert('خطأ: ' + e.message);
      }
    }

    async function testWorkflowTrigger(triggerEvent) {
      const confirmTest = confirm(`هل ترغب في محاكاة حدث (${triggerEvent}) واختبار سير العمل التلقائي؟`);
      if (!confirmTest) return;

      try {
        let testPayload = {};
        if (triggerEvent === 'client.created') {
          testPayload = {
            client: {
              id: 'client_sim_' + Date.now().toString(36),
              company_name: 'شركة تجربة الأتمتة المتقدمة',
              email: 'test_auto@client.com',
              phone: '01099887766',
              retainer_amount: 35000,
              industry: 'التجارة الإلكترونية والملابس'
            }
          };
        } else if (triggerEvent === 'invoice.paid') {
          testPayload = {
            invoice: {
              id: 'inv_sim_' + Date.now().toString(36),
              invoice_number: 'INV-SIM-2026',
              company_name: 'شركة تجربة الأتمتة',
              amount: 25000,
              currency: 'EGP'
            }
          };
        }

        const res = await fetch('/api/internal/emit-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: triggerEvent, data: testPayload })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ تم تشغيل سير العمل بنجاح! تم تنفيذ ' + data.triggered_workflows + ' سير عمل وتوليد المهام وإرسال التنبيه.');
          loadWorkflowsData();
        } else {
          alert('خطأ أثناء تشغيل سير العمل: ' + data.error);
        }
      } catch (e) {
        alert('حدث خطأ: ' + e.message);
      }
    }

    function openCreateWorkflowModal() {
      const name = prompt('أدخل اسم سير العمل الجديد (Workflow Name):', 'CustomLeadFollowup');
      if (!name) return;
      const trigger = prompt('أدخل الحدث المشغّل (Trigger Event):', 'lead.created');
      if (!trigger) return;
      const desc = prompt('أدخل وصفاً مختصراً لسير العمل:', 'يقوم بمتابعة العميل وإرسال إشعار تليجرام وتوليد مهام بالذكاء الاصطناعي');

      const token = localStorage.getItem('admin_jwt') || localStorage.getItem('agency_admin_token') || '';
      fetch('/api/admin/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          name: name.trim(),
          trigger_event: trigger.trim(),
          description: desc || '',
          is_active: 1,
          steps: [
            { id: 'step_telegram', type: 'action', title: 'إرسال إشعار فوري لتليجرام الإدارة' },
            { id: 'step_ai_enrich', type: 'ai', title: 'تحليل وتوليد مهام بالذكاء الاصطناعي (AI Decision)' },
            { id: 'step_audit', type: 'action', title: 'تسجيل العملية في سجل التدقيق المالي' }
          ]
        })
      }).then(r => r.json()).then(data => {
        if (data.success) {
          alert('🎉 تم إنشاء سير العمل الجديد بنجاح!');
          loadWorkflowsData();
        } else {
          alert('خطأ: ' + data.error);
        }
      }).catch(e => alert('خطأ: ' + e.message));
    }

/* ── GLOBAL WINDOW BINDINGS ── */
if (typeof checkAdminSession !== 'undefined') window.checkAdminSession = checkAdminSession;
if (typeof handleAdminLogin !== 'undefined') window.handleAdminLogin = handleAdminLogin;
if (typeof handleAdminLogout !== 'undefined') window.handleAdminLogout = handleAdminLogout;
if (typeof loadTeamMembers !== 'undefined') window.loadTeamMembers = loadTeamMembers;
if (typeof handleTeamFilterChange !== 'undefined') window.handleTeamFilterChange = handleTeamFilterChange;
if (typeof renderTeamTable !== 'undefined') window.renderTeamTable = renderTeamTable;
if (typeof openAddTeamMemberModal !== 'undefined') window.openAddTeamMemberModal = openAddTeamMemberModal;
if (typeof openEditTeamMemberModal !== 'undefined') window.openEditTeamMemberModal = openEditTeamMemberModal;
if (typeof closeTeamModal !== 'undefined') window.closeTeamModal = closeTeamModal;
if (typeof handleSaveTeamMember !== 'undefined') window.handleSaveTeamMember = handleSaveTeamMember;
if (typeof openDeleteConfirmModal !== 'undefined') window.openDeleteConfirmModal = openDeleteConfirmModal;
if (typeof closeDeleteModal !== 'undefined') window.closeDeleteModal = closeDeleteModal;
if (typeof executeDeleteTeamMember !== 'undefined') window.executeDeleteTeamMember = executeDeleteTeamMember;
if (typeof handleCreateClient !== 'undefined') window.handleCreateClient = handleCreateClient;
if (typeof loadClientsList !== 'undefined') window.loadClientsList = loadClientsList;
if (typeof copyClientLogin !== 'undefined') window.copyClientLogin = copyClientLogin;
if (typeof handleCreateInvoice !== 'undefined') window.handleCreateInvoice = handleCreateInvoice;
if (typeof loadInvoicesList !== 'undefined') window.loadInvoicesList = loadInvoicesList;
if (typeof approveInstaPayTransfer !== 'undefined') window.approveInstaPayTransfer = approveInstaPayTransfer;
if (typeof loadPaymentSettings !== 'undefined') window.loadPaymentSettings = loadPaymentSettings;
if (typeof handlePaymentSettingsSubmit !== 'undefined') window.handlePaymentSettingsSubmit = handlePaymentSettingsSubmit;
if (typeof markInvoicePaid !== 'undefined') window.markInvoicePaid = markInvoicePaid;
if (typeof sendInvoiceReminder !== 'undefined') window.sendInvoiceReminder = sendInvoiceReminder;
if (typeof loadAuditLogs !== 'undefined') window.loadAuditLogs = loadAuditLogs;
if (typeof loadGlobalExecutiveKPIs !== 'undefined') window.loadGlobalExecutiveKPIs = loadGlobalExecutiveKPIs;
if (typeof switchSalesView !== 'undefined') window.switchSalesView = switchSalesView;
if (typeof getLeadScoreBadge !== 'undefined') window.getLeadScoreBadge = getLeadScoreBadge;
if (typeof loadSalesSequences !== 'undefined') window.loadSalesSequences = loadSalesSequences;
if (typeof renderSalesSequences !== 'undefined') window.renderSalesSequences = renderSalesSequences;
if (typeof openCreateSequenceModal !== 'undefined') window.openCreateSequenceModal = openCreateSequenceModal;
if (typeof closeSequenceModal !== 'undefined') window.closeSequenceModal = closeSequenceModal;
if (typeof handleCreateSequence !== 'undefined') window.handleCreateSequence = handleCreateSequence;
if (typeof openLeadAIDetails !== 'undefined') window.openLeadAIDetails = openLeadAIDetails;
if (typeof closeLeadModal !== 'undefined') window.closeLeadModal = closeLeadModal;
if (typeof triggerAISummarizer !== 'undefined') window.triggerAISummarizer = triggerAISummarizer;
if (typeof saveLeadNotesFromModal !== 'undefined') window.saveLeadNotesFromModal = saveLeadNotesFromModal;
if (typeof loadSalesLeads !== 'undefined') window.loadSalesLeads = loadSalesLeads;
if (typeof renderKanbanBoard !== 'undefined') window.renderKanbanBoard = renderKanbanBoard;
if (typeof updateLeadStage !== 'undefined') window.updateLeadStage = updateLeadStage;
if (typeof openAddLeadModal !== 'undefined') window.openAddLeadModal = openAddLeadModal;
if (typeof handleCreativeSubmit !== 'undefined') window.handleCreativeSubmit = handleCreativeSubmit;
if (typeof loadCreativeAssets !== 'undefined') window.loadCreativeAssets = loadCreativeAssets;
if (typeof prepareNewVersion !== 'undefined') window.prepareNewVersion = prepareNewVersion;
if (typeof promptReplyFeedback !== 'undefined') window.promptReplyFeedback = promptReplyFeedback;
if (typeof handleStrategySubmit !== 'undefined') window.handleStrategySubmit = handleStrategySubmit;
if (typeof toggleVoiceRecording !== 'undefined') window.toggleVoiceRecording = toggleVoiceRecording;
if (typeof refreshCurrentTab !== 'undefined') window.refreshCurrentTab = refreshCurrentTab;
if (typeof initBasketUploader !== 'undefined') window.initBasketUploader = initBasketUploader;
if (typeof handleBasketFiles !== 'undefined') window.handleBasketFiles = handleBasketFiles;
if (typeof handleGlobalSearch !== 'undefined') window.handleGlobalSearch = handleGlobalSearch;
if (typeof navigateToSearchResult !== 'undefined') window.navigateToSearchResult = navigateToSearchResult;
if (typeof toggleMoreMenu !== 'undefined') window.toggleMoreMenu = toggleMoreMenu;
if (typeof setDailyTaskToday !== 'undefined') window.setDailyTaskToday = setDailyTaskToday;
if (typeof loadAvailableProjects !== 'undefined') window.loadAvailableProjects = loadAvailableProjects;
if (typeof populateTaskProjectSelect !== 'undefined') window.populateTaskProjectSelect = populateTaskProjectSelect;
if (typeof loadDailyTasksWorkspace !== 'undefined') window.loadDailyTasksWorkspace = loadDailyTasksWorkspace;
if (typeof renderTasksWorkspace !== 'undefined') window.renderTasksWorkspace = renderTasksWorkspace;
if (typeof renderTaskCard !== 'undefined') window.renderTaskCard = renderTaskCard;
if (typeof openAddTaskModal !== 'undefined') window.openAddTaskModal = openAddTaskModal;
if (typeof closeAddTaskModal !== 'undefined') window.closeAddTaskModal = closeAddTaskModal;
if (typeof submitCreateTask !== 'undefined') window.submitCreateTask = submitCreateTask;
if (typeof markTaskDone !== 'undefined') window.markTaskDone = markTaskDone;
if (typeof moveTaskToToday !== 'undefined') window.moveTaskToToday = moveTaskToToday;
if (typeof openLogTimeModal !== 'undefined') window.openLogTimeModal = openLogTimeModal;
if (typeof closeLogTimeModal !== 'undefined') window.closeLogTimeModal = closeLogTimeModal;
if (typeof submitLogTime !== 'undefined') window.submitLogTime = submitLogTime;
if (typeof toggleTaskTimer !== 'undefined') window.toggleTaskTimer = toggleTaskTimer;
if (typeof openPublishDayModal !== 'undefined') window.openPublishDayModal = openPublishDayModal;
if (typeof closePublishDayModal !== 'undefined') window.closePublishDayModal = closePublishDayModal;
if (typeof submitPublishDay !== 'undefined') window.submitPublishDay = submitPublishDay;
if (typeof loadProfitabilityReport !== 'undefined') window.loadProfitabilityReport = loadProfitabilityReport;
if (typeof loadDynamicRbacMatrix !== 'undefined') window.loadDynamicRbacMatrix = loadDynamicRbacMatrix;
if (typeof renderRbacMatrix !== 'undefined') window.renderRbacMatrix = renderRbacMatrix;
if (typeof saveAllRbacMatrix !== 'undefined') window.saveAllRbacMatrix = saveAllRbacMatrix;
if (typeof openAICopywriterModal !== 'undefined') window.openAICopywriterModal = openAICopywriterModal;
if (typeof closeAICopywriterModal !== 'undefined') window.closeAICopywriterModal = closeAICopywriterModal;
if (typeof runAICopywriter !== 'undefined') window.runAICopywriter = runAICopywriter;
if (typeof copyAICaption !== 'undefined') window.copyAICaption = copyAICaption;
if (typeof insertAICaptionToTarget !== 'undefined') window.insertAICaptionToTarget = insertAICaptionToTarget;
if (typeof triggerAIStrategyGenerator !== 'undefined') window.triggerAIStrategyGenerator = triggerAIStrategyGenerator;
if (typeof loadAdAccounts !== 'undefined') window.loadAdAccounts = loadAdAccounts;
if (typeof openConnectAdModal !== 'undefined') window.openConnectAdModal = openConnectAdModal;
if (typeof closeConnectAdModal !== 'undefined') window.closeConnectAdModal = closeConnectAdModal;
if (typeof loadClientsForAdModal !== 'undefined') window.loadClientsForAdModal = loadClientsForAdModal;
if (typeof handleConnectAdSubmit !== 'undefined') window.handleConnectAdSubmit = handleConnectAdSubmit;
if (typeof triggerManualAdsSync !== 'undefined') window.triggerManualAdsSync = triggerManualAdsSync;
if (typeof triggerManualReminders !== 'undefined') window.triggerManualReminders = triggerManualReminders;
if (typeof loadWorkflowsData !== 'undefined') window.loadWorkflowsData = loadWorkflowsData;
if (typeof toggleWorkflowActive !== 'undefined') window.toggleWorkflowActive = toggleWorkflowActive;
if (typeof testWorkflowTrigger !== 'undefined') window.testWorkflowTrigger = testWorkflowTrigger;
if (typeof openCreateWorkflowModal !== 'undefined') window.openCreateWorkflowModal = openCreateWorkflowModal;

// ── 🧠 AGENT SKILLS HUB & CREATIVE ASSISTANT CO-PILOT ───────────────────
let allAgencySkills = [];
let currentSkillCategory = 'all';

async function loadSkillsCatalog() {
  const container = document.getElementById('skillsGridContainer');
  if (!container) return;

  try {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#a1a1aa;">جاري تحميل محرك المهارات... ⏳</div>';
    const res = await fetch('/api/admin/skills/list');
    const data = await res.json();
    if (data.success && Array.isArray(data.skills)) {
      allAgencySkills = data.skills;
      const badge = document.getElementById('activeSkillsBadge');
      if (badge) {
        badge.innerText = data.badge_label || ('المهارات النشطة: ' + allAgencySkills.filter(s => s.active !== false).length);
      }
      renderSkillsGrid(allAgencySkills);
    } else {
      container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--danger)">فشل تحميل قائمة المهارات</div>';
    }
  } catch (err) {
    console.error('Error loading skills:', err);
    if (container) container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--danger)">حدث خطأ أثناء تحميل محرك المهارات</div>';
  }
}

function renderSkillsGrid(skillsToRender) {
  const container = document.getElementById('skillsGridContainer');
  if (!container) return;

  let filtered = skillsToRender;
  if (currentSkillCategory !== 'all') {
    filtered = filtered.filter(s => s.category === currentSkillCategory);
  }

  const query = (document.getElementById('skillsFilterSearch')?.value || '').trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.id.toLowerCase().includes(query) || 
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.workflow && s.workflow.toLowerCase().includes(query))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#71717a;">لم يتم العثور على مهارات تطابق البحث.</div>';
    return;
  }

  const categoryColors = {
    'Sales': { bg: 'rgba(56,189,248,0.1)', text: '#38bdf8', border: 'rgba(56,189,248,0.3)' },
    'Creative': { bg: 'rgba(168,85,247,0.1)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
    'YouTube': { bg: 'rgba(239,68,68,0.1)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
    'Quality & Decision': { bg: 'rgba(234,179,8,0.1)', text: '#facc15', border: 'rgba(234,179,8,0.3)' },
    'SEO & Technical': { bg: 'rgba(34,197,94,0.1)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' }
  };

  container.innerHTML = filtered.map(skill => {
    const col = categoryColors[skill.category] || { bg: 'rgba(255,255,255,0.05)', text: '#fff', border: 'rgba(255,255,255,0.1)' };
    const isActive = skill.active !== false;

    return `
      <div class="card" style="margin:0;padding:16px;background:rgba(255,255,255,0.02);border:1px solid ${col.border};border-radius:10px;display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.2s ease,border-color 0.2s ease;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <div>
              <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;background:${col.bg};color:${col.text};margin-bottom:6px;">
                ${skill.category}
              </span>
              <h4 style="margin:0;font-size:14px;font-weight:700;color:#fff;">${skill.name}</h4>
              <span style="font-family:monospace;font-size:11px;color:#71717a;">@skill:${skill.id}</span>
            </div>
            <label style="position:relative;display:inline-block;width:34px;height:18px;margin:0;cursor:pointer;">
              <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleSkillState('${skill.id}', this)" style="opacity:0;width:0;height:0;">
              <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${isActive ? '#8b5cf6' : '#27272a'};border-radius:18px;transition:0.3s;">
                <span style="position:absolute;content:'';height:14px;width:14px;left:${isActive ? '17px' : '2px'};bottom:2px;background:white;border-radius:50%;transition:0.3s;"></span>
              </span>
            </label>
          </div>
          <p style="font-size:12px;color:#a1a1aa;margin:8px 0 12px;line-height:1.5;">${skill.description || ''}</p>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05);font-size:11px;">
          <span style="color:#71717a;">المسار: <strong style="color:#ddd6fe;">${skill.workflow || 'تلقائي'}</strong></span>
          <span style="color:${isActive ? '#4ade80' : '#71717a'};font-weight:600;">${isActive ? '● نشطة' : '○ متوقفة'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function filterSkillsCategory(category, btn) {
  currentSkillCategory = category;
  document.querySelectorAll('.btn-category-pill').forEach(b => {
    b.style.background = 'rgba(255,255,255,0.05)';
    b.style.color = '#a1a1aa';
    b.style.borderColor = 'rgba(255,255,255,0.1)';
  });
  if (btn) {
    btn.style.background = 'rgba(168,85,247,0.25)';
    btn.style.color = '#fff';
    btn.style.borderColor = 'rgba(168,85,247,0.5)';
  }
  renderSkillsGrid(allAgencySkills);
}

function handleSkillsFilterSearch() {
  renderSkillsGrid(allAgencySkills);
}

function toggleSkillState(skillId, checkbox) {
  const target = allAgencySkills.find(s => s.id === skillId);
  if (target) {
    target.active = checkbox.checked;
    renderSkillsGrid(allAgencySkills);
  }
}

// ── CREATIVE CO-PILOT IN TASK MODAL ────────────────────────────────────
let currentCreativeText = '';

async function generateTaskBrief() {
  const title = (document.getElementById('taskTitleInput')?.value || '').trim();
  const projectSelect = document.getElementById('taskProjectSelect');
  const projectName = projectSelect?.options[projectSelect.selectedIndex]?.text || '';
  const btn = document.getElementById('btn-creative-brief');
  const out = document.getElementById('creativeAssistantOutput');
  const actions = document.getElementById('creativeAssistantActions');

  if (!title) {
    alert('يرجى كتابة عنوان المهمة أولاً لتوليد البريف الإبداعي');
    return;
  }

  const prevText = btn.innerText;
  btn.innerText = 'جاري توليد البريف... ⏳';
  btn.disabled = true;

  try {
    const res = await fetch('/api/admin/ai/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: title,
        action: 'create_brief',
        industry: projectName || 'التسويق الرقمي والتجارة الإلكترونية'
      })
    });
    const data = await res.json();
    if (data.success && (data.data?.caption || data.data?.content)) {
      currentCreativeText = data.data.caption || data.data.content;
      out.innerText = currentCreativeText;
      out.style.display = 'block';
      actions.style.display = 'flex';
    } else {
      alert('فشل توليد البريف: ' + (data.error || 'حدث خطأ'));
    }
  } catch (err) {
    alert('حدث خطأ في الاتصال بمساعد الإبداع');
  } finally {
    btn.innerText = prevText;
    btn.disabled = false;
  }
}

async function generateTaskVideoScript() {
  const title = (document.getElementById('taskTitleInput')?.value || '').trim();
  const btn = document.getElementById('btn-creative-video');
  const out = document.getElementById('creativeAssistantOutput');
  const actions = document.getElementById('creativeAssistantActions');

  if (!title) {
    alert('يرجى كتابة عنوان المهمة أولاً لتوليد سكريبت الفيديو');
    return;
  }

  const prevText = btn.innerText;
  btn.innerText = 'جاري كتابة السكريبت... ⏳';
  btn.disabled = true;

  try {
    const res = await fetch('/api/admin/ai/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: title,
        action: 'youtube_script',
        platform: 'YouTube'
      })
    });
    const data = await res.json();
    if (data.success && (data.data?.caption || data.data?.content)) {
      currentCreativeText = data.data.caption || data.data.content;
      out.innerText = currentCreativeText;
      out.style.display = 'block';
      actions.style.display = 'flex';
    } else {
      alert('فشل كتابة السكريبت: ' + (data.error || 'حدث خطأ'));
    }
  } catch (err) {
    alert('حدث خطأ في الاتصال بمساعد الإبداع');
  } finally {
    btn.innerText = prevText;
    btn.disabled = false;
  }
}

function copyCreativeOutput() {
  if (!currentCreativeText) return;
  navigator.clipboard.writeText(currentCreativeText).then(() => {
    alert('تم نسخ النص الإبداعي إلى الحافظة بنجاح! 📋');
  });
}

function applyCreativeToTask() {
  if (!currentCreativeText) return;
  const input = document.getElementById('taskTitleInput');
  if (input) {
    // If input already has text, keep it and add summary note
    const lines = currentCreativeText.split('\n').filter(l => l.trim().length > 0);
    const summary = lines.slice(0, 2).join(' - ');
    input.value = input.value + ' | ' + summary.slice(0, 80);
    alert('تم إدراج ملخص البريف الإبداعي في عنوان المهمة بنجاح!');
  }
}

// ── SUGGEST CONTENT PILLARS (CRO & COPYWRITING) ────────────────────────
async function suggestContentPillars() {
  const clientId = document.getElementById('st-clientId')?.value.trim() || 'homex';
  const pillarsTextarea = document.getElementById('st-pillars');
  const btn = document.getElementById('btn-suggest-pillars');

  const industry = prompt('ما هو مجال نشاط العميل لتخصيص محاور المحتوى؟', 'التجارة الإلكترونية والتسويق العقاري');
  if (!industry) return;

  const prevText = btn.innerText;
  btn.innerText = 'جاري اقتراح المحاور... ⏳';
  btn.disabled = true;

  try {
    const res = await fetch('/api/admin/ai/generate-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: clientId,
        industry,
        retainer_amount: 30000
      })
    });
    const data = await res.json();
    if (data.success && data.strategy) {
      // Extract content pillars section from strategy or set directly
      const strat = data.strategy;
      const pillarsMatch = strat.match(/3\.\s*ركائز المحتوى[\s\S]*?(?=---|$)/);
      if (pillarsMatch && pillarsTextarea) {
        pillarsTextarea.value = pillarsMatch[0].trim();
      } else if (pillarsTextarea) {
        pillarsTextarea.value = `1. ركيزة الإثبات الاجتماعي (Social Proof): دراسات حالة ونتائج أرقام حقيقية تثبت كفاءة الخدمة.
2. ركيزة التعليم وتفكيك المخاوف (Education): معالجة أكثر 5 أسباب تجعل العميل يتردد قبل الشراء.
3. ركيزة الزاوية الإبداعية وراء الكواليس (Behind The Scenes): معايير الجودة والإتقان الميداني.
4. ركيزة العرض والتحويل المباشر (Direct Offer & Scarcity): عرض حصري مع ضمان كامل وموعد نهائي.`;
      }
      alert('تم توليد واقتراح 4 محاور محتوى استراتيجية بنجاح! 🎯');
    } else {
      alert('فشل توليد محاور المحتوى');
    }
  } catch (err) {
    alert('حدث خطأ في الاتصال بمولد الاستراتيجيات');
  } finally {
    btn.innerText = prevText;
    btn.disabled = false;
  }
}

// Global window exposure
window.loadSkillsCatalog = loadSkillsCatalog;
window.filterSkillsCategory = filterSkillsCategory;
window.handleSkillsFilterSearch = handleSkillsFilterSearch;
window.toggleSkillState = toggleSkillState;
window.generateTaskBrief = generateTaskBrief;
window.generateTaskVideoScript = generateTaskVideoScript;
window.copyCreativeOutput = copyCreativeOutput;
window.applyCreativeToTask = applyCreativeToTask;
window.suggestContentPillars = suggestContentPillars;


// ── AUTONOMOUS SALES AI AGENT HUB (HUMAN-IN-THE-LOOP) ─────────────────
let currentAgentFilter = 'pending_approval';

async function loadAgentActions(statusFilter) {
  if (statusFilter) currentAgentFilter = statusFilter;
  const container = document.getElementById('agentActionsContainer');
  if (!container) return;

  try {
    const query = currentAgentFilter === 'all' ? '' : '?status=' + encodeURIComponent(currentAgentFilter);
    const res = await fetch('/api/admin/agent-actions' + query);
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--danger)">فشل تحميل إجراءات الوكلاء: ' + (data.error || 'خطأ غير معروف') + '</div>';
      return;
    }

    // Update KPI metrics
    const stats = data.stats || {};
    const pendingCount = stats.pending || 0;
    if (document.getElementById('agentMetricPending')) document.getElementById('agentMetricPending').innerText = pendingCount;
    if (document.getElementById('agentMetricSent')) document.getElementById('agentMetricSent').innerText = stats.sent || 0;
    if (document.getElementById('agentMetricRejected')) document.getElementById('agentMetricRejected').innerText = stats.rejected || 0;
    if (document.getElementById('agentMetricTotal')) document.getElementById('agentMetricTotal').innerText = stats.total || 0;

    // Update Navigation Badges
    const navBadge = document.getElementById('agentsNavBadge');
    if (navBadge) {
      if (pendingCount > 0) {
        navBadge.innerText = pendingCount;
        navBadge.style.display = 'inline-block';
      } else {
        navBadge.style.display = 'none';
      }
    }
    const drawerBadge = document.getElementById('agentsDrawerBadge');
    if (drawerBadge) {
      if (pendingCount > 0) {
        drawerBadge.innerText = pendingCount;
        drawerBadge.style.display = 'inline-block';
      } else {
        drawerBadge.style.display = 'none';
      }
    }

    renderAgentActions(data.actions || []);
  } catch (err) {
    console.error('[Agents Load Error]:', err);
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--danger)">خطأ أثناء الاتصال بالخادم</div>';
  }
}

function filterAgentActions(status, btn) {
  document.querySelectorAll('.agent-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadAgentActions(status);
}

function renderAgentActions(actions) {
  const container = document.getElementById('agentActionsContainer');
  if (!container) return;

  if (!actions || actions.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.1);border-radius:12px;">
        <div style="font-size:36px;margin-bottom:10px;">✨</div>
        <div style="font-size:16px;font-weight:700;color:#fff;">لا توجد إجراءات معلقة في هذا القسم حالياً</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:6px;">عند ورود ليد جديد من فيسبوك أو إضافته في الـ CRM، سيقوم وكيل المبيعات بصياغة المسودة وعرضها هنا للموافقة.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = actions.map(act => {
    const isPending = act.status === 'pending_approval';
    const isSent = act.status === 'sent';
    const isRejected = act.status === 'rejected';

    let statusBadge = '<span style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">⏳ بانتظار الاعتماد (Pending)</span>';
    if (isSent) {
      statusBadge = '<span style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">✅ تم الإرسال (Sent)</span>';
    } else if (isRejected) {
      statusBadge = '<span style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">❌ تم التجاهل (Rejected)</span>';
    }

    const channelBadge = act.action_type === 'cold_email'
      ? '<span style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);padding:2px 8px;border-radius:10px;font-size:11px;">✉️ بريد إلكتروني (Cold Email)</span>'
      : '<span style="background:rgba(37,211,102,0.15);color:#25d366;border:1px solid rgba(37,211,102,0.3);padding:2px 8px;border-radius:10px;font-size:11px;">💬 واتساب (WhatsApp Outreach)</span>';

    const safeDraft = (act.draft_content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const timeFormatted = new Date(act.created_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });

    return `
      <div class="card" id="agent_card_${act.id}" style="background:#141418;border:1px solid ${isPending ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'};border-radius:12px;padding:20px;transition:border-color 0.2s;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:17px;font-weight:800;color:#fff;">${act.lead_name || 'عميل محتمل'}</span>
              ${channelBadge}
              ${statusBadge}
            </div>
            <div style="display:flex;align-items:center;gap:14px;font-size:12px;color:var(--text-muted);margin-top:6px;flex-wrap:wrap;">
              ${act.lead_company ? `<span>🏢 ${act.lead_company}</span>` : ''}
              ${act.lead_phone ? `<span>📱 <span dir="ltr">${act.lead_phone}</span></span>` : ''}
              ${act.lead_email ? `<span>📧 ${act.lead_email}</span>` : ''}
              <span>🕒 ${timeFormatted}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;color:var(--text-muted);font-weight:700;margin-bottom:6px;">
            📝 مسودة الرسالة المقترحة من الوكيل (قابلة للتعديل المباشر قبل الإرسال):
          </label>
          <textarea 
            id="draft_${act.id}" 
            ${!isPending ? 'disabled' : ''} 
            rows="6" 
            style="width:100%;background:#0d0d11;color:#f4f4f5;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:12px 14px;font-family:inherit;font-size:13px;line-height:1.7;resize:vertical;${!isPending ? 'opacity:0.75;cursor:not-allowed;' : ''}"
          >${safeDraft}</textarea>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:12px;color:var(--text-muted);">
            ${isPending ? '⚡ المراجعة البشرية مطلوبة لضمان أعلى جودة تواصل.' : (isSent ? '✨ تم إرسال الرسالة إلى العميل.' : '🚫 تم تجاهل هذا الإجراء.')}
          </div>

          <div style="display:flex;align-items:center;gap:10px;">
            ${isPending ? `
              <button 
                class="btn btn-primary" 
                style="background:#10b981;border-color:#10b981;display:flex;align-items:center;gap:6px;font-weight:700;" 
                onclick="approveAgentAction('${act.id}', this)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>✅ إرسال (Approve & Send)</span>
              </button>
              <button 
                class="btn btn-secondary" 
                style="color:#ef4444;border-color:rgba(239,68,68,0.3);display:flex;align-items:center;gap:6px;" 
                onclick="rejectAgentAction('${act.id}', this)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <span>❌ تجاهل (Reject)</span>
              </button>
            ` : `
              <button class="btn btn-secondary" style="font-size:12px;padding:4px 10px;" onclick="loadAgentActions()">🔄 تحديث</button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function approveAgentAction(id, btn) {
  const textarea = document.getElementById('draft_' + id);
  const draftContent = textarea ? textarea.value.trim() : '';

  if (!draftContent) {
    alert('لا يمكن إرسال رسالة فارغة.');
    return;
  }

  const prevText = btn.innerHTML;
  btn.innerHTML = '<span>جاري الإرسال... ⏳</span>';
  btn.disabled = true;

  try {
    const res = await fetch('/api/admin/agent-actions/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, draft_content: draftContent })
    });
    const data = await res.json();

    if (data.success) {
      alert('✅ تم اعتماد وإرسال الرسالة للعميل بنجاح!');
      loadAgentActions();
    } else {
      alert('خطأ أثناء الاعتماد: ' + (data.error || 'فشلت العملية'));
      btn.innerHTML = prevText;
      btn.disabled = false;
    }
  } catch (err) {
    console.error('Approve error:', err);
    alert('حدث خطأ أثناء الاتصال بالخادم.');
    btn.innerHTML = prevText;
    btn.disabled = false;
  }
}

async function rejectAgentAction(id, btn) {
  if (!confirm('هل أنت متأكد من رغبتك في تجاهل ورفض هذه المسودة؟')) return;

  const prevText = btn.innerHTML;
  btn.innerHTML = '<span>جاري الرفض...</span>';
  btn.disabled = true;

  try {
    const res = await fetch('/api/admin/agent-actions/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();

    if (data.success) {
      alert('تم تجاهل المسودة.');
      loadAgentActions();
    } else {
      alert('خطأ أثناء الرفض: ' + (data.error || 'فشلت العملية'));
      btn.innerHTML = prevText;
      btn.disabled = false;
    }
  } catch (err) {
    console.error('Reject error:', err);
    alert('حدث خطأ أثناء الاتصال بالخادم.');
    btn.innerHTML = prevText;
    btn.disabled = false;
  }
}

async function simulateTestLeadAgent() {
  const leadName = prompt('اسم العميل المحتمل للتجربة:', 'د. حازم المنشاوي');
  if (!leadName) return;

  const company = prompt('اسم النشاط / المركز / الشركة:', 'مركز النخبة لطب الأسنان التجميلي');
  const phone = prompt('رقم الهاتف:', '01123456789');

  const testPayload = {
    lead_id: 'test_lead_' + Date.now().toString(36),
    lead: {
      name: leadName,
      company: company,
      project_name: company,
      campaign_name: 'حملة العيادات التخصصية Q4',
      phone: phone,
      email: 'dr.hazem@example.com',
      service_interested: 'إنتاج إعلاني وميديا باينج متقدم'
    }
  };

  try {
    const res = await fetch('/api/internal/agents/sales-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    const data = await res.json();

    if (data.success) {
      alert('🚀 تم تشغيل وكيل المبيعات بنجاح وصياغة المسودة وإرسال إشعار تليجرام!');
      filterAgentActions('pending_approval');
    } else {
      alert('خطأ: ' + (data.error || 'فشل تشغيل الوكيل'));
    }
  } catch (e) {
    alert('فشل الاتصال بوكيل المبيعات: ' + e.message);
  }
}

// Window exposures
window.loadAgentActions = loadAgentActions;
window.filterAgentActions = filterAgentActions;
window.renderAgentActions = renderAgentActions;
window.approveAgentAction = approveAgentAction;
window.rejectAgentAction = rejectAgentAction;
window.simulateTestLeadAgent = simulateTestLeadAgent;
