---
name: architecture-rules
description: Strict architectural boundary laws governing Public Marketing Pages vs. Admin Agency OS vs. Client Portal.
---

# Inviolable Architecture Rules & Boundary Enforcement

## The Golden Question (Rule 0)
Before adding any UI button, link, script, or endpoint, you MUST answer:
> **"WHO IS THIS FOR?"**
- **Public Prospect / Visitor?** ➔ Marketing pages only (`index.html`, `about.html`, `services.html`, `clients.html`, `team.html`). No internal tools, no dev badges, no admin buttons.
- **Agency Team Member / Admin?** ➔ Admin OS only (`admin-agency.html`, `sales-crm-2026.html`). Protected by `admin_jwt` and `functions/api/admin/_middleware.js`.
- **Client (Paying Retainer)?** ➔ Client Portal only (`portal-dashboard-2026.html`). Protected by `client_jwt` and `functions/api/portal/_middleware.js` with tenant Row-Level Security.

---

## 1. Public Marketing Website Rules
1. **Strict Content Hygiene:**
   - Public pages MUST ONLY contain brand positioning, service explanations, verified social proof, public contact forms, and the AI chatbot.
   - ZERO internal tools, site generators, security checkers, or raw debug dashboards.
2. **Navigation Bar Invariance:**
   - The public `<nav class="hdr-nav">` is strictly reserved for:
     `الرئيسية` (Home) | `من نحن` (About) | `الخدمات` (Services) | `العملاء` (Clients) | `الفريق` (Team) | `تواصل معنا` (Contact).
   - NEVER insert tool badges, lightning bolts (`⚡`), internal generators, or testing links into the public header.
3. **Robots & Caching:**
   - Public pages must have `X-Robots-Tag: index, follow`.
   - All static assets must be edge-cacheable without authentication blocks.

---

## 2. Admin Agency OS Rules
1. **Location & Routing:**
   - All internal operations, sales tools, site factories, team taskboards, and financial dashboards MUST live inside `admin-agency.html` or `sales-crm-2026.html`.
2. **Authentication Gate:**
   - Front-end must block unauthenticated viewing via `#admin-login-overlay`.
   - All backend APIs under `/api/admin/*` MUST be strictly gated by `functions/api/admin/_middleware.js` verifying `admin_jwt` or `pr_admin_token`.
3. **No Indexing:**
   - All admin pages and endpoints MUST emit `X-Robots-Tag: noindex, nofollow, noarchive`.

---

## 3. Client Portal Rules
1. **Tenant Isolation (Row-Level Security):**
   - A client must ONLY see their own deliverables, contracts, strategy reports, and invoices.
   - Authenticated strictly via `client_jwt` checked in `functions/api/portal/_middleware.js`.
2. **Subdomain Routing:**
   - Served on dedicated portal subdomains (`portal.pragency.ag` or `clients.*`), bypassing public marketing templates completely.
3. **No Leaks:**
   - Clients must never see internal agency profit margins, agency team internal chat, or tools meant for agency admins.

---

## 4. Shared Component & Assets Rules
1. **Component Independence:**
   - If an asset is shared (CSS/JS like `css/main.css` or `js/main.js`), it must NEVER reference admin-only endpoints or render admin-only DOM nodes.
2. **Build-Time Verification:**
   - Every commit or deployment MUST pass `scripts/check-architecture.cjs`. Any leak of internal tool keywords to public HTML files will instantly fail the build.
