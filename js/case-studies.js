(function() {
  'use strict';

  var grid = document.getElementById('case-studies-grid');
  if (!grid) return;

  var isEn = document.documentElement.lang === 'en';

  fetch('/api/case-studies')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      grid.innerHTML = '';

      if (!Array.isArray(data) || data.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#94A3B8;">' +
          (isEn ? 'No case studies published yet.' : 'لا توجد قصص نجاح منشورة حتى الآن.') +
          '</div>';
        return;
      }

      data.forEach(function(item) {
        var card = document.createElement('a');
        card.href = '/case-studies/' + encodeURIComponent(item.slug);
        card.className = 'cs-card';

        var clientName = (isEn && item.client_name_en) ? item.client_name_en : item.client_name;
        var resultText = (isEn && item.results_en) ? item.results_en : item.results_ar;
        var logoSrc = item.client_logo || '/assets/logos/pr-agency.webp';

        var metricsHtml = '';
        if (Array.isArray(item.metrics) && item.metrics.length > 0) {
          metricsHtml = '<div class="cs-metrics">';
          item.metrics.slice(0, 2).forEach(function(m) {
            metricsHtml += '<div class="cs-metric-item">' +
              '<span class="cs-metric-val">' + (m.value || '') + '</span>' +
              '<span class="cs-metric-lbl">' + (m.label || '') + '</span>' +
              '</div>';
          });
          metricsHtml += '</div>';
        }

        card.innerHTML = 
          '<div class="cs-top">' +
            '<img src="' + logoSrc + '" alt="' + clientName + '" class="cs-logo" loading="lazy" />' +
            '<span class="cs-badge">' + (item.service_type || 'Marketing') + '</span>' +
          '</div>' +
          '<h3 class="cs-name">' + clientName + '</h3>' +
          '<p class="cs-result-highlight">' + (resultText || '') + '</p>' +
          metricsHtml +
          '<div class="cs-cta-btn">' +
            '<span>' + (isEn ? 'Read Case Study' : 'اقرأ القصة كاملة') + '</span>' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</div>';

        grid.appendChild(card);
      });
    })
    .catch(function(err) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#EF4444;">' +
        (isEn ? 'Failed to load case studies. Please refresh.' : 'تعذر تحميل قصص النجاح. يرجى إعادة المحاولة.') +
        '</div>';
    });
})();
