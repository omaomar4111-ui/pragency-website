CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT PRIMARY KEY,
  can_approve_assets INTEGER DEFAULT 0,
  can_view_financials INTEGER DEFAULT 0,
  can_manage_team INTEGER DEFAULT 0,
  can_manage_clients INTEGER DEFAULT 0,
  can_view_audit INTEGER DEFAULT 0,
  can_manage_tasks INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO role_permissions (role, can_approve_assets, can_view_financials, can_manage_team, can_manage_clients, can_view_audit, can_manage_tasks) VALUES
('Super Admin', 1, 1, 1, 1, 1, 1),
('Account Manager', 1, 0, 0, 1, 0, 1),
('Graphic Designer', 0, 0, 0, 0, 0, 1),
('Video Editor', 0, 0, 0, 0, 0, 1),
('Copywriter', 0, 0, 0, 0, 0, 1),
('Sales', 0, 0, 0, 1, 0, 1),
('Strategist', 1, 0, 0, 1, 0, 1);
