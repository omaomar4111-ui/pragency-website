/**
 * PR Agency — Portfolio Gallery Client Engine
 * Dynamic brand filtering, design rendering, and touch/keyboard lightbox
 */

document.addEventListener('DOMContentLoaded', () => {
  const brandsGrid = document.getElementById('brands-grid');
  const designsGrid = document.getElementById('designs-grid');
  const filterContainer = document.querySelector('.portfolio-filters');

  // Lightbox elements
  const lightbox = document.getElementById('portfolio-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxBrand = document.getElementById('lightbox-brand');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  let allBrands = [];
  let currentDesigns = [];
  let activeIndex = 0;
  let activeBrandSlug = 'all';

  const isEn = document.documentElement.lang === 'en' || window.location.pathname.startsWith('/en');

  // Render Skeletons
  function renderSkeletons(container, count = 4) {
    if (!container) return;
    container.innerHTML = Array(count).fill(0).map(() => '<div class="portfolio-skeleton"></div>').join('');
  }

  // Fetch Brands
  async function loadBrands() {
    renderSkeletons(brandsGrid, 3);
    try {
      const res = await fetch('/api/portfolio/brands');
      if (!res.ok) throw new Error('Failed to load brands');
      allBrands = await res.json();
      renderBrandFilters(allBrands);
      renderBrandsList(allBrands);
      loadDesigns('all');
    } catch (e) {
      console.error(e);
      if (brandsGrid) brandsGrid.innerHTML = `<div class="portfolio-empty">${isEn ? 'Failed to load portfolio brands.' : 'تعذر تحميل بيانات البراندات.'}</div>`;
    }
  }

  // Render Brand Filter Buttons
  function renderBrandFilters(brands) {
    if (!filterContainer) return;
    const allBtn = `
      <button class="filter-btn active" data-filter="all">
        <span>${isEn ? 'All Brands' : 'كل البراندات'}</span>
      </button>
    `;

    const brandBtns = brands.map(b => {
      const name = isEn && b.name_en ? b.name_en : b.name_ar;
      return `
        <button class="filter-btn" data-filter="${b.slug}">
          <span>${name}</span>
          <span class="badge-count">${b.design_count || 0}</span>
        </button>
      `;
    }).join('');

    filterContainer.innerHTML = allBtn + brandBtns;

    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const slug = btn.getAttribute('data-filter');
        activeBrandSlug = slug;
        loadDesigns(slug);

        // Highlight brand card if exists
        document.querySelectorAll('.brand-card').forEach(c => {
          c.classList.toggle('active', c.getAttribute('data-slug') === slug);
        });
      });
    });
  }

  // Render Brands Grid Cards
  function renderBrandsList(brands) {
    if (!brandsGrid) return;
    if (brands.length === 0) {
      brandsGrid.innerHTML = `<div class="portfolio-empty">${isEn ? 'No brands found.' : 'لا توجد علامات تجارية حتى الآن.'}</div>`;
      return;
    }

    brandsGrid.innerHTML = brands.map(b => {
      const name = isEn && b.name_en ? b.name_en : b.name_ar;
      const logo = b.logo_url || '/assets/logos/pr-agency.webp';
      const countLabel = isEn ? `${b.design_count || 0} Designs` : `${b.design_count || 0} تصميم`;
      return `
        <div class="brand-card" data-slug="${b.slug}">
          <div class="brand-logo-wrap">
            <img src="${logo}" alt="${name}" loading="lazy"/>
          </div>
          <div class="brand-name">${name}</div>
          <div class="brand-category">${b.category || ''}</div>
          <div class="brand-designs-tag">${countLabel}</div>
        </div>
      `;
    }).join('');

    brandsGrid.querySelectorAll('.brand-card').forEach(card => {
      card.addEventListener('click', () => {
        const slug = card.getAttribute('data-slug');
        if (slug) {
          window.location.href = `/portfolio/${slug}`;
        }
      });
    });
  }

  // Load & Render Designs
  async function loadDesigns(brandSlug = 'all') {
    renderSkeletons(designsGrid, 4);
    try {
      const endpoint = brandSlug === 'all' 
        ? '/api/portfolio/designs'
        : `/api/portfolio/brands/${brandSlug}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to load designs');
      const data = await res.json();
      currentDesigns = brandSlug === 'all' ? data : (data.designs || []);
      renderDesignsGrid(currentDesigns);
    } catch (e) {
      console.error(e);
      if (designsGrid) designsGrid.innerHTML = `<div class="portfolio-empty">${isEn ? 'Failed to load designs.' : 'تعذر تحميل التصاميم.'}</div>`;
    }
  }

  function renderDesignsGrid(designs) {
    if (!designsGrid) return;
    if (designs.length === 0) {
      designsGrid.innerHTML = `<div class="portfolio-empty">${isEn ? 'No designs published yet.' : 'لا توجد تصاميم منشورة لهذا البراند حالياً.'}</div>`;
      return;
    }

    designsGrid.innerHTML = designs.map((d, index) => {
      const title = isEn && d.title_en ? d.title_en : (d.title_ar || 'تصميم إبداعي');
      const desc = isEn && d.description_en ? d.description_en : (d.description_ar || '');
      const brandName = isEn && d.brand_name_en ? d.brand_name_en : (d.brand_name_ar || '');
      const img = d.thumbnail_url || d.image_url;

      return `
        <div class="design-card" data-index="${index}">
          <div class="design-thumb-wrap">
            <img src="${img}" alt="${title}" loading="lazy"/>
            <div class="design-overlay">
              <span class="design-zoom-icon">🔍</span>
            </div>
          </div>
          <div class="design-info">
            ${brandName ? `<span class="design-brand-badge">${brandName}</span>` : ''}
            <div class="design-title">${title}</div>
            ${desc ? `<p class="design-desc">${desc}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

    designsGrid.querySelectorAll('.design-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-index'), 10);
        openLightbox(idx);
      });
    });
  }

  // ── Lightbox Functions ───────────────────────────────────────────────
  function openLightbox(index) {
    if (!currentDesigns || !currentDesigns[index]) return;
    activeIndex = index;
    updateLightboxContent();
    lightbox.classList.remove('lightbox-hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.add('lightbox-hidden');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const item = currentDesigns[activeIndex];
    if (!item) return;
    lightboxImg.src = item.image_url || item.thumbnail_url;
    lightboxTitle.textContent = isEn && item.title_en ? item.title_en : (item.title_ar || '');
    lightboxDesc.textContent = isEn && item.description_en ? item.description_en : (item.description_ar || '');
    lightboxBrand.textContent = isEn && item.brand_name_en ? item.brand_name_en : (item.brand_name_ar || '');
  }

  function nextImage() {
    if (currentDesigns.length === 0) return;
    activeIndex = (activeIndex + 1) % currentDesigns.length;
    updateLightboxContent();
  }

  function prevImage() {
    if (currentDesigns.length === 0) return;
    activeIndex = (activeIndex - 1 + currentDesigns.length) % currentDesigns.length;
    updateLightboxContent();
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', nextImage);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (lightbox && !lightbox.classList.contains('lightbox-hidden')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') isEn ? nextImage() : prevImage();
      if (e.key === 'ArrowLeft') isEn ? prevImage() : nextImage();
    }
  });

  // Touch Swipe for Mobile
  let touchStartX = 0;
  let touchEndX = 0;
  if (lightbox) {
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // swipe right
        prevImage();
      } else {
        // swipe left
        nextImage();
      }
    }
  }

  // Initialize
  loadBrands();
});
