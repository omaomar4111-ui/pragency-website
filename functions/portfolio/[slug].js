export async function onRequestGet(context) {
  const { params, env, request } = context;
  const slug = params.slug;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db || !slug) {
    return new Response('Database or slug unavailable', { status: 500 });
  }

  try {
    const brand = await db.prepare(
      'SELECT * FROM portfolio_brands WHERE slug = ? AND is_published = 1'
    ).bind(slug).first();

    if (!brand) {
      return new Response('Brand not found', { status: 404 });
    }

    const { results: rawDesigns } = await db.prepare(
      'SELECT * FROM portfolio_designs WHERE brand_id = ? AND is_published = 1 ORDER BY display_order ASC, id DESC'
    ).bind(brand.id).all();

    const designs = rawDesigns || [];

    const url = new URL(request.url);
    const isEn = url.pathname.startsWith('/en/');

    const brandName = isEn && brand.name_en ? brand.name_en : (brand.name_ar || brand.slug);
    const brandDesc = isEn && brand.description_en ? brand.description_en : (brand.description_ar || 'نماذج أعمال وتصاميم إبداعية لعلامة تجارية رائدة بالتعاون مع PR Agency.');
    const brandLogo = brand.logo_url || '/assets/logos/pr-agency.webp';
    const categoryName = brand.category || (isEn ? 'Creative Direction' : 'إدارة المحتوى والهوية');
    const clientName = brandName;
    const year = '2026';

    const categoryMap = {
      'social_media': isEn ? 'Social Media Management' : 'إدارة السوشيال ميديا',
      'branding': isEn ? 'Brand Identity' : 'الهوية البصرية والبراندنج',
      'ads': isEn ? 'Performance Marketing & Ads' : 'الإعلانات الممولة',
      'video': isEn ? 'Video Production & Reels' : 'الإنتاج المرئي وتصوير',
      'other': isEn ? 'Full Creative Services' : 'خدمات تسويقية متكاملة'
    };
    const displayCategory = categoryMap[brand.category] || (isEn ? 'Brand Growth & Marketing' : 'تسويق وإدارة العلامة التجارية');

    // JSON-LD CollectionPage schema with hasPart
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${brandName} — ${isEn ? 'Brand Portfolio & Gallery' : 'معرض أعمال وتصاميم البراند'}`,
      "description": brandDesc,
      "url": request.url,
      "publisher": {
        "@type": "Organization",
        "name": "PR Agency",
        "url": "https://pragency.pages.dev",
        "logo": "https://pragency.pages.dev/assets/logos/pr-agency.webp"
      },
      "about": {
        "@type": "Organization",
        "name": brandName,
        "description": brandDesc
      },
      "hasPart": designs.map(d => ({
        "@type": "CreativeWork",
        "name": isEn && d.title_en ? d.title_en : (d.title_ar || brandName),
        "description": isEn && d.description_en ? d.description_en : (d.description_ar || ''),
        "image": d.image_url ? (d.image_url.startsWith('http') ? d.image_url : `https://pragency.pages.dev${d.image_url}`) : undefined
      }))
    };

    // Render designs masonry HTML
    let designsHtml = '';
    if (designs.length === 0) {
      designsHtml = `<div class="brand-empty-designs">${isEn ? 'No designs published for this brand yet.' : 'لا توجد تصاميم منشورة لهذا البراند حالياً.'}</div>`;
    } else {
      designs.forEach((d, idx) => {
        const title = isEn && d.title_en ? d.title_en : (d.title_ar || `تصميم #${idx + 1}`);
        const desc = isEn && d.description_en ? d.description_en : (d.description_ar || '');
        const img = d.image_url || '/assets/logos/pr-agency.webp';
        const thumb = d.thumbnail_url || img;

        designsHtml += `
          <div class="brand-design-card" data-index="${idx}" data-img="${img}" data-title="${title}" data-desc="${desc}">
            <div class="brand-design-img-wrap">
              <img src="${thumb}" alt="${title}" loading="lazy" width="600" height="600"/>
              <div class="brand-design-overlay">
                <span class="brand-design-zoom-btn" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </span>
                <div class="brand-design-info">
                  <h3 class="brand-design-title">${title}</h3>
                  ${desc ? `<p class="brand-design-desc">${desc}</p>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }

    const html = `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'ar'}" dir="${isEn ? 'ltr' : 'rtl'}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${brandName} — ${isEn ? 'Portfolio Gallery' : 'معرض أعمال البراند'} | PR Agency</title>
  <meta name="description" content="${brandDesc}"/>
  <link rel="canonical" href="https://pragency.pages.dev/portfolio/${brand.slug}"/>
  
  <meta property="og:title" content="${brandName} — PR Agency Portfolio"/>
  <meta property="og:description" content="${brandDesc}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:url" content="https://pragency.pages.dev/portfolio/${brand.slug}"/>
  <meta property="og:image" content="${designs[0]?.image_url ? (designs[0].image_url.startsWith('http') ? designs[0].image_url : 'https://pragency.pages.dev' + designs[0].image_url) : 'https://pragency.pages.dev/og.jpg'}"/>
  <meta property="og:site_name" content="PR Agency"/>

  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="/css/style.css?v=89"/>
  <link rel="stylesheet" href="/css/pages.css?v=89"/>
  <link rel="stylesheet" href="/css/portfolio.css?v=89"/>
  <link rel="stylesheet" href="/css/chatbot.css?v=89"/>

  <script type="application/ld+json">
    ${JSON.stringify(jsonLd)}
  </script>
</head>
<body class="page-brand-portfolio">

  <!-- Main Navigation -->
  <nav id="hdr" role="navigation" aria-label="التنقل الرئيسي">
    <a href="/" aria-label="PR Agency — الرئيسية" class="hdr-logo-link">
      <img src="/assets/logos/pr-agency.webp" alt="PR Agency" class="hdr-logo" width="60" height="60"/>
    </a>
    <div class="hdr-nav">
      <a href="/">${isEn ? 'Home' : 'الرئيسية'}</a>
      <a href="/about.html">${isEn ? 'About' : 'من نحن'}</a>
      <a href="/services.html">${isEn ? 'Services' : 'الخدمات'}</a>
      <a href="/portfolio" class="active">${isEn ? 'Portfolio' : 'معرض الأعمال'}</a>
      <a href="/team">${isEn ? 'Team' : 'الفريق'}</a>
      <a href="/clients.html">${isEn ? 'Clients' : 'العملاء'}</a>
      <a href="/#register">${isEn ? 'Contact' : 'تواصل'}</a>
    </div>
    <div class="hdr-actions">
      <a href="https://wa.me/201144826641" class="hdr-cta" target="_blank" rel="noopener">
        ${isEn ? 'Contact Us' : 'كلمنا'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </div>
  </nav>

  <main class="brand-page-main">
    
    <!-- Breadcrumb / Back Link -->
    <div class="brand-back-nav">
      <a href="/portfolio" class="brand-back-link">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="${isEn ? 'M19 12H5M12 19l-7-7 7-7' : 'M5 12h14M12 5l7 7-7 7'}"/>
        </svg>
        <span>${isEn ? 'Back to All Brands' : 'العودة لكل الأعمال'}</span>
      </a>
    </div>

    <!-- 1. Top Hero Section -->
    <header class="brand-hero">
      <div class="brand-hero-badge">${displayCategory}</div>
      <h1 class="brand-hero-title">${brandName}</h1>
      <p class="brand-hero-desc">${brandDesc}</p>
    </header>

    <!-- 2. Minimalist Metadata Block -->
    <section class="brand-meta">
      <div class="brand-meta-grid">
        <div class="brand-meta-item">
          <span class="brand-meta-label">${isEn ? 'Client' : 'العميل'}</span>
          <strong class="brand-meta-value">${clientName}</strong>
        </div>
        <div class="brand-meta-item">
          <span class="brand-meta-label">${isEn ? 'Year' : 'السنة'}</span>
          <strong class="brand-meta-value">${year}</strong>
        </div>
        <div class="brand-meta-item">
          <span class="brand-meta-label">${isEn ? 'Services Provided' : 'الخدمات المنفذة'}</span>
          <strong class="brand-meta-value">${displayCategory}</strong>
        </div>
      </div>
    </section>

    <!-- 3. Minimalist Responsive Masonry Gallery -->
    <section class="brand-gallery-section">
      <div class="brand-designs-grid" id="brand-designs-masonry">
        ${designsHtml}
      </div>
    </section>

    <!-- 4. Brand Logo Presentation Section -->
    <section class="brand-logo-section">
      <div class="brand-logo-card">
        <div class="brand-logo-img-wrap">
          <img src="${brandLogo}" alt="${brandName} Logo" loading="lazy" width="140" height="140"/>
        </div>
        <h2 class="brand-logo-name">${brandName}</h2>
        <p class="brand-logo-tagline">${isEn ? "Creative Visual Identity & Growth Partnership" : "شراكة نمو وهوية بصرية متكاملة"}</p>
      </div>
    </section>

    <!-- 5. Conversion CTA Section -->
    <section class="brand-cta">
      <div class="brand-cta-inner">
        <h2 class="brand-cta-title">${isEn ? 'Want results like this for your brand?' : 'عايز نتايج زي دي لبراندك؟'}</h2>
        <p class="brand-cta-subtitle">${isEn ? 'Let’s build something remarkable together with custom creative direction and high-converting marketing.' : 'فريقنا جاهز يحوّل أفكارك لحملات إبداعية وتصاميم تفرّق براندك عن كل المنافسين.'}</p>
        <div class="brand-cta-buttons">
          <a href="/#register" class="btn btn-primary brand-cta-btn">${isEn ? 'Start Your Project' : 'ابدأ مشروعك معانا'}</a>
          <a href="https://wa.me/201144826641" class="btn btn-secondary brand-cta-wa" target="_blank" rel="noopener">
            ${isEn ? 'Chat on WhatsApp' : 'تواصل عبر واتساب'}
          </a>
        </div>
      </div>
    </section>

  </main>

  <!-- Lightbox Modal for Brand Designs -->
  <div id="brand-lightbox" class="lightbox-hidden" role="dialog" aria-modal="true" aria-label="${isEn ? 'Image preview' : 'معاينة التصميم'}">
    <button class="lightbox-close" aria-label="Close">✕</button>
    <button class="lightbox-prev" aria-label="Previous">‹</button>
    <button class="lightbox-next" aria-label="Next">›</button>
    <div class="lightbox-content">
      <img id="brand-lightbox-img" src="" alt="" />
      <div class="lightbox-caption">
        <h3 id="brand-lightbox-title"></h3>
        <p id="brand-lightbox-desc"></p>
      </div>
    </div>
  </div>

  <footer class="footer">
    <div class="footer-bottom">
      <p>© 2026 PR Agency. All rights reserved.</p>
    </div>
  </footer>

  <script>
    // Lightbox interactivity for SSR Brand Gallery
    (function() {
      const cards = Array.from(document.querySelectorAll('.brand-design-card'));
      const lightbox = document.getElementById('brand-lightbox');
      const lbImg = document.getElementById('brand-lightbox-img');
      const lbTitle = document.getElementById('brand-lightbox-title');
      const lbDesc = document.getElementById('brand-lightbox-desc');
      const btnClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
      const btnPrev = lightbox ? lightbox.querySelector('.lightbox-prev') : null;
      const btnNext = lightbox ? lightbox.querySelector('.lightbox-next') : null;

      if (!lightbox || cards.length === 0) return;

      let currentIndex = 0;

      function showImage(idx) {
        if (idx < 0) idx = cards.length - 1;
        if (idx >= cards.length) idx = 0;
        currentIndex = idx;
        const card = cards[currentIndex];
        const img = card.getAttribute('data-img');
        const title = card.getAttribute('data-title') || '';
        const desc = card.getAttribute('data-desc') || '';

        lbImg.src = img;
        lbImg.alt = title;
        lbTitle.textContent = title;
        lbDesc.textContent = desc;
        lightbox.classList.remove('lightbox-hidden');
        document.body.style.overflow = 'hidden';
      }

      function closeLightbox() {
        lightbox.classList.add('lightbox-hidden');
        document.body.style.overflow = '';
      }

      cards.forEach((card, i) => {
        card.addEventListener('click', () => showImage(i));
      });

      if (btnClose) btnClose.addEventListener('click', closeLightbox);
      if (btnPrev) btnPrev.addEventListener('click', () => showImage(currentIndex - 1));
      if (btnNext) btnNext.addEventListener('click', () => showImage(currentIndex + 1));

      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });

      document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('lightbox-hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showImage(${isEn ? 'currentIndex - 1' : 'currentIndex + 1'});
        if (e.key === 'ArrowRight') showImage(${isEn ? 'currentIndex + 1' : 'currentIndex - 1'});
      });
    })();
  </script>

</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=120'
      }
    });

  } catch (err) {
    return new Response(`Error rendering brand page: ${err.message}`, { status: 500 });
  }
}
