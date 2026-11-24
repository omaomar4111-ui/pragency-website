-- Unified Schema Migration for Autonomous AI Agents & Tasks
-- Ensures tasks.ai_brief and agent_pending_actions columns exist cleanly

ALTER TABLE tasks ADD COLUMN ai_brief TEXT;

CREATE TABLE IF NOT EXISTS agent_pending_actions (
  id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  lead_id TEXT,
  lead_name TEXT,
  lead_company TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  action_type TEXT NOT NULL,
  draft_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending_approval',
  related_id TEXT,
  processed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
