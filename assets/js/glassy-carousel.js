// Interactive Glassy 3D Carousel Engine
(function initGlassyCarousel() {
  const container = document.getElementById('glassyCarouselContainer');
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.glassy-card'));
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');

  let activeIndex = 1;
  const total = cards.length;

  function updateCarousel() {
    cards.forEach((card, i) => {
      let offset = i - activeIndex;

      // Handle wrapping
      if (offset > Math.floor(total / 2)) offset -= total;
      if (offset < -Math.floor(total / 2)) offset += total;

      const absOffset = Math.abs(offset);

      if (offset === 0) {
        // Active Center Card
        card.style.transform = `translateX(0) translateZ(100px) scale(1.05)`;
        card.style.zIndex = '10';
        card.style.opacity = '1';
        card.style.filter = 'none';
        card.style.pointerEvents = 'auto';
      } else if (offset === -1 || (offset === total - 1 && total > 2)) {
        // Left Card
        card.style.transform = `translateX(-260px) translateZ(-80px) rotateY(22deg) scale(0.9)`;
        card.style.zIndex = '5';
        card.style.opacity = '0.75';
        card.style.filter = 'blur(1px)';
        card.style.pointerEvents = 'auto';
      } else if (offset === 1 || (offset === -(total - 1) && total > 2)) {
        // Right Card
        card.style.transform = `translateX(260px) translateZ(-80px) rotateY(-22deg) scale(0.9)`;
        card.style.zIndex = '5';
        card.style.opacity = '0.75';
        card.style.filter = 'blur(1px)';
        card.style.pointerEvents = 'auto';
      } else {
        // Hidden / Far Cards
        const dir = offset > 0 ? 1 : -1;
        card.style.transform = `translateX(${dir * 420}px) translateZ(-200px) scale(0.7)`;
        card.style.zIndex = '1';
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
      }
    });
  }

  function nextSlide() {
    activeIndex = (activeIndex + 1) % total;
    updateCarousel();
  }

  function prevSlide() {
    activeIndex = (activeIndex - 1 + total) % total;
    updateCarousel();
  }

  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      if (activeIndex !== index) {
        activeIndex = index;
        updateCarousel();
      }
    });
  });

  // Keyboard navigation
  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  });

  // Touch Swipe for Mobile
  let touchStartX = 0;
  container.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (diff > 50) prevSlide();
    if (diff < -50) nextSlide();
  }, { passive: true });

  updateCarousel();
})();
