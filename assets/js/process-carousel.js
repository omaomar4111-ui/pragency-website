// 3D Glassy Perspective Process Carousel Engine (Autonomous 60fps Loop + Drag + Swipe + 3D Hover)
(function initProcessCarousel() {
  const container = document.getElementById('processCarouselContainer');
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.process-card-3d'));
  if (!cards.length) return;

  // Start precisely at Step 01 (index 0)
  let activeIndex = 0; 
  const total = cards.length;
  let autoPlayTimer = null;
  let isInteracting = false;

  function updateCarousel() {
    cards.forEach((card, i) => {
      let offset = i - activeIndex;

      // Handle continuous circular wrapping smoothly
      if (offset > Math.floor(total / 2)) offset -= total;
      if (offset < -Math.floor(total / 2)) offset += total;

      if (offset === 0) {
        // Active Center Card (Fully focused, front stage, glowing)
        card.style.transform = 'translate3d(-50%, -50%, 150px) scale(1.08)';
        card.style.zIndex = '30';
        card.style.opacity = '1';
        card.style.filter = 'none';
        card.style.pointerEvents = 'auto';
        card.classList.add('is-active');
      } else if (offset === 1 || (offset === -(total - 1) && total > 2)) {
        // Right Card (Next Step in RTL context)
        card.style.transform = 'translate3d(calc(-50% + 310px), -50%, -40px) rotateY(-25deg) scale(0.9)';
        card.style.zIndex = '20';
        card.style.opacity = '0.75';
        card.style.filter = 'blur(0.5px)';
        card.style.pointerEvents = 'auto';
        card.classList.remove('is-active');
      } else if (offset === -1 || (offset === total - 1 && total > 2)) {
        // Left Card (Previous Step in RTL context)
        card.style.transform = 'translate3d(calc(-50% - 310px), -50%, -40px) rotateY(25deg) scale(0.9)';
        card.style.zIndex = '20';
        card.style.opacity = '0.75';
        card.style.filter = 'blur(0.5px)';
        card.style.pointerEvents = 'auto';
        card.classList.remove('is-active');
      } else {
        // Background 4th Card (Opposite side)
        const dir = offset > 0 ? 1 : -1;
        card.style.transform = `translate3d(calc(-50% + ${dir * 480}px), -50%, -200px) rotateY(${dir * -35}deg) scale(0.72)`;
        card.style.zIndex = '5';
        card.style.opacity = '0.3';
        card.style.filter = 'blur(3px)';
        card.style.pointerEvents = 'auto';
        card.classList.remove('is-active');
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

  // 1. Autonomous Autoplay Loop (تحرك تلقائي ناعم ومريح)
  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(() => {
      if (!isInteracting) {
        nextSlide();
      }
    }, 4200);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  // Pause on hover so the user can read comfortably
  container.addEventListener('mouseenter', () => {
    isInteracting = true;
  });

  container.addEventListener('mouseleave', () => {
    isInteracting = false;
  });

  // Direct click on any card to bring it to center immediately
  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      if (activeIndex !== index) {
        activeIndex = index;
        updateCarousel();
      }
    });
  });

  // 2. Touch Swipe & Mouse Drag Handling (سحب وتقليب سلس وفوري)
  let startX = 0;
  let isDragging = false;

  // Touch on Mobile
  container.addEventListener('touchstart', (e) => {
    isInteracting = true;
    startX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (diff > 40) {
      prevSlide();
    } else if (diff < -40) {
      nextSlide();
    }
    setTimeout(() => { isInteracting = false; }, 800);
  }, { passive: true });

  // Mouse Drag on Desktop
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    isInteracting = true;
    startX = e.clientX;
    container.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = 'grab';
    const diff = e.clientX - startX;
    if (diff > 50) {
      prevSlide();
    } else if (diff < -50) {
      nextSlide();
    }
    setTimeout(() => { isInteracting = false; }, 800);
  });

  // Initial immediate layout from Step 01
  updateCarousel();
  startAutoPlay();
})();
