-- Self-Learning Memory Table for Google Gemini Senior Sales Consultant Agent
CREATE TABLE IF NOT EXISTS agent_learned_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT,
  successful_technique TEXT,
  context_lesson TEXT NOT NULL,
  quality_score INTEGER DEFAULT 90,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learned_insights_topic ON agent_learned_insights(topic);

-- Pre-seed with Senior High-Ticket Sales Consultant Wisdom
INSERT OR IGNORE INTO agent_learned_insights (topic, successful_technique, context_lesson, quality_score) VALUES
('budget_qualification', 'Value First then Diagnostic Pricing', 'لا تذكر أسعاراً جزافية في البداية؛ اسأل أولاً عن أهداف النمو وحجم الإنفاق الإعلاني الحالي لتحديد الباقة الأنسب التي تضمن أعلى عائد ROAS.', 98),
('competitor_objection', 'Positioning on Creative & ROI', 'عند مقارنة الوكالة بشركات رخيصة، ركّز على أن الإنتاج السينمائي والـ Media Buying الاحترافي يوفران آلاف الجنيهات المهدرة في إعلانات فاشلة.', 95),
('closing_urgency', 'Consultative Audit Hook', 'اعرض فحصاً تسويقياً مجانياً (Marketing Audit) لصفحاتهم ومبيعاتهم الحالية كخطوة أولى لبناء الثقة وتحديد فجوات النمو.', 96);
