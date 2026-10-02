-- Migration: Visitor Analytics & Customer Journey Tracking
-- Execute in Cloudflare D1 Console (Database: DB)

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  country TEXT,
  city TEXT,
  ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  entry_page TEXT,
  exit_page TEXT,
  page_views INTEGER DEFAULT 1,
  session_duration INTEGER DEFAULT 0,
  is_bot INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  event_type TEXT NOT NULL,
  event_data TEXT,
  page_url TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_first_seen ON sessions(first_seen);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
