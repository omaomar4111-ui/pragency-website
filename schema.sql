-- PR Agency — D1 Schema
-- Run in: Cloudflare Dashboard > D1 > pragency-db > Console

CREATE TABLE IF NOT EXISTS site_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(section, key)
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  linkedin_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_theme (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  label TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_layout (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_visible INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_theme (key, value, label) VALUES
  ('primary_color', '#8B5CF6', 'اللون الرئيسي'),
  ('secondary_color', '#6D28D9', 'اللون الثانوي'),
  ('accent_color', '#A78BFA', 'لون التمييز'),
  ('bg_dark', '#0A0612', 'خلفية داكنة');

INSERT OR IGNORE INTO site_layout (section_id, label, order_index, is_visible) VALUES
  ('hero', 'Hero Section', 1, 1),
  ('clients', 'Client Logos', 2, 1),
  ('services', 'Our Services', 3, 1),
  ('about', 'About Us', 4, 1),
  ('team', 'Our Team', 5, 1),
  ('contact', 'Contact Form', 6, 1);
