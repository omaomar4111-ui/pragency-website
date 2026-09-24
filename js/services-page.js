/**
 * services-page.js v1
 * Minimal page script for services.html
 * Future: could load services dynamically from D1
 */
(function () {
  // Footer year
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // GSAP Scroll Animation
  if (typeof gsap !== 'undefined') {
    gsap.from('.service-detailed-card', {
      opacity: 0,
      y: 40,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.services-detailed',
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });
  } else if (typeof window.initReveal !== 'function') {
    const cards = document.querySelectorAll('.service-detailed-card');
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      cards.forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        obs.observe(card);
      });
    }
  }
})();
