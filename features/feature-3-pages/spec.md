# Feature 3: Standalone Pages

## Status
- Stage: SPECIFY (Revised)
- Gate 1: PENDING_APPROVAL
- Gate 2: PENDING
- Gate 3: PENDING

## 1. Requirements

### Functional
- [ ] `/about.html` — Full deep-dive about page matching `team.html` design & aesthetic (does NOT replace homepage section)
- [ ] `/services.html` — Clean grid of 5 services with detailed descriptions (no complex tabs/filters)
- [ ] `/clients.html` — Dynamic grid loaded from D1 with static fallback from `js/clients.js` if D1 is empty
- [ ] `index.html` — High-impact preview sections + "شوف المزيد" buttons
- [ ] Navbar & Mobile Menu in ALL pages — synchronized links with active state highlighting
- [ ] `functions/api/clients.js` — Public read-only endpoint returning clients from D1

### CTA Requirements
- [ ] Every standalone page has a prominent CTA: "احصل على استشارة مجانية"
- [ ] CTA links to `/#register` (homepage form anchor)
- [ ] CTA styled as primary button (purple gradient)
- [ ] Homepage preview sections include the same CTA

### Mobile Menu & Navigation
- [ ] Update mobile drawer menu in ALL pages matching main navbar links
- [ ] Highlight current page item (`.active` class)
- [ ] Standalone pages link to `/` for homepage and `/#section` for homepage anchors

### Preview Sections (Homepage)
- **About**: 3 lines summary + "شوف المزيد" -> `/about.html` + CTA
- **Services**: 3 cards preview (out of 5) + "شوف كل الخدمات" -> `/services.html` + CTA
- **Team**: 3 cards preview (out of 7) + "فريق العمل كاملاً" -> `/team.html` + CTA
- **Clients**: 6 logos preview (out of 19+) + "جميع العملاء" -> `/clients.html` + CTA

### "شوف المزيد" Button
- Purple outline style with subtle hover glow
- Arrow icon pointing towards navigation direction
- Semantic link (`<a>`) to standalone page

### Non-Functional
- Performance: < 2s load time, minimal asset payload
- Responsive: Fully adaptive across 1920 / 1440 / 768 / 375 viewports
- SEO: Semantic meta tags, OpenGraph preview cards, Schema.org JSON-LD
- Accessibility: Valid ARIA landmarks, keyboard focus rings, semantic tags

## 2. Architecture

### Files to CREATE
- `about.html` (new standalone about page)
- `services.html` (new standalone services page)
- `clients.html` (new standalone clients page)
- `functions/api/clients.js` (public D1 endpoint)
- `js/clients-page.js` (dynamic D1 client loader with static fallback)
- `js/services-page.js` (clean static services renderer)

### Files to MODIFY
- `index.html` (navbar/drawer links + 3-4 item section previews & "شوف المزيد" buttons)
- `team.html` (navbar/drawer synchronization)
- `contact.html` (navbar/drawer synchronization)
- `privacy.html` (navbar/drawer synchronization)
- `terms.html` (navbar/drawer synchronization)
- `404.html` (navbar/drawer synchronization)
- `services/*.html` (navbar/drawer synchronization)
- `lp/*.html` (navbar/drawer synchronization)
- `css/pages.css` (add preview section styles, "شوف المزيد" button, and standalone cards)

### Database
- Use existing `clients` table in Cloudflare D1:
  - Columns: `id`, `name`, `logo_url`, `website_url`, `order_index`, `is_active`

### APIs
- **New**: `GET /api/clients` (Public, cached, returns active clients sorted by `order_index ASC, id ASC`)
- **Existing**: `GET /api/team` (Reference public endpoint)

## 3. Impact on Existing & Strategy

### Navigation & Anchors
- Homepage links preserve smooth internal scrolling (`#about`, `#services`, `#clients`, `#team`, `#register`).
- Standalone pages route to `/#register` for the CTA and explicit page paths (`/about.html`, `/services.html`, etc.).
- Mobile drawer menus updated globally to prevent broken intra-page jumps.

## 4. Decisions on Previous Open Questions
1. **/about**: DEEP-DIVE page (does NOT replace homepage section). Homepage section remains intact with a summary preview.
2. **/services**: Clean and simple grid of 5 services (no tabs or filters).
3. **Clients**: DYNAMIC from D1 (`/api/clients`) with automatic STATIC FALLBACK to hardcoded clients if D1 returns empty.

## 5. Risks & Mitigations
- **Broken Anchors**: Mitigated by using root-relative anchor paths `/#register` on subpages.
- **D1 Empty State**: Mitigated by bundling fallback clients array into `js/clients-page.js`.
- **Navigation Drift**: Mitigated by shared markup verification script across all HTML files.

## 6. Time Estimate
- Stage 2 (Plan & Design): 15 min
- Stage 3 (Waves A-D Implementation): 90 min
- Stage 4-6 (Review, QA & Validation): 30 min
- Stage 7 (Deploy & Verification): 10 min
- **Total**: ~2.5 hours
