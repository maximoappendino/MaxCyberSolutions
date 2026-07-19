-- Push limits and usage tracking
ALTER TABLE owners ADD COLUMN push_daily_limit  INTEGER NOT NULL DEFAULT 10;
ALTER TABLE owners ADD COLUMN push_weekly_limit INTEGER NOT NULL DEFAULT 50;
ALTER TABLE owners ADD COLUMN push_daily_used   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE owners ADD COLUMN push_weekly_used  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE owners ADD COLUMN push_daily_reset  TEXT    NOT NULL DEFAULT '';
ALTER TABLE owners ADD COLUMN push_weekly_reset TEXT    NOT NULL DEFAULT '';

-- Short-lived tokens for admin impersonation (5-minute single-use)
CREATE TABLE IF NOT EXISTS impersonation_tokens (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  used       INTEGER NOT NULL DEFAULT 0
);
