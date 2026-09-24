# PR Agency — AI Agent Rules

## Project Overview
- Domain: https://pragency.pages.dev
- Repo: omaomar4111-ui/pragency-website
- Stack: Cloudflare Pages + D1 + Vanilla JS + GSAP
- Admin: /admin (Basic Auth: empty username / pr2026)

## Critical Rules (NON-NEGOTIABLE)
1. NEVER publish without explicit user approval
2. ALWAYS show git diff before any change
3. NEVER modify functions/api/contact.js without reason
4. NEVER hardcode API keys — use environment variables
5. NEVER force push to main
6. NEVER skip the Review Gates

## Workflow — Feature Development (8 Stages)

Every new feature MUST pass:
1. Mapping → FEATURES.md updated
2. Requirements → Human approval required
3. Architecture → Human approval required
4. Implementation → Code + tests
5. Self Review → Agent reviews own code
6. Security Review → Vulnerabilities checked
7. Manual Testing → User tests in browser
8. Production → User approves final push

## Token Optimization Rules
- NO long explanations
- NO repeated instructions
- NO code dumps unless requested
- Use AGENTS.md as persistent context
- Use FEATURES.md for tracking
- Turn cap: 50 per feature
- Batch related changes

## File Structure
- /index.html — Main landing
- /about.html, /contact.html — Static pages
- /services/*.html — Service pages
- /lp/*.html — Landing pages
- /functions/api/ — Backend APIs
- /functions/admin/index.js — Admin dashboard
- /css/main.css, /css/pages.css — Styles
- /js/*.js — Scripts
- /assets/images/, /assets/logos/ — Media
- /schema.sql — DB schema
- /wrangler.toml — Config

## Deployment
git add -A
git commit -m "message"
git push origin main
node deploy_pragency.cjs

## No-Go Zones
- .env files
- API keys in source code
- Direct D1 access without migration
- Modifying production without preview

## Security Checklist
- [ ] Auth checked on all /api/admin/*
- [ ] Input validation on all forms
- [ ] No SQL injection (use prepared statements)
- [ ] No XSS (escape user content)
- [ ] HTTPS only
- [ ] Rate limiting considered

## Testing Checklist
- [ ] Manual browser test (Desktop + Mobile)
- [ ] API test (curl / PowerShell)
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Performance acceptable

## Communication Style
- Language: Arabic (Egyptian) + English technical terms
- Tone: Direct, concise, professional
- Format: Bullet points > paragraphs
- Response: Max 200 words unless asked for details

## Token Optimization (ENFORCED)

### Active Tools
- token-saviour: Global skill (reads code, compresses output)
- mcp-memory-service: Global MCP (persistent memory across sessions)
- Suber Agent Team: PR Agency (fan-out parallel sub-agents)
- Argos: PR Agency (local-first project memory)

### Rules
1. Always run `/clear` before new features
2. Use `@token-saviour` for code reads
3. Store decisions via memory MCP after each feature
4. Use Suber fan-out for parallel tasks
5. Target: 70% token reduction

### Workflow
- Stage 1-7 (Specify → Deploy) with 3 Human Gates
- All artifacts in `features/[feature-name]/`
