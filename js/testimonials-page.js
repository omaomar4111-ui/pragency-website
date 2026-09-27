(function () {
  'use strict';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function renderStars(n) {
    var r = Math.min(Math.max(parseInt(n, 10) || 5, 1), 5);
    var out = '';
    for (var i = 0; i < 5; i++) {
      out += (i < r) ? '★' : '☆';
    }
    return out;
  }

  function renderCard(t) {
    var initial = (t.name || '?').charAt(0).toUpperCase();
    var photo = t.photo_url
      ? '<img src="' + escapeHtml(t.photo_url) + '" alt="' + escapeHtml(t.name) + '" loading="lazy" onerror="this.parentElement.innerHTML=\'' + initial + '\'"/>'
      : initial;
    var company = t.company ? ' — ' + escapeHtml(t.company) : '';

    return '<article class="testimonial-card rv">' +
      '<div class="testimonial-quote">“</div>' +
      '<p class="testimonial-content">' + escapeHtml(t.content) + '</p>' +
      '<div class="testimonial-rating">' + renderStars(t.rating) + '</div>' +
      '<div class="testimonial-author">' +
        '<div class="testimonial-photo">' + photo + '</div>' +
        '<div class="testimonial-meta">' +
          '<h4 class="testimonial-name">' + escapeHtml(t.name) + '</h4>' +
          '<p class="testimonial-role">' + escapeHtml(t.role || '') + company + '</p>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  async function loadTestimonials() {
    var grid = document.getElementById('testimonialsPageGrid');
    if (!grid) return;

    try {
      var res = await fetch('/api/testimonials');
      var data = await res.json();

      if (!data.success || !data.data || data.data.length === 0) {
        grid.innerHTML = '<div class="testimonials-empty">لا توجد آراء مسجلة حتى الآن</div>';
        return;
      }

      // Display ALL active testimonials on the dedicated page
      grid.innerHTML = data.data.map(renderCard).join('');
    } catch (err) {
      console.error('Testimonials page load error:', err);
      grid.innerHTML = '<div class="testimonials-empty">حدث خطأ أثناء تحميل الآراء</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTestimonials);
  } else {
    loadTestimonials();
  }
})();
