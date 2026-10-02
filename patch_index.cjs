const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const sliderHTML = `
<section id="services" class="section-services-slider">
  <div class="slider-header" style="text-align:center">
    <div class="section-badge rv">خدماتنا</div>
    <h2 class="section-title rv">حلول تسويق <span>متكاملة</span></h2>
    <p class="section-desc rv">كل خدمة مصممة تحقق هدف محدد لنمو البزنس بتاعك</p>
  </div>

  <div class="services-slider-wrap">
    <div class="services-slider" id="servicesSlider">
      <a href="/services/social-media.html" class="slider-card">
        <div class="slider-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></div>
        <h3>إدارة السوشيال ميديا</h3>
        <p>خطط محتوى مبنية على أهدافك</p>
        <span class="slider-link">اقرأ المزيد ←</span>
      </a>
      <a href="/services/media-buying.html" class="slider-card">
        <div class="slider-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
        <h3>الإعلانات المدفوعة</h3>
        <p>الوصول لجمهورك باستهداف دقيق</p>
        <span class="slider-link">اقرأ المزيد ←</span>
      </a>
      <a href="/services/content-production.html" class="slider-card">
        <div class="slider-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg></div>
        <h3>إنتاج المحتوى</h3>
        <p>فيديوهات وتصوير عالي الجودة</p>
        <span class="slider-link">اقرأ المزيد ←</span>
      </a>
      <a href="/services/branding.html" class="slider-card">
        <div class="slider-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg></div>
        <h3>العلامة التجارية والهوية</h3>
        <p>هوية بصرية تعبر عن قوة البراند</p>
        <span class="slider-link">اقرأ المزيد ←</span>
      </a>
      <a href="/services/strategy.html" class="slider-card">
        <div class="slider-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg></div>
        <h3>استراتيجية التسويق</h3>
        <p>خطة تسويق بتوصل لهدفك</p>
        <span class="slider-link">اقرأ المزيد ←</span>
      </a>
    </div>

    <button class="slider-btn slider-prev" aria-label="السابق">›</button>
    <button class="slider-btn slider-next" aria-label="التالي">‹</button>
  </div>

  <div class="slider-dots" id="sliderDots"></div>

  <div style="text-align:center;margin-top:40px">
    <a href="/services.html" class="btn btn-secondary">شوف كل الخدمات</a>
  </div>
</section>
`;

html = html.replace(/<section id="services"[^>]*>[\s\S]*?<\/section>/, sliderHTML);

if (!html.includes('js/services-slider.js')) {
    html = html.replace(/<\/body>/, '  <script src="js/services-slider.js?v=1" defer></script>\n</body>');
}

fs.writeFileSync('index.html', html);
