// ═══════════════════════════════════════════════════════════════════════════
// PR AGENCY — PWA INSTALL MANAGER
// Handles beforeinstallprompt, UI button visibility, and standalone detection
// ═══════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  let deferredPrompt = null;

  // 1. Detect if running in Standalone (already installed as PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://');

  if (isStandalone) {
    document.documentElement.classList.add('pwa-standalone');
    console.log('[PWA] Running in Standalone Installed Mode');
    return; // Don't show install buttons
  }

  // 2. Inject Floating & Header Install Button
  function injectInstallUI() {
    if (document.getElementById('pwa-install-banner')) return;

    const bannerHtml = `
      <div id="pwa-install-banner" class="pwa-install-banner" style="display:none;">
        <div class="pwa-install-content">
          <img src="/icons/icon-192.png" alt="PR Agency" class="pwa-install-logo" />
          <div class="pwa-install-info">
            <span class="pwa-install-title">تطبيق PR Agency</span>
            <span class="pwa-install-subtitle">تثبيت التطبيق على جهازك للوصول السريع والإشعارات</span>
          </div>
        </div>
        <div class="pwa-install-actions">
          <button id="pwa-btn-install" class="pwa-action-btn primary">
            <span>تثبيت التطبيق 📲</span>
          </button>
          <button id="pwa-btn-dismiss" class="pwa-action-btn secondary" aria-label="إغلاق">✕</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHtml);

    // CSS styling
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-banner {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 99999;
        background: linear-gradient(135deg, rgba(22, 18, 36, 0.95), rgba(16, 12, 28, 0.95));
        border: 1px solid rgba(168, 85, 247, 0.4);
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(139, 92, 246, 0.25);
        backdrop-filter: blur(14px);
        border-radius: 18px;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        gap: 16px;
        font-family: 'Cairo', sans-serif;
        direction: rtl;
        animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        max-width: 440px;
      }
      @keyframes pwaSlideUp {
        from { transform: translateY(40px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .pwa-install-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .pwa-install-logo {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .pwa-install-info {
        display: flex;
        flex-direction: column;
      }
      .pwa-install-title {
        font-size: 14px;
        font-weight: 800;
        color: #fff;
      }
      .pwa-install-subtitle {
        font-size: 11px;
        color: #a1a1aa;
      }
      .pwa-install-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pwa-action-btn.primary {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: #fff;
        border: none;
        padding: 8px 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
      }
      .pwa-action-btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(139, 92, 246, 0.6);
      }
      .pwa-action-btn.secondary {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #d4d4d8;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @media (max-width: 600px) {
        .pwa-install-banner {
          left: 14px;
          right: 14px;
          bottom: 14px;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);

    const banner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-btn-install');
    const dismissBtn = document.getElementById('pwa-btn-dismiss');

    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      deferredPrompt = null;
      banner.style.display = 'none';
    });

    dismissBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      sessionStorage.setItem('pwa_dismissed', 'true');
    });
  }

  // 3. Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] beforeinstallprompt event fired and captured');

    if (sessionStorage.getItem('pwa_dismissed') === 'true') return;

    injectInstallUI();
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.style.display = 'flex';
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App successfully installed');
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.style.display = 'none';
    deferredPrompt = null;
  });

  // Expose global manual install trigger
  window.triggerPWAInstall = function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      alert('لتثبيت التطبيق على جهازك: اضغط على خيارات المتصفح (⋮) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
    }
  };

})();
