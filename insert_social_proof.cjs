const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');

const socialProofHtml = `
<!-- ═══════════════════════════════════════════════════════
     SOCIAL PROOF & TESTIMONIALS (Task 1.2)
═══════════════════════════════════════════════════════ -->
<section id="social-proof" class="section-social-proof">
  <div class="social-proof-container">
    
    <div class="social-proof-header">
      <h2 class="social-proof-title" data-i18n="social_proof.title">أكثر من 19 علامة تجارية تثق فينا</h2>
      <p class="social-proof-sub" data-i18n="social_proof.subtitle">نساعد شركاءنا على تحقيق نمو استثنائي ومضاعفة المبيعات بأعلى معايير الإبداع الرقمي</p>
    </div>

    <!-- 8 Client Logos -->
    <div class="social-proof-logos">
      <img src="assets/logos/clients/client-05-nh-clinics.webp" alt="NH Clinics" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-07-mountain-view.webp" alt="Mountain View Partner" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-14-island-gym.webp" alt="Island Gym" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-02-home-ix.webp" alt="Home IX" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-04-dar.webp" alt="Dar Real Estate" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-15-iskin.webp" alt="ISkin Clinics" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-18-ovo.webp" alt="OVO Stores" class="social-proof-logo-item" loading="lazy" />
      <img src="assets/logos/clients/client-09-memaar.webp" alt="Memaar Properties" class="social-proof-logo-item" loading="lazy" />
    </div>

    <!-- 3 Client Testimonials -->
    <div class="testimonials-grid">
      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-quote" data-i18n="social_proof.t1_quote">"ضاعفنا عدد الحجوزات والمبيعات من خلال إعلاناتهم الاحترافية وحملات السوشيال ميديا."</p>
        <div class="testimonial-author-wrap">
          <div class="testimonial-avatar-placeholder">NH</div>
          <div>
            <div class="testimonial-author-name" data-i18n="social_proof.t1_author">د. أحمد منصور</div>
            <div class="testimonial-author-role" data-i18n="social_proof.t1_role">مدير مراكز NH Clinics الطبية</div>
          </div>
        </div>
      </div>

      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-quote" data-i18n="social_proof.t2_quote">"فريق تصوير وميديا باينج على أعلى مستوى من الإتقان والالتزام التام بالنتائج والمواعيد."</p>
        <div class="testimonial-author-wrap">
          <div class="testimonial-avatar-placeholder">MV</div>
          <div>
            <div class="testimonial-author-name" data-i18n="social_proof.t2_author">م. كريم الشريف</div>
            <div class="testimonial-author-role" data-i18n="social_proof.t2_role">شريك مؤسس — قطاع التطوير العقاري</div>
          </div>
        </div>
      </div>

      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-quote" data-i18n="social_proof.t3_quote">"من أفضل الوكالات التي تعاونا معها، استراتيجية المحتوى والريلز حققت تفاعلاً غير مسبوق."</p>
        <div class="testimonial-author-wrap">
          <div class="testimonial-avatar-placeholder">IG</div>
          <div>
            <div class="testimonial-author-name" data-i18n="social_proof.t3_author">كابتن عمر زكي</div>
            <div class="testimonial-author-role" data-i18n="social_proof.t3_role">المدير التنفيذي — Island Gym</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>
`;

if (!indexHtml.includes('id="social-proof"')) {
  indexHtml = indexHtml.replace('<footer class="site-footer"', socialProofHtml + '\n<footer class="site-footer"');
  fs.writeFileSync('index.html', indexHtml, 'utf8');
  console.log('✅ Social proof section successfully inserted before footer in index.html');
} else {
  console.log('Social proof already present');
}
