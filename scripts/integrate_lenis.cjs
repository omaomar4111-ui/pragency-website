const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Check if Lenis already exists
if (!html.includes('lenis')) {
  const lenisScript = `  <!-- Lenis Luxury Smooth Scroll -->
  <script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.2,
        });

        if (window.gsap && window.ScrollTrigger) {
          lenis.on('scroll', ScrollTrigger.update);
          gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
          });
          gsap.ticker.lagSmoothing(0);
        } else {
          function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
          }
          requestAnimationFrame(raf);
        }
      }
    });
  </script>`;

  html = html.replace('</body>', `${lenisScript}\n</body>`);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Added Lenis Smooth Scroll to index.html');
} else {
  console.log('Lenis already present');
}
