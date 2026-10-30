const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the process section HTML text directly
html = html.replace(
  /<div class="process-grid">[\s\S]*?<\/div>\s*<\/div>\s*<script type="application\/ld\+json">/,
  `<div class="process-grid">
      <div class="process-card rv">
        <span class="process-num">01</span>
        <h3 class="process-card-title" data-i18n="process.card1.title">استكشاف (Discover)</h3>
        <p class="process-card-desc" data-i18n="process.card1.desc">جلسة عمل (Meeting / Audit) لتحليل وضع البراند الحالي، دراسة المنافسين في مصر والخليج، وتحديد الميزانية والأهداف البيعية.</p>
      </div>

      <div class="process-card process-card-accent rv">
        <span class="process-num">02</span>
        <h3 class="process-card-title" data-i18n="process.card2.title">تخطيط واستراتيجية (Strategize)</h3>
        <p class="process-card-desc" data-i18n="process.card2.desc">بناء خطة العمل الشهرية (Marketing Roadmap): تحديد الجمهور المستهدف، زوايا الإعلانات (Hooks & Angles)، وتوزيع ميزانية الإعلانات على المنصات.</p>
      </div>

      <div class="process-card rv">
        <span class="process-num">03</span>
        <h3 class="process-card-title" data-i18n="process.card3.title">تنفيذ وإنتاج (Create)</h3>
        <p class="process-card-desc" data-i18n="process.card3.desc">صناعة المحتوى البصري: كتابة السكريبتات، تصوير الفيديوهات والريلز، وتجهيز تصميمات الهوية والإعلانات.</p>
      </div>

      <div class="process-card rv">
        <span class="process-num">04</span>
        <h3 class="process-card-title" data-i18n="process.card4.title">إطلاق وتحسين (Launch & Optimize)</h3>
        <p class="process-card-desc" data-i18n="process.card4.desc">إطلاق الحملات الممولة، متابعة الأداء يوم بيوم، تحسين سعر الرسالة أو الشراء، وإرسال تقارير دورية شفافة للعميل.</p>
      </div>
    </div>
  </div>

  <script type="application/ld+json">`
);

// 2. Add Project Name and Challenge to Step 3 in index.html
const oldStep3Fields = `<div class="register-field">
              <label for="reg-name" data-i18n="form.name">الاسم *</label>
              <input type="text" id="reg-name" name="name" required data-i18n="form.name.ph" placeholder="اسمك الكريم" autocomplete="name"/>
            </div>`;

// Check where reg-name is
if (html.includes('id="reg-name"')) {
  // We insert project_name right before reg-business or after reg-phone, and challenge textarea before form-actions
  const projectField = `            <div class="register-field">
              <label for="reg-project-name" data-i18n="form.project_name">اسم المشروع / البيزنس *</label>
              <input type="text" id="reg-project-name" name="project_name" required data-i18n-placeholder="form.project_name.ph" placeholder="اكتب اسم مشروعك أو علامتك التجارية" autocomplete="organization"/>
            </div>\n`;

  const challengeField = `            <div class="register-field">
              <label for="reg-challenge" data-i18n="form.challenge">إيه التحدي أو الهدف اللي عايز تحققه معانا؟</label>
              <textarea id="reg-challenge" name="message" rows="3" data-i18n-placeholder="form.challenge.ph" placeholder="مثلاً: زيادة المبيعات، إطلاق براند جديد، خفض تكلفة الإعلانات..." style="width:100%;padding:12px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-family:inherit;font-size:14px;resize:vertical;"></textarea>
            </div>\n`;

  // Insert project name before reg-business
  if (!html.includes('id="reg-project-name"')) {
    html = html.replace(/<div class="register-field">\s*<label for="reg-business"/, `${projectField}<div class="register-field">\n              <label for="reg-business"`);
  }

  // Insert challenge textarea before form-actions
  if (!html.includes('id="reg-challenge"')) {
    html = html.replace(/<div class="form-actions"/, `${challengeField}<div class="form-actions"`);
  }
}

// 3. Bump version to v=98
html = html.replace(/v=\d+/g, 'v=98');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Updated index.html with new Process and Form fields!');
