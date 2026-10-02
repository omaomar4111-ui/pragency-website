(function () {
  'use strict';

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function getVisitorId() {
    let vid = getCookie('pr_vid') || localStorage.getItem('pr_vid');
    if (!vid) {
      vid = 'vid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      try {
        localStorage.setItem('pr_vid', vid);
        document.cookie = `pr_vid=${vid}; Path=/; Max-Age=31536000; SameSite=Lax`;
      } catch (e) {}
    }
    return vid;
  }

  function getSessionId() {
    let sid = sessionStorage.getItem('pr_sid');
    if (!sid) {
      const today = new Date().toISOString().slice(0, 10);
      sid = getVisitorId().slice(0, 8) + '_' + today;
      try {
        sessionStorage.setItem('pr_sid', sid);
      } catch (e) {}
    }
    return sid;
  }

  function trackEvent(eventType, eventData = {}) {
    const payload = {
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      event_type: eventType,
      event_data: eventData,
      page_url: window.location.pathname + window.location.search
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', blob);
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }
  }

  window.trackEvent = trackEvent;

  // 1. Initial Page View
  trackEvent('page_view', { title: document.title, referrer: document.referrer });

  // 2. Track Clicks (Buttons, CTAs, Links)
  document.addEventListener('click', function (e) {
    const target = e.target.closest('a, button, [data-track]');
    if (!target) return;

    // WhatsApp Click
    if (target.closest('#wa-widget') || target.closest('.wa-widget') || target.href?.includes('wa.me')) {
      trackEvent('wa_click', { href: target.href || 'whatsapp' });
      return;
    }

    // Language Toggle
    if (target.closest('.lang-switch')) {
      trackEvent('lang_switch', { to: window.i18n ? window.i18n.get() : 'toggle' });
      return;
    }

    // Call / Phone click
    if (target.href?.startsWith('tel:')) {
      trackEvent('phone_click', { phone: target.href });
      return;
    }

    // General CTA Buttons
    if (
      target.classList.contains('hero-vr-cta') ||
      target.classList.contains('btn') ||
      target.classList.contains('mbar-btn') ||
      target.dataset.track === 'cta'
    ) {
      trackEvent('cta_click', {
        text: target.textContent?.trim().slice(0, 60),
        id: target.id || null,
        href: target.getAttribute('href') || null
      });
    }
  }, { passive: true });

  // 3. Track Form Submissions
  document.addEventListener('submit', function (e) {
    const form = e.target;
    trackEvent('form_submit', {
      form_id: form.id || 'unnamed_form',
      action: form.action || window.location.pathname
    });
  }, { passive: true });

  // 4. Track Scroll Depth (25%, 50%, 75%, 100%)
  const trackedDepths = new Set();
  function checkScrollDepth() {
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (docHeight <= winHeight) return;

    const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);
    const thresholds = [25, 50, 75, 100];

    thresholds.forEach(threshold => {
      if (scrollPercent >= threshold && !trackedDepths.has(threshold)) {
        trackedDepths.add(threshold);
        trackEvent('scroll_depth', { depth: threshold + '%' });
      }
    });
  }

  let scrollTimeout;
  window.addEventListener('scroll', function () {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(function () {
        checkScrollDepth();
        scrollTimeout = null;
      }, 300);
    }
  }, { passive: true });

})();
