function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Basic ')) return false;
  try {
    const base64 = authHeader.slice(6).trim();
    const decoded = atob(base64);
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return false;
    return decoded.slice(colonIdx + 1) === PASS;
  } catch (e) {
    return false;
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return new Response('Unauthorized Access to PR Agency Admin', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PR Agency — لوحة إدارة الرسائل</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg: #0A0014;
      --card-bg: #14001F;
      --card-border: rgba(139, 92, 246, 0.15);
      --card-hover: rgba(139, 92, 246, 0.05);
      --red: #8B5CF6;
      --red-glow: rgba(139, 92, 246, 0.35);
      --red-hover: #A855F7;
      --text: #ffffff;
      --text-muted: rgba(255, 255, 255, 0.65);
      --text-sub: rgba(255, 255, 255, 0.4);
      --green: #10b981;
      --amber: #f59e0b;
      --gray: #6b7280;
      --font: 'Cairo', system-ui, -apple-system, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.5;
      min-height: 100vh;
      background-image: radial-gradient(ellipse at 50% -10%, rgba(192, 0, 0, 0.18), transparent 60%);
      padding: 24px;
    }

    .container {
      max-width: 1440px;
      margin: 0 auto;
    }

    /* Topbar */
    .topbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 28px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand img {
      width: 46px;
      height: 46px;
      object-fit: contain;
      filter: drop-shadow(0 0 10px rgba(192,0,0,0.5));
    }

    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.01em;
      color: #fff;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 99px;
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-top: 2px;
    }

    .brand-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: var(--font);
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      text-decoration: none;
      white-space: nowrap;
    }

    .btn-primary {
      background: var(--red);
      color: #fff;
      box-shadow: 0 4px 14px var(--red-glow);
    }
    .btn-primary:hover {
      background: var(--red-hover);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      border: 1px solid var(--card-border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .btn-sound {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: #e5e5e5;
    }
    .btn-sound.muted {
      color: #9ca3af;
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.08);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease;
    }
    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      height: 2px;
      background: var(--card-border);
    }

    .stat-card.today::before { background: var(--green); }
    .stat-card.week::before  { background: var(--amber); }
    .stat-card.month::before { background: var(--red); }
    .stat-card.total::before { background: #fff; }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 900;
      color: #fff;
      line-height: 1.1;
    }

    .stat-desc {
      font-size: 12px;
      color: var(--text-sub);
    }

    /* Status breakdown pills bar */
    .status-summary-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--card-border);
      border-radius: 10px;
    }

    .summary-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
      user-select: none;
    }
    .summary-pill:hover {
      transform: translateY(-1px);
    }
    .summary-pill.pill-new {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .summary-pill.pill-contacted {
      background: rgba(245, 158, 11, 0.12);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.3);
    }
    .summary-pill.pill-closed {
      background: rgba(156, 163, 175, 0.12);
      color: #d1d5db;
      border-color: rgba(156, 163, 175, 0.3);
    }
    .summary-pill.pill-starred {
      background: rgba(234, 179, 8, 0.15);
      color: #fde047;
      border-color: rgba(234, 179, 8, 0.4);
    }
    .summary-pill-count {
      font-size: 14px;
      font-weight: 900;
    }

    /* Filter Bar */
    .filter-bar {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .search-box {
      flex: 2;
      min-width: 260px;
      position: relative;
    }

    .search-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 14px 10px 38px;
      color: #fff;
      font-family: var(--font);
      font-size: 13.5px;
      outline: none;
      transition: all 0.2s;
    }

    .search-input:focus {
      border-color: var(--red);
      background: rgba(255, 255, 255, 0.07);
      box-shadow: 0 0 0 3px rgba(192, 0, 0, 0.2);
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .filter-select {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-family: var(--font);
      font-size: 13.5px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-select:focus {
      border-color: var(--red);
    }
    .filter-select option {
      background: #111;
      color: #fff;
    }

    .star-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      background: rgba(255, 255, 255, 0.05);
      color: #e5e5e5;
      font-family: var(--font);
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .star-toggle-btn.active {
      background: rgba(234, 179, 8, 0.2);
      color: #fde047;
      border-color: rgba(234, 179, 8, 0.5);
      box-shadow: 0 0 10px rgba(234, 179, 8, 0.2);
    }

    .filter-reset-btn {
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-muted);
      font-family: var(--font);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-reset-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .counter-tag {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 600;
      margin-right: auto;
      white-space: nowrap;
    }

    /* Table Wrap */
    .table-wrap {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
      font-size: 13.5px;
      min-width: 1100px;
    }

    thead th {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-muted);
      font-weight: 700;
      padding: 14px 14px;
      border-bottom: 1px solid var(--card-border);
      white-space: nowrap;
    }

    tbody td {
      padding: 14px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      vertical-align: middle;
      color: #e5e5e5;
    }

    tbody tr:hover {
      background: var(--card-hover);
    }

    .cell-star {
      width: 36px;
      text-align: center;
      cursor: pointer;
      font-size: 18px;
      user-select: none;
      transition: transform 0.15s ease;
    }
    .cell-star:hover {
      transform: scale(1.25);
    }
    .cell-star.starred {
      color: #facc15;
      text-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
    }
    .cell-star.unstarred {
      color: rgba(255, 255, 255, 0.2);
    }
    .cell-star.unstarred:hover {
      color: rgba(255, 255, 255, 0.6);
    }

    .cell-id {
      font-family: monospace;
      font-size: 12px;
      color: var(--text-sub);
      width: 40px;
    }

    .cell-date {
      white-space: nowrap;
    }

    .badge-time {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      margin-left: 5px;
    }
    .badge-today { background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); }
    .badge-week  { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); }
    .badge-old   { background: rgba(107, 114, 128, 0.18); color: #9ca3af; border: 1px solid rgba(107, 114, 128, 0.35); }

    .badge-source-meta { background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35); }
    .badge-source-web  { background: rgba(16, 185, 129, 0.14); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }

    .cell-name-box {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cell-name {
      font-weight: 700;
      color: #fff;
    }
    .note-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      background: rgba(234, 179, 8, 0.18);
      color: #fbbf24;
      font-size: 12px;
      cursor: pointer;
      border: 1px solid rgba(234, 179, 8, 0.35);
      transition: all 0.2s;
    }
    .note-indicator:hover {
      transform: scale(1.15);
      background: rgba(234, 179, 8, 0.3);
    }

    .cell-phone {
      font-family: monospace;
      direction: ltr;
      text-align: right;
      color: #93c5fd;
      font-weight: 600;
    }

    /* Status Badge Dropdown */
    .status-badge-wrap {
      position: relative;
      display: inline-block;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
      user-select: none;
    }
    .status-badge:hover {
      transform: translateY(-1px);
    }

    .status-badge.status-new {
      background: rgba(16, 185, 129, 0.16);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.4);
    }
    .status-badge.status-contacted {
      background: rgba(245, 158, 11, 0.16);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.4);
    }
    .status-badge.status-closed {
      background: rgba(156, 163, 175, 0.16);
      color: #d1d5db;
      border-color: rgba(156, 163, 175, 0.4);
    }

    .status-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      background: #111113;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 6px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.85);
      z-index: 100;
      display: none;
      flex-direction: column;
      gap: 4px;
      min-width: 140px;
    }
    .status-dropdown.open {
      display: flex;
    }

    .status-opt {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      background: transparent;
      border: none;
      color: #e5e5e5;
      cursor: pointer;
      text-align: right;
      font-family: var(--font);
      transition: background 0.15s;
    }
    .status-opt:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .cell-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.06);
      color: #f3f4f6;
    }

    .cell-message {
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-muted);
    }
    .cell-message:hover {
      white-space: normal;
      word-break: break-word;
    }

    /* Actions cell */
    .actions-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .act-btn {
      height: 32px;
      padding: 0 10px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
      font-family: var(--font);
      font-size: 12.5px;
      font-weight: 700;
    }

    .act-btn-icon {
      width: 32px;
      padding: 0;
    }

    .act-wa-btn {
      background: rgba(37, 211, 102, 0.15);
      color: #25d366;
      position: relative;
    }
    .act-wa-btn:hover {
      background: #25d366;
      color: #000;
    }

    /* WhatsApp Templates Dropdown */
    .wa-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      background: #111114;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.9);
      z-index: 120;
      display: none;
      flex-direction: column;
      gap: 6px;
      width: 320px;
      text-align: right;
    }
    .wa-dropdown.open {
      display: flex;
    }

    .wa-dropdown-header {
      font-size: 11px;
      font-weight: 800;
      color: var(--text-sub);
      padding: 2px 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 4px;
    }

    .wa-template-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      text-align: right;
      font-family: var(--font);
    }
    .wa-template-item:hover {
      background: rgba(37, 211, 102, 0.12);
      border-color: rgba(37, 211, 102, 0.3);
    }
    .wa-template-title {
      font-size: 12px;
      font-weight: 800;
      color: #25d366;
    }
    .wa-template-preview {
      font-size: 11.5px;
      color: var(--text-muted);
      line-height: 1.4;
      white-space: normal;
    }

    .act-note {
      background: rgba(234, 179, 8, 0.15);
      color: #fbbf24;
    }
    .act-note:hover {
      background: #fbbf24;
      color: #000;
    }

    .act-copy {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    .act-copy:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .act-del {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    .act-del:hover {
      background: #ef4444;
      color: #fff;
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s;
    }
    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-card {
      background: #0d0d10;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      max-width: 460px;
      width: 90%;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.95);
      text-align: right;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 8px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .modal-desc {
      font-size: 13.5px;
      color: var(--text-muted);
      margin-bottom: 18px;
      line-height: 1.5;
    }

    .modal-textarea {
      width: 100%;
      min-height: 140px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 12px;
      color: #fff;
      font-family: var(--font);
      font-size: 14px;
      line-height: 1.5;
      outline: none;
      resize: vertical;
      margin-bottom: 20px;
      transition: border-color 0.2s;
    }
    .modal-textarea:focus {
      border-color: var(--red);
      box-shadow: 0 0 0 3px rgba(192, 0, 0, 0.2);
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #18181b;
      color: #fff;
      border: 1px solid var(--card-border);
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.85);
      font-size: 14px;
      font-weight: 700;
      transition: all 0.3s ease;
      z-index: 99999;
      opacity: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: var(--text-muted);
      font-size: 15px;
    }


    /* ═══ CMS TABS ═══ */
    .cms-tabs-nav {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      overflow-x: auto;
      padding-bottom: 0;
    }
    .cms-tab-btn {
      padding: 10px 18px;
      border-radius: 8px 8px 0 0;
      border: 1px solid transparent;
      border-bottom: none;
      background: transparent;
      color: var(--text-muted);
      font-family: var(--font);
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
      margin-bottom: -1px;
    }
    .cms-tab-btn:hover {
      background: rgba(139,92,246,0.08);
      color: #fff;
    }
    .cms-tab-btn.active {
      background: var(--card-bg);
      color: var(--red);
      border-color: var(--card-border);
      border-bottom-color: var(--card-bg);
    }

    .cms-tab-panel { display: none; }
    .cms-tab-panel.active { display: block; }

    /* CMS Form Styles */
    .cms-section-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 16px;
    }
    .cms-section-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--card-border);
    }
    .cms-field {
      margin-bottom: 14px;
    }
    .cms-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .cms-input, .cms-textarea {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 12px;
      color: #fff;
      font-family: var(--font);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .cms-input:focus, .cms-textarea:focus {
      border-color: var(--red);
    }
    .cms-textarea { min-height: 80px; resize: vertical; }

    .cms-save-btn {
      background: var(--red);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 22px;
      font-family: var(--font);
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px var(--red-glow);
    }
    .cms-save-btn:hover { background: var(--red-hover); transform: translateY(-1px); }

    /* CMS Table */
    .cms-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .cms-table thead th {
      background: rgba(255,255,255,0.03);
      color: var(--text-muted);
      font-weight: 700;
      padding: 12px 14px;
      border-bottom: 1px solid var(--card-border);
      text-align: right;
    }
    .cms-table tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      vertical-align: middle;
      color: #e5e5e5;
    }
    .cms-table tbody tr:hover { background: var(--card-hover); }

    /* Color preview */
    .color-preview {
      width: 32px; height: 32px;
      border-radius: 6px;
      border: 1px solid var(--card-border);
      display: inline-block;
      vertical-align: middle;
      margin-left: 8px;
    }

    /* Layout drag handles */
    .layout-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      margin-bottom: 8px;
      transition: background 0.2s;
    }
    .layout-row:hover { background: var(--card-hover); }
    .layout-row-label { flex: 1; font-weight: 700; color: #fff; }
    .layout-vis-toggle {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 6px 12px;
      color: #e5e5e5;
      font-family: var(--font);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .layout-vis-toggle.visible { background: rgba(139,92,246,0.15); color: var(--red); border-color: rgba(139,92,246,0.4); }

    /* Modal input */
    .modal-input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 12px;
      color: #fff;
      font-family: var(--font);
      font-size: 14px;
      outline: none;
      margin-bottom: 12px;
      transition: border-color 0.2s;
    }
    .modal-input:focus { border-color: var(--red); }
    .modal-field-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 5px;
    }

    /* ═══ Admin v2 Enhancements ═══ */
    .bulk-bar {
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 18px;
      background: rgba(139, 92, 246, 0.12);
      border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: 8px;
      margin-bottom: 14px;
    }
    .bulk-bar.active { display: flex; }
    .bulk-bar-info { font-weight: 700; color: #e9d5ff; font-size: 13.5px; }
    .bulk-bar-actions { display: flex; align-items: center; gap: 8px; }

    .chart-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 22px;
      margin-bottom: 20px;
    }
    .chart-title {
      font-size: 15px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 180px;
      padding-top: 20px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 10px;
    }
    .chart-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
    }
    .chart-bar-fill {
      width: 100%;
      max-width: 44px;
      background: linear-gradient(180deg, var(--red-hover), var(--red));
      border-radius: 6px 6px 0 0;
      min-height: 4px;
      transition: height 0.4s ease;
      position: relative;
    }
    .chart-bar-fill:hover {
      background: linear-gradient(180deg, #c084fc, #9333ea);
    }
    .chart-bar-val {
      position: absolute;
      top: -22px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      font-weight: 800;
      color: #fff;
    }
    .chart-col-label {
      margin-top: 8px;
      font-size: 11px;
      color: var(--text-muted);
      text-align: center;
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .analytics-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
    }
    .analytics-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 13.5px;
    }
    .analytics-item:last-child { border-bottom: none; }
    .analytics-name { font-weight: 600; color: #fff; }
    .analytics-count {
      font-weight: 800;
      color: #a855f7;
      background: rgba(168, 85, 247, 0.15);
      padding: 2px 10px;
      border-radius: 99px;
    }

    .settings-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
    }
    .settings-table td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .settings-table tr td:first-child {
      color: var(--text-muted);
      font-weight: 700;
      width: 200px;
    }
    .settings-table tr td:last-child {
      color: #fff;
      font-family: monospace;
    }

    @media (max-width: 860px) {
      body { padding: 14px; }
      .brand-title { font-size: 18px; }
      .stat-value { font-size: 26px; }
      .filter-bar { flex-direction: column; align-items: stretch; }
      .search-box { min-width: 100%; }
      .filter-select, .star-toggle-btn, .filter-reset-btn { width: 100%; }
      .wa-dropdown { width: 280px; left: auto; right: 0; }
    }
  </style>
</head>
<body>


<div class="container">
  <!-- Topbar -->
  <header class="topbar">
    <div class="brand">
      <img src="/assets/logos/pr-agency.webp" alt="PR Agency" onerror="this.src='/favicon.ico'"/>
      <div>
        <h1 class="brand-title">PR Agency — لوحة إدارة الرسائل</h1>
        <div class="brand-badge">
          <span class="brand-badge-dot"></span>
          <span>قاعدة البيانات D1 متصلة ومحمية</span>
        </div>
      </div>
    </div>
    <div class="topbar-actions">
      <button class="btn btn-sound" id="soundToggleBtn" onclick="toggleSound()" title="كتم/تفعيل صوت التنبيه">
        <span id="soundIcon">🔔</span> <span id="soundText">التنبيهات مفعّلة</span>
      </button>
      <button class="btn btn-secondary" onclick="loadAll()" title="تحديث البيانات">
        <span>🔄</span> تحديث
      </button>
      <button class="btn btn-primary" onclick="exportCSV()" title="تصدير ملف Excel">
        <span>📥</span> تصدير CSV
      </button>
    </div>
  </header>

  <!-- ═══ CMS Tab Navigation ═══ -->
  <nav class="cms-tabs-nav">
    <button class="cms-tab-btn active" onclick="switchTab('dashboard')">📊 لوحة المؤشرات</button>
    <button class="cms-tab-btn" onclick="switchTab('messages')">📨 الرسائل</button>
    <button class="cms-tab-btn" onclick="switchTab('analytics')">📈 التحليلات</button>
    <button class="cms-tab-btn" onclick="switchTab('settings')">⚙️ الإعدادات</button>
    <button class="cms-tab-btn" onclick="switchTab('content')">📝 المحتوى</button>
    <button class="cms-tab-btn" onclick="switchTab('clients')">👥 العملاء</button>
    <button class="cms-tab-btn" onclick="switchTab('team')">👤 الفريق</button>
    <button class="cms-tab-btn" onclick="switchTab('theme')">🎨 الثيم</button>
    <button class="cms-tab-btn" onclick="switchTab('layout')">📐 الترتيب</button>
  </nav>

  <!-- ═══════════════════════════════════ -->
  <!-- TAB: DASHBOARD                      -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel active" id="panel-dashboard">
    <section class="stats-grid">
      <div class="stat-card today">
        <div class="stat-header">
          <span>رسائل اليوم</span>
          <span>🟢</span>
        </div>
        <div class="stat-value" id="dashStatToday">0</div>
        <div class="stat-desc">خلال آخر 24 ساعة</div>
      </div>
      <div class="stat-card week">
        <div class="stat-header">
          <span>رسائل الأسبوع</span>
          <span>🟡</span>
        </div>
        <div class="stat-value" id="dashStatWeek">0</div>
        <div class="stat-desc">آخر 7 أيام</div>
      </div>
      <div class="stat-card month">
        <div class="stat-header">
          <span>رسائل هذا الشهر</span>
          <span>🔴</span>
        </div>
        <div class="stat-value" id="dashStatMonth">0</div>
        <div class="stat-desc">خلال الشهر الحالي</div>
      </div>
      <div class="stat-card total">
        <div class="stat-header">
          <span>إجمالي الرسائل</span>
          <span>⚪</span>
        </div>
        <div class="stat-value" id="dashStatTotal">0</div>
        <div class="stat-desc">إجمالي الوارد في D1</div>
      </div>
    </section>

    <!-- Chart: Last 7 Days -->
    <div class="chart-container">
      <div class="chart-title">
        <span>📊</span> حجم الرسائل اليومي (آخر 7 أيام)
      </div>
      <div class="chart-bars" id="dashboardBars">
        <div style="width:100%;text-align:center;color:var(--text-muted);padding-top:60px">جارٍ تحميل الرسم البياني...</div>
      </div>
    </div>
  </div><!-- end #panel-dashboard -->

  <!-- ═══════════════════════════════════ -->
  <!-- TAB: MESSAGES                       -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel" id="panel-messages">

  <!-- Stats Grid -->
  <section class="stats-grid">
    <div class="stat-card today">
      <div class="stat-header">
        <span>رسائل اليوم</span>
        <span>🟢</span>
      </div>
      <div class="stat-value" id="statToday">0</div>
      <div class="stat-desc">خلال آخر 24 ساعة</div>
    </div>
    <div class="stat-card week">
      <div class="stat-header">
        <span>رسائل هذا الأسبوع</span>
        <span>🟡</span>
      </div>
      <div class="stat-value" id="statWeek">0</div>
      <div class="stat-desc">آخر 7 أيام</div>
    </div>
    <div class="stat-card month">
      <div class="stat-header">
        <span>رسائل هذا الشهر</span>
        <span>🔴</span>
      </div>
      <div class="stat-value" id="statMonth">0</div>
      <div class="stat-desc">خلال الشهر الحالي</div>
    </div>
    <div class="stat-card total">
      <div class="stat-header">
        <span>إجمالي الرسائل</span>
        <span>⚪</span>
      </div>
      <div class="stat-value" id="statTotal">0</div>
      <div class="stat-desc">إجمالي الوارد في D1</div>
    </div>
  </section>

  <!-- Status Summary Pills -->
  <div class="status-summary-bar">
    <span style="font-size:13px;font-weight:800;color:var(--text-sub);margin-left:6px">توزيع الحالات:</span>
    <div class="summary-pill pill-new" onclick="quickFilterStatus('new')" title="تصفية حسب: جديد">
      <span>🟢 جديد:</span>
      <span class="summary-pill-count" id="countStatusNew">0</span>
    </div>
    <div class="summary-pill pill-contacted" onclick="quickFilterStatus('contacted')" title="تصفية حسب: تم التواصل">
      <span>🟡 تم التواصل:</span>
      <span class="summary-pill-count" id="countStatusContacted">0</span>
    </div>
    <div class="summary-pill pill-closed" onclick="quickFilterStatus('closed')" title="تصفية حسب: مغلق">
      <span>⚪ مغلق:</span>
      <span class="summary-pill-count" id="countStatusClosed">0</span>
    </div>
    <div class="summary-pill pill-starred" onclick="quickFilterStarred()" title="عرض الرسائل المميزة بنجمة فقط">
      <span>⭐ مميزة بنجمة:</span>
      <span class="summary-pill-count" id="countStatusStarred">0</span>
    </div>
    <div class="summary-pill" style="background:rgba(59,130,246,0.12);color:#60a5fa;border-color:rgba(59,130,246,0.3)" onclick="quickFilterSource('meta_lead_ads')" title="تصفية حسب: Meta Lead Ads">
      <span>📱 Meta Ads:</span>
      <span class="summary-pill-count" id="countSourceMeta">0</span>
    </div>
    <div class="summary-pill" style="background:rgba(16,185,129,0.12);color:#34d399;border-color:rgba(16,185,129,0.3)" onclick="quickFilterSource('website')" title="تصفية حسب: الموقع">
      <span>🌐 الموقع:</span>
      <span class="summary-pill-count" id="countSourceWebsite">0</span>
    </div>
  </div>

  <!-- Filter Bar -->
  <div class="filter-bar">
    <div class="search-box">
      <input type="text" id="searchInput" class="search-input" placeholder="ابحث بالاسم، رقم الموبايل، نوع النشاط، أو الملاحظات..." oninput="handleSearch()"/>
      <span class="search-icon">🔍</span>
    </div>

    <!-- Status Dropdown -->
    <select id="statusFilter" class="filter-select" onchange="applyFilters()">
      <option value="">كل الحالات</option>
      <option value="new">🟢 جديد</option>
      <option value="contacted">🟡 تم التواصل</option>
      <option value="closed">⚪ مغلق</option>
    </select>

    <!-- Source Dropdown -->
    <select id="sourceFilter" class="filter-select" onchange="applyFilters()">
      <option value="">كل المصادر</option>
      <option value="website">🌐 الموقع</option>
      <option value="meta_lead_ads">📱 Meta Ads</option>
    </select>

    <!-- Campaign Filter Input -->
    <input type="text" id="campaignFilter" class="filter-select" placeholder="تصفية بالحملة..." style="width:130px" oninput="handleSearch()"/>

    <!-- Starred Filter Toggle -->
    <button type="button" id="starredToggleBtn" class="star-toggle-btn" onclick="toggleStarredFilter()">
      <span>⭐</span> المميزة فقط
    </button>

    <!-- Sort Dropdown -->
    <select id="sortFilter" class="filter-select" onchange="applyFilters()">
      <option value="date_desc">⏱️ الأحدث أولاً</option>
      <option value="date_asc">⏳ الأقدم أولاً</option>
      <option value="name">🔤 حسب الاسم</option>
    </select>

    <!-- Clear Filters Button -->
    <button type="button" class="filter-reset-btn" onclick="resetFilters()">
      ✖️ مسح الفلاتر
    </button>

    <div class="counter-tag" id="counterTag">جارٍ تحميل الرسائل...</div>
  </div>

  <!-- Bulk Action Bar -->
  <div class="bulk-bar" id="bulkBar">
    <div class="bulk-bar-info" id="bulkInfo">تم تحديد 0 رسالة</div>
    <div class="bulk-bar-actions">
      <select id="bulkStatusSelect" class="filter-select" style="padding:6px 12px;font-size:12.5px">
        <option value="">تغيير الحالة إلى...</option>
        <option value="new">🟢 جديد</option>
        <option value="contacted">🟡 تم التواصل</option>
        <option value="closed">⚪ مغلق</option>
      </select>
      <button class="btn btn-secondary" onclick="applyBulkStatus()" style="padding:6px 12px;font-size:12.5px">تطبيق</button>
      <button class="btn btn-primary" onclick="applyBulkDelete()" style="padding:6px 12px;font-size:12.5px;background:#ef4444">🗑️ حذف المحدد</button>
      <button class="btn btn-secondary" onclick="deselectAll()" style="padding:6px 12px;font-size:12.5px">إلغاء التحديد</button>
    </div>
  </div>

  <!-- Messages Table -->
  <div class="table-wrap">
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width:36px;text-align:center"><input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll(this)" style="cursor:pointer"/></th>
            <th style="width:36px;text-align:center">⭐</th>
            <th style="width:40px">#</th>
            <th>التاريخ والوقت</th>
            <th>الاسم</th>
            <th>رقم الموبايل</th>
            <th>المصدر</th>
            <th>الحملة</th>
            <th>الحالة</th>
            <th>نوع النشاط</th>
            <th>الميزانية</th>
            <th>نص الرسالة</th>
            <th style="text-align:center">الإجراءات</th>
          </tr>
        </thead>
        <tbody id="tableBody">
          <tr><td colspan="13" class="empty-state">جارٍ الاتصال بقاعدة البيانات...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  </div><!-- end #panel-messages -->

  <!-- ═══════════════════════════════════ -->
  <!-- TAB: ANALYTICS                      -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel" id="panel-analytics">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:800;color:#fff">📈 تحليلات الحملات ومصادر العملاء</h2>
      <button class="btn btn-secondary" onclick="fetchAnalyticsData()">🔄 تحديث التحليلات</button>
    </div>

    <div class="analytics-grid">
      <!-- UTM Campaigns -->
      <div class="analytics-card">
        <div class="cms-section-title">📢 الحملات الإعلانية (UTM Campaign)</div>
        <div id="analyticsCampaigns">
          <p style="color:var(--text-muted);font-size:13px">جارٍ التحميل...</p>
        </div>
      </div>

      <!-- Business Breakdown -->
      <div class="analytics-card">
        <div class="cms-section-title">🏢 مجالات الأنشطة التجارية</div>
        <div id="analyticsBusiness">
          <p style="color:var(--text-muted);font-size:13px">جارٍ التحميل...</p>
        </div>
      </div>

      <!-- Budget Breakdown -->
      <div class="analytics-card">
        <div class="cms-section-title">💰 الميزانيات المقترحة</div>
        <div id="analyticsBudget">
          <p style="color:var(--text-muted);font-size:13px">جارٍ التحميل...</p>
        </div>
      </div>

      <!-- Source Breakdown -->
      <div class="analytics-card">
        <div class="cms-section-title">🌐 مصادر الرسائل (Lead Sources)</div>
        <div id="analyticsSource">
          <p style="color:var(--text-muted);font-size:13px">جارٍ التحميل...</p>
        </div>
      </div>
    </div>
  </div><!-- end #panel-analytics -->

  <!-- ═══════════════════════════════════ -->
  <!-- TAB: SETTINGS                       -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel" id="panel-settings">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:800;color:#fff">⚙️ إعدادات النظام ومعلومات التشغيل</h2>
    </div>

    <div class="cms-section-card">
      <div class="cms-section-title">معلومات البيئة وقاعدة البيانات</div>
      <table class="settings-table">
        <tr>
          <td>نظام الإدارة:</td>
          <td>PR Agency Production Admin v2.0</td>
        </tr>
        <tr>
          <td>قاعدة البيانات:</td>
          <td>Cloudflare D1 (Serverless SQLite) — Contacts Table</td>
        </tr>
        <tr>
          <td>حالة السيرفر:</td>
          <td><span style="color:#10b981;font-weight:700">🟢 Live &amp; Operational</span></td>
        </tr>
        <tr>
          <td>إصدار التخزين المؤقت (Cache):</td>
          <td>CSS: v19 / JS: v17 / Multi-step: v2 / Pages: v47</td>
        </tr>
        <tr>
          <td>رابط الموقع الحي:</td>
          <td><a href="https://pragency.pages.dev" target="_blank" style="color:#a855f7;text-decoration:none">https://pragency.pages.dev</a></td>
        </tr>
        <tr>
          <td>مسارات الصفحات المستقلة:</td>
          <td>/about, /services, /clients</td>
        </tr>
      </table>
    </div>
  </div><!-- end #panel-settings -->

  <!-- ═══════════════════════════════════ -->
  <!-- TAB: CONTENT                        -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel" id="panel-content">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:800;color:#fff">📝 محتوى الموقع</h2>
      <button class="cms-save-btn" onclick="saveAllContent()">💾 حفظ كل التغييرات</button>
    </div>

    <div class="cms-section-card">
      <div class="cms-section-title">Hero — الصفحة الرئيسية</div>
      <div class="cms-field"><label class="cms-label">العنوان الرئيسي</label><input class="cms-input" id="c-hero-title" placeholder="YOUR BRAND'S CREATIVE PARTNER"/></div>
      <div class="cms-field"><label class="cms-label">العنوان الفرعي</label><input class="cms-input" id="c-hero-subtitle" placeholder="وكالة تسويق رقمي متكاملة..."/></div>
      <div class="cms-field"><label class="cms-label">نص الزر</label><input class="cms-input" id="c-hero-cta" placeholder="ابدأ معنا الآن"/></div>
    </div>

    <div class="cms-section-card">
      <div class="cms-section-title">About — من نحن</div>
      <div class="cms-field"><label class="cms-label">العنوان</label><input class="cms-input" id="c-about-title" placeholder="من نحن"/></div>
      <div class="cms-field"><label class="cms-label">الوصف</label><textarea class="cms-textarea" id="c-about-description" placeholder="وكالة تسويق رقمي..."></textarea></div>
    </div>

    <div class="cms-section-card">
      <div class="cms-section-title">Services — الخدمات</div>
      <div class="cms-field"><label class="cms-label">عنوان القسم</label><input class="cms-input" id="c-services-title" placeholder="خدماتنا"/></div>
      <div class="cms-field"><label class="cms-label">وصف القسم</label><textarea class="cms-textarea" id="c-services-description" placeholder="نقدم خدمات..."></textarea></div>
    </div>

    <div class="cms-section-card">
      <div class="cms-section-title">Contact — تواصل معنا</div>
      <div class="cms-field"><label class="cms-label">العنوان</label><input class="cms-input" id="c-contact-title" placeholder="تواصل معنا"/></div>
      <div class="cms-field"><label class="cms-label">البريد الإلكتروني</label><input class="cms-input" id="c-contact-email" placeholder="info@example.com"/></div>
      <div class="cms-field"><label class="cms-label">رقم الواتساب</label><input class="cms-input" id="c-contact-whatsapp" placeholder="+201234567890"/></div>
    </div>
  </div><!-- end #panel-content -->

  <!-- ═══════════════════════════════════ -->
  <!-- TAB: CLIENTS                        -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel" id="panel-clients">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:800;color:#fff">👥 إدارة العملاء</h2>
      <button class="cms-save-btn" onclick="openClientModal()">➕ إضافة عميل</button>
    </div>
    <div class="cms-section-card">
      <div style="overflow-x:auto">
        <table class="cms-table">
          <thead><tr>
            <th>#</th><th>الاسم</th><th>اللوجو</th><th>الموقع</th><th>الترتيب</th><th>الحالة</th><th>إجراءات</th>
          </tr></thead>
          <tbody id="clientsTableBody"><tr><td colspan="7" class="empty-state">جارٍ التحميل...</td></tr></tbody>
        </table>
      </div>
    </div>
  </div><!-- end #panel-clients -->

  <!-- ═══════════════════════════════════ -->
  <!-- TAB: TEAM                           -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel" id="panel-team">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:800;color:#fff">👤 إدارة الفريق</h2>
      <button class="cms-save-btn" onclick="openTeamModal()">➕ إضافة عضو</button>
    </div>
    <div class="cms-section-card">
      <div style="overflow-x:auto">
        <table class="cms-table">
          <thead><tr>
            <th>#</th><th>الاسم</th><th>المنصب</th><th>الصورة</th><th>لينكدإن</th><th>الترتيب</th><th>الحالة</th><th>إجراءات</th>
          </tr></thead>
          <tbody id="teamTableBody"><tr><td colspan="8" class="empty-state">جارٍ التحميل...</td></tr></tbody>
        </table>
      </div>
    </div>
  </div><!-- end #panel-team -->

  <!-- ═══════════════════════════════════ -->
  <!-- TAB: THEME                          -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel" id="panel-theme">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:800;color:#fff">🎨 إعدادات الثيم</h2>
      <button class="cms-save-btn" onclick="saveTheme()">💾 حفظ الثيم</button>
    </div>
    <div class="cms-section-card">
      <div class="cms-section-title">الألوان</div>
      <div id="themeFields">
        <p style="color:var(--text-muted)">جارٍ تحميل إعدادات الثيم...</p>
      </div>
    </div>
    <div class="cms-section-card">
      <div class="cms-section-title">معاينة مباشرة</div>
      <div id="themePreview" style="padding:20px;border-radius:10px;background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(10,6,18,0.95));text-align:center">
        <p style="color:#fff;font-weight:800;font-size:18px">YOUR BRAND'S CREATIVE PARTNER</p>
        <button style="margin-top:12px;padding:10px 24px;border-radius:8px;border:none;font-weight:800;cursor:pointer;font-size:14px" id="previewBtn">ابدأ معنا الآن</button>
      </div>
    </div>
  </div><!-- end #panel-theme -->

  <!-- ═══════════════════════════════════ -->
  <!-- TAB: LAYOUT                         -->
  <!-- ═══════════════════════════════════ -->
  <div class="cms-tab-panel" id="panel-layout">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:800;color:#fff">📐 ترتيب الأقسام</h2>
      <button class="cms-save-btn" onclick="saveLayout()">💾 حفظ الترتيب</button>
    </div>
    <div class="cms-section-card">
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px">استخدم السهمين لتغيير ترتيب الأقسام، أو أخفِ قسمًا مؤقتًا.</p>
      <div id="layoutRows">
        <p style="color:var(--text-muted)">جارٍ تحميل الترتيب...</p>
      </div>
    </div>
  </div><!-- end #panel-layout -->

</div><!-- end .container -->


<!-- Client Add/Edit Modal -->
<div class="modal-overlay" id="clientModal">
  <div class="modal-card" style="max-width:520px">
    <h3 class="modal-title"><span>👥</span><span id="clientModalTitle">إضافة عميل جديد</span></h3>
    <input type="hidden" id="clientModalId"/>
    <label class="modal-field-label">اسم العميل *</label>
    <input type="text" class="modal-input" id="clientName" placeholder="مثال: شركة ABC"/>
    <label class="modal-field-label">رابط اللوجو (URL) *</label>
    <input type="text" class="modal-input" id="clientLogoUrl" placeholder="https://example.com/logo.webp"/>
    <label class="modal-field-label">رابط الموقع</label>
    <input type="text" class="modal-input" id="clientWebsite" placeholder="https://example.com"/>
    <label class="modal-field-label">الترتيب</label>
    <input type="number" class="modal-input" id="clientOrder" value="0" placeholder="0"/>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeClientModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="saveClient()">💾 حفظ</button>
    </div>
  </div>
</div>

<!-- Team Add/Edit Modal -->
<div class="modal-overlay" id="teamModal">
  <div class="modal-card" style="max-width:520px">
    <h3 class="modal-title"><span>👤</span><span id="teamModalTitle">إضافة عضو فريق</span></h3>
    <input type="hidden" id="teamModalId"/>
    <label class="modal-field-label">الاسم *</label>
    <input type="text" class="modal-input" id="teamName" placeholder="مثال: أحمد محمد"/>
    <label class="modal-field-label">المنصب *</label>
    <input type="text" class="modal-input" id="teamRole" placeholder="مثال: مدير التسويق"/>
    <label class="modal-field-label">نبذة مختصرة</label>
    <textarea class="modal-textarea" id="teamBio" placeholder="نبذة..."></textarea>
    <label class="modal-field-label">رابط الصورة</label>
    <input type="text" class="modal-input" id="teamPhoto" placeholder="https://example.com/photo.jpg"/>
    <label class="modal-field-label">رابط لينكدإن</label>
    <input type="text" class="modal-input" id="teamLinkedin" placeholder="https://linkedin.com/in/..."/>
    <label class="modal-field-label">الترتيب</label>
    <input type="number" class="modal-input" id="teamOrder" value="0"/>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeTeamModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="saveTeamMember()">💾 حفظ</button>
    </div>
  </div>
</div>

<!-- Notes Modal -->
<div class="modal-overlay" id="notesModal">
  <div class="modal-card">
    <h3 class="modal-title">
      <span>📝</span>
      <span id="notesModalTitle">ملاحظات العميل</span>
    </h3>
    <p class="modal-desc" id="notesModalDesc">سجل ملاحظات فريق المبيعات والمتابعة لهذه المحادثة (تُحفظ داخلياً فقط):</p>
    <textarea id="notesTextarea" class="modal-textarea" placeholder="مثال: تم الاتفاق على عرض سعر 15,000 ج، العميل يفضل التواصل بعد الساعة 5 مساءً..."></textarea>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeNotesModal()">إلغاء</button>
      <button class="btn btn-primary" id="saveNotesBtn" onclick="saveNotes()">حفظ الملاحظة</button>
    </div>
  </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal-overlay" id="deleteModal">
  <div class="modal-card" style="text-align:center">
    <h3 class="modal-title" style="justify-content:center">🗑️ تأكيد حذف الرسالة</h3>
    <p class="modal-desc" id="modalDesc">هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً من قاعدة البيانات؟</p>
    <div class="modal-actions" style="justify-content:center">
      <button class="btn btn-secondary" onclick="closeDeleteModal()">إلغاء</button>
      <button class="btn btn-primary" id="confirmDeleteBtn" style="background:#ef4444">تأكيد الحذف</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
  let allMessages = [];
  let selectedIds = new Set();
  let deleteTargetId = null;
  let activeNotesId = null;
  let maxKnownId = 0;
  let isMuted = localStorage.getItem('admin_sound_muted') === 'true';
  let onlyStarred = false;
  let audioCtx = null;

  // Initialize Sound Settings
  function initSoundUI() {
    const icon = document.getElementById('soundIcon');
    const text = document.getElementById('soundText');
    const btn = document.getElementById('soundToggleBtn');
    if (isMuted) {
      icon.innerText = '🔕';
      text.innerText = 'التنبيهات مكتومة';
      btn.classList.add('muted');
    } else {
      icon.innerText = '🔔';
      text.innerText = 'التنبيهات مفعّلة';
      btn.classList.remove('muted');
    }
  }

  function toggleSound() {
    isMuted = !isMuted;
    localStorage.setItem('admin_sound_muted', isMuted ? 'true' : 'false');
    initSoundUI();
    showToast(isMuted ? 'تم كتم صوت التنبيهات 🔕' : 'تم تفعيل صوت التنبيهات 🔔');
  }

  function playNotificationSound() {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      // Pleasant two-tone chime (D5 -> A5)
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) return location.reload();
      const json = await res.json();
      if (json.success && json.stats) {
        document.getElementById('statToday').innerText = json.stats.today;
        document.getElementById('statWeek').innerText = json.stats.week;
        document.getElementById('statMonth').innerText = json.stats.month;
        document.getElementById('statTotal').innerText = json.stats.total;

        const dashToday = document.getElementById('dashStatToday');
        if (dashToday) {
          dashToday.innerText = json.stats.today;
          document.getElementById('dashStatWeek').innerText = json.stats.week;
          document.getElementById('dashStatMonth').innerText = json.stats.month;
          document.getElementById('dashStatTotal').innerText = json.stats.total;
        }

        if (json.stats.by_status) {
          document.getElementById('countStatusNew').innerText = json.stats.by_status.new || 0;
          document.getElementById('countStatusContacted').innerText = json.stats.by_status.contacted || 0;
          document.getElementById('countStatusClosed').innerText = json.stats.by_status.closed || 0;
        }
        document.getElementById('countStatusStarred').innerText = json.stats.starred_count || 0;

        if (json.stats.by_source) {
          const webEl = document.getElementById('countSourceWebsite');
          const metaEl = document.getElementById('countSourceMeta');
          if (webEl) webEl.innerText = json.stats.by_source.website || 0;
          if (metaEl) metaEl.innerText = json.stats.by_source.meta_lead_ads || 0;
        }
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }

  async function fetchMessages(isAutoRefresh = false) {
    try {
      const search = document.getElementById('searchInput').value.trim();
      const status = document.getElementById('statusFilter').value;
      const source = document.getElementById('sourceFilter').value;
      const campaign = document.getElementById('campaignFilter').value.trim();
      const sort = document.getElementById('sortFilter').value;

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (source) params.set('lead_source', source);
      if (campaign) params.set('utm_campaign', campaign);
      if (onlyStarred) params.set('starred', '1');
      if (sort) params.set('sort', sort);

      const url = '/api/admin/messages' + (params.toString() ? ('?' + params.toString()) : '');
      const res = await fetch(url);
      if (res.status === 401) return location.reload();
      const json = await res.json();

      if (json.success) {
        const newMessages = json.data || [];

        // Check if there are newly arrived messages
        if (newMessages.length > 0) {
          const currentMaxId = Math.max(...newMessages.map(m => Number(m.id || 0)));
          if (maxKnownId > 0 && currentMaxId > maxKnownId) {
            playNotificationSound();
            const newArrivedCount = newMessages.filter(m => Number(m.id) > maxKnownId).length;
            document.title = '(' + newArrivedCount + ') PR Agency — لوحة إدارة الرسائل';
            showToast('🔔 وصلتك ' + newArrivedCount + ' رسالة جديدة الآن!');
          }
          maxKnownId = Math.max(maxKnownId, currentMaxId);
        }

        allMessages = newMessages;
        renderTable(allMessages);
      }
    } catch (e) {
      console.error('Failed to load messages:', e);
      if (!isAutoRefresh) {
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="12" class="empty-state" style="color:#ef4444">حدث خطأ أثناء تحميل الرسائل، يرجى المحاولة مجدداً.</td></tr>';
      }
    }
  }

  function renderTable(list) {
    const tbody = document.getElementById('tableBody');
    const counter = document.getElementById('counterTag');
    counter.innerText = 'إجمالي المعروض: ' + list.length + ' رسالة';

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="13" class="empty-state">لا توجد رسائل مطابقة لخيارات البحث أو الفلترة</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(m => {
      const isStarred = Number(m.starred || 0) === 1;
      const starIcon = isStarred ? '⭐' : '☆';
      const starClass = isStarred ? 'starred' : 'unstarred';
      const isChecked = selectedIds.has(Number(m.id)) ? 'checked' : '';

      const timeBadge = getRelativeBadge(m.created_at);
      const formattedDate = formatDate(m.created_at);
      const hasNotes = Boolean(m.notes && m.notes.trim().length > 0);

      const isMeta = (m.lead_source === 'meta_lead_ads');
      const sourceBadge = isMeta
        ? '<span class="cell-badge badge-source-meta">📱 Meta Ads</span>'
        : '<span class="cell-badge badge-source-web">🌐 الموقع</span>';

      const campaignBadge = m.utm_campaign
        ? '<span class="cell-badge" style="background:rgba(234,179,8,0.15);color:#fbbf24;border-color:rgba(234,179,8,0.3)" title="Source: ' + escapeHtml(m.utm_source || 'direct') + '">' + escapeHtml(m.utm_campaign) + '</span>'
        : '<span style="color:#71717a">—</span>';

      const status = m.status || 'new';
      let statusLabel = '🟢 جديد';
      let statusClass = 'status-new';
      if (status === 'contacted') {
        statusLabel = '🟡 تم التواصل';
        statusClass = 'status-contacted';
      } else if (status === 'closed') {
        statusLabel = '⚪ مغلق';
        statusClass = 'status-closed';
      }

      return [
        '<tr>',
        '  <td style="text-align:center"><input type="checkbox" class="row-select-checkbox" data-id="' + m.id + '" onchange="toggleSelectRow(' + m.id + ', this.checked)" ' + isChecked + ' style="cursor:pointer"/></td>',
        '  <td class="cell-star ' + starClass + '" data-action="toggle-star" data-id="' + m.id + '" title="' + (isStarred ? 'إزالة النجمة' : 'تمييز بنجمة') + '">' + starIcon + '</td>',
        '  <td class="cell-id">#' + m.id + '</td>',
        '  <td class="cell-date">' + timeBadge + ' ' + formattedDate + '</td>',
        '  <td>',
        '    <div class="cell-name-box">',
        '      <span class="cell-name">' + escapeHtml(m.name || 'بدون اسم') + '</span>',
        hasNotes ? ('      <span class="note-indicator" data-action="edit-note" data-id="' + m.id + '" title="ملاحظة: ' + escapeHtml(m.notes) + '">📝</span>') : '',
        '    </div>',
        '  </td>',
        '  <td class="cell-phone"><a href="tel:' + escapeHtml(m.phone) + '" style="color:inherit;text-decoration:none">' + escapeHtml(m.phone) + '</a></td>',
        '  <td>' + sourceBadge + '</td>',
        '  <td>' + campaignBadge + '</td>',
        '  <td>',
        '    <div class="status-badge-wrap">',
        '      <span class="status-badge ' + statusClass + '" data-action="open-status-menu" data-id="' + m.id + '">' + statusLabel + ' ▾</span>',
        '      <div class="status-dropdown" id="statusMenu_' + m.id + '">',
        '        <button type="button" class="status-opt" data-action="set-status" data-id="' + m.id + '" data-status="new">🟢 جديد</button>',
        '        <button type="button" class="status-opt" data-action="set-status" data-id="' + m.id + '" data-status="contacted">🟡 تم التواصل</button>',
        '        <button type="button" class="status-opt" data-action="set-status" data-id="' + m.id + '" data-status="closed">⚪ مغلق</button>',
        '      </div>',
        '    </div>',
        '  </td>',
        '  <td><span class="cell-badge">' + escapeHtml(m.business || 'غير محدد') + '</span></td>',
        '  <td style="color:#fbbf24;font-weight:700">' + escapeHtml(m.budget || '—') + '</td>',
        '  <td class="cell-message" title="' + escapeHtml(m.message || '') + '">' + escapeHtml(m.message || '—') + '</td>',
        '  <td style="text-align:center">',
        '    <div class="actions-cell">',
        '      <!-- WhatsApp Action with Templates Dropdown -->',
        '      <div style="position:relative;display:inline-block">',
        '        <button type="button" class="act-btn act-wa-btn" data-action="open-wa-menu" data-id="' + m.id + '" title="رد سريع عبر واتساب">',
        '          <span>💬</span> رد ▾',
        '        </button>',
        '        <div class="wa-dropdown" id="waMenu_' + m.id + '">',
        '          <div class="wa-dropdown-header">قوالب الرد السريع عبر واتساب</div>',
        '          <div class="wa-template-item" data-action="send-wa" data-id="' + m.id + '" data-tpl="1">',
        '            <div class="wa-template-title">1. استلام الطلب والرد قريباً</div>',
        '            <div class="wa-template-preview">أهلاً ' + escapeHtml(m.name || 'بك') + '، شكراً لتواصلك مع PR Agency. وصلتنا رسالتك وهنرد عليك في أقرب وقت.</div>',
        '          </div>',
        '          <div class="wa-template-item" data-action="send-wa" data-id="' + m.id + '" data-tpl="2">',
        '            <div class="wa-template-title">2. طلب تفاصيل عن النشاط</div>',
        '            <div class="wa-template-preview">أهلاً ' + escapeHtml(m.name || 'بك') + '، عايزين نعرف تفاصيل أكتر عن ' + escapeHtml(m.business || 'مشروعك') + '. تحب نكلمك امتى؟</div>',
        '          </div>',
        '          <div class="wa-template-item" data-action="send-wa" data-id="' + m.id + '" data-tpl="3">',
        '            <div class="wa-template-title">3. مناقشة الميزانية والبدء</div>',
        '            <div class="wa-template-preview">أهلاً ' + escapeHtml(m.name || 'بك') + '، جاهزين نبدأ. ممكن نتكلم عن الميزانية اللي ذكرتها؟</div>',
        '          </div>',
        '          <div class="wa-template-item" data-action="send-wa" data-id="' + m.id + '" data-tpl="custom" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:2px">',
        '            <div class="wa-template-title" style="color:#60a5fa">💬 فتح محادثة مخصصة فارغة</div>',
        '          </div>',
        '        </div>',
        '      </div>',
        '      <button type="button" class="act-btn act-note" data-action="edit-note" data-id="' + m.id + '" title="كتابة أو تعديل ملاحظة">📝 ملاحظة</button>',
        '      <button type="button" class="act-btn act-btn-icon act-copy" data-action="copy-phone" data-phone="' + escapeHtml(m.phone) + '" title="نسخ الرقم">📋</button>',
        '      <button type="button" class="act-btn act-btn-icon act-del" data-action="delete" data-id="' + m.id + '" data-name="' + escapeHtml(m.name || '') + '" title="حذف الرسالة">🗑️</button>',
        '    </div>',
        '  </td>',
        '</tr>'
      ].join('');
    }).join('');
  }

  // Formatting and Helpers
  function getRelativeBadge(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.replace(' ', 'T') + 'Z');
      const now = new Date();
      const diffHours = (now - d) / (1000 * 60 * 60);
      if (diffHours <= 24) return '<span class="badge-time badge-today">اليوم</span>';
      if (diffHours <= 168) return '<span class="badge-time badge-week">هذا الأسبوع</span>';
      return '<span class="badge-time badge-old">سابق</span>';
    } catch (e) {
      return '';
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr.replace(' ', 'T') + 'Z');
      return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + ' · ' + 
             d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch(e) {
      return dateStr;
    }
  }

  function cleanPhoneForWa(phone) {
    if (!phone) return '';
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('01')) p = '20' + p.substring(1);
    else if (!p.startsWith('20') && p.length === 10) p = '20' + p;
    return p;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Filter Actions
  let searchTimeout;
  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchMessages();
    }, 250);
  }

  function applyFilters() {
    fetchMessages();
  }

  function toggleStarredFilter() {
    onlyStarred = !onlyStarred;
    const btn = document.getElementById('starredToggleBtn');
    if (onlyStarred) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    fetchMessages();
  }

  function quickFilterStatus(st) {
    document.getElementById('statusFilter').value = st;
    applyFilters();
  }

  function quickFilterStarred() {
    onlyStarred = true;
    document.getElementById('starredToggleBtn').classList.add('active');
    applyFilters();
  }

  function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    const srcEl = document.getElementById('sourceFilter');
    if (srcEl) srcEl.value = '';
    const campEl = document.getElementById('campaignFilter');
    if (campEl) campEl.value = '';
    document.getElementById('sortFilter').value = 'date_desc';
    onlyStarred = false;
    document.getElementById('starredToggleBtn').classList.remove('active');
    fetchMessages();
  }

  function quickFilterSource(src) {
    const srcEl = document.getElementById('sourceFilter');
    if (srcEl) srcEl.value = src;
    applyFilters();
  }

  // PATCH Helper
  async function updateMessage(id, updates) {
    try {
      const res = await fetch('/api/admin/messages/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const json = await res.json();
      if (json.success) {
        // Update local object
        const target = allMessages.find(m => String(m.id) === String(id));
        if (target) {
          Object.assign(target, updates);
        }
        renderTable(allMessages);
        fetchStats();
        return true;
      } else {
        alert('فشل التحديث: ' + (json.error || ''));
        return false;
      }
    } catch (e) {
      alert('خطأ في الاتصال بالخادم أثناء التحديث');
      return false;
    }
  }

  // Status Change
  async function handleSetStatus(id, newStatus) {
    closeAllDropdowns();
    const success = await updateMessage(id, { status: newStatus });
    if (success) {
      const labels = { new: 'جديد 🟢', contacted: 'تم التواصل 🟡', closed: 'مغلق ⚪' };
      showToast('تم تغيير حالة الرسالة إلى ' + (labels[newStatus] || newStatus) + ' بنجاح ✅');
    }
  }

  // Star Toggle
  async function handleToggleStar(id) {
    const target = allMessages.find(m => String(m.id) === String(id));
    if (!target) return;
    const current = Number(target.starred || 0);
    const nextVal = current === 1 ? 0 : 1;
    const success = await updateMessage(id, { starred: nextVal });
    if (success) {
      showToast(nextVal === 1 ? 'تمت إضافة الرسالة إلى المميزة بنجمة ⭐' : 'تمت إزالة النجمة ☆');
    }
  }

  // Notes Modal Handling
  function openNotesModal(id) {
    activeNotesId = id;
    const target = allMessages.find(m => String(m.id) === String(id));
    if (!target) return;
    document.getElementById('notesModalTitle').innerText = 'ملاحظات: ' + (target.name || 'بدون اسم');
    document.getElementById('notesModalDesc').innerText = 'العميل: ' + (target.name || '—') + ' · الهاتف: ' + (target.phone || '—') + ' · النشاط: ' + (target.business || '—');
    document.getElementById('notesTextarea').value = target.notes || '';
    document.getElementById('notesModal').classList.add('open');
    document.getElementById('notesTextarea').focus();
  }

  function closeNotesModal() {
    document.getElementById('notesModal').classList.remove('open');
    activeNotesId = null;
  }

  async function saveNotes() {
    if (!activeNotesId) return;
    const btn = document.getElementById('saveNotesBtn');
    btn.disabled = true;
    btn.innerText = 'جارٍ الحفظ...';

    const text = document.getElementById('notesTextarea').value.trim();
    const success = await updateMessage(activeNotesId, { notes: text });
    btn.disabled = false;
    btn.innerText = 'حفظ الملاحظة';

    if (success) {
      closeNotesModal();
      showToast('تم حفظ الملاحظة بنجاح 📝');
    }
  }

  // WhatsApp Reply Templates
  function sendWhatsAppTemplate(id, tplKey) {
    closeAllDropdowns();
    const target = allMessages.find(m => String(m.id) === String(id));
    if (!target) return;

    const name = target.name || 'بك';
    const business = target.business || 'مشروعك';
    let text = '';

    if (tplKey === '1') {
      text = 'أهلاً ' + name + '، شكراً لتواصلك مع PR Agency. وصلتنا رسالتك وهنرد عليك في أقرب وقت.';
    } else if (tplKey === '2') {
      text = 'أهلاً ' + name + '، عايزين نعرف تفاصيل أكتر عن ' + business + '. تحب نكلمك امتى؟';
    } else if (tplKey === '3') {
      text = 'أهلاً ' + name + '، جاهزين نبدأ. ممكن نتكلم عن الميزانية اللي ذكرتها؟';
    } else {
      text = 'أهلاً بك ' + name + '، تواصلنا معك بخصوص طلبك في PR Agency';
    }

    const waPhone = cleanPhoneForWa(target.phone);
    const waUrl = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(text);
    window.open(waUrl, '_blank', 'noopener');
  }

  // Copy Phone
  function copyPhone(phone) {
    navigator.clipboard.writeText(phone).then(() => {
      showToast('تم نسخ الرقم ' + phone + ' بنجاح! 📋');
    }).catch(() => {
      showToast('فشل النسخ تلقائياً: ' + phone);
    });
  }

  // Delete Modal Handling
  function confirmDelete(id, name) {
    deleteTargetId = id;
    document.getElementById('modalDesc').innerText = 'هل أنت متأكد من رغبتك في حذف رسالة العميل (' + name + ') نهائياً؟';
    document.getElementById('deleteModal').classList.add('open');
    document.getElementById('confirmDeleteBtn').onclick = () => executeDelete(id);
  }

  function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('open');
    deleteTargetId = null;
  }

  async function executeDelete(id) {
    try {
      const res = await fetch('/api/admin/messages/' + id, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('تم حذف الرسالة بنجاح 🗑️');
        closeDeleteModal();
        loadAll();
      } else {
        alert('حدث خطأ أثناء الحذف: ' + (json.error || ''));
      }
    } catch(e) {
      alert('فشل الاتصال بالخادم لحذف الرسالة');
    }
  }

  // Dropdown Management
  function closeAllDropdowns() {
    document.querySelectorAll('.status-dropdown.open').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.wa-dropdown.open').forEach(el => el.classList.remove('open'));
  }

  document.addEventListener('click', (e) => {
    // If click is outside status dropdown or wa dropdown, close them
    if (!e.target.closest('.status-badge-wrap') && !e.target.closest('.wa-dropdown') && !e.target.closest('.act-wa-btn')) {
      closeAllDropdowns();
    }
  });

  // Event Delegation for Table Clicks
  document.getElementById('tableBody').addEventListener('click', (e) => {
    const starBtn = e.target.closest('[data-action="toggle-star"]');
    if (starBtn) {
      handleToggleStar(starBtn.getAttribute('data-id'));
      return;
    }

    const openStatusBtn = e.target.closest('[data-action="open-status-menu"]');
    if (openStatusBtn) {
      e.stopPropagation();
      const id = openStatusBtn.getAttribute('data-id');
      const menu = document.getElementById('statusMenu_' + id);
      const isOpen = menu.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) menu.classList.add('open');
      return;
    }

    const setStatusBtn = e.target.closest('[data-action="set-status"]');
    if (setStatusBtn) {
      e.stopPropagation();
      const id = setStatusBtn.getAttribute('data-id');
      const st = setStatusBtn.getAttribute('data-status');
      handleSetStatus(id, st);
      return;
    }

    const openWaBtn = e.target.closest('[data-action="open-wa-menu"]');
    if (openWaBtn) {
      e.stopPropagation();
      const id = openWaBtn.getAttribute('data-id');
      const menu = document.getElementById('waMenu_' + id);
      const isOpen = menu.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) menu.classList.add('open');
      return;
    }

    const sendWaBtn = e.target.closest('[data-action="send-wa"]');
    if (sendWaBtn) {
      e.stopPropagation();
      const id = sendWaBtn.getAttribute('data-id');
      const tpl = sendWaBtn.getAttribute('data-tpl');
      sendWhatsAppTemplate(id, tpl);
      return;
    }

    const noteBtn = e.target.closest('[data-action="edit-note"]');
    if (noteBtn) {
      openNotesModal(noteBtn.getAttribute('data-id'));
      return;
    }

    const copyBtn = e.target.closest('[data-action="copy-phone"]');
    if (copyBtn) {
      copyPhone(copyBtn.getAttribute('data-phone') || '');
      return;
    }

    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn) {
      confirmDelete(delBtn.getAttribute('data-id'), delBtn.getAttribute('data-name') || '');
      return;
    }
  });

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
  }

  function exportCSV() {
    if (!allMessages || allMessages.length === 0) {
      alert('لا توجد رسائل لتصديرها!');
      return;
    }

    const headers = ['المعرف (ID)', 'تاريخ الإرسال', 'الاسم', 'رقم الهاتف', 'المصدر', 'الحملة الإعلانية', 'الحالة', 'مميزة بنجمة', 'ملاحظات فريق العمل', 'نوع النشاط', 'الميزانية', 'الرسالة'];
    const rows = allMessages.map(m => [
      m.id,
      m.created_at || '',
      '"' + (m.name || '').replace(/"/g, '""') + '"',
      '"' + (m.phone || '').replace(/"/g, '""') + '"',
      '"' + (m.lead_source === 'meta_lead_ads' ? 'Meta Ads' : 'الموقع').replace(/"/g, '""') + '"',
      '"' + (m.utm_campaign || '').replace(/"/g, '""') + '"',
      '"' + (m.status || 'new').replace(/"/g, '""') + '"',
      m.starred ? 'نعم' : 'لا',
      '"' + (m.notes || '').replace(/"/g, '""') + '"',
      '"' + (m.business || '').replace(/"/g, '""') + '"',
      '"' + (m.budget || '').replace(/"/g, '""') + '"',
      '"' + (m.message || '').replace(/"/g, '""') + '"'
    ]);

    // UTF-8 BOM so Excel opens Arabic correctly
    const nl = String.fromCharCode(10);
    const bom = String.fromCharCode(0xFEFF);
    const csvContent = bom + headers.join(',') + nl + rows.map(e => e.join(',')).join(nl);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PR_Agency_Messages_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم تصدير ملف Excel بنجاح! 📥');
  }

  // ═══════════════════════════════════════════════
  // BULK ACTIONS & SELECTION
  // ═══════════════════════════════════════════════
  function updateBulkUI() {
    const bar = document.getElementById('bulkBar');
    const info = document.getElementById('bulkInfo');
    const selectAllCb = document.getElementById('selectAllCheckbox');

    if (selectedIds.size > 0) {
      bar.classList.add('active');
      info.innerText = 'تم تحديد ' + selectedIds.size + ' رسالة';
    } else {
      bar.classList.remove('active');
    }

    if (selectAllCb) {
      selectAllCb.checked = allMessages.length > 0 && selectedIds.size === allMessages.length;
    }
  }

  function toggleSelectRow(id, isChecked) {
    const numId = Number(id);
    if (isChecked) {
      selectedIds.add(numId);
    } else {
      selectedIds.delete(numId);
    }
    updateBulkUI();
  }

  function toggleSelectAll(masterCb) {
    if (masterCb.checked) {
      allMessages.forEach(m => selectedIds.add(Number(m.id)));
    } else {
      selectedIds.clear();
    }
    renderTable(allMessages);
    updateBulkUI();
  }

  function deselectAll() {
    selectedIds.clear();
    renderTable(allMessages);
    updateBulkUI();
  }

  async function applyBulkStatus() {
    const st = document.getElementById('bulkStatusSelect').value;
    if (!st) {
      alert('يرجى اختيار الحالة أولاً');
      return;
    }
    if (selectedIds.size === 0) {
      alert('لم تقم بتحديد أي رسائل');
      return;
    }

    try {
      const res = await fetch('/api/admin/messages/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', ids: Array.from(selectedIds), status: st })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'تم تحديث الحالة بنجاح ✅');
        selectedIds.clear();
        loadAll();
      } else {
        alert('حدث خطأ: ' + (json.error || ''));
      }
    } catch (e) {
      alert('تعذر الاتصال بالخادم');
    }
  }

  async function applyBulkDelete() {
    if (selectedIds.size === 0) {
      alert('لم تقم بتحديد أي رسائل لحذفها');
      return;
    }
    if (!confirm('هل أنت متأكد من رغبتك في حذف ' + selectedIds.size + ' رسالة نهائياً؟')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/messages/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: Array.from(selectedIds) })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'تم حذف الرسائل بنجاح 🗑️');
        selectedIds.clear();
        loadAll();
      } else {
        alert('حدث خطأ: ' + (json.error || ''));
      }
    } catch (e) {
      alert('تعذر الاتصال بالخادم');
    }
  }

  // ═══════════════════════════════════════════════
  // ANALYTICS & DASHBOARD LOADERS
  // ═══════════════════════════════════════════════
  let _analyticsData = null;
  async function fetchAnalyticsData() {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.status === 401) return location.reload();
      const json = await res.json();
      if (!json.success) return;
      _analyticsData = json;

      // Render 7-day chart in Dashboard
      renderDashboardChart(json.last7Days || []);

      // Render Analytics Tab
      renderAnalyticsList('analyticsCampaigns', json.campaigns || [], 'حملة');
      renderAnalyticsList('analyticsBusiness', json.businessBreakdown || [], 'نشاط');
      renderAnalyticsList('analyticsBudget', json.budgetBreakdown || [], 'ميزانية');
      renderAnalyticsList('analyticsSource', json.sourceBreakdown || [], 'مصدر');
    } catch (e) {
      console.error('Failed to load analytics:', e);
    }
  }

  function renderDashboardChart(daysList) {
    const container = document.getElementById('dashboardBars');
    if (!container) return;

    if (!daysList || daysList.length === 0) {
      container.innerHTML = '<div style="width:100%;text-align:center;color:var(--text-muted);padding-top:60px">لا توجد رسائل مسجلة خلال آخر 7 أيام</div>';
      return;
    }

    const maxVal = Math.max(...daysList.map(d => Number(d.count || 0)), 1);

    container.innerHTML = daysList.map(item => {
      const count = Number(item.count || 0);
      const heightPercent = Math.max(Math.round((count / maxVal) * 100), 4);
      const dateLabel = String(item.day || '').slice(5); // MM-DD
      return [
        '<div class="chart-col">',
        '  <div class="chart-bar-fill" style="height:' + heightPercent + '%" title="' + count + ' رسائل">',
        '    <span class="chart-bar-val">' + count + '</span>',
        '  </div>',
        '  <span class="chart-col-label">' + dateLabel + '</span>',
        '</div>'
      ].join('');
    }).join('');
  }

  function renderAnalyticsList(targetId, items, label) {
    const el = document.getElementById(targetId);
    if (!el) return;
    if (!items || items.length === 0) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">لا توجد بيانات مسجلة حتى الآن</p>';
      return;
    }
    el.innerHTML = items.map(item => {
      const name = item.campaign || item.business || item.budget || item.source || 'غير محدد';
      const count = item.count || 0;
      return [
        '<div class="analytics-item">',
        '  <span class="analytics-name">' + escapeHtml(name) + '</span>',
        '  <span class="analytics-count">' + count + '</span>',
        '</div>'
      ].join('');
    }).join('');
  }

  function loadAll() {
    fetchStats();
    fetchMessages();
    fetchAnalyticsData();
  }

  // Focus Window resets notification badge in title
  window.addEventListener('focus', () => {
    document.title = 'PR Agency — لوحة إدارة الرسائل';
  });

  // Auto-refresh every 30 seconds
  setInterval(() => {
    fetchStats();
    fetchMessages(true);
    fetchAnalyticsData();
  }, 30000);

  // Initial Load
  initSoundUI();
  loadAll();

  // ═══════════════════════════════════════════════
  // CMS TAB SWITCHING
  // ═══════════════════════════════════════════════
  const CMS_TABS = ['dashboard','messages','analytics','settings','content','clients','team','theme','layout'];
  function switchTab(name) {
    CMS_TABS.forEach(t => {
      const panel = document.getElementById('panel-' + t);
      if (panel) panel.classList.toggle('active', t === name);
    });
    document.querySelectorAll('.cms-tab-btn').forEach((btn, i) => {
      btn.classList.toggle('active', CMS_TABS[i] === name);
    });
    // lazy load on first open
    if (name === 'dashboard' || name === 'analytics') fetchAnalyticsData();
    if (name === 'content') fetchCmsContent();
    if (name === 'clients') fetchCmsClients();
    if (name === 'team') fetchCmsTeam();
    if (name === 'theme') fetchCmsTheme();
    if (name === 'layout') fetchCmsLayout();
  }

  // ═══════════════════════════════════════════════
  // AUTH HEADER
  // ═══════════════════════════════════════════════
  function cmsAuth() {
    return { 'Authorization': 'Basic ' + btoa(':pr2026'), 'Content-Type': 'application/json' };
  }

  // ═══════════════════════════════════════════════
  // CONTENT TAB
  // ═══════════════════════════════════════════════
  let _contentLoaded = false;
  async function fetchCmsContent() {
    if (_contentLoaded) return;
    try {
      const res = await fetch('/api/admin/content', { headers: cmsAuth() });
      const json = await res.json();
      if (!json.success) return;
      const d = json.data;
      const set = (id, sec, key) => {
        const el = document.getElementById(id);
        if (el && d[sec] && d[sec][key]) el.value = d[sec][key];
      };
      set('c-hero-title', 'hero', 'title');
      set('c-hero-subtitle', 'hero', 'subtitle');
      set('c-hero-cta', 'hero', 'cta');
      set('c-about-title', 'about', 'title');
      set('c-about-description', 'about', 'description');
      set('c-services-title', 'services', 'title');
      set('c-services-description', 'services', 'description');
      set('c-contact-title', 'contact', 'title');
      set('c-contact-email', 'contact', 'email');
      set('c-contact-whatsapp', 'contact', 'whatsapp');
      _contentLoaded = true;
    } catch(e) { showToast('خطأ في تحميل المحتوى'); }
  }

  async function saveAllContent() {
    const fields = [
      ['c-hero-title','hero','title'],['c-hero-subtitle','hero','subtitle'],['c-hero-cta','hero','cta'],
      ['c-about-title','about','title'],['c-about-description','about','description'],
      ['c-services-title','services','title'],['c-services-description','services','description'],
      ['c-contact-title','contact','title'],['c-contact-email','contact','email'],['c-contact-whatsapp','contact','whatsapp']
    ];
    try {
      for (const [id, section, key] of fields) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) continue;
        await fetch('/api/admin/content', {
          method: 'PUT',
          headers: cmsAuth(),
          body: JSON.stringify({ section, key, value: el.value.trim() })
        });
      }
      showToast('✅ تم حفظ المحتوى بنجاح!');
    } catch(e) { showToast('❌ خطأ: ' + e.message); }
  }

  // ═══════════════════════════════════════════════
  // CLIENTS TAB
  // ═══════════════════════════════════════════════
  let cmsClients = [];
  let _clientsLoaded = false;
  async function fetchCmsClients() {
    try {
      const res = await fetch('/api/admin/clients', { headers: cmsAuth() });
      const json = await res.json();
      if (!json.success) return;
      cmsClients = json.data || [];
      renderClientsTable();
      _clientsLoaded = true;
    } catch(e) { showToast('خطأ في تحميل العملاء'); }
  }

  function renderClientsTable() {
    const tb = document.getElementById('clientsTableBody');
    if (!cmsClients.length) {
      tb.innerHTML = '<tr><td colspan="7" class="empty-state">لا يوجد عملاء — أضف أول عميل!</td></tr>';
      return;
    }
    tb.innerHTML = cmsClients.map(c => \`
      <tr>
        <td style="color:var(--text-sub);font-family:monospace">\${c.id}</td>
        <td style="font-weight:700;color:#fff">\${c.name}</td>
        <td><img src="\${c.logo_url}" alt="\${c.name}" style="height:32px;max-width:80px;object-fit:contain;border-radius:4px" onerror="this.style.display='none'"/></td>
        <td><a href="\${c.website_url||'#'}" target="_blank" style="color:#60a5fa;font-size:12px">\${c.website_url||'—'}</a></td>
        <td>\${c.order_index}</td>
        <td><span style="padding:3px 9px;border-radius:99px;font-size:12px;font-weight:700;\${c.is_active?'background:rgba(16,185,129,0.15);color:#34d399':'background:rgba(107,114,128,0.15);color:#9ca3af'}">\${c.is_active?'نشط':'مخفي'}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="act-btn act-note" onclick="editClient(\${c.id})">✏️</button>
            <button class="act-btn act-del" onclick="deleteClient(\${c.id})">🗑️</button>
          </div>
        </td>
      </tr>\`).join('');
  }

  function openClientModal(id) {
    document.getElementById('clientModalId').value = '';
    document.getElementById('clientModalTitle').textContent = 'إضافة عميل جديد';
    document.getElementById('clientName').value = '';
    document.getElementById('clientLogoUrl').value = '';
    document.getElementById('clientWebsite').value = '';
    document.getElementById('clientOrder').value = 0;
    document.getElementById('clientModal').classList.add('open');
  }

  function editClient(id) {
    const c = cmsClients.find(x => x.id === id);
    if (!c) return;
    document.getElementById('clientModalId').value = id;
    document.getElementById('clientModalTitle').textContent = 'تعديل بيانات العميل';
    document.getElementById('clientName').value = c.name || '';
    document.getElementById('clientLogoUrl').value = c.logo_url || '';
    document.getElementById('clientWebsite').value = c.website_url || '';
    document.getElementById('clientOrder').value = c.order_index || 0;
    document.getElementById('clientModal').classList.add('open');
  }

  function closeClientModal() { document.getElementById('clientModal').classList.remove('open'); }

  async function saveClient() {
    const id = document.getElementById('clientModalId').value;
    const body = {
      name: document.getElementById('clientName').value.trim(),
      logo_url: document.getElementById('clientLogoUrl').value.trim(),
      website_url: document.getElementById('clientWebsite').value.trim(),
      order_index: parseInt(document.getElementById('clientOrder').value) || 0
    };
    if (!body.name || !body.logo_url) { showToast('⚠️ الاسم والرابط مطلوبان'); return; }
    try {
      const url = id ? '/api/admin/clients?id=' + id : '/api/admin/clients';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: cmsAuth(), body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) { closeClientModal(); _clientsLoaded = false; fetchCmsClients(); showToast('✅ تم الحفظ!'); }
      else showToast('❌ ' + json.error);
    } catch(e) { showToast('❌ ' + e.message); }
  }

  async function deleteClient(id) {
    if (!confirm('هل تريد حذف هذا العميل نهائياً؟')) return;
    try {
      await fetch('/api/admin/clients?id=' + id, { method: 'DELETE', headers: cmsAuth() });
      _clientsLoaded = false; fetchCmsClients(); showToast('🗑️ تم الحذف');
    } catch(e) { showToast('❌ ' + e.message); }
  }

  // ═══════════════════════════════════════════════
  // TEAM TAB
  // ═══════════════════════════════════════════════
  let cmsTeam = [];
  async function fetchCmsTeam() {
    try {
      const res = await fetch('/api/admin/team', { headers: cmsAuth() });
      const json = await res.json();
      if (!json.success) return;
      cmsTeam = json.data || [];
      renderTeamTable();
    } catch(e) { showToast('خطأ في تحميل الفريق'); }
  }

  function renderTeamTable() {
    const tb = document.getElementById('teamTableBody');
    if (!cmsTeam.length) {
      tb.innerHTML = '<tr><td colspan="8" class="empty-state">لا يوجد أعضاء — أضف أول عضو!</td></tr>';
      return;
    }
    tb.innerHTML = cmsTeam.map(m => \`
      <tr>
        <td style="color:var(--text-sub);font-family:monospace">\${m.id}</td>
        <td style="font-weight:700;color:#fff">\${m.name}</td>
        <td style="color:var(--text-muted)">\${m.role}</td>
        <td>\${m.photo_url?'<img src="'+m.photo_url+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover" onerror="this.style.display=\'none\'"/>':'—'}</td>
        <td>\${m.linkedin_url?'<a href="'+m.linkedin_url+'" target="_blank" style="color:#60a5fa;font-size:12px">🔗</a>':'—'}</td>
        <td>\${m.order_index}</td>
        <td><span style="padding:3px 9px;border-radius:99px;font-size:12px;font-weight:700;\${m.is_active?'background:rgba(16,185,129,0.15);color:#34d399':'background:rgba(107,114,128,0.15);color:#9ca3af'}">\${m.is_active?'نشط':'مخفي'}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="act-btn act-note" onclick="editTeamMember(\${m.id})">✏️</button>
            <button class="act-btn act-del" onclick="deleteTeamMember(\${m.id})">🗑️</button>
          </div>
        </td>
      </tr>\`).join('');
  }

  function openTeamModal() {
    document.getElementById('teamModalId').value = '';
    document.getElementById('teamModalTitle').textContent = 'إضافة عضو فريق';
    ['teamName','teamRole','teamBio','teamPhoto','teamLinkedin'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('teamOrder').value = 0;
    document.getElementById('teamModal').classList.add('open');
  }

  function editTeamMember(id) {
    const m = cmsTeam.find(x => x.id === id);
    if (!m) return;
    document.getElementById('teamModalId').value = id;
    document.getElementById('teamModalTitle').textContent = 'تعديل بيانات العضو';
    document.getElementById('teamName').value = m.name || '';
    document.getElementById('teamRole').value = m.role || '';
    document.getElementById('teamBio').value = m.bio || '';
    document.getElementById('teamPhoto').value = m.photo_url || '';
    document.getElementById('teamLinkedin').value = m.linkedin_url || '';
    document.getElementById('teamOrder').value = m.order_index || 0;
    document.getElementById('teamModal').classList.add('open');
  }

  function closeTeamModal() { document.getElementById('teamModal').classList.remove('open'); }

  async function saveTeamMember() {
    const id = document.getElementById('teamModalId').value;
    const body = {
      name: document.getElementById('teamName').value.trim(),
      role: document.getElementById('teamRole').value.trim(),
      bio: document.getElementById('teamBio').value.trim(),
      photo_url: document.getElementById('teamPhoto').value.trim(),
      linkedin_url: document.getElementById('teamLinkedin').value.trim(),
      order_index: parseInt(document.getElementById('teamOrder').value) || 0
    };
    if (!body.name || !body.role) { showToast('⚠️ الاسم والمنصب مطلوبان'); return; }
    try {
      const url = id ? '/api/admin/team?id=' + id : '/api/admin/team';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: cmsAuth(), body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) { closeTeamModal(); fetchCmsTeam(); showToast('✅ تم الحفظ!'); }
      else showToast('❌ ' + json.error);
    } catch(e) { showToast('❌ ' + e.message); }
  }

  async function deleteTeamMember(id) {
    if (!confirm('هل تريد حذف هذا العضو نهائياً؟')) return;
    try {
      await fetch('/api/admin/team?id=' + id, { method: 'DELETE', headers: cmsAuth() });
      fetchCmsTeam(); showToast('🗑️ تم الحذف');
    } catch(e) { showToast('❌ ' + e.message); }
  }

  // ═══════════════════════════════════════════════
  // THEME TAB
  // ═══════════════════════════════════════════════
  let cmsThemeData = [];
  async function fetchCmsTheme() {
    try {
      const res = await fetch('/api/admin/theme', { headers: cmsAuth() });
      const json = await res.json();
      if (!json.success) return;
      cmsThemeData = json.data || [];
      renderThemeFields();
    } catch(e) { showToast('خطأ في تحميل الثيم'); }
  }

  function renderThemeFields() {
    const container = document.getElementById('themeFields');
    if (!cmsThemeData.length) { container.innerHTML = '<p style="color:var(--text-muted)">لا توجد بيانات ثيم في D1 — تأكد من تشغيل SQL.</p>'; return; }
    container.innerHTML = cmsThemeData.map(item => \`
      <div class="cms-field" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <label class="cms-label" style="min-width:160px;margin:0">\${item.label || item.key}</label>
        <input type="color" value="\${item.value||'#8B5CF6'}" id="theme-\${item.key}" onchange="updateThemePreview('\${item.key}',this.value)" style="width:48px;height:36px;border:none;border-radius:6px;cursor:pointer;background:transparent"/>
        <input type="text" class="cms-input" value="\${item.value||''}" id="theme-txt-\${item.key}" oninput="syncColorPicker('\${item.key}',this.value)" style="max-width:140px"/>
        <span class="color-preview" id="theme-prev-\${item.key}" style="background:\${item.value||'#8B5CF6'}"></span>
      </div>\`).join('');
  }

  function syncColorPicker(key, val) {
    const picker = document.getElementById('theme-' + key);
    const prev = document.getElementById('theme-prev-' + key);
    if (picker && val.match(/^#[0-9a-fA-F]{6}$/)) { picker.value = val; }
    if (prev) prev.style.background = val;
    updateThemePreview(key, val);
  }

  function updateThemePreview(key, val) {
    const txt = document.getElementById('theme-txt-' + key);
    const prev = document.getElementById('theme-prev-' + key);
    if (txt) txt.value = val;
    if (prev) prev.style.background = val;
    // live preview button color
    if (key === 'primary_color') {
      const btn = document.getElementById('previewBtn');
      if (btn) btn.style.background = val;
    }
  }

  async function saveTheme() {
    try {
      for (const item of cmsThemeData) {
        const txtEl = document.getElementById('theme-txt-' + item.key);
        if (!txtEl) continue;
        await fetch('/api/admin/theme', {
          method: 'PUT', headers: cmsAuth(),
          body: JSON.stringify({ key: item.key, value: txtEl.value.trim() })
        });
      }
      showToast('✅ تم حفظ الثيم!');
    } catch(e) { showToast('❌ ' + e.message); }
  }

  // ═══════════════════════════════════════════════
  // LAYOUT TAB
  // ═══════════════════════════════════════════════
  let cmsLayout = [];
  async function fetchCmsLayout() {
    try {
      const res = await fetch('/api/admin/layout', { headers: cmsAuth() });
      const json = await res.json();
      if (!json.success) return;
      cmsLayout = json.data || [];
      renderLayoutRows();
    } catch(e) { showToast('خطأ في تحميل الترتيب'); }
  }

  function renderLayoutRows() {
    const container = document.getElementById('layoutRows');
    if (!cmsLayout.length) { container.innerHTML = '<p style="color:var(--text-muted)">لا توجد بيانات layout — تأكد من تشغيل SQL.</p>'; return; }
    container.innerHTML = cmsLayout.map((s, i) => \`
      <div class="layout-row">
        <span style="color:var(--text-sub);font-weight:800;min-width:24px">\${s.order_index}</span>
        <span class="layout-row-label">\${s.label}</span>
        <button onclick="moveLayout(\${i},-1)" \${i===0?'disabled':''} style="padding:4px 10px;border-radius:6px;border:1px solid var(--card-border);background:rgba(255,255,255,0.04);color:#fff;cursor:pointer">▲</button>
        <button onclick="moveLayout(\${i},1)" \${i===cmsLayout.length-1?'disabled':''} style="padding:4px 10px;border-radius:6px;border:1px solid var(--card-border);background:rgba(255,255,255,0.04);color:#fff;cursor:pointer">▼</button>
        <button class="layout-vis-toggle \${s.is_visible?'visible':''}" onclick="toggleLayoutVis(\${i})">\${s.is_visible?'👁️ ظاهر':'🙈 مخفي'}</button>
      </div>\`).join('');
  }

  function moveLayout(idx, dir) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= cmsLayout.length) return;
    [cmsLayout[idx], cmsLayout[newIdx]] = [cmsLayout[newIdx], cmsLayout[idx]];
    cmsLayout.forEach((s,i) => s.order_index = i + 1);
    renderLayoutRows();
  }

  function toggleLayoutVis(idx) {
    cmsLayout[idx].is_visible = cmsLayout[idx].is_visible ? 0 : 1;
    renderLayoutRows();
  }

  async function saveLayout() {
    try {
      for (const s of cmsLayout) {
        await fetch('/api/admin/layout', {
          method: 'PUT', headers: cmsAuth(),
          body: JSON.stringify({ section_id: s.section_id, order_index: s.order_index, is_visible: s.is_visible })
        });
      }
      showToast('✅ تم حفظ الترتيب!');
    } catch(e) { showToast('❌ ' + e.message); }
  }

</script>


</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
