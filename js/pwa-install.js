// ═══════════════════════════════════════════════════════════════════════════
// PR AGENCY — PWA INSTALL & LIFECYCLE MANAGER
// Handles beforeinstallprompt capture, appinstalled cleanup, iOS Safari guide,
// and cross-page standalone detection.
// ═══════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // 1. Register Service Worker Immediately if available
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[PWA] Service Worker registered:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
    });
  }

  // 2. Global state for install prompt
  let deferredPrompt = null;

  // 3. Early capture of beforeinstallprompt (MUST be registered before other logic)
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    window._pwaDeferredPrompt = e;
    console.log('[PWA] beforeinstallprompt event captured early');

    // Notify all UI install buttons that prompt is ready
    updateInstallButtonsState(true);

    // If banner was previously dismissed in this session, do not force-open
    if (sessionStorage.getItem('pwa_dismissed') === 'true') return;

    showInstallBanner();
  });

  // 4. Handle appinstalled event (Cleanup button and state)
  window.addEventListener('appinstalled', (e) => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
    window._pwaDeferredPrompt = null;
    hideInstallBanner();
    updateInstallButtonsState(false);
  });

  // 5. Standalone & Platform Detection
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://');

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isStandalone) {
    document.documentElement.classList.add('pwa-standalone');
    console.log('[PWA] Running in Standalone Installed Mode');
    return; // Don't show banners in installed mode
  }

  // Helper to update any page button with onclick="triggerPWAInstall()"
  function updateInstallButtonsState(available) {
    const installButtons = document.querySelectorAll('[data-pwa-install], .pwa-install-trigger');
    installButtons.forEach(btn => {
      btn.style.display = available || isIOS ? 'inline-flex' : 'none';
    });
  }

  // 6. UI: Floating Install Banner
  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) {
      document.getElementById('pwa-install-banner').style.display = 'flex';
      return;
    }

    const bannerHtml = `
      <div id="pwa-install-banner" class="pwa-install-banner" role="dialog" aria-label="تثبيت التطبيق">
        <div class="pwa-install-content">
          <img src="/icons/icon-192.png" alt="PR Agency" class="pwa-install-logo" />
          <div class="pwa-install-info">
            <span class="pwa-install-title">تطبيق PR Agency</span>
            <span class="pwa-install-subtitle">${isIOS ? 'أضف التطبيق لشاشتك الرئيسية عبر Safari' : 'تثبيت التطبيق للوصول السريع بدون متصفح'}</span>
          </div>
        </div>
        <div class="pwa-install-actions">
          <button id="pwa-btn-install" class="pwa-action-btn primary">
            <span>${isIOS ? 'طريقة التثبيت 📲' : 'تثبيت التطبيق 📲'}</span>
          </button>
          <button id="pwa-btn-dismiss" class="pwa-action-btn secondary" aria-label="إغلاق">✕</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHtml);
    injectStyles();

    const banner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-btn-install');
    const dismissBtn = document.getElementById('pwa-btn-dismiss');

    installBtn.addEventListener('click', () => {
      window.triggerPWAInstall();
    });

    dismissBtn.addEventListener('click', () => {
      hideInstallBanner();
      sessionStorage.setItem('pwa_dismissed', 'true');
    });
  }

  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  }

  // 7. UI: iOS Safari Step-by-Step Modal Guide
  function showIOSInstallModal() {
    let modal = document.getElementById('pwa-ios-modal');
    if (!modal) {
      const modalHtml = `
        <div id="pwa-ios-modal" class="pwa-modal-overlay">
          <div class="pwa-modal-card">
            <div class="pwa-modal-header">
              <div style="display:flex; align-items:center; gap:10px;">
                <img src="/icons/icon-192.png" alt="Logo" style="width:36px; height:36px; border-radius:8px;" />
                <h3 style="margin:0; font-size:16px; font-weight:800; color:#fff;">تثبيت تطبيق PR Agency على iPhone</h3>
              </div>
              <button id="pwa-ios-close" class="pwa-modal-close">✕</button>
            </div>
            <div class="pwa-modal-body">
              <p style="color:#d4d4d8; font-size:13px; margin-bottom:14px;">
                لتثبيت المنصة كتطبيق أصيل على جهاز الـ iPhone أو iPad بدون متجر App Store، اتبع الخطوات البسيطة التالية:
              </p>
              <div class="pwa-step">
                <span class="pwa-step-num">1</span>
                <span>اضغط على أيقونة <strong>المشاركة (Share)</strong> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" style="vertical-align:middle; display:inline-block;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> أسفل شاشة متصفح Safari.</span>
              </div>
              <div class="pwa-step">
                <span class="pwa-step-num">2</span>
                <span>مرر للأسفل واختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong> ➕.</span>
              </div>
              <div class="pwa-step">
                <span class="pwa-step-num">3</span>
                <span>اضغط على <strong>"إضافة" (Add)</strong> في أعلى الزاوية. سيظهر التطبيق فوراً على شاشتك.</span>
              </div>
            </div>
            <div class="pwa-modal-footer">
              <button id="pwa-ios-ok" class="pwa-action-btn primary" style="width:100%; justify-content:center;">حسناً، فهمت</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      modal = document.getElementById('pwa-ios-modal');

      document.getElementById('pwa-ios-close').onclick = () => modal.style.display = 'none';
      document.getElementById('pwa-ios-ok').onclick = () => modal.style.display = 'none';
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };
    }
    modal.style.display = 'flex';
  }

  // 8. Inject Styles for Banner & iOS Guide
  function injectStyles() {
    if (document.getElementById('pwa-install-styles')) return;

    const style = document.createElement('style');
    style.id = 'pwa-install-styles';
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
        -webkit-backdrop-filter: blur(14px);
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
        display: inline-flex;
        align-items: center;
        font-family: inherit;
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
      /* iOS Modal */
      .pwa-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 100000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        direction: rtl;
        font-family: 'Cairo', sans-serif;
      }
      .pwa-modal-card {
        background: #120e24;
        border: 1px solid rgba(168, 85, 247, 0.4);
        border-radius: 20px;
        max-width: 420px;
        width: 100%;
        padding: 22px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(139, 92, 246, 0.25);
        animation: pwaSlideUp 0.3s ease-out;
      }
      .pwa-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .pwa-modal-close {
        background: rgba(255,255,255,0.08);
        border: none;
        color: #a1a1aa;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 14px;
        cursor: pointer;
      }
      .pwa-step {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 10px 14px;
        margin-bottom: 10px;
        font-size: 13px;
        color: #e4e4e7;
        line-height: 1.5;
      }
      .pwa-step-num {
        background: #8b5cf6;
        color: #fff;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 800;
        flex-shrink: 0;
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
  }

  // 9. Global manual trigger accessible anywhere
  window.triggerPWAInstall = async function() {
    const promptEvent = deferredPrompt || window._pwaDeferredPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        console.log('[PWA] User response to install:', outcome);
        if (outcome === 'accepted') {
          hideInstallBanner();
          updateInstallButtonsState(false);
        }
        deferredPrompt = null;
        window._pwaDeferredPrompt = null;
      } catch (err) {
        console.error('[PWA] Error triggering install prompt:', err);
      }
    } else if (isIOS) {
      showIOSInstallModal();
    } else {
      // Fallback instructions for desktop or browsers that don't dispatch prompt
      alert('لتثبيت التطبيق على جهازك:\n• على Chrome للكمبيوتر: اضغط على أيقونة التثبيت (⊞) الموجودة في شريط العنوان أعلى المتصفح.\n• على أندرويد: اضغط على زر خيارات المتصفح (⋮) ثم اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق".');
    }
  };

  // 10. Automatically check and show on mobile/desktop load
  window.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    // If on iOS and not standalone, show the banner with the iOS guide trigger
    if (isIOS && !isStandalone && sessionStorage.getItem('pwa_dismissed') !== 'true') {
      setTimeout(showInstallBanner, 2000);
    }
  });

})();
