# Feature 2: Team Page — Mapping

## 1. Requirements

### Functional
- Standalone page at `/team` (`team.html`).
- عرض أعضاء الفريق ديناميكياً من CMS (`team_members` table عبر `/api/admin/team` أو public fallback/endpoint) مع fallback لـ `js/team.js` و `data/team.json`.
- Grid layout متجاوب وموزع ببطاقات احترافية لكل عضو تشمل: الصورة (WebP/PNG)، الاسم الإنجليزي/العربي، الدور الوظيفي، النبذة (Bio/Desc)، ورابط LinkedIn (اختياري).
- تكامل الهيدر (Navbar) والفوتر (Footer) الموحدين بنفس تصميم وهوية الموقع الرئيسية.
- تأثيرات ظهور وحركة ناعمة للبطاقات (Smooth Scroll & Reveal Animations).

### Non-Functional
- **Performance:** زمن تحميل للصفحة < 2 ثوانٍ، تحميل الصور Lazy-loading وصيغ WebP خفيفة.
- **Responsive:** تصميم متجاوب 100% مع كافة الشاشات (Mobile 375px, Tablet 768px, Desktop 1440px+).
- **SEO:** علامات Open Graph، Meta Title/Description مخصصة لفريق العمل، وSemantic HTML (`<article>`, `<header>`).
- **Accessibility:** تباين ألوان يتوافق مع WCAG، نصوص بديلة للصور (`alt` tags)، ودعم التنقل بلوحة المفاتيح.


## 2. Architecture

### Files to Create
- `team.html`: صفحة الفريق المستقلة تشمل الهيكل، الـ Meta Tags، الـ Navbar الموحد، والـ Footer.
- `functions/api/team.js`: Public API endpoint (GET) لقراءة أعضاء الفريق النشطين فقط (`is_active = 1`) بدون الحاجة لـ Basic Auth.
- `js/team-page.js`: سكريبت جلب البيانات من الـ API العام وعرض بطاقات الفريق مع Fallback إلى `js/team.js` عند أي انقطاع.

### Files to Modify
- `index.html`: تحديث رابط التنقل في الـ Navbar/Footer ليشير إلى صفحة `/team` (أو `team.html`).
- `css/pages.css`: إضافة أنماط شبكة الفريق المستقلة (Team Grid)، تحسينات الـ Responsive، والبطاقات المنفصلة.
- `js/cms-loader.js`: دعم تحميل ثيم الموقع وتحديثات الفريق داخل صفحة `team.html`.

### APIs Used
- `GET /api/team`: Endpoint عام جديد لجلب أعضاء الفريق النشطين فقط (`SELECT * FROM team_members WHERE is_active = 1 ORDER BY order_index ASC`).
- `GET /api/admin/team`: API الإدارة المحمي لإدارة وإضافة وتعديل الأعضاء من لوحة التحكم.

### DB Tables
- `team_members`: جدول D1 الأساسي (الحقول: `id`, `name`, `role`, `bio`, `photo_url`, `linkedin_url`, `order_index`, `is_active`).
- `site_theme`: لقراءة الألوان والثيم الموحد.

### Impact on Existing Pages
- `index.html`: تعديل مسار الرابط في الـ Navbar/Footer فقط بدون أي تأثير على هيكل الصفحة أو سرعة التحميل.
- بقية صفحات الموقع: ستستفيد من التوجيه المباشر لصفحة الفريق المستقلة.


## 3. Tasks (Parallel Waves)

| ID | Task | Agent Role | Files | Wave | Deps |
|----|------|-----------|-------|------|------|
| T1 | إنشاء صفحة الفريق المستقلة وتضمين الـ SEO والـ Navbar/Footer | Frontend Dev | `team.html` | A | None |
| T2 | تجهيز Endpoint عام لقراءة أعضاء الفريق النشطين فقط | Backend Dev | `functions/api/team.js` | A | None |
| T3 | إضافة وتحديث أنماط الشبكة والبطاقات الخاصة بصفحة الفريق | CSS/Style | `css/pages.css` | A | None |
| T4 | برمجة جلب بيانات الأعضاء وعرضها مع Fallback وXSS sanitization | JS Dev | `js/team-page.js` | B | T1, T2 |
| T5 | تحديث روابط الترويسة والتذييل بالصفحة الرئيسية | Integration | `index.html` | B | T1 |
| T6 | تحسين تأثيرات الحركة والتدرجات اللطيفة (GSAP/Scroll) | UI/UX | `css/pages.css`, `js/team-page.js` | C | T3, T4 |
| T7 | تنفيذ فحوصات الأمان واختبار الـ Edge Cases واستجابة الشاشات | QA/Sec | All above | D | T5, T6 |
| T8 | مراجعة الكاش وتجهيز الملفات للنشر النهائي | DevOps | Cache bumps (`?v=...`) | D | T7 |

---

## 4. Testing Plan

### Manual Browser Testing
| # | Test | Viewport | Expected |
|---|------|----------|----------|
| 1 | Page loads | 1920px | All elements render |
| 2 | Page loads | 1440px | Responsive layout |
| 3 | Page loads | 768px | Tablet view works |
| 4 | Page loads | 375px | Mobile view works |
| 5 | Team members display | Any | Cards grid correctly |
| 6 | Nav links work | Any | All links functional |
| 7 | Footer links work | Any | All links functional |
| 8 | Scroll animations | Any | Smooth reveal |

### API Testing
- GET /api/admin/team with auth → 200 + array
- GET /api/admin/team without auth → 401
- GET /api/team without auth → 200 (Active members only)
- Test with 0 members
- Test with 1 member
- Test with 10 members
- Test with 50 members (performance)

### Edge Cases
- Member without photo → show placeholder
- Member without bio → skip bio section
- Very long name → truncate
- Very long role → truncate
- Arabic + English mixed names
- Broken photo URL → onerror handler

---

## 5. Security Checklist
- [ ] **XSS Prevention:** Escape all user content (name, role, bio) via textContent or escapeHtml()
- [ ] **No SQL Injection:** Use prepared statements (already in place)
- [ ] **Auth on Admin API:** Already exists (Basic Auth)
- [ ] **No Sensitive Data:** Team API returns public data only
- [ ] **HTTPS Only:** Enforced by Cloudflare
- [ ] **Rate Limiting:** Consider Cloudflare rate limit
- [ ] **CSP Headers:** Check _headers file
- [ ] **No Inline Scripts:** Use external JS files
- [ ] **CORS:** Restrict to same origin

---

## 6. Time Estimate

| Wave | Tasks | Time | Notes |
|------|-------|------|-------|
| A | T1, T2, T3 | ~25 min | Parallel safe |
| B | T4, T5 | ~15 min | Depends on A |
| C | T6 | ~5 min | Polish |
| D | T7, T8 | ~15 min | Testing + Security |
| **Total** | | **~60 min** | |

### Risk Factors
- Photo upload (if needed) → +30 min
- Design iteration → +20 min
- Unexpected bugs → +15 min

### Optimistic / Realistic / Pessimistic Estimate
- Optimistic: 60 min
- Realistic: 90 min
- Pessimistic: 2 hours

---

## 7. Approval Gate

### User Approval Required:
- [ ] Requirements section — approved?
- [ ] Architecture section — approved?
- [ ] Tasks section — approved?
- [ ] Testing section — approved?
- [ ] Security section — approved?

**If all approved → proceed to Stage 2 (Implementation)**

