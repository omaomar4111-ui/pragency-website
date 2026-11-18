# PR AGENCY — EXECUTION PLAN (`plan.md`)
> **الإصدار:** v3.5 (2026 AI-First Methodology)  
> **الحالة:** نشط وموثق (Active Production Baseline)  
> **الهدف:** بناء وتشغيل استوديو ومنصة تسويقية سينمائية فائقة السرعة بتكلفة $0 وبأعلى معايير الـ Vibe Coding.

---

## 1. ملخص المشروع ومؤشرات النجاح (Mission & KPIs)
* **المشروع:** منصة رقمية متكاملة لوكالة PR Agency تجمع بين التسويق عالي الأداء واستوديو المخرج السينمائي (Higgsfield OS) مع بوابة عملاء وإدارة مهام وتطبيق PWA هجين.
* **الـ Tech Stack الأساسي:** Vanilla JS (ES6+), HTML5, CSS3 Glassmorphism, GSAP Animations, Cloudflare Pages & Workers, D1 / Edge Functions.
* **مؤشرات النجاح (Core KPIs):**
  - سرعة التحميل ودرجة Lighthouse: 95-100% Performance.
  - تكلفة الاستضافة والـ LLMs السحابية: $0 (Zero-Cost Router via FreeLLMAPI / Gemini / Local Fallback).
  - معدل استقرار الخدمة: 100% Uptime بدون أي انقطاع حتى عند نفاد مفاتيح الـ API.

---

## 2. مراحل الإنجاز المنفذة (Completed Phases)

### ✅ Phase 1: الأساس المعماري والهوية البصرية الفاخرة
- [x] بناء الهوية البصرية بنمط **Dark Luxury Glassmorphism** والتدرجات البنفسجية (`#8b5cf6` إلى `#7c3aed`).
- [x] تصميم صفحات الموقع الرئيسية والحملات التسويقية المتخصصة (Gyms, Clinics, Real Estate, E-commerce).
- [x] محرك حركات تفاعلي فائق الخفة مبني على **GSAP** و **Native Sync** بدون أي أطر عمل ثقيلة.

### ✅ Phase 2: استوديو المخرج السينمائي (Higgsfield Studio OS v3.0)
- [x] بناء لوحة تحكم المخرج الكاملة (**Director Controls Panel**) بالخيارات التفاعلية:
  - حركات الكاميرا (Dolly In, Crane Up, Orbit 360, Bullet Time, FPV Drone, Static).
  - العدسات والزوايا (35mm Eye-Level, 85mm Portrait, Macro Lens, Low Angle Hero, High Angle).
  - الإضاءة السينمائية (Volumetric, Rim Light, Softbox, Cyberpunk Neon, Golden Hour).
  - أبعاد الكادر (9:16 Reels, 16:9 Cinema, 1:1 Square).
- [x] هندسة محرك البرومبت المتقدم وفق معايير **MCSLA + Seedance Six-Slot** (برومبتات هوليوودية 50-80 كلمة).
- [x] بناء عارض الميديا السينمائي الأفقي (**Cinematic Carousel**) مع بطاقات الـ HUD التراكبية.

### ✅ Phase 3: تحويل المنصة لتطبيق PWA ونظام تسجيل الدخول الموحد (RBAC)
- [x] تكوين ملفات التثبيت الكاملة `manifest.json` و `site.webmanifest` و Service Worker `sw.js`.
- [x] معالجة التقاط حدث `beforeinstallprompt` المبكر وبانر التثبيت التفاعلي الذكي.
- [x] إضافة دليل تفاعلي مخصص لأجهزة **iOS / Safari** لشرح خطوات "Add to Home Screen".
- [x] إنشاء صفحة الدخول الموحدة `login.html` مع توجيه الصلاحيات الثلاث:
  - مدير النظام (`admin`): توجيه إلى `admin-dashboard.html`.
  - فريق الإنتاج والمونتاج (`team_member`): توجيه إلى `team-dashboard.html`.
  - العميل (`client`): توجيه إلى `portal-dashboard-2026.html`.

### ✅ Phase 4: نظام التوجيه الذكي للذكاء الاصطناعي (Multi-Tier Router)
- [x] دمج معمارية 3 مستويات لضمان مجانية واستمرارية الخدمة:
  - Tier 1: Gemini 1.5 Flash (سرعة وذكاء عالٍ).
  - Tier 2: OpenRouter / FreeLLMAPI المتوافق مع معيار OpenAI (`meta-llama/llama-3.3-70b-instruct:free`).
  - Tier 3: محرك الحساب الخوارزمي المحلي (Local MCSLA v3.0 Zero-Cost).
- [x] شارة المحرك النشط التفاعلية ديناميكياً على واجهة المخرج.

---

## 3. خارطة الطريق القادمة (Next Upcoming Sprints)

### 📌 Sprint 5: استبدال كروت الفريق بمنظومة المجرات الفضائية (Cosmic 3D Galaxy)
- [ ] إزالة الصور الكرتونية الـ 2D الحالية لقسم الفريق.
- [ ] بناء مشهد كوني تفاعلي ثلاثي الأبعاد بـ Three.js / WebGL يعرض الكواكب والأنظمة المدارية التي تمثل كل تخصص إبداعي.

### 📌 Sprint 6: توليد الستوري بورد المتعدد (Multi-Scene Storyboard Generator)
- [ ] إضافة زر لتوليد 6 مشاهد متتالية لإعلان تجاري كامل بضغطة زر واحدة وتنسيق تصدير PDF/CSV للعميل.

### 📌 Sprint 7: تكامل المراقبة والتنبيهات المباشرة (Sentry & Telegram Bot Hooks)
- [ ] ربط Webhook مباشر لتلقي إشعارات التعديلات والطلبات على محادثة تليجرام في ثوانٍ.
