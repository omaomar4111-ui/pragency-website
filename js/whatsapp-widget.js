(function () {
  'use strict';

  const PHONE = '201144826641';
  
  // Context-aware messages per page
  const MESSAGES = {
    '/': 'أهلاً 👋 عايز تعرف أكتر عن PR Agency وخدماتنا؟',
    '/about': 'شوفت عن الوكالة؟ عايز نناقش إزاي نساعدك؟',
    '/services': 'شوفت الخدمات؟ عايز نناقش تفاصيل مشروعك؟',
    '/clients': 'شوفت عملاءنا؟ عايز تكون التالي؟',
    '/team': 'عايز تتعرف على الفريق؟ تعال نتكلم',
    '/services/clinics': 'بتدور على تسويق لعيادتك؟ إحنا متخصصين 🏥',
    '/services/gyms': 'عايز تجيب أعضاء جداد لجيمك؟ 💪',
    '/services/real-estate': 'محتاج تسويق لمشروعك العقاري؟ 🏢',
    '/services/ecommerce': 'عايز تزود مبيعات متجرك؟ 🛒',
    '/blog': 'شوفت مقالاتنا؟ عندك سؤال؟',
    default: 'أهلاً 👋 كيف أقدر أساعدك؟'
  };
  
  function getMessage() {
    const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    return MESSAGES[path] || MESSAGES.default;
  }
  
  function trackClick() {
    // GA4
    if (typeof gtag === 'function') {
      gtag('event', 'whatsapp_click', {
        'event_category': 'engagement',
        'event_label': window.location.pathname,
        'value': 1
      });
    }
    // Meta Pixel
    if (typeof fbq === 'function') {
      fbq('track', 'Contact', {
        content_name: 'WhatsApp Click',
        content_category: window.location.pathname
      });
    }
  }
  
  function init() {
    if (document.getElementById('wa-widget')) return;
    var widget = document.createElement('a');
    widget.id = 'wa-widget';
    widget.className = 'wa-widget';
    widget.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(getMessage());
    widget.target = '_blank';
    widget.rel = 'noopener';
    widget.setAttribute('aria-label', 'تواصل معنا على واتساب');
    widget.innerHTML = 
      '<svg viewBox="0 0 448 512" width="28" height="28" fill="currentColor">' +
        '<path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157z"/>' +
      '</svg>' +
      '<span class="wa-tooltip">كلمنا على واتساب</span>';
    
    widget.addEventListener('click', trackClick);
    document.body.appendChild(widget);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
