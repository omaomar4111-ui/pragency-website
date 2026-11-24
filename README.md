# PR Agency — Agency OS & Marketing Platform

المنصة المتكاملة لوكالة **PR Agency** للتسويق الرقمي والإنتاج الإعلاني وإدارة العملاء.

- **الموقع الرسمي:** [pragency.pages.dev](https://pragency.pages.dev)
- **البنية التحتية:** Cloudflare Pages + Cloudflare Pages Functions (Edge APIs) + Cloudflare D1 (`2d-marketing-db` & `pragency-analytics`) + Workers AI.

## الأنظمة الرئيسية

| النظام | المسار | الوصف |
| :--- | :--- | :--- |
| **الموقع التسويقي** | `/` | الواجهة الرئيسية، الخدمات، سابقة الأعمال، وطلب عرض السعر. |
| **بوابة الدخول الموحدة** | `/login` | تسجيل دخول موحد للعملاء، الفريق، والإدارة. |
| **بوابة العميل** | `/portal-dashboard-2026` | متابعة التسليمات، الموافقة على التصميمات والفيديوهات، والفواتير. |
| **إدارة المبيعات (CRM)** | `/sales-crm-2026` | متابعة الـ Leads، مراحل التعاقد، وتصدير عروض الكولاج PDF بهوية PR Agency. |
| **لوحة الإدارة** | `/admin-dashboard` | مركز القيادة، إدارة الوكالة، ومركز الوكلاء الأذكياء. |
| **لوحة الفريق** | `/team-dashboard` | متابعة المهام والتسليمات اليومية. |

## التشغيل والنشر (Deployment)

```bash
npx wrangler pages deploy . --project-name pragency --branch main
```
