/**
 * js/native-sync.js
 * PR Agency Native Capacitor Bridge & Offline Cloud Sync Engine
 * Handles Network status banner, Offline mutation queueing via Preferences,
 * Cloudflare D1 Cloud Sync, and Android Hardware Back Button navigation.
 */

(function () {
  const isCapacitor = typeof window !== 'undefined' && Boolean(window.Capacitor);
  const Plugins = isCapacitor ? window.Capacitor.Plugins : {};
  const Network = Plugins.Network;
  const Preferences = Plugins.Preferences;
  const App = Plugins.App;

  // Offline banner element
  let bannerEl = null;
  let lastBackPressTime = 0;

  function initUI() {
    if (document.getElementById('native-offline-banner')) return;

    bannerEl = document.createElement('div');
    bannerEl.id = 'native-offline-banner';
    bannerEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #ea580c, #c2410c);
      color: #ffffff;
      text-align: center;
      padding: 10px 16px;
      font-size: 13.5px;
      font-weight: 700;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 999999;
      display: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      direction: rtl;
    `;
    bannerEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
        <span style="font-size:16px;">⚠️</span>
        <span>أنت غير متصل بالإنترنت، سيتم حفظ التغييرات محلياً ومزامنتها لاحقاً.</span>
      </div>
    `;
    document.body.appendChild(bannerEl);
  }

  function showToast(message, duration = 3000) {
    let toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #f8fafc;
      padding: 10px 20px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      z-index: 999999;
      direction: rtl;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      transition: opacity 0.25s ease;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  function updateNetworkStatus(connected) {
    initUI();
    if (bannerEl) {
      bannerEl.style.display = connected ? 'none' : 'block';
    }
    if (connected) {
      syncOfflineQueue();
    }
  }

  // Capacitor Network Listener
  if (Network) {
    Network.getStatus().then((status) => updateNetworkStatus(status.connected));
    Network.addListener('networkStatusChange', (status) => {
      updateNetworkStatus(status.connected);
      if (status.connected) {
        showToast('🟢 تم استعادة الاتصال. جاري مزامنة التغييرات السحابية...');
      }
    });
  } else {
    // Browser fallback
    window.addEventListener('online', () => updateNetworkStatus(true));
    window.addEventListener('offline', () => updateNetworkStatus(false));
    updateNetworkStatus(navigator.onLine);
  }

  // Preferences Storage Queue
  async function getStoredQueue() {
    try {
      if (Preferences) {
        const { value } = await Preferences.get({ key: 'pr_offline_sync_queue' });
        return value ? JSON.parse(value) : [];
      } else {
        const raw = localStorage.getItem('pr_offline_sync_queue');
        return raw ? JSON.parse(raw) : [];
      }
    } catch (e) {
      console.warn('[NativeSync] Error reading offline queue:', e);
      return [];
    }
  }

  async function saveStoredQueue(queue) {
    try {
      const serialized = JSON.stringify(queue);
      if (Preferences) {
        await Preferences.set({ key: 'pr_offline_sync_queue', value: serialized });
      } else {
        localStorage.setItem('pr_offline_sync_queue', serialized);
      }
    } catch (e) {
      console.warn('[NativeSync] Error saving offline queue:', e);
    }
  }

  async function queueMutation(endpoint, method, body, headers = {}) {
    const queue = await getStoredQueue();
    queue.push({
      id: 'mut_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      endpoint,
      method,
      body,
      headers,
      timestamp: new Date().toISOString()
    });
    await saveStoredQueue(queue);
    showToast('💾 تم حفظ العملية محلياً وستُرفع تلقائياً عند عودة الاتصال.');
  }

  async function syncOfflineQueue() {
    const queue = await getStoredQueue();
    if (!queue || queue.length === 0) return;

    const remaining = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const res = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...(item.headers || {})
          },
          body: item.body ? JSON.stringify(item.body) : undefined
        });

        if (res.ok) {
          syncedCount++;
        } else if (res.status >= 400 && res.status < 500) {
          // Client error, drop invalid payload
          console.warn('[NativeSync] Discarding invalid payload:', item);
        } else {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
      }
    }

    await saveStoredQueue(remaining);
    if (syncedCount > 0) {
      showToast(`☁️ تم مزامنة ${syncedCount} عملية سحابية بنجاح!`);
    }
  }

  // Android Hardware Back Button Handling
  if (App) {
    App.addListener('backButton', ({ canGoBack }) => {
      // If modal or palette is open, close it first
      const activeModal = document.querySelector('.modal.open, .dialog-active, .palette-active');
      if (activeModal) {
        activeModal.classList.remove('open', 'dialog-active', 'palette-active');
        return;
      }

      if (canGoBack && window.location.pathname !== '/' && window.location.pathname !== '/admin-agency.html') {
        window.history.back();
        return;
      }

      const now = Date.now();
      if (now - lastBackPressTime < 2000) {
        App.exitApp();
      } else {
        lastBackPressTime = now;
        showToast('اضغط مرة أخرى للخروج من التطبيق');
      }
    });
  }

  // Expose API globally
  window.NativeSync = {
    isCapacitor,
    queueMutation,
    syncOfflineQueue,
    getStoredQueue,
    showToast
  };

  document.addEventListener('DOMContentLoaded', initUI);
})();
