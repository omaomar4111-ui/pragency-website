/**
 * Admin Visual Layer Studio — PR Agency OS 2026
 * Interactive Visual Positioning & Sliders for Statue & Brand Logo
 */
(function initAdminVisualStudio() {
  'use strict';

  // Elements
  const statueLayer = document.querySelector('.hero-statue-layer');
  const logoLockup = document.querySelector('.hero-brand-lockup');

  // Default coordinate states
  const state = {
    statue: { x: 0, y: 0, scale: 1, opacity: 1 },
    logo: { x: 0, y: 0, scale: 1, opacity: 1 }
  };

  // 1. Fetch saved layer settings
  async function loadSavedLayers() {
    try {
      const res = await fetch('/api/admin/hero-layers');
      const data = await res.json();
      if (data.success && data.layers && Object.keys(data.layers).length > 0) {
        if (data.layers.statue) {
          Object.assign(state.statue, data.layers.statue);
        }
        if (data.layers.logo) {
          Object.assign(state.logo, data.layers.logo);
        }
        applyTransforms();
        updateSlidersUI();
      }
    } catch (e) {}
  }

  function applyTransforms() {
    if (statueLayer) {
      statueLayer.style.transform = `translate(calc(-50% + ${state.statue.x}px), calc(-50% + ${state.statue.y}px)) scale(${state.statue.scale})`;
      statueLayer.style.opacity = state.statue.opacity;
    }
    if (logoLockup) {
      if (state.logo.x !== 0 || state.logo.y !== 0 || state.logo.scale !== 1) {
        logoLockup.style.transform = `translate(${state.logo.x}px, ${state.logo.y}px) scale(${state.logo.scale})`;
      }
      logoLockup.style.opacity = state.logo.opacity;
    }
  }

  function updateSlidersUI() {
    const ids = [
      ['statue-x', state.statue.x],
      ['statue-y', state.statue.y],
      ['statue-scale', state.statue.scale],
      ['statue-opacity', state.statue.opacity],
      ['logo-x', state.logo.x],
      ['logo-y', state.logo.y],
      ['logo-scale', state.logo.scale]
    ];
    ids.forEach(([id, val]) => {
      const el = document.getElementById('avs-' + id);
      const valEl = document.getElementById('avs-' + id + '-val');
      if (el) el.value = val;
      if (valEl) valEl.innerText = typeof val === 'number' && val % 1 !== 0 ? val.toFixed(2) : val;
    });
  }

  // 2. STRICT ADMIN & URL GATE: Check if user is logged in as Admin to render the Studio Floating Dock
  async function checkAdminAndRenderDock() {
    const token = localStorage.getItem('admin_jwt');
    const urlParams = new URLSearchParams(window.location.search);
    const hasEditParam = urlParams.get('edit') === 'true';

    // Must be authenticated Admin AND have ?edit=true explicitly in URL
    if (!token || !hasEditParam) {
      return;
    }

    renderDockUI();
    enableInteractiveDrag();
  }

  // 3. Render Studio UI Widget
  function renderDockUI() {
    if (document.getElementById('admin-visual-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'admin-visual-dock';
    dock.innerHTML = `
      <style>
        #admin-visual-dock {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          direction: rtl;
        }
        #avs-toggle-btn {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.5);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
        }
        #avs-toggle-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 30px rgba(139, 92, 246, 0.7);
        }
        #avs-panel {
          display: none;
          position: absolute;
          bottom: 50px;
          right: 0;
          width: 330px;
          background: rgba(15, 15, 20, 0.96);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.85);
          color: #fff;
        }
        #avs-panel.active { display: block; animation: avsFadeIn 0.2s ease-out; }
        @keyframes avsFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .avs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; }
        .avs-title { font-size: 14px; font-weight: 800; color: #a78bfa; margin: 0; }
        .avs-section-title { font-size: 12px; font-weight: 700; color: #e4e4e7; margin: 12px 0 6px; display: flex; align-items: center; justify-content: space-between; }
        .avs-row { margin-bottom: 8px; }
        .avs-label-wrap { display: flex; justify-content: space-between; font-size: 11px; color: #a1a1aa; margin-bottom: 3px; }
        .avs-slider { width: 100%; height: 5px; -webkit-appearance: none; background: #27272a; border-radius: 3px; outline: none; }
        .avs-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #8b5cf6; cursor: pointer; }
        .avs-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px; }
        .avs-save-btn { width: 100%; padding: 10px; background: #10b981; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .avs-save-btn:hover { background: #059669; }
        .avs-reset-btn { width: 100%; padding: 8px; background: #27272a; color: #a1a1aa; border: 1px solid #3f3f46; border-radius: 8px; font-size: 12px; cursor: pointer; }
        .avs-drag-badge { font-size: 10px; background: rgba(139,92,246,0.25); color: #c4b5fd; padding: 2px 6px; border-radius: 4px; }
        .avs-pwd-input { width: 100%; padding: 8px 12px; background: #18181b; border: 1px solid #3f3f46; border-radius: 6px; color: #fff; font-size: 12px; margin-bottom: 8px; box-sizing: border-box; }
      </style>

      <button id="avs-toggle-btn">
        <span>🎨 محرر اللايرز المباشر</span>
      </button>

      <div id="avs-panel">
        <div class="avs-header">
          <h4 class="avs-title">⚡ استوديو ضبط الطبقات البصري</h4>
          <span style="font-size: 11px; color: #10b981;">Admin Mode ●</span>
        </div>

        <div style="font-size: 11px; color: #a1a1aa; margin-bottom: 10px; line-height: 1.4;">
          اسحب التمثال أو اللوجو مباشرة بالماوس، أو استخدم المؤشرات لضبط الإحداثيات بدقة:
        </div>

        <!-- Statue Controls -->
        <div class="avs-section-title">
          <span>🗿 تمثال البطل (Statue)</span>
          <span class="avs-drag-badge">اسحبه بحرية</span>
        </div>
        
        <div class="avs-row">
          <div class="avs-label-wrap"><span>إزاحة أفقية (X)</span><span id="avs-statue-x-val">0</span></div>
          <input type="range" class="avs-slider" id="avs-statue-x" min="-400" max="400" value="0">
        </div>
        <div class="avs-row">
          <div class="avs-label-wrap"><span>إزاحة رأسية (Y)</span><span id="avs-statue-y-val">0</span></div>
          <input type="range" class="avs-slider" id="avs-statue-y" min="-300" max="300" value="0">
        </div>
        <div class="avs-row">
          <div class="avs-label-wrap"><span>الحجم (Scale)</span><span id="avs-statue-scale-val">1.0</span></div>
          <input type="range" class="avs-slider" id="avs-statue-scale" min="0.5" max="1.8" step="0.05" value="1">
        </div>

        <!-- Logo Controls -->
        <div class="avs-section-title" style="margin-top: 14px;">
          <span>👑 شعار PR (Logo)</span>
          <span class="avs-drag-badge">اسحبه بحرية</span>
        </div>

        <div class="avs-row">
          <div class="avs-label-wrap"><span>إزاحة أفقية (X)</span><span id="avs-logo-x-val">0</span></div>
          <input type="range" class="avs-slider" id="avs-logo-x" min="-400" max="400" value="0">
        </div>
        <div class="avs-row">
          <div class="avs-label-wrap"><span>إزاحة رأسية (Y)</span><span id="avs-logo-y-val">0</span></div>
          <input type="range" class="avs-slider" id="avs-logo-y" min="-300" max="300" value="0">
        </div>
        <div class="avs-row">
          <div class="avs-label-wrap"><span>الحجم (Scale)</span><span id="avs-logo-scale-val">1.0</span></div>
          <input type="range" class="avs-slider" id="avs-logo-scale" min="0.6" max="1.6" step="0.05" value="1">
        </div>

        <div class="avs-actions">
          <input type="password" id="avs-admin-pwd" class="avs-pwd-input" placeholder="كلمة سر الأدمن لتأكيد الحفظ..." value="pr2026">
          <button class="avs-save-btn" id="avs-save-btn">💾 حفظ التموضع للجميع</button>
          <button class="avs-reset-btn" id="avs-reset-btn">إعادة ضبط</button>
        </div>
      </div>
    `;

    document.body.appendChild(dock);

    const toggleBtn = document.getElementById('avs-toggle-btn');
    const panel = document.getElementById('avs-panel');
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('active');
    });

    // Wire sliders
    const bindSlider = (id, obj, prop, isFloat = false) => {
      const input = document.getElementById('avs-' + id);
      const valEl = document.getElementById('avs-' + id + '-val');
      input.addEventListener('input', (e) => {
        const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
        obj[prop] = val;
        valEl.innerText = isFloat ? val.toFixed(2) : val;
        applyTransforms();
      });
    };

    bindSlider('statue-x', state.statue, 'x');
    bindSlider('statue-y', state.statue, 'y');
    bindSlider('statue-scale', state.statue, 'scale', true);
    bindSlider('logo-x', state.logo, 'x');
    bindSlider('logo-y', state.logo, 'y');
    bindSlider('logo-scale', state.logo, 'scale', true);

    // Save button
    document.getElementById('avs-save-btn').addEventListener('click', async () => {
      const btn = document.getElementById('avs-save-btn');
      const pwd = document.getElementById('avs-admin-pwd').value.trim() || 'pr2026';
      btn.innerText = 'جاري الحفظ السحابي... ⏳';
      btn.disabled = true;

      try {
        const token = localStorage.getItem('admin_jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/admin/hero-layers', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            layers: state,
            admin_password: pwd
          })
        });
        const data = await res.json();
        if (data.success) {
          btn.innerText = '✅ تم الحفظ السحابي بنجاح!';
          setTimeout(() => {
            btn.innerText = '💾 حفظ التموضع للجميع';
            btn.disabled = false;
          }, 2000);
        } else {
          alert('خطأ أثناء الحفظ: ' + (data.error || 'يرجى التأكد من كلمة السر'));
          btn.innerText = '💾 حفظ التموضع للجميع';
          btn.disabled = false;
        }
      } catch (e) {
        alert('تعذر الاتصال بالخادم: ' + e.message);
        btn.innerText = '💾 حفظ التموضع للجميع';
        btn.disabled = false;
      }
    });

    // Reset button
    document.getElementById('avs-reset-btn').addEventListener('click', () => {
      state.statue = { x: 0, y: 0, scale: 1, opacity: 1 };
      state.logo = { x: 0, y: 0, scale: 1, opacity: 1 };
      applyTransforms();
      updateSlidersUI();
    });

    updateSlidersUI();
  }

  // 4. Enable Free Mouse Drag & Drop directly on elements
  function enableInteractiveDrag() {
    function makeDraggable(element, stateObj) {
      if (!element) return;
      element.style.cursor = 'grab';
      element.style.pointerEvents = 'auto';

      let isDragging = false;
      let startMouseX = 0, startMouseY = 0;
      let initialObjX = 0, initialObjY = 0;

      element.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        element.style.cursor = 'grabbing';
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        initialObjX = stateObj.x;
        initialObjY = stateObj.y;
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;
        stateObj.x = Math.round(initialObjX + dx);
        stateObj.y = Math.round(initialObjY + dy);
        applyTransforms();
        updateSlidersUI();
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          element.style.cursor = 'grab';
        }
      });
    }

    makeDraggable(statueLayer, state.statue);
    makeDraggable(logoLockup, state.logo);
  }

  // Init sequence
  loadSavedLayers();
  document.addEventListener('DOMContentLoaded', () => {
    checkAdminAndRenderDock();
  });
})();
