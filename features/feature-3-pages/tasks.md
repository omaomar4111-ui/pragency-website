# Feature 3: Standalone Pages — Tasks

## Status
- Stage: DECOMPOSE (Revised)
- Gate 1: ✅ APPROVED
- Gate 2: PENDING_APPROVAL

## Parallel Waves

### Wave A — Foundation (Parallel Safe)
| ID | Task | Agent Role | Files | Deps |
|----|------|------------|-------|------|
| T1 | Create /about.html skeleton | Frontend | about.html | - |
| T2 | Create /services.html skeleton | Frontend | services.html | - |
| T3 | Create /clients.html skeleton | Frontend | clients.html | - |
| T4 | Create public clients API | Backend | functions/api/clients.js | - |
| T5 | Add standalone page CSS | Styles | css/pages.css | - |

### Wave B — Integration (Conflict-Free)
| ID | Task | Agent Role | Files | Deps |
|----|------|------------|-------|------|
| T6 | Create js/clients-page.js | Frontend | js/clients-page.js | T3, T4 |
| T7 | Create js/services-page.js | Frontend | js/services-page.js | T2 |
| T8a | Update navbar in NON-homepage pages | Integration | team.html, contact.html, privacy.html, terms.html, 404.html, services/*.html, lp/*.html | T1, T2, T3 |
| T9 | Add "شوف المزيد" buttons to homepage | Frontend | index.html | T1, T2, T3 |
| T10 | Refactor homepage sections to previews | Frontend | index.html | T9 |
| T8b | Update navbar in index.html | Integration | index.html | T10 |

### Wave C — Polish (Consolidated)
| ID | Task | Agent Role | Files | Deps |
|----|------|------------|-------|------|
| T11 | Add GSAP scroll animations | UI/UX | js/*.js, css/pages.css | T6, T7 |
| T12 | Add CTA + SEO to all new pages | Frontend + SEO | about.html, services.html, clients.html | T8a, T8b |

### Wave D — Verification (Final Checks)
| ID | Task | Agent Role | Files | Deps |
|----|------|------------|-------|------|
| T13 | Security review (XSS, injection) | Security | All new files | T12 |
| T14 | Manual browser testing | QA | - | T12 |
| T15 | Cache bump | DevOps | All *.html | T12 |

## Updated Time Estimate
| Wave | Tasks | Parallel Execution |
|------|-------|--------------------|
| Wave A | T1-T5 (5 parallel) | ~20 min |
| Wave B | T6, T7, T8a, T9 (4 parallel) → T10 → T8b (sequential) | ~40 min |
| Wave C | T11, T12 (2 parallel) | ~20 min |
| Wave D | T13, T14, T15 (3 parallel) | ~20 min |
| **Total** | | **~100 min** |
