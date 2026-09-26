/**
 * Scroll Progress Indicator
 * Updates the width of #scroll-progress as the user scrolls
 */
(function() {
  'use strict';

  function initScrollProgress() {
    let progressBar = document.getElementById('scroll-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'scroll-progress';
      document.body.prepend(progressBar);
    }

    let ticking = false;

    function updateProgress() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      progressBar.style.width = scrollPercent + '%';
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollProgress);
  } else {
    initScrollProgress();
  }
})();
