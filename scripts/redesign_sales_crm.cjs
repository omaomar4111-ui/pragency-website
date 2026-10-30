const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'sales-crm-2026.html');

// Read existing file to ensure we preserve any critical scripts
console.log('Reading sales-crm-2026.html...');
const original = fs.readFileSync(filePath, 'utf8');

console.log('Original length:', original.length);

// Let's create the newly overhauled, clean, professional enterprise CRM file
const newContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
  <title>Revenue & Sales OS | PR Agency Enterprise</title>
  <meta name="robots" content="noindex, nofollow, noarchive"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  
  <style>
    /* ══════════════════════════════════════════════════════════════════════════
       ENTERPRISE REVENUE & SALES CRM DESIGN SYSTEM
       - Linear & Stripe Inspired High-Density Architecture
       - Zero Consumer Emojis (Subtle Minimalist Vectors & Enterprise Typography)
       - Strict 8px Spacing Grid & Glassmorphic Accents
       - Dynamic Bi-Directional Layouts (RTL / LTR)
       ══════════════════════════════════════════════════════════════════════════ */
    :root {
      --bg-base: #090a0f;
      --bg-elevated: #11131a;
      --bg-surface: #161822;
      --bg-surface-hover: #1c1f2c;
      --bg-glass: rgba(17, 19, 26, 0.85);
      
      --border-subtle: rgba(255, 255, 255, 0.06);
      --border-default: rgba(255, 255, 255, 0.1);
      --border-active: rgba(139, 92, 246, 0.45);
      --border-glow: rgba(139, 92, 246, 0.65);

      --accent: #8b5cf6;
      --accent-hover: #7c3aed;
      --accent-light: rgba(139, 92, 246, 0.12);
      
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.12);
      --warning: #f59e0b;
      --warning-bg: rgba(245, 158, 11, 0.12);
      --danger: #ef4444;
      --danger-bg: rgba(239, 68, 68, 0.12);
      --info: #06b6d4;
      --info-bg: rgba(6, 182, 212, 0.12);

      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      
      --ease-quad: cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(139, 92, 246, 0.3) rgba(15, 15, 23, 0.6);
    }

    body {
      background: var(--bg-base);
      color: var(--text-main);
      font-family: 'Cairo', 'Plus Jakarta Sans', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    html[dir="ltr"] body {
      font-family: 'Plus Jakarta Sans', 'Cairo', -apple-system, sans-serif;
    }

    /* ── TOPBAR NAVIGATION ── */
    .topnav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      gap: 16px;
    }

    .topnav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 15px;
      letter-spacing: -0.3px;
      color: #fff;
      text-decoration: none;
    }
    .brand-badge {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--accent-light);
      color: #c4b5fd;
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .sync-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: var(--success);
      background: var(--success-bg);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 3px 10px;
      border-radius: 20px;
    }
    .sync-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .topnav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.2s var(--ease-quad);
      border: 1px solid transparent;
      text-decoration: none;
      touch-action: manipulation;
    }
    .btn-primary {
      background: var(--accent);
      color: #fff;
      box-shadow: 0 2px 10px rgba(139, 92, 246, 0.25);
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: var(--bg-surface);
      color: var(--text-main);
      border-color: var(--border-default);
    }
    .btn-secondary:hover {
      background: var(--bg-surface-hover);
      border-color: var(--border-active);
    }
    .btn-sm {
      padding: 5px 12px;
      font-size: 11.5px;
      border-radius: 6px;
    }

    /* Language Switcher Button */
    .lang-toggle-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      color: #e2e8f0;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 750;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    .lang-toggle-btn:hover {
      border-color: var(--accent);
      color: #fff;
    }

    /* ── LAYOUT SHELL ── */
    .layout {
      display: flex;
      flex: 1;
      min-height: calc(100vh - 60px);
    }

    .sidebar {
      width: 230px;
      background: var(--bg-elevated);
      border-inline-end: 1px solid var(--border-subtle);
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
    }
    .sidebar-section {
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-dim);
      padding: 12px 12px 6px 12px;
    }
    .sidebar-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 12px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      font-family: inherit;
      font-size: 13px;
      font-weight: 650;
      cursor: pointer;
      text-align: start;
      transition: all 0.15s ease;
    }
    .sidebar-btn:hover {
      background: var(--bg-surface);
      color: #fff;
    }
    .sidebar-btn.active {
      background: var(--accent-light);
      border-color: rgba(139, 92, 246, 0.35);
      color: #fff;
      font-weight: 750;
    }

    .main {
      flex: 1;
      padding: 24px 28px;
      overflow-y: auto;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    /* ── PAGES & TABS ── */
    .page {
      display: none;
    }
    .page.active {
      display: block;
      animation: fadeIn 0.25s var(--ease-quad);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-title {
      font-size: 22px;
      font-weight: 850;
      letter-spacing: -0.4px;
      color: #fff;
    }
    .page-sub {
      font-size: 12.5px;
      color: var(--text-muted);
      margin-top: 3px;
    }

    /* ── KPI METRICS STRIP ── */
    .stats-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .stat-card:hover {
      border-color: var(--border-default);
      transform: translateY(-2px);
    }
    .stat-number {
      font-size: 28px;
      font-weight: 850;
      color: #fff;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    .stat-label {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-top: 8px;
    }

    /* ── CARDS & TABLES ── */
    .card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 24px;
    }
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.015);
    }
    .card-title {
      font-size: 14px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: start;
      font-size: 12.5px;
    }
    th {
      padding: 12px 18px;
      font-weight: 750;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--border-subtle);
    }
    td {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-subtle);
      color: #e2e8f0;
      vertical-align: middle;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.025);
    }

    /* Clean Pill Badges (Zero Emojis) */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 750;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border: 1px solid transparent;
    }
    .badge-new { background: rgba(59, 130, 246, 0.12); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3); }
    .badge-contacted { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border-color: rgba(245, 158, 11, 0.3); }
    .badge-meeting_scheduled { background: rgba(139, 92, 246, 0.12); color: #c4b5fd; border-color: rgba(139, 92, 246, 0.3); }
    .badge-proposal_sent { background: rgba(6, 182, 212, 0.12); color: #38bdf8; border-color: rgba(6, 182, 212, 0.3); }
    .badge-won { background: rgba(16, 185, 129, 0.12); color: #34d399; border-color: rgba(16, 185, 129, 0.3); }
    .badge-lost { background: rgba(239, 68, 68, 0.12); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }

    /* ── KANBAN PIPELINE ── */
    .kanban {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 16px;
      min-height: 540px;
    }
    .kanban-col {
      width: 290px;
      min-width: 290px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
    }
    .kanban-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 800;
      color: #fff;
    }
    .kanban-count {
      font-size: 11px;
      background: var(--bg-surface);
      color: var(--text-muted);
      padding: 2px 7px;
      border-radius: 10px;
      border: 1px solid var(--border-subtle);
    }
    .kanban-cards {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
      overflow-y: auto;
    }
    .kanban-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s var(--ease-quad);
    }
    .kanban-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
    }
    .kanban-card-title {
      font-size: 13.5px;
      font-weight: 750;
      color: #fff;
      margin-bottom: 4px;
    }
    .kanban-card-meta {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* ── FILTER PILLS ── */
    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .filter-pill {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-pill:hover {
      color: #fff;
      border-color: var(--accent);
    }
    .filter-pill.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    /* ── MODALS (FIXED VISIBILITY & EASING) ── */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      z-index: 99999 !important;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.25s var(--ease-quad), visibility 0.25s var(--ease-quad);
    }
    .modal-overlay.open,
    .modal-overlay.active {
      display: flex !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }
    .modal {
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 24px;
      width: 660px;
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.95);
      position: relative;
    }
    .modal-close {
      position: absolute;
      top: 18px;
      inset-inline-end: 18px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .modal-close:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    /* ── FORM ELEMENTS ── */
    .form-grid {
      display: grid;
      gap: 14px;
    }
    .form-grid-2 {
      grid-template-columns: 1fr 1fr;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    label {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    input, select, textarea {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      color: #fff;
      font-family: inherit;
      font-size: 13px;
      padding: 10px 14px;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
    }
    textarea {
      resize: vertical;
      line-height: 1.6;
    }

    /* ── AI SALES STUDIO SECTION (MINIMALIST & HIGH POWER) ── */
    .ai-studio-container {
      background: linear-gradient(145deg, rgba(139, 92, 246, 0.1), rgba(17, 19, 26, 0.8));
      border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: var(--radius-md);
      padding: 16px;
      margin-bottom: 20px;
    }
    .ai-studio-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .ai-studio-title {
      font-size: 13px;
      font-weight: 800;
      color: #c4b5fd;
      letter-spacing: 0.3px;
    }
    .ai-quick-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin: 10px 0;
    }
    .ai-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-default);
      color: var(--text-main);
      padding: 4px 10px;
      border-radius: 14px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .ai-chip:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    /* ── RESPONSIVE MOBILE DOCK & SIDEBAR ── */
    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      flex-direction: column;
      gap: 4px;
    }
    .mobile-menu-btn span {
      display: block;
      width: 20px;
      height: 2px;
      background: #fff;
      border-radius: 2px;
    }

    .mobile-dock {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: rgba(17, 19, 26, 0.95);
      backdrop-filter: blur(14px);
      border-top: 1px solid var(--border-subtle);
      z-index: 99;
      justify-content: space-around;
      align-items: center;
      padding: 0 8px;
    }
    .dock-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 6px;
    }
    .dock-btn.active {
      color: var(--accent);
    }

    @media (max-width: 900px) {
      .sidebar {
        position: fixed;
        top: 60px;
        bottom: 0;
        inset-inline-start: -260px;
        z-index: 1000;
        transition: inset-inline-start 0.3s var(--ease-quad);
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.6);
      }
      .sidebar.open {
        inset-inline-start: 0;
      }
      .mobile-menu-btn {
        display: flex;
      }
      .mobile-dock {
        display: flex;
      }
      .main {
        padding: 16px;
        padding-bottom: 80px;
      }
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>

  <!-- Topbar Navigation -->
  <header class="topnav">
    <div style="display:flex;align-items:center;gap:12px;">
      <button type="button" class="mobile-menu-btn" onclick="toggleSidebar()" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <a href="/sales-crm-2026.html" class="topnav-brand">
        <span style="color:#fff;">PR AGENCY</span>
        <span class="brand-badge" data-i18n="brandBadge">REVENUE OS</span>
      </a>
      <div class="sync-indicator">
        <span class="sync-dot"></span>
        <span data-i18n="syncStatus">Cloud Synced</span>
      </div>
    </div>

    <!-- Quick Search Input -->
    <div style="position:relative;width:280px;max-width:35vw;">
      <input type="text" id="globalSearchInput" placeholder="Search deals (Ctrl+K)..." oninput="handleSearch(this.value)" style="padding:6px 14px;border-radius:20px;font-size:12px;"/>
    </div>

    <div class="topnav-actions">
      <!-- Language Toggle Switch -->
      <button type="button" class="lang-toggle-btn" id="langToggleBtn" onclick="toggleLanguage()">
        <span id="langBtnText">English</span>
      </button>
      <button type="button" class="btn btn-primary btn-sm" onclick="openModal('addLeadModal')" data-i18n="btnNewDeal">
        + New Deal
      </button>
      <a href="/admin-agency" class="btn btn-secondary btn-sm" data-i18n="adminLink">
        Admin Console ↗
      </a>
    </div>
  </header>

  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-section" data-i18n="navSecWorkspace">WORKSPACE</div>
      <button class="sidebar-btn active" onclick="showPage('dashboard', this)">
        <span data-i18n="navDashboard">Dashboard</span>
      </button>
      <button class="sidebar-btn" onclick="showPage('kanban', this)">
        <span data-i18n="navPipeline">Pipeline (Kanban)</span>
      </button>
      <button class="sidebar-btn" onclick="showPage('leads', this)">
        <span data-i18n="navLeads">Leads & Deals</span>
      </button>

      <div class="sidebar-section" data-i18n="navSecOperations">OPERATIONS</div>
      <button class="sidebar-btn" onclick="showPage('voice', this)">
        <span data-i18n="navActivity">Activity & Notes</span>
      </button>
      <button class="sidebar-btn" onclick="showPage('overdue', this)">
        <span data-i18n="navOverdue">Overdue Tasks</span>
      </button>
      <button class="sidebar-btn" onclick="showPage('reports', this)">
        <span data-i18n="navReports">Analytics & Reports</span>
      </button>
    </aside>

    <!-- Main Content -->
    <main class="main">
      <!-- ── PAGE 1: DASHBOARD ── -->
      <div id="page-dashboard" class="page active">
        <div class="page-header">
          <div>
            <h1 class="page-title" data-i18n="dashboardTitle">Revenue & Sales Dashboard</h1>
            <p class="page-sub" data-i18n="dashboardSub">Real-time pipeline tracking and conversion analytics</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="refreshAll()" data-i18n="btnSyncCloud">
            Sync Cloud
          </button>
        </div>

        <!-- KPI Strip -->
        <div class="stats-strip">
          <div class="stat-card">
            <div class="stat-number" id="st-total">1</div>
            <div class="stat-label" data-i18n="kpiTotalDeals">Active Pipeline Deals</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="st-new" style="color:var(--info);">0</div>
            <div class="stat-label" data-i18n="kpiNewLeads">New Leads (This Week)</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="st-won" style="color:var(--success);">0</div>
            <div class="stat-label" data-i18n="kpiWonDeals">Closed Won Contracts</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="st-overdue" style="color:var(--danger);">0</div>
            <div class="stat-label" data-i18n="kpiPendingFollowups">Pending Follow-ups</div>
          </div>
        </div>

        <!-- Recent Deals Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title" data-i18n="recentDealsTitle">Recent Pipeline Activity</div>
            <button class="btn btn-secondary btn-sm" onclick="showPage('leads')" data-i18n="btnViewAll">View All ↗</button>
          </div>
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th data-i18n="thName">Lead Name</th>
                  <th data-i18n="thCompany">Company / Project</th>
                  <th data-i18n="thSource">Channel</th>
                  <th data-i18n="thOwner">Owner</th>
                  <th data-i18n="thStage">Stage</th>
                  <th data-i18n="thDate">Created Date</th>
                  <th data-i18n="thAction">Action</th>
                </tr>
              </thead>
              <tbody id="recentLeadsBody">
                <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);" data-i18n="loadingMsg">Loading pipeline data...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── PAGE 2: KANBAN PIPELINE ── -->
      <div id="page-kanban" class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title" data-i18n="pipelineTitle">Deal Pipeline (Kanban)</h1>
            <p class="page-sub" data-i18n="pipelineSub">Drag-free visual deal stages from New to Closed Won</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openModal('addLeadModal')" data-i18n="btnNewDeal">+ New Deal</button>
        </div>
        <div class="kanban" id="kanbanBoard"></div>
      </div>

      <!-- ── PAGE 3: LEADS LIST ── -->
      <div id="page-leads" class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title" data-i18n="leadsTitle">All Leads & Deals</h1>
            <p class="page-sub" data-i18n="leadsSub">Complete registry of potential clients and deal stages</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openModal('addLeadModal')" data-i18n="btnNewDeal">+ New Deal</button>
        </div>

        <!-- Filter Pills -->
        <div class="filter-pills" id="stageFilters">
          <button class="filter-pill active" onclick="filterLeads('all', this)" data-i18n="filterAll">All Deals</button>
          <button class="filter-pill" onclick="filterLeads('new', this)" data-i18n="stageNew">New Lead</button>
          <button class="filter-pill" onclick="filterLeads('contacted', this)" data-i18n="stageContacted">Contacted</button>
          <button class="filter-pill" onclick="filterLeads('meeting_scheduled', this)" data-i18n="stageMeeting">Meeting Scheduled</button>
          <button class="filter-pill" onclick="filterLeads('proposal_sent', this)" data-i18n="stageProposal">Proposal Sent</button>
          <button class="filter-pill" onclick="filterLeads('won', this)" data-i18n="stageWon">Closed Won</button>
          <button class="filter-pill" onclick="filterLeads('lost', this)" data-i18n="stageLost">Closed Lost</button>
        </div>

        <div class="card">
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th data-i18n="thName">Lead Name</th>
                  <th data-i18n="thPhone">Phone / WhatsApp</th>
                  <th data-i18n="thCompany">Company</th>
                  <th data-i18n="thSource">Channel</th>
                  <th data-i18n="thOwner">Owner</th>
                  <th data-i18n="thStage">Stage</th>
                  <th data-i18n="thDate">Created Date</th>
                  <th data-i18n="thAction">Action</th>
                </tr>
              </thead>
              <tbody id="leadsTableBody">
                <tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);" data-i18n="loadingMsg">Loading pipeline data...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── PAGE 4: VOICE / ACTIVITY NOTES ── -->
      <div id="page-voice" class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title" data-i18n="activityTitle">Activity & Notes Log</h1>
            <p class="page-sub" data-i18n="activitySub">Record follow-up summaries, call transcripts, and next steps</p>
          </div>
        </div>

        <div class="card" style="padding:22px;">
          <form onsubmit="submitFollowupNote(event)">
            <div class="form-grid form-grid-2" style="margin-bottom:16px;">
              <div class="field">
                <label data-i18n="selectLeadLabel">Select Deal / Client *</label>
                <select id="voiceLeadSelect" required></select>
              </div>
              <div class="field">
                <label data-i18n="outcomeLabel">Call / Contact Outcome</label>
                <select id="voiceOutcome">
                  <option value="interested" data-i18n="outcomeInterested">Interested & Moving Forward</option>
                  <option value="callback" data-i18n="outcomeCallback">Follow-up Call Scheduled</option>
                  <option value="no_answer" data-i18n="outcomeNoAnswer">No Answer / Left Message</option>
                  <option value="not_fit" data-i18n="outcomeNotFit">Disqualified / Not a Fit</option>
                </select>
              </div>
              <div class="field">
                <label data-i18n="stageUpdateLabel">Update Stage</label>
                <select id="voiceNewStage">
                  <option value="">Keep Current Stage</option>
                  <option value="contacted" data-i18n="stageContacted">Contacted</option>
                  <option value="meeting_scheduled" data-i18n="stageMeeting">Meeting Scheduled</option>
                  <option value="proposal_sent" data-i18n="stageProposal">Proposal Sent</option>
                  <option value="won" data-i18n="stageWon">Closed Won</option>
                  <option value="lost" data-i18n="stageLost">Closed Lost</option>
                </select>
              </div>
              <div class="field">
                <label data-i18n="nextDateLabel">Next Follow-up Due Date</label>
                <input type="date" id="voiceNextDate"/>
              </div>
            </div>

            <div class="field" style="margin-bottom:16px;">
              <label data-i18n="notesAreaLabel">Follow-up Notes / Transcript *</label>
              <textarea id="voiceNotes" rows="4" required placeholder="Enter key conversation points, agreed deliverables, or client objections..."></textarea>
            </div>

            <button type="submit" class="btn btn-primary" data-i18n="btnSaveFollowup">
              Save Follow-up to Cloud
            </button>
          </form>
        </div>
      </div>

      <!-- ── PAGE 5: OVERDUE ── -->
      <div id="page-overdue" class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title" data-i18n="overdueTitle">Overdue Tasks & Follow-ups</h1>
            <p class="page-sub" data-i18n="overdueSub">Clients requiring urgent outreach based on scheduled dates</p>
          </div>
        </div>
        <div class="card">
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th data-i18n="thName">Lead Name</th>
                  <th data-i18n="thPhone">Phone</th>
                  <th data-i18n="thOwner">Owner</th>
                  <th data-i18n="thDueDate">Due Date</th>
                  <th data-i18n="thStage">Stage</th>
                  <th data-i18n="thAction">Action</th>
                </tr>
              </thead>
              <tbody id="overdueBody">
                <tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);" data-i18n="noOverdueMsg">No overdue tasks. All follow-ups are up to date.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── PAGE 6: REPORTS ── -->
      <div id="page-reports" class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title" data-i18n="reportsTitle">Conversion & Sales Reports</h1>
            <p class="page-sub" data-i18n="reportsSub">Attribution by channel and closed won conversion performance</p>
          </div>
        </div>
        <div class="card" id="reportBody" style="padding:20px;">
          <div style="text-align:center;color:var(--text-muted);padding:24px;" data-i18n="loadingMsg">Loading analytics...</div>
        </div>
      </div>
    </main>
  </div>

  <!-- Mobile Bottom Navigation Dock -->
  <nav class="mobile-dock">
    <button type="button" class="dock-btn active" onclick="showPage('dashboard')">
      <span data-i18n="dockDashboard">Dashboard</span>
    </button>
    <button type="button" class="dock-btn" onclick="showPage('kanban')">
      <span data-i18n="dockPipeline">Pipeline</span>
    </button>
    <button type="button" class="dock-btn" onclick="showPage('leads')">
      <span data-i18n="dockDeals">Deals</span>
    </button>
    <button type="button" class="dock-btn" onclick="showPage('voice')">
      <span data-i18n="dockActivity">Activity</span>
    </button>
  </nav>

  <!-- ═══════════════════════════════ MODALS ═══════════════════════════════ -->

  <!-- Add New Deal Modal -->
  <div class="modal-overlay" id="addLeadModal">
    <div class="modal">
      <button type="button" class="modal-close" onclick="closeModal('addLeadModal')">✕</button>
      <div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:14px;" data-i18n="modalNewDealTitle">
        Create New Deal in Pipeline
      </div>
      <form id="addLeadForm" onsubmit="submitNewLead(event)">
        <div class="form-grid form-grid-2">
          <div class="field">
            <label data-i18n="lblLeadName">Client / Decision Maker *</label>
            <input type="text" id="al-name" required placeholder="e.g. John Doe"/>
          </div>
          <div class="field">
            <label data-i18n="lblProjectName">Company / Project Name *</label>
            <input type="text" id="al-project" required placeholder="e.g. Acme Corp"/>
          </div>
          <div class="field">
            <label data-i18n="lblPhone">Phone / WhatsApp *</label>
            <input type="tel" id="al-phone" required placeholder="+20xxxxxxxxxx" dir="ltr"/>
          </div>
          <div class="field">
            <label data-i18n="lblEmail">Email Address</label>
            <input type="email" id="al-email" placeholder="contact@company.com" dir="ltr"/>
          </div>
          <div class="field">
            <label data-i18n="lblSource">Acquisition Channel *</label>
            <select id="al-source">
              <option value="meta_ad">Meta Ads (Instagram / Facebook)</option>
              <option value="google_ad">Google Search / YouTube Ads</option>
              <option value="client_referral">Client Referral</option>
              <option value="website_form">Direct Website Inquiry</option>
              <option value="cold_outreach">Direct / Cold Outreach</option>
              <option value="other">Other Channel</option>
            </select>
          </div>
          <div class="field">
            <label data-i18n="lblService">Service Interested *</label>
            <select id="al-service">
              <option value="full_package">Full Growth Retainer</option>
              <option value="paid_ads">Paid Media & Ads Management</option>
              <option value="video_production">Video Production & Reels</option>
              <option value="branding">Brand Identity & Positioning</option>
            </select>
          </div>
          <div class="field">
            <label data-i18n="lblBudget">Estimated Budget Tier</label>
            <select id="al-budget">
              <option value="starter">Starter (&lt; 15,000 EGP)</option>
              <option value="growth">Growth (15,000 - 35,000 EGP)</option>
              <option value="enterprise">Enterprise (35,000+ EGP)</option>
            </select>
          </div>
          <div class="field">
            <label data-i18n="lblDueDate">Initial Follow-up Date</label>
            <input type="date" id="al-due"/>
          </div>
        </div>
        <div class="field" style="margin-top:14px;">
          <label data-i18n="lblNotes">Deal Notes & Initial Requirements</label>
          <textarea id="al-notes" rows="3" placeholder="Enter key business challenges or client expectations..."></textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal('addLeadModal')" data-i18n="btnCancel">Cancel</button>
          <button type="submit" class="btn btn-primary" data-i18n="btnSaveDeal">Save to Cloud Database</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Lead Detail & AI Sales Studio Modal -->
  <div class="modal-overlay" id="leadDetailModal">
    <div class="modal">
      <button type="button" class="modal-close" onclick="closeModal('leadDetailModal')">✕</button>
      <div id="leadDetailContent">
        <div style="text-align:center;padding:32px;color:var(--text-muted);" data-i18n="loadingMsg">Loading deal details...</div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════ SCRIPTS ═══════════════════════════════ -->
  <script>
    // ── BILINGUAL INTERNATIONAL DICTIONARY (ZERO EMOJIS) ─────────────────
    const I18N = {
      ar: {
        brandBadge: 'نظام الإيرادات',
        syncStatus: 'متزامن سحابياً',
        langBtnText: 'English',
        adminLink: 'لوحة الإدارة ↗',
        btnNewDeal: '+ إضافة صفقة',
        btnSyncCloud: 'تحديث سحابي',
        btnViewAll: 'عرض الكل ↗',
        btnCancel: 'إلغاء',
        btnSaveDeal: 'حفظ في السحابة',
        navSecWorkspace: 'مساحة العمل',
        navSecOperations: 'عمليات المبيعات',
        navDashboard: 'لوحة التحكم',
        navPipeline: 'مسار الصفقات (Pipeline)',
        navLeads: 'العملاء والصفقات',
        navActivity: 'المتابعات والملاحظات',
        navOverdue: 'متابعات مستحقة',
        navReports: 'التقارير والتحليلات',
        dashboardTitle: 'لوحة تحكم المبيعات والإيرادات',
        dashboardSub: 'متابعة لحظية لمسار الصفقات ومعدلات التحويل السحابية',
        kpiTotalDeals: 'إجمالي الصفقات النشطة',
        kpiNewLeads: 'صفقات جديدة هذا الأسبوع',
        kpiWonDeals: 'عقود تم إغلاقها بنجاح',
        kpiPendingFollowups: 'متابعات مستحقة',
        recentDealsTitle: 'أحدث الصفقات والفرص البيعية',
        pipelineTitle: 'مسار الصفقات (Pipeline)',
        pipelineSub: 'متابعة مراحل الصفقات من البداية وحتى الفوز بالعقد',
        leadsTitle: 'سجل العملاء والصفقات',
        leadsSub: 'قاعدة بيانات موحدة لجميع العملاء المحتملين وتفاصيل التواصل',
        filterAll: 'جميع الصفقات',
        stageNew: 'ليد جديد',
        stageContacted: 'تم التواصل',
        stageMeeting: 'اجتماع مجدول',
        stageProposal: 'عرض سعر مرسل',
        stageWon: 'تم الفوز بالعقد',
        stageLost: 'صفقة خاسرة',
        thName: 'اسم العميل',
        thCompany: 'المشروع / الشركة',
        thPhone: 'الهاتف / واتساب',
        thSource: 'القناة',
        thOwner: 'المسؤول',
        thStage: 'المرحلة',
        thDate: 'التاريخ',
        thAction: 'الإجراء',
        thDueDate: 'الموعد المحدد',
        actionDetails: 'التفاصيل',
        actionCall: 'اتصال',
        actionWhatsApp: 'واتساب',
        actionConvert: 'تحويل لعميل',
        actionBrief: 'بريف اليوم',
        aiStudioTitle: 'استوديو الذكاء الاصطناعي للمبيعات (AI Sales Studio)',
        aiStudioSub: 'توليد استراتيجيات، عروض أسعار، ومعالجة اعتراضات مدعومة بـ 77 مهارة',
        aiPromptPlaceholder: 'اكتب ما تطلبه من الذكاء الاصطناعي لهذا العميل (مثال: دراسة حالة كولاج، تحليل منافسين، سيناريو إغلاق، عرض أسعار بالباقات)...',
        btnGenerateAi: 'توليد بالذكاء الاصطناعي',
        btnExportCollage: 'تصدير كولاج PDF',
        btnCopy: 'نسخ المحتوى',
        chipCollage: 'ملف تقديم كولاج',
        chipProposal: 'عرض سعر متكامل',
        chipObjection: 'معالجة اعتراض',
        chipCompetitor: 'تحليل المنافسين',
        activityTitle: 'سجل المتابعات والملاحظات',
        activitySub: 'توثيق نتائج المكالمات وتحديد مواعيد المتابعة القادمة',
        selectLeadLabel: 'اختر الصفقة / العميل *',
        outcomeLabel: 'نتيجة المكالمة',
        outcomeInterested: 'مهتم بالخدمة ومستعد للخطوة التالية',
        outcomeCallback: 'مكالمة متابعة لاحقة',
        outcomeNoAnswer: 'لم يتم الرد',
        outcomeNotFit: 'غير مؤهل / غير مناسب حالياً',
        stageUpdateLabel: 'تحديث المرحلة',
        nextDateLabel: 'تاريخ المتابعة القادمة',
        notesAreaLabel: 'الملاحظات والملخص *',
        btnSaveFollowup: 'حفظ المتابعة في السحابة',
        overdueTitle: 'المتابعات والمهام المستحقة',
        overdueSub: 'عملاء يتطلبون تواصلاً فورياً بناءً على المواعيد المحددة',
        noOverdueMsg: 'لا توجد مهام متأخرة حالياً. جميع المتابعات منتظمة.',
        reportsTitle: 'تقارير الأداء ومعدل التحويل',
        reportsSub: 'تحليل دقيق لمصادر التدفق ومعدل إغلاق العقود',
        loadingMsg: 'جاري تحميل البيانات من السحابة...',
        modalNewDealTitle: 'إضافة صفقة جديدة إلى مسار المبيعات',
        lblLeadName: 'اسم العميل / صانع القرار *',
        lblProjectName: 'اسم الشركة أو المشروع *',
        lblPhone: 'الهاتف / واتساب *',
        lblEmail: 'البريد الإلكتروني',
        lblSource: 'قناة الاستقطاب *',
        lblService: 'الخدمة المطلوبة *',
        lblBudget: 'الميزانية التقديرية',
        lblDueDate: 'تاريخ المتابعة الأولى',
        lblNotes: 'ملاحظات الصفقة والتحديات',
        dockDashboard: 'الرئيسية',
        dockPipeline: 'المسار',
        dockDeals: 'الصفقات',
        dockActivity: 'المتابعة'
      },
      en: {
        brandBadge: 'REVENUE OS',
        syncStatus: 'Cloud Synced',
        langBtnText: 'عربي',
        adminLink: 'Admin Console ↗',
        btnNewDeal: '+ New Deal',
        btnSyncCloud: 'Sync Cloud',
        btnViewAll: 'View All ↗',
        btnCancel: 'Cancel',
        btnSaveDeal: 'Save to Cloud',
        navSecWorkspace: 'WORKSPACE',
        navSecOperations: 'OPERATIONS',
        navDashboard: 'Dashboard',
        navPipeline: 'Pipeline (Kanban)',
        navLeads: 'Leads & Deals',
        navActivity: 'Activity & Notes',
        navOverdue: 'Overdue Tasks',
        navReports: 'Analytics & Reports',
        dashboardTitle: 'Revenue & Sales Dashboard',
        dashboardSub: 'Real-time pipeline tracking and conversion analytics',
        kpiTotalDeals: 'Active Pipeline Deals',
        kpiNewLeads: 'New Leads (This Week)',
        kpiWonDeals: 'Closed Won Contracts',
        kpiPendingFollowups: 'Pending Follow-ups',
        recentDealsTitle: 'Recent Pipeline Activity',
        pipelineTitle: 'Deal Pipeline (Kanban)',
        pipelineSub: 'Visual stage progression from New to Closed Won',
        leadsTitle: 'All Leads & Deals',
        leadsSub: 'Central registry of potential clients and deal stages',
        filterAll: 'All Deals',
        stageNew: 'New Lead',
        stageContacted: 'Contacted',
        stageMeeting: 'Meeting Scheduled',
        stageProposal: 'Proposal Sent',
        stageWon: 'Closed Won',
        stageLost: 'Closed Lost',
        thName: 'Lead Name',
        thCompany: 'Company / Project',
        thPhone: 'Phone / WhatsApp',
        thSource: 'Channel',
        thOwner: 'Owner',
        thStage: 'Stage',
        thDate: 'Created Date',
        thAction: 'Action',
        thDueDate: 'Due Date',
        actionDetails: 'Details',
        actionCall: 'Call',
        actionWhatsApp: 'WhatsApp',
        actionConvert: 'Convert',
        actionBrief: 'Daily Brief',
        aiStudioTitle: 'AI Sales Studio & Copilot',
        aiStudioSub: 'Custom strategy, proposals, and objection handling powered by 77 skills & Arena engine',
        aiPromptPlaceholder: 'Enter custom AI prompt for this lead (e.g. customized retainer proposal, legal cases pitch, trend exploitation angles, closing script)...',
        btnGenerateAi: 'Generate with AI',
        btnExportCollage: 'Export Collage PDF',
        btnCopy: 'Copy Output',
        chipCollage: 'Collage Pitch Deck',
        chipProposal: 'Pricing Proposal',
        chipObjection: 'Objection Script',
        chipCompetitor: 'Competitor Teardown',
        activityTitle: 'Activity & Notes Log',
        activitySub: 'Record call summaries and schedule next follow-up dates',
        selectLeadLabel: 'Select Deal / Client *',
        outcomeLabel: 'Call / Contact Outcome',
        outcomeInterested: 'Interested & Moving Forward',
        outcomeCallback: 'Follow-up Call Scheduled',
        outcomeNoAnswer: 'No Answer / Left Message',
        outcomeNotFit: 'Disqualified / Not a Fit',
        stageUpdateLabel: 'Update Stage',
        nextDateLabel: 'Next Follow-up Due Date',
        notesAreaLabel: 'Follow-up Notes / Transcript *',
        btnSaveFollowup: 'Save Follow-up to Cloud',
        overdueTitle: 'Overdue Tasks & Follow-ups',
        overdueSub: 'Deals requiring urgent contact based on scheduled dates',
        noOverdueMsg: 'No overdue tasks. All follow-ups are up to date.',
        reportsTitle: 'Conversion & Attribution Reports',
        reportsSub: 'Channel performance and closed won conversion rates',
        loadingMsg: 'Loading data from cloud database...',
        modalNewDealTitle: 'Create New Deal in Pipeline',
        lblLeadName: 'Client / Decision Maker *',
        lblProjectName: 'Company / Project Name *',
        lblPhone: 'Phone / WhatsApp *',
        lblEmail: 'Email Address',
        lblSource: 'Acquisition Channel *',
        lblService: 'Service Interested *',
        lblBudget: 'Estimated Budget Tier',
        lblDueDate: 'Initial Follow-up Date',
        lblNotes: 'Deal Notes & Requirements',
        dockDashboard: 'Dashboard',
        dockPipeline: 'Pipeline',
        dockDeals: 'Deals',
        dockActivity: 'Activity'
      }
    };

    let currentLang = localStorage.getItem('crm_lang') || 'ar';
    let allLeads = [];
    let currentStageFilter = 'all';

    function getAuthHeaders() {
      const token = localStorage.getItem('admin_jwt') || localStorage.getItem('agency_admin_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      return headers;
    }

    // ── LANGUAGE SWITCHER ──────────────────────────────────────────────
    function setLanguage(lang) {
      currentLang = lang;
      localStorage.setItem('crm_lang', lang);
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

      // Update all data-i18n elements
      const dict = I18N[lang] || I18N.ar;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
      });

      const langBtn = document.getElementById('langBtnText');
      if (langBtn) langBtn.textContent = dict.langBtnText;

      // Re-render components with translated texts
      refreshDashboard();
      renderKanban(allLeads);
      renderLeadsTable(allLeads);
    }

    function toggleLanguage() {
      setLanguage(currentLang === 'ar' ? 'en' : 'ar');
    }

    // ── NAVIGATION & SIDEBAR ───────────────────────────────────────────
    function showPage(id, btn) {
      toggleSidebar(false);
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));

      const target = document.getElementById('page-' + id);
      if (target) target.classList.add('active');
      if (btn) btn.classList.add('active');

      if (id === 'dashboard') refreshDashboard();
      if (id === 'kanban') renderKanban(allLeads);
      if (id === 'leads') renderLeadsTable(allLeads);
      if (id === 'voice') populateLeadSelect();
      if (id === 'overdue') loadOverdue();
      if (id === 'reports') loadReports();
    }

    function toggleSidebar(forceState) {
      const sb = document.getElementById('sidebar');
      if (!sb) return;
      const isOpen = forceState !== undefined ? forceState : !sb.classList.contains('open');
      sb.classList.toggle('open', isOpen);
    }

    // ── MODAL MANAGEMENT ───────────────────────────────────────────────
    function openModal(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add('open', 'active');
      el.style.display = 'flex';
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.pointerEvents = 'auto';
      document.body.style.overflow = 'hidden';
    }

    function closeModal(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('open', 'active');
      el.style.display = 'none';
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      document.body.style.overflow = '';
    }

    // ── CLOUD SYNC & DATA FETCHING ─────────────────────────────────────
    async function fetchLeads() {
      try {
        const r = await fetch('/api/admin/sales/leads?limit=100', {
          headers: getAuthHeaders()
        });
        const d = await r.json();
        return d.leads || d.data || [];
      } catch (err) {
        console.error('[Sales Cloud Sync Error]:', err);
        return [];
      }
    }

    async function refreshAll() {
      allLeads = await fetchLeads();
      refreshDashboard();
      renderKanban(allLeads);
      renderLeadsTable(allLeads);
      populateLeadSelect();
    }

    function getStageLabel(stage) {
      const dict = I18N[currentLang] || I18N.ar;
      const map = {
        new: dict.stageNew,
        contacted: dict.stageContacted,
        meeting_scheduled: dict.stageMeeting,
        proposal_sent: dict.stageProposal,
        won: dict.stageWon,
        lost: dict.stageLost
      };
      return map[stage] || stage;
    }

    function getSourceLabel(src) {
      const dict = I18N[currentLang] || I18N.ar;
      const map = {
        meta_ad: currentLang === 'ar' ? 'إعلانات ميتا' : 'Meta Ads',
        google_ad: currentLang === 'ar' ? 'إعلانات جوجل' : 'Google Ads',
        client_referral: currentLang === 'ar' ? 'توصية عميل' : 'Client Referral',
        website_form: currentLang === 'ar' ? 'الموقع الإلكتروني' : 'Website',
        cold_outreach: currentLang === 'ar' ? 'مباشر / بارد' : 'Direct / Cold',
        other: currentLang === 'ar' ? 'أخرى' : 'Other'
      };
      return map[src] || src;
    }

    function refreshDashboard() {
      const total = allLeads.length;
      const newLeads = allLeads.filter(l => l.pipeline_stage === 'new').length;
      const won = allLeads.filter(l => l.pipeline_stage === 'won').length;
      const today = new Date().toISOString().split('T')[0];
      const overdue = allLeads.filter(l =>
        l.next_followup_due && l.next_followup_due < today &&
        !['won', 'lost'].includes(l.pipeline_stage)
      ).length;

      document.getElementById('st-total').textContent = total;
      document.getElementById('st-new').textContent = newLeads;
      document.getElementById('st-won').textContent = won;
      document.getElementById('st-overdue').textContent = overdue;

      const recent = allLeads.slice(0, 5);
      const tb = document.getElementById('recentLeadsBody');
      const dict = I18N[currentLang] || I18N.ar;

      if (!recent.length) {
        tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px;">' + (currentLang === 'ar' ? 'لا توجد صفقات حالياً' : 'No deals found') + '</td></tr>';
      } else {
        tb.innerHTML = recent.map(l => \`
          <tr>
            <td><strong>\${l.name}</strong></td>
            <td>\${l.project_name || '—'}</td>
            <td><span class="badge" style="background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1);">\${getSourceLabel(l.source_type)}</span></td>
            <td>\${l.assigned_sales_name || '—'}</td>
            <td><span class="badge badge-\${l.pipeline_stage}">\${getStageLabel(l.pipeline_stage)}</span></td>
            <td style="color:var(--text-muted);">\${(l.created_at || '').slice(0, 10)}</td>
            <td>
              <button type="button" class="btn btn-sm btn-secondary" onclick="openLeadDetail('\${l.id}')">
                \${dict.actionDetails}
              </button>
            </td>
          </tr>
        \`).join('');
      }
    }

    // ── KANBAN BOARD ───────────────────────────────────────────────────
    function renderKanban(leads) {
      const dict = I18N[currentLang] || I18N.ar;
      const stages = [
        { key: 'new', label: dict.stageNew },
        { key: 'contacted', label: dict.stageContacted },
        { key: 'meeting_scheduled', label: dict.stageMeeting },
        { key: 'proposal_sent', label: dict.stageProposal },
        { key: 'won', label: dict.stageWon },
        { key: 'lost', label: dict.stageLost }
      ];

      const board = document.getElementById('kanbanBoard');
      board.innerHTML = stages.map(s => {
        const colLeads = leads.filter(l => l.pipeline_stage === s.key);
        return \`
          <div class="kanban-col">
            <div class="kanban-header">
              <span>\${s.label}</span>
              <span class="kanban-count">\${colLeads.length}</span>
            </div>
            <div class="kanban-cards">
              \${colLeads.map(l => \`
                <div class="kanban-card" onclick="openLeadDetail('\${l.id}')">
                  <div class="kanban-card-title">\${l.name}</div>
                  <div class="kanban-card-meta">\${l.project_name || 'Project'}</div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
                    <span class="badge" style="background:rgba(255,255,255,0.04);font-size:10px;">\${getSourceLabel(l.source_type)}</span>
                    <span style="font-size:10.5px;color:var(--text-dim);">\${(l.created_at || '').slice(0, 10)}</span>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }).join('');
    }

    // ── LEADS DATA TABLE ───────────────────────────────────────────────
    function renderLeadsTable(leads) {
      const dict = I18N[currentLang] || I18N.ar;
      const filtered = currentStageFilter === 'all' ? leads : leads.filter(l => l.pipeline_stage === currentStageFilter);
      const tbody = document.getElementById('leadsTableBody');

      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">' + (currentLang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching records') + '</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(l => \`
        <tr>
          <td><strong>\${l.name}</strong></td>
          <td dir="ltr" style="text-align:start;">
            <a href="https://wa.me/\${(l.phone || '').replace(/\\D/g, '')}" target="_blank" style="color:var(--success);text-decoration:none;font-weight:600;">
              \${l.phone || '—'}
            </a>
          </td>
          <td>\${l.project_name || '—'}</td>
          <td><span class="badge" style="background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1);">\${getSourceLabel(l.source_type)}</span></td>
          <td>\${l.assigned_sales_name || '—'}</td>
          <td><span class="badge badge-\${l.pipeline_stage}">\${getStageLabel(l.pipeline_stage)}</span></td>
          <td style="color:var(--text-muted);">\${(l.created_at || '').slice(0, 10)}</td>
          <td>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openLeadDetail('\${l.id}')">
              \${dict.actionDetails}
            </button>
          </td>
        </tr>
      \`).join('');
    }

    function filterLeads(stage, btn) {
      currentStageFilter = stage;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderLeadsTable(allLeads);
    }

    // ── LEAD DETAIL & AI STUDIO MODAL ──────────────────────────────────
    async function openLeadDetail(leadId) {
      openModal('leadDetailModal');
      const content = document.getElementById('leadDetailContent');
      const dict = I18N[currentLang] || I18N.ar;

      content.innerHTML = '<div style="text-align:center;padding:36px;color:var(--text-muted);">' + dict.loadingMsg + '</div>';

      let lead = allLeads.find(l => String(l.id) === String(leadId));
      let followups = [];

      try {
        const res = await fetch('/api/admin/sales/leads?id=' + encodeURIComponent(leadId), {
          headers: getAuthHeaders()
        });
        const d = await res.json();
        if (d.success && (d.lead || d.data)) {
          lead = d.lead || d.data;
          followups = d.followups || [];
          const idx = allLeads.findIndex(l => String(l.id) === String(leadId));
          if (idx !== -1) allLeads[idx] = lead;
          else allLeads.unshift(lead);
        }
      } catch (e) {
        console.warn('Could not fetch single lead details:', e);
      }

      if (!lead) {
        content.innerHTML = '<div style="text-align:center;padding:24px;color:var(--danger);">' + (currentLang === 'ar' ? 'تعذر العثور على بيانات هذا العميل' : 'Deal not found') + '</div>';
        return;
      }

      const initials = (lead.name || 'LD').slice(0, 2).toUpperCase();

      content.innerHTML = \`
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;border-bottom:1px solid var(--border-subtle);padding-bottom:16px;">
          <div>
            <div style="font-size:18px;font-weight:850;color:#fff;">\${lead.name}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">\${lead.project_name || 'Project'} · \${getSourceLabel(lead.source_type)}</div>
          </div>
          <span class="badge badge-\${lead.pipeline_stage}">\${getStageLabel(lead.pipeline_stage)}</span>
        </div>

        <!-- Quick Outreach & Conversion Actions -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
          <a href="https://wa.me/\${(lead.phone || '').replace(/\\D/g, '')}" target="_blank" class="btn btn-sm btn-secondary">
            \${dict.actionWhatsApp}
          </a>
          <a href="tel:\${lead.phone || ''}" class="btn btn-sm btn-secondary">
            \${dict.actionCall}
          </a>
          <button type="button" class="btn btn-sm btn-primary" onclick="convertLeadToClient('\${lead.id}')">
            \${dict.actionConvert}
          </button>
        </div>

        <!-- ── AI SALES STUDIO & STRATEGY GENERATOR ── -->
        <div class="ai-studio-container">
          <div class="ai-studio-header">
            <div>
              <div class="ai-studio-title">\${dict.aiStudioTitle}</div>
              <div style="font-size:11px;color:var(--text-muted);">\${dict.aiStudioSub}</div>
            </div>
            <span id="aiStatusPill" style="font-size:11px;color:#c4b5fd;font-weight:700;">Ready</span>
          </div>

          <textarea id="aiCustomPromptInput" rows="2" placeholder="\${dict.aiPromptPlaceholder}"></textarea>

          <div class="ai-quick-chips">
            <span class="ai-chip" onclick="setAiPromptPreset('\${lead.id}', 'collage')">\${dict.chipCollage}</span>
            <span class="ai-chip" onclick="setAiPromptPreset('\${lead.id}', 'proposal')">\${dict.chipProposal}</span>
            <span class="ai-chip" onclick="setAiPromptPreset('\${lead.id}', 'objection')">\${dict.chipObjection}</span>
            <span class="ai-chip" onclick="setAiPromptPreset('\${lead.id}', 'competitor')">\${dict.chipCompetitor}</span>
          </div>

          <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">
            <button type="button" class="btn btn-sm btn-primary" onclick="runAiStudio('\${lead.id}')">
              \${dict.btnGenerateAi}
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openCollagePdfDeck('\${lead.id}')" style="border-color:rgba(139,92,246,0.4);color:#c4b5fd;">
              \${dict.btnExportCollage}
            </button>
          </div>

          <!-- AI Output Area -->
          <div id="aiStudioResult" style="display:none;margin-top:14px;background:#0d0e14;border:1px solid rgba(139,92,246,0.25);border-radius:8px;padding:14px;font-size:12.5px;line-height:1.65;color:#f1f5f9;white-space:pre-wrap;max-height:260px;overflow-y:auto;"></div>
        </div>

        <!-- Deal Metadata -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;font-size:12px;background:var(--bg-surface);padding:14px;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
          <div><span style="color:var(--text-dim);">\${dict.thPhone}: </span><strong dir="ltr">\${lead.phone || '—'}</strong></div>
          <div><span style="color:var(--text-dim);">\${dict.thSource}: </span><strong>\${getSourceLabel(lead.source_type)}</strong></div>
          <div><span style="color:var(--text-dim);">\${dict.lblService}: </span><strong>\${lead.service_interested || '—'}</strong></div>
          <div><span style="color:var(--text-dim);">\${dict.lblBudget}: </span><strong>\${lead.budget_tier || '—'}</strong></div>
          <div><span style="color:var(--text-dim);">\${dict.thOwner}: </span><strong>\${lead.assigned_sales_name || '—'}</strong></div>
          <div><span style="color:var(--text-dim);">\${dict.thDueDate}: </span><strong>\${lead.next_followup_due || '—'}</strong></div>
        </div>

        <!-- Timeline of Follow-up Notes -->
        <div>
          <div style="font-size:13px;font-weight:750;color:#fff;margin-bottom:10px;">\${dict.followupsTitle}</div>
          \${followups.length ? followups.map(f => \`
            <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:6px;padding:10px 14px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:4px;">
                <span>\${f.created_at || ''}</span>
                <span class="badge" style="background:rgba(255,255,255,0.05);">\${f.outcome || 'Note'}</span>
              </div>
              <div style="font-size:12px;color:#e2e8f0;line-height:1.6;">\${f.notes || ''}</div>
            </div>
          \`).join('') : '<div style="font-size:12px;color:var(--text-dim);text-align:center;padding:14px;">' + dict.noFollowups + '</div>'}
        </div>
      \`;
    }

    // ── AI STUDIO ACTIONS ──────────────────────────────────────────────
    function setAiPromptPreset(leadId, preset) {
      const input = document.getElementById('aiCustomPromptInput');
      if (!input) return;
      if (preset === 'collage') {
        input.value = currentLang === 'ar' 
          ? 'قم بإنشاء خطة استراتيجية كولاج مخصصة لعرضها على العميل لعام 2026 تشمل دراسة فجوة المنافسين وزوايا المحتوى الإبداعي وعرض أسعار الباقات.' 
          : 'Create a tailored 2026 collage strategy deck including competitor gap analysis, editorial content pillars, and commercial retainer proposal.';
      } else if (preset === 'proposal') {
        input.value = currentLang === 'ar'
          ? 'اكتب عرض سعر مالي متكامل بباقات شهرية واضحة تشمل التصوير وإدارة الإعلانات وطرق التحصيل عبر انستاباي والعائد المتوقع.'
          : 'Draft a full commercial proposal with monthly retainer tiers, production scope, ads management, and expected ROI.';
      } else if (preset === 'objection') {
        input.value = currentLang === 'ar'
          ? 'اكتب 3 سيناريوهات حاسمة للرد على اعتراض (السعر غالي / بنجرب بنفسنا الأول / عايزين نضمن النتيجة).'
          : 'Provide 3 high-impact objection handling scripts addressing pricing concerns and proof of results.';
      } else if (preset === 'competitor') {
        input.value = currentLang === 'ar'
          ? 'حلل المنافسين المباشرين للعميل واستخرج الفجوات التي تمنحنا الفوز بالتعاقد وتفوق العميل في مجاله.'
          : 'Perform a competitive teardown identifying market gaps and our agency winning differentiation.';
      }
    }

    async function runAiStudio(leadId) {
      const input = document.getElementById('aiCustomPromptInput');
      const box = document.getElementById('aiStudioResult');
      const statusPill = document.getElementById('aiStatusPill');
      const prompt = input ? input.value.trim() : '';

      if (statusPill) statusPill.textContent = currentLang === 'ar' ? 'جاري التوليد...' : 'Generating...';
      if (box) {
        box.style.display = 'block';
        box.textContent = currentLang === 'ar' ? 'جاري الاتصال بمحرك الذكاء الاصطناعي والأرينا...' : 'Calling AI Engine & Arena Router...';
      }

      const lead = allLeads.find(l => String(l.id) === String(leadId));

      try {
        const res = await fetch('/api/admin/sales/ai-skill', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            skill: 'custom',
            prompt: prompt || 'خطة استراتيجية كولاج متكاملة',
            lead_id: leadId,
            lead_name: lead?.name,
            company: lead?.project_name,
            project_name: lead?.project_name,
            stage: lead?.pipeline_stage
          })
        });

        const d = await res.json();
        if (d.success && d.result) {
          if (box) box.textContent = d.result;
          if (statusPill) statusPill.textContent = 'Completed';
        } else {
          if (box) box.textContent = 'Error: ' + (d.error || 'Failed to generate content');
          if (statusPill) statusPill.textContent = 'Failed';
        }
      } catch (err) {
        if (box) box.textContent = 'Connection error: ' + err.message;
        if (statusPill) statusPill.textContent = 'Error';
      }
    }

    function openCollagePdfDeck(leadId) {
      window.open('/collage-deck.html?leadId=' + encodeURIComponent(leadId), '_blank');
    }

    // ── CREATE NEW DEAL ────────────────────────────────────────────────
    async function submitNewLead(e) {
      if (e) e.preventDefault();
      const name = document.getElementById('al-name').value.trim();
      const project_name = document.getElementById('al-project').value.trim();
      const phone = document.getElementById('al-phone').value.trim();
      const email = document.getElementById('al-email').value.trim();
      const source_type = document.getElementById('al-source').value;
      const service_interested = document.getElementById('al-service').value;
      const budget_tier = document.getElementById('al-budget').value;
      const next_followup_due = document.getElementById('al-due').value;
      const challenge_notes = document.getElementById('al-notes').value.trim();

      try {
        const res = await fetch('/api/admin/sales/leads', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name,
            project_name,
            phone,
            email,
            source_type,
            service_interested,
            budget_tier,
            next_followup_due,
            challenge_notes
          })
        });

        const d = await res.json();
        if (d.success) {
          closeModal('addLeadModal');
          document.getElementById('addLeadForm').reset();
          await refreshAll();
          alert(currentLang === 'ar' ? 'تم حفظ الصفقة في السحابة بنجاح!' : 'Deal saved to cloud successfully!');
        } else {
          alert('Error: ' + d.error);
        }
      } catch (err) {
        alert('Could not save deal: ' + err.message);
      }
    }

    // ── CONVERT TO CLIENT ──────────────────────────────────────────────
    async function convertLeadToClient(leadId) {
      const lead = allLeads.find(l => String(l.id) === String(leadId));
      if (!lead) return;

      const defaultEmail = lead.email || (lead.name.toLowerCase().replace(/\\s+/g, '_') + '@client.com');
      const tempPassword = 'pr_' + Math.random().toString(36).substring(2, 8);

      const msg = currentLang === 'ar'
        ? \`هل تريد تحويل العميل (\${lead.name}) إلى عميل رسمي في البوابة؟\\n\\nالبريد: \${defaultEmail}\\nكلمة المرور: \${tempPassword}\`
        : \`Convert lead (\${lead.name}) into official client?\\n\\nEmail: \${defaultEmail}\\nPassword: \${tempPassword}\`;

      if (!confirm(msg)) return;

      try {
        const res = await fetch('/api/admin/portal-clients', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'create',
            company_name: lead.project_name || lead.name,
            contact_name: lead.name,
            email: defaultEmail,
            phone: lead.phone,
            password: tempPassword
          })
        });

        const d = await res.json();
        if (d.success) {
          await fetch('/api/admin/sales/leads', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: lead.id, pipeline_stage: 'won' })
          });
          closeModal('leadDetailModal');
          await refreshAll();
          alert(currentLang === 'ar' ? 'تم تحويل العميل بنجاح وتحديث المرحلة إلى Won!' : 'Client converted successfully and deal stage marked as Won!');
        } else {
          alert('Error: ' + (d.error || 'Conversion failed'));
        }
      } catch (err) {
        alert('Connection error: ' + err.message);
      }
    }

    // ── FOLLOW-UP ACTIVITY SUBMIT ──────────────────────────────────────
    function populateLeadSelect() {
      const sel = document.getElementById('voiceLeadSelect');
      if (!sel) return;
      sel.innerHTML = '<option value="">-- ' + (currentLang === 'ar' ? 'اختر العميل للمتابعة' : 'Select Deal') + ' --</option>' +
        allLeads.map(l => \`<option value="\${l.id}">\${l.name} (\${l.project_name || 'Project'})\` + \`</option>\`).join('');
    }

    async function submitFollowupNote(e) {
      if (e) e.preventDefault();
      const lead_id = document.getElementById('voiceLeadSelect').value;
      const outcome = document.getElementById('voiceOutcome').value;
      const new_stage = document.getElementById('voiceNewStage').value;
      const next_followup_due = document.getElementById('voiceNextDate').value;
      const notes = document.getElementById('voiceNotes').value.trim();

      if (!lead_id) {
        alert(currentLang === 'ar' ? 'يرجى اختيار العميل' : 'Please select a deal');
        return;
      }

      try {
        const res = await fetch('/api/admin/sales/followup', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            lead_id,
            outcome,
            new_stage: new_stage || undefined,
            next_followup_due: next_followup_due || undefined,
            notes
          })
        });

        const d = await res.json();
        if (d.success) {
          alert(currentLang === 'ar' ? 'تم حفظ المتابعة بنجاح في السحابة!' : 'Follow-up recorded successfully in cloud!');
          document.getElementById('voiceNotes').value = '';
          await refreshAll();
        } else {
          alert('Error: ' + d.error);
        }
      } catch (err) {
        alert('Could not record follow-up: ' + err.message);
      }
    }

    function loadOverdue() {
      const today = new Date().toISOString().split('T')[0];
      const overdue = allLeads.filter(l =>
        l.next_followup_due && l.next_followup_due < today &&
        !['won', 'lost'].includes(l.pipeline_stage)
      );
      const tb = document.getElementById('overdueBody');
      const dict = I18N[currentLang] || I18N.ar;

      if (!overdue.length) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">' + dict.noOverdueMsg + '</td></tr>';
      } else {
        tb.innerHTML = overdue.map(l => \`
          <tr>
            <td><strong>\${l.name}</strong></td>
            <td dir="ltr" style="text-align:start;">\${l.phone || '—'}</td>
            <td>\${l.assigned_sales_name || '—'}</td>
            <td style="color:var(--danger);font-weight:700;">\${l.next_followup_due}</td>
            <td><span class="badge badge-\${l.pipeline_stage}">\${getStageLabel(l.pipeline_stage)}</span></td>
            <td>
              <button type="button" class="btn btn-sm btn-primary" onclick="openLeadDetail('\${l.id}')">
                \${dict.actionDetails}
              </button>
            </td>
          </tr>
        \`).join('');
      }
    }

    function loadReports() {
      const total = allLeads.length;
      const won = allLeads.filter(l => l.pipeline_stage === 'won').length;
      const lost = allLeads.filter(l => l.pipeline_stage === 'lost').length;
      const rate = total > 0 ? Math.round((won / total) * 100) : 0;

      const sources = {};
      allLeads.forEach(l => {
        if (!sources[l.source_type]) sources[l.source_type] = { total: 0, won: 0 };
        sources[l.source_type].total++;
        if (l.pipeline_stage === 'won') sources[l.source_type].won++;
      });

      const body = document.getElementById('reportBody');
      body.innerHTML = \`
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:24px;">
          <div class="stat-card">
            <div class="stat-number">\${total}</div>
            <div class="stat-label">Total Deals Logged</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color:var(--success);">\${won}</div>
            <div class="stat-label">Closed Won Deals</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" style="color:var(--info);">\${rate}%</div>
            <div class="stat-label">Win Rate Percentage</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Channel / Source</th>
              <th>Total Deals</th>
              <th>Won Contracts</th>
              <th>Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            \${Object.entries(sources).map(([src, d]) => \`
              <tr>
                <td><strong>\${getSourceLabel(src)}</strong></td>
                <td>\${d.total}</td>
                <td style="color:var(--success);font-weight:750;">\${d.won}</td>
                <td><strong style="color:var(--accent);">\${Math.round((d.won / d.total) * 100)}%</strong></td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
    }

    function handleSearch(q) {
      if (!q) {
        renderLeadsTable(allLeads);
        return;
      }
      const lower = q.toLowerCase();
      const filtered = allLeads.filter(l =>
        (l.name && l.name.toLowerCase().includes(lower)) ||
        (l.project_name && l.project_name.toLowerCase().includes(lower)) ||
        (l.phone && l.phone.includes(lower))
      );
      renderLeadsTable(filtered);
    }

    // Keyboard shortcut for search
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('globalSearchInput');
        if (input) { input.focus(); input.select(); }
      }
    });

    // ── INITIALIZATION ─────────────────────────────────────────────────
    window.onload = async () => {
      setLanguage(currentLang);
      await refreshAll();
    };
  </script>
</body>
</html>`;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully written new sales-crm-2026.html! New length:', newContent.length);
