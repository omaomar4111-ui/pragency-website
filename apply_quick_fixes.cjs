/**
 * apply_quick_fixes.cjs
 * Fix 1: Remove Trust Badges
 * Fix 2: Switch Budget options to EGP (جنيه) & Open
 * Fix 3: Remove Testimonials (keep client logos only)
 * Fix 4: Infinite scrolling client logos marquee
 * Bump version to v=76
 */

const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

// ── 1. Update locales: remove USD, add EGP & Open options ───────────────────
const arPath = path.join(ROOT, 'locales/ar.json');
const enPath = path.join(ROOT, 'locales/en.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Delete trust badges from locales
delete ar['trust.badge1'];
delete ar['trust.badge2'];
delete ar['trust.badge3'];
delete ar['trust.badge4'];
delete en['trust.badge1'];
delete en['trust.badge2'];
delete en['trust.badge3'];
delete en['trust.badge4'];

// Delete testimonials from locales
delete ar['social_proof.t1_quote'];
delete ar['social_proof.t1_author'];
delete ar['social_proof.t1_role'];
delete ar['social_proof.t2_quote'];
delete ar['social_proof.t2_author'];
delete ar['social_proof.t2_role'];
delete ar['social_proof.t3_quote'];
delete ar['social_proof.t3_author'];
delete ar['social_proof.t3_role'];

delete en['social_proof.t1_quote'];
delete en['social_proof.t1_author'];
delete en['social_proof.t1_role'];
delete en['social_proof.t2_quote'];
delete en['social_proof.t2_author'];
delete en['social_proof.t2_role'];
delete en['social_proof.t3_quote'];
delete en['social_proof.t3_author'];
delete en['social_proof.t3_role'];

// EGP Budget keys
ar['budget.opt1'] = "أقل من 10,000 جنيه";
ar['budget.opt2'] = "10,000 - 30,000 جنيه";
ar['budget.opt3'] = "30,000 - 100,000 جنيه";
ar['budget.opt4'] = "أكثر من 100,000 جنيه";
ar['budget.opt5'] = "مفتوح / حسب الاتفاق";

en['budget.opt1'] = "Under 10,000 EGP";
en['budget.opt2'] = "10,000 - 30,000 EGP";
en['budget.opt3'] = "30,000 - 100,000 EGP";
en['budget.opt4'] = "Over 100,000 EGP";
en['budget.opt5'] = "Open / Flexible";

// Clean cro_form budget keys
ar['cro_form.budget_tier1'] = "أقل من 10,000 جنيه";
ar['cro_form.budget_tier2'] = "10,000 - 30,000 جنيه";
ar['cro_form.budget_tier3'] = "30,000 - 100,000 جنيه";
ar['cro_form.budget_tier4'] = "أكثر من 100,000 جنيه";
ar['cro_form.budget_tier5'] = "مفتوح / حسب الاتفاق";

en['cro_form.budget_tier1'] = "Under 10,000 EGP";
en['cro_form.budget_tier2'] = "10,000 - 30,000 EGP";
en['cro_form.budget_tier3'] = "30,000 - 100,000 EGP";
en['cro_form.budget_tier4'] = "Over 100,000 EGP";
en['cro_form.budget_tier5'] = "Open / Flexible";

delete ar['cro_form.budget_under_1k'];
delete ar['cro_form.budget_1k_3k'];
delete ar['cro_form.budget_3k_10k'];
delete ar['cro_form.budget_above_10k'];

delete en['cro_form.budget_under_1k'];
delete en['cro_form.budget_1k_3k'];
delete en['cro_form.budget_3k_10k'];
delete en['cro_form.budget_above_10k'];

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

const localesData = `export const ar = ${JSON.stringify(ar)};\nexport const en = ${JSON.stringify(en)};\n`;
fs.writeFileSync(path.join(ROOT, 'functions/locales_data.js'), localesData, 'utf8');
console.log('✅ Locales synced without USD & without testimonials');

// ── 2. Patch css/pages.css to add smooth Marquee animation ──────────────────
const pagesCssPath = path.join(ROOT, 'css/pages.css');
let pagesCss = fs.readFileSync(pagesCssPath, 'utf8');

const marqueeCss = `
/* ══════════════════════════════════════════════════════════════
   INFINITE CLIENT LOGOS MARQUEE (FIX 4)
══════════════════════════════════════════════════════════════ */
.clients-marquee-wrapper {
  overflow: hidden;
  width: 100%;
  padding: 30px 0;
  position: relative;
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
}
.clients-marquee-track {
  display: flex;
  gap: 60px;
  width: max-content;
  animation: scroll-clients 35s linear infinite;
  align-items: center;
}
.clients-marquee-track:hover {
  animation-play-state: paused;
}
.clients-marquee-logo {
  height: 48px;
  max-width: 140px;
  object-fit: contain;
  filter: grayscale(100%) brightness(1.2);
  opacity: 0.75;
  transition: all 0.3s ease;
  user-select: none;
}
.clients-marquee-logo:hover {
  filter: grayscale(0%) brightness(1);
  opacity: 1;
  transform: scale(1.1);
}

@keyframes scroll-clients {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
[dir="rtl"] .clients-marquee-track {
  animation: scroll-clients-rtl 35s linear infinite;
}
[dir="rtl"] .clients-marquee-track:hover {
  animation-play-state: paused;
}
@keyframes scroll-clients-rtl {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(50%);
  }
}
`;

if (!pagesCss.includes('scroll-clients')) {
  pagesCss += '\n' + marqueeCss;
  fs.writeFileSync(pagesCssPath, pagesCss, 'utf8');
  console.log('✅ css/pages.css updated with infinite marquee animation');
}

// ── 3. Patch index.html: ─────────────────────────────────────────────────────
let indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// FIX 1: Remove Trust Badges
const trustBadgesRegex = /<!-- Trust Badges \(Task 1\.3\) -->[\s\S]*?<\/div>\s*<\/div>/;
if (trustBadgesRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(trustBadgesRegex, '');
  console.log('✅ Trust Badges removed from Hero in index.html');
}

// FIX 2: Replace Step 2 Budget options with EGP & Open
const oldBudgetStepRegex = /<!-- STEP 2: Budget Range -->[\s\S]*?<!-- STEP 3: Contact Info & Submission -->/;
const newBudgetStepHtml = `<!-- STEP 2: Budget Range -->
          <div class="form-step" data-step="2">
            <div class="cro-step-grid">
              <label class="cro-choice-card">
                <input type="radio" name="budget_tier" value="< 10k" required />
                <span data-i18n="cro_form.budget_tier1">أقل من 10,000 جنيه</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="budget_tier" value="10k - 30k" />
                <span data-i18n="cro_form.budget_tier2">10,000 - 30,000 جنيه</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="budget_tier" value="30k - 100k" />
                <span data-i18n="cro_form.budget_tier3">30,000 - 100,000 جنيه</span>
              </label>
              <label class="cro-choice-card">
                <input type="radio" name="budget_tier" value="> 100k" />
                <span data-i18n="cro_form.budget_tier4">أكثر من 100,000 جنيه</span>
              </label>
              <label class="cro-choice-card" style="grid-column: 1 / -1;">
                <input type="radio" name="budget_tier" value="open" />
                <span data-i18n="cro_form.budget_tier5">مفتوح / حسب الاتفاق</span>
              </label>
            </div>
            <div class="form-actions" style="display:flex;gap:12px;">
              <button type="button" class="register-submit form-prev-btn" id="step2PrevBtn" style="background:transparent;border:1px solid rgba(168,85,247,0.4);color:#A78BFA">
                السابق
              </button>
              <button type="button" class="register-submit form-next-btn" id="step2NextBtn">
                <span data-i18n="contact.next">التالي</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
            </div>
          </div>

          <!-- STEP 3: Contact Info & Submission -->`;

if (oldBudgetStepRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(oldBudgetStepRegex, newBudgetStepHtml);
  console.log('✅ Budget options updated to EGP (جنيه) & Open in index.html');
}

// FIX 3 & 4: Remove Fake Testimonials & replace static logos with animated Marquee
const oldSocialProofRegex = /<!-- ═════+\s*SOCIAL PROOF & TESTIMONIALS[\s\S]*?<\/section>/;
const logos = [
  'client-05-nh-clinics.webp',
  'client-07-mountain-view.webp',
  'client-14-island-gym.webp',
  'client-02-home-ix.webp',
  'client-04-dar.webp',
  'client-15-iskin.webp',
  'client-18-ovo.webp',
  'client-09-memaar.webp'
];

let logosItems = '';
logos.forEach(l => {
  logosItems += `    <img src="assets/logos/clients/${l}" alt="Client Logo" class="clients-marquee-logo" loading="lazy" />\n`;
});

// Duplicate logos for seamless infinite scroll
const newSocialProofHtml = `<!-- ═══════════════════════════════════════════════════════
     TRUSTED BY CLIENTS MARQUEE (FIX 3 & FIX 4)
═══════════════════════════════════════════════════════ -->
<section id="social-proof" class="section-social-proof" style="padding: 60px 0;">
  <div class="social-proof-container">
    
    <div class="social-proof-header" style="margin-bottom: 24px;">
      <h2 class="social-proof-title" data-i18n="social_proof.title">أكثر من 19 علامة تجارية تثق فينا</h2>
      <p class="social-proof-sub" data-i18n="social_proof.subtitle">شراكات نجاح حقيقية حققت نتائج استثنائية في مصر والخليج العربي</p>
    </div>

    <!-- Infinite Scrolling Logos Strip -->
    <div class="clients-marquee-wrapper">
      <div class="clients-marquee-track">
${logosItems}${logosItems}      </div>
    </div>

  </div>
</section>`;

if (oldSocialProofRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(oldSocialProofRegex, newSocialProofHtml);
  console.log('✅ Testimonials removed and infinite scrolling marquee installed');
}

fs.writeFileSync(path.join(ROOT, 'index.html'), indexHtml, 'utf8');

// ── 4. Clean css/chatbot.css from trust badges CSS ──────────────────────────
const chatCssPath = path.join(ROOT, 'css/chatbot.css');
let chatCss = fs.readFileSync(chatCssPath, 'utf8');
chatCss = chatCss.replace(/\/\* Trust Badges in Hero \*\/[\s\S]*?\.trust-badge-item svg \{[\s\S]*?\}/, '');
fs.writeFileSync(chatCssPath, chatCss, 'utf8');

// ── 5. Bump versions to v=76 in all html files ──────────────────────────────
const htmlFiles = [
  'index.html','about.html','services.html','clients.html',
  'team.html','contact.html','privacy.html','terms.html',
  'thank-you.html','404.html','case-studies.html'
];

let count = 0;
for (const f of htmlFiles) {
  const fp = path.join(ROOT, f);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  if (content.includes('v=75')) {
    content = content.replace(/v=75/g, 'v=76');
    fs.writeFileSync(fp, content, 'utf8');
    count++;
  }
}
console.log(`✅ Version bumped to v=76 in ${count} files`);
