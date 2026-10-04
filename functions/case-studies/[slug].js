export async function onRequestGet(context) {
  const { params, env, request } = context;
  const slug = params.slug;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db || !slug) {
    return new Response('Database or slug unavailable', { status: 500 });
  }

  try {
    const study = await db.prepare(
      'SELECT * FROM case_studies WHERE slug = ? AND is_published = 1'
    ).bind(slug).first();

    if (!study) {
      return new Response('Case study not found', { status: 404 });
    }

    const url = new URL(request.url);
    const isEn = url.pathname.startsWith('/en/');

    const clientName = isEn && study.client_name_en ? study.client_name_en : study.client_name;
    const challenge = isEn && study.challenge_en ? study.challenge_en : study.challenge_ar;
    const solution = isEn && study.solution_en ? study.solution_en : study.solution_ar;
    const results = isEn && study.results_en ? study.results_en : study.results_ar;
    const testimonial = isEn && study.testimonial_en ? study.testimonial_en : study.testimonial_ar;
    const author = study.testimonial_author || '';
    const logo = study.client_logo || '/assets/logos/pr-agency.webp';

    let metrics = [];
    try { metrics = JSON.parse(study.metrics_json || '[]'); } catch (e) {}

    let metricsCardsHtml = '';
    metrics.forEach(m => {
      metricsCardsHtml += `
        <div class="cs-detail-metric">
          <span class="cs-detail-metric-val">${m.value || ''}</span>
          <span class="cs-detail-metric-lbl">${m.label || ''}</span>
        </div>
      `;
    });

    // Structured Data (JSON-LD)
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CaseStudy",
      "name": clientName,
      "url": request.url,
      "about": study.service_type || "Marketing",
      "description": results,
      "publisher": {
        "@type": "Organization",
        "name": "PR Agency",
        "url": "https://pragency.pages.dev"
      }
    };

    if (testimonial) {
      jsonLd.review = {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        },
        "author": {
          "@type": "Person",
          "name": author || "Client"
        },
        "reviewBody": testimonial
      };
    }

    const html = `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'ar'}" dir="${isEn ? 'ltr' : 'rtl'}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${clientName} — ${isEn ? 'Case Study' : 'قصة نجاح'} | PR Agency</title>
  <meta name="description" content="${results}"/>
  
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link rel="stylesheet" href="/css/style.css?v=75"/>
  <link rel="stylesheet" href="/css/pages.css?v=75"/>
  <link rel="stylesheet" href="/css/chatbot.css?v=75"/>
  
  <!-- Structured Data (CaseStudy + Review) -->
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd)}
  </script>

  <style>
    .cs-detail-page {
      max-width: 900px;
      margin: 40px auto 100px;
      padding: 0 24px;
    }
    .cs-back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #A78BFA;
      text-decoration: none;
      font-weight: 700;
      margin-bottom: 32px;
      transition: color 0.2s;
    }
    .cs-back-link:hover {
      color: #C4B5FD;
    }
    .cs-detail-hero {
      text-align: center;
      padding: 48px 24px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      margin-bottom: 48px;
      backdrop-filter: blur(12px);
    }
    .cs-detail-logo {
      height: 64px;
      max-width: 180px;
      object-fit: contain;
      margin-bottom: 20px;
      filter: brightness(1.2);
    }
    .cs-detail-service {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #C4B5FD;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .cs-detail-title {
      font-size: clamp(2rem, 4vw, 2.8rem);
      font-weight: 900;
      color: #FFFFFF;
      margin: 0;
    }
    .cs-detail-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 32px;
    }
    .cs-section-label {
      font-size: 0.85rem;
      font-weight: 800;
      color: #8B5CF6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cs-section-body {
      font-size: 1.05rem;
      line-height: 1.8;
      color: #E2E8F0;
      margin: 0;
    }
    .cs-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    .cs-detail-metric {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
    }
    .cs-detail-metric-val {
      display: block;
      font-size: 2rem;
      font-weight: 900;
      color: #10B981;
      margin-bottom: 6px;
    }
    .cs-detail-metric-lbl {
      font-size: 0.85rem;
      color: #94A3B8;
      font-weight: 600;
    }
    .cs-testimonial-box {
      border-left: ${isEn ? '4px solid #8B5CF6' : 'none'};
      border-right: ${isEn ? 'none' : '4px solid #8B5CF6'};
      background: rgba(139, 92, 246, 0.06);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 32px;
    }
    .cs-testimonial-quote {
      font-size: 1.15rem;
      font-style: italic;
      color: #F8FAFC;
      line-height: 1.7;
      margin-bottom: 16px;
    }
    .cs-testimonial-author {
      font-weight: 800;
      color: #A78BFA;
      font-size: 0.95rem;
    }
    .cs-detail-cta {
      text-align: center;
      padding: 56px 24px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.1));
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 24px;
      margin-top: 48px;
    }
    .cs-cta-heading {
      font-size: 1.8rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 12px;
    }
    .cs-cta-sub {
      color: #CBD5E1;
      font-size: 1rem;
      margin-bottom: 28px;
    }
    .cs-cta-action {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #8B5CF6, #EC4899);
      color: #fff;
      font-weight: 800;
      padding: 16px 36px;
      border-radius: 16px;
      text-decoration: none;
      font-size: 1.05rem;
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cs-cta-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(139, 92, 246, 0.5);
    }
  </style>
</head>
<body class="page-services">

<nav id="hdr" role="navigation">
  <a href="/" class="hdr-logo-link">
    <img src="/assets/logos/pr-agency.webp" alt="PR Agency" class="hdr-logo" width="60" height="60"/>
  </a>
  <div class="hdr-nav">
    <a href="/">${isEn ? 'Home' : 'الرئيسية'}</a>
    <a href="/services.html">${isEn ? 'Services' : 'الخدمات'}</a>
    <a href="/case-studies" class="active">${isEn ? 'Case Studies' : 'قصص النجاح'}</a>
    <a href="/clients.html">${isEn ? 'Clients' : 'العملاء'}</a>
    <a href="/#register">${isEn ? 'Contact' : 'تواصل'}</a>
  </div>
  <div class="hdr-actions">
    <a href="https://wa.me/201144826641" class="hdr-cta" target="_blank" rel="noopener">
      ${isEn ? 'WhatsApp' : 'كلمنا'}
    </a>
  </div>
</nav>

<main class="cs-detail-page">
  <a href="/case-studies" class="cs-back-link">${isEn ? '← All Case Studies' : '← كل قصص النجاح'}</a>

  <header class="cs-detail-hero">
    <img src="/${logo}" alt="${clientName}" class="cs-detail-logo" loading="lazy" />
    <br/>
    <span class="cs-detail-service">${study.service_type || 'Marketing'}</span>
    <h1 class="cs-detail-title">${clientName}</h1>
  </header>

  <article>
    <!-- Challenge Section -->
    <section class="cs-detail-section">
      <div class="cs-section-label">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>${isEn ? 'The Challenge' : 'التحدي'}</span>
      </div>
      <p class="cs-section-body">${challenge}</p>
    </section>

    <!-- Solution Section -->
    <section class="cs-detail-section">
      <div class="cs-section-label">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        <span>${isEn ? 'The Solution' : 'الحل'}</span>
      </div>
      <p class="cs-section-body">${solution}</p>
    </section>

    <!-- Results Section -->
    <section class="cs-detail-section">
      <div class="cs-section-label">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        <span>${isEn ? 'Results & Metrics' : 'النتايج والأرقام'}</span>
      </div>
      <p class="cs-section-body">${results}</p>
      
      ${metricsCardsHtml ? '<div class="cs-metrics-grid">' + metricsCardsHtml + '</div>' : ''}
    </section>

    <!-- Testimonial Section -->
    ${testimonial ? `
    <section class="cs-testimonial-box">
      <p class="cs-testimonial-quote">"${testimonial}"</p>
      <div class="cs-testimonial-author">${author}</div>
    </section>
    ` : ''}

    <!-- CTA Section -->
    <section class="cs-detail-cta">
      <h2 class="cs-cta-heading">${isEn ? 'Want Similar Results for Your Brand?' : 'عايز نتايج زي دي؟'}</h2>
      <p class="cs-cta-sub">${isEn ? 'Let us build a data-driven growth roadmap tailored for your business.' : 'ابعتلنا تفاصيل مشروعك وهنرد عليك بخطة عمل واستراتيجية مخصصة لمجالك.'}</p>
      <a href="/#register" class="cs-cta-action">
        <span>${isEn ? 'Request a Free Proposal' : 'اطلب استشارة مجانية الآن'}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </section>
  </article>
</main>

<footer class="site-footer" role="contentinfo">
  <div class="site-footer-container">
    <p style="text-align:center;color:#94A3B8;">© 2026 PR Agency. All rights reserved.</p>
  </div>
</footer>

<script src="/js/chatbot.js?v=75" defer></script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (err) {
    return new Response('Error loading case study: ' + err.message, { status: 500 });
  }
}
