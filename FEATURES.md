# PR Agency — Features Roadmap

## 🔥 Active (In Progress)

### Feature 1: Fix Admin SQL Migration
- **Priority:** P0
- **Status:** Waiting for user SQL execution
- **Blocker:** D1 tables missing
- **Files:** schema.sql, functions/api/admin/*.js
- **Action:** User to run SQL in D1 Console

---

## 🟡 Pending (Next)

### Feature 2: Team Page (Standalone)
- **Priority:** P1
- **Status:** Not started
- **Goal:** `/team` page with all team members
- **Files:** team.html, js/team.js, css/pages.css
- **Requirements:** TBD

### Feature 3: Clients Page (Standalone)
- **Priority:** P1
- **Status:** Not started
- **Goal:** `/clients` page with all client logos
- **Files:** clients.html, js/clients.js, css/pages.css

### Feature 4: Services Page (Standalone)
- **Priority:** P1
- **Status:** Not started
- **Goal:** `/services` page with detailed services
- **Files:** services.html, css/pages.css

### Feature 5: New CTA + Short Form
- **Priority:** P2
- **Status:** Not started
- **Goal:** "احصل على استشارة مجانية" + 3-field form
- **Files:** index.html, js/contact-form.js

---

## ✅ Completed

### Feature 0: CMS Infrastructure
- [x] 5 DB tables (schema)
- [x] 5 Admin APIs (content, clients, team, theme, layout)
- [x] Admin UI with 6 tabs
- [x] js/cms-loader.js
- [x] Cache v41

---

## 📊 Feature Template

### Feature: [Name]
- **Priority:** P0 / P1 / P2
- **Status:** Not started / In Progress / Testing / Done
- **Goal:** [One sentence]

#### Requirements
- [ ] Requirement 1
- [ ] Requirement 2

#### Architecture
- Files affected:
- APIs used:
- DB tables:

#### Tasks (Parallel Groups)
| ID | Task | Agent | Files | Group | Deps |
|----|------|-------|-------|-------|------|

#### Testing Plan
- Manual:
- API:
- Edge cases:

#### Security Checklist
- [ ] Auth
- [ ] Validation
- [ ] SQL injection
- [ ] XSS

#### Result
- Commit:
- Live URL:
- Notes:
