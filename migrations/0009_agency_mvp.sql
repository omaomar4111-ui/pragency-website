-- Migration 0009: PeakTime Agency MVP Core
-- Tables: projects, tasks, time_entries, daily_publishes

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  client_name TEXT,
  retainer_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'backlog', -- backlog, planned, done
  priority TEXT DEFAULT 'medium', -- low, medium, high
  flag TEXT DEFAULT 'feature',
  planned_date DATE,
  estimated_hours REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  done_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  hours REAL NOT NULL,
  hourly_cost REAL DEFAULT 150,
  date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_publishes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  date DATE NOT NULL,
  summary TEXT,
  total_hours REAL DEFAULT 0,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_date ON tasks(status, planned_date);
CREATE INDEX IF NOT EXISTS idx_time_task_user ON time_entries(task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_publishes_user_date ON daily_publishes(user_id, date);
