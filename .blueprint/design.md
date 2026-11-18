# PR AGENCY — SYSTEM ARCHITECTURE & DESIGN (`design.md`)
> **الإصدار:** v3.5 (2026 AI-First Methodology)  
> **الحالة:** معتمد كمرجع تصميمي شامل (Single Source of Truth)

---

## 1. فلسفة التصميم ونظام العناصر (Design System Tokens)

### لوحة الألوان (Color Palette)
- **خلفية الأعماق (Deep Canvas):** `#07050d` / `#0b0d17`
- **الأسطح الزجاجية (Glass Surfaces):** `rgba(16, 12, 28, 0.85)` مع `backdrop-filter: blur(14px)`
- **حدود التوهج (Accent Borders):** `rgba(168, 85, 247, 0.35)`
- **اللون الأساسي المتوهج (Primary Purple):** `#8b5cf6` إلى `#7c3aed`
- **التدرج الذهبي والألوان الدلالية:**
  - النجاح: `#10b981` (Emerald Green)
  - التنبيه: `#f59e0b` (Amber)
  - التحذير: `#ef4444` (Ruby Red)
  - النصوص الرئيسية: `#ffffff` / نصوص ثانوية: `#a1a1aa`

### الخطوط والطباعة (Typography)
- **الخط الأساسي العربي واللاتيني:** `Cairo` بأوزان (400, 600, 700, 800, 900).
- **أكواد البرومبت والـ HUD:** `monospace` (JetBrains Mono / SF Mono fallback).

---

## 2. معمارية الـ Frontend والصفحات (Frontend Routing & Hierarchy)

```
/
├── index.html                  -> Landing Page الرئيسية واستعراض الخدمات
├── login.html                  -> بوابة الدخول الموحدة (Unified Login)
├── admin-dashboard.html        -> لوحة الإدارة والتحكم المالي (Admin Dashboard)
├── team-dashboard.html         -> لوحة مهام الإنتاج والتسليم لفريق العمل (Team Board)
├── portal-dashboard-2026.html  -> بوابة العميل واستوديو المخرج السينمائي (Higgsfield)
├── offline.html                -> صفحة الطوارئ عند عدم توفر اتصال بالإنترنت
└── manifest.json / site.webmanifest -> تعريفات PWA المستقلة
```

---

## 3. معمارية الـ Backend ودوال الحافة (Cloudflare Pages Functions API)

### أ. محرك التوجيه الذكي (`POST /api/portal/generate`)
* **المدخلات (Request Payload):**
  ```json
  {
    "subject": "ساعة فاخرة على رخام أسود",
    "camera": "Orbit 360",
    "lens": "35mm Lens, Eye-Level",
    "lighting": "Cyberpunk Neon Contrast",
    "ratio": "9:16"
  }
  ```
* **المخرجات (Response Payload):**
  ```json
  {
    "success": true,
    "engine": "Gemini 1.5 Flash | FreeLLMAPI (model) | Local MCSLA v3.0 (Zero-Cost)",
    "prompt": "50-80 words cinematic prompt in English with Hollywood technical tags...",
    "ratio": "9:16",
    "camera": "Orbit 360",
    "lens": "35mm Lens, Eye-Level",
    "lighting": "Cyberpunk Neon Contrast"
  }
  ```

### ب. تسجيل الدخول وحماية الصلاحيات (`POST /api/auth/unified-login`)
* **التحقق (RBAC Logic):**
  - دور `admin`: فحص الحساب الإداري -> إرجاع توجيه لـ `/admin-dashboard.html`.
  - دور `team_member`: فحص حسابات أعضاء الفريق -> إرجاع توجيه لـ `/team-dashboard.html`.
  - دور `client`: فحص حساب العميل -> إرجاع توجيه لـ `/portal-dashboard-2026.html`.

---

## 4. مخطط البيانات المرجعي (Database & State Schema)

### كائن جلسة المستخدم المخزن محلياً (`localStorage: pr_user_session`):
```json
{
  "id": "usr_xxxxxxxx",
  "name": "اسم المستخدم",
  "email": "user@example.com",
  "role": "admin | team_member | client",
  "token": "tok_xxxxxxxxxxxx",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

### كائن مواصفات اللقطة السينمائية (Seedance Six-Slot Object):
```json
{
  "cameraMovement": "Orbit 360 | Dolly In | Crane Up | Bullet Time",
  "subject": "وصف العنصر الأساسي",
  "action": "الحركة والحالة الفيزيائية",
  "setting": "high-end luxury cinematic studio",
  "style": "Hyper-Realistic 8K, Arri Alexa Mini LF, high-end commercial aesthetic",
  "lighting": "Volumetric | Rim Light | Cyberpunk Neon | Softbox"
}
```
