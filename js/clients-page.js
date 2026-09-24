/**
 * clients-page.js v1
 * Loads clients dynamically from /api/clients (D1)
 * Falls back to static list if D1 is empty or unavailable
 */
(function () {
  const grid = document.getElementById('clientsGrid');
  const loading = document.getElementById('clientsLoading');

  if (!grid) return;

  // Static fallback clients (shown if D1 is empty or errors)
  const FALLBACK_CLIENTS = [
    // Add static clients here as needed
    // { id: 1, name: 'براند مثال', logo_url: 'assets/clients/logo.webp', website_url: '#' }
  ];

  function renderClients(clients) {
    if (loading) loading.style.display = 'none';

    if (!clients || clients.length === 0) {
      if (FALLBACK_CLIENTS.length > 0) {
        renderClients(FALLBACK_CLIENTS);
        return;
      }
      grid.innerHTML = '<p class="clients-empty">نحن نضيف عملاءنا قريباً. ترقّب!</p>';
      return;
    }

    grid.innerHTML = clients
      .map((c) => {
        const logoHTML = c.logo_url
          ? `<img src="${escapeHtml(c.logo_url)}" alt="${escapeHtml(c.name)}" class="client-logo" loading="lazy" width="120" height="60" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
             <span class="client-name-fallback" style="display:none">${escapeHtml(c.name)}</span>`
          : `<span class="client-name-fallback">${escapeHtml(c.name)}</span>`;

        const cardContent = `
          <div class="client-logo-wrap">
            ${logoHTML}
          </div>
          <span class="client-name">${escapeHtml(c.name)}</span>
        `;

        if (c.website_url && c.website_url !== '#') {
          return `<a href="${escapeHtml(c.website_url)}" class="client-card" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(c.name)}">${cardContent}</a>`;
        }
        return `<div class="client-card">${cardContent}</div>`;
      })
      .join('');

    if (typeof gsap !== 'undefined') {
      gsap.from('.client-card', {
        opacity: 0,
        y: 30,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.clients-grid',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadClients() {
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      renderClients(data.clients || []);
    } catch (err) {
      console.warn('[clients-page] API error, using fallback:', err);
      if (loading) loading.style.display = 'none';
      renderClients(FALLBACK_CLIENTS);
    }
  }

  // Start loading
  loadClients();
})();
