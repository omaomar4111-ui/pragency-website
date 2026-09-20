(function() {
  'use strict';
  
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  function renderMember(m) {
    const initial = (m.name || '?').charAt(0).toUpperCase();
    const photoHtml = m.photo_url
      ? `<img src="${escapeHtml(m.photo_url)}" alt="${escapeHtml(m.name)}" loading="lazy" onerror="this.parentElement.innerHTML='${initial}'" />`
      : initial;
    
    return `
      <article class="team-member-card" data-id="${m.id}">
        <div class="team-member-photo">${photoHtml}</div>
        <h3 class="team-member-name">${escapeHtml(m.name)}</h3>
        <p class="team-member-role">${escapeHtml(m.role)}</p>
        ${m.bio ? `<p class="team-member-bio">${escapeHtml(m.bio)}</p>` : ''}
      </article>
    `;
  }
  
  async function loadTeam() {
    const grid = document.getElementById('teamGrid');
    if (!grid) return;
    
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      
      if (!data.success || !data.data || data.data.length === 0) {
        grid.innerHTML = '<div class="team-empty-state">الفريق قيد الإنشاء قريباً</div>';
        return;
      }
      
      grid.innerHTML = data.data.map(renderMember).join('');

      if (typeof gsap !== 'undefined') {
        gsap.from('.team-member-card', {
          opacity: 0,
          y: 40,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.team-grid',
            start: 'top 80%'
          }
        });
      } else {
        document.querySelectorAll('.team-member-card').forEach(function(el) {
          el.classList.add('visible');
        });
      }
    } catch (err) {
      console.error('Team load error:', err);
      grid.innerHTML = '<div class="team-empty-state">حدث خطأ أثناء تحميل الفريق</div>';
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTeam);
  } else {
    loadTeam();
  }
})();
