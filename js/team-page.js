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
    return `
      <article class="role-card" data-id="${m.id}">
        <div class="role-image-wrap">
          <div class="role-image">
            ${m.photo_url 
              ? `<picture>
                   <source srcset="${escapeHtml(m.photo_url)}" type="image/webp">
                   <img src="${escapeHtml(m.photo_url.replace('.webp', '.png'))}" alt="${escapeHtml(m.name)}" loading="lazy" width="300" height="300" onerror="this.src='${escapeHtml(m.photo_url)}'" />
                 </picture>`
              : `<div style="font-size:32px;font-weight:900;color:#fff">${escapeHtml((m.name||'?').charAt(0))}</div>`
            }
          </div>
        </div>
        <div class="role-info">
          <h3 class="role-name-en">${escapeHtml(m.name)}</h3>
          <p class="role-name-ar">${escapeHtml(m.role || '')}</p>
          <p class="role-desc">${escapeHtml(m.bio || '')}</p>
        </div>
        <div class="role-line"></div>
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
        gsap.from('.role-card', {
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
