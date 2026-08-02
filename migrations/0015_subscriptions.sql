-- Track MP preapproval ID and current subscription state on each owner
ALTER TABLE owners ADD COLUMN preapproval_id        TEXT;
ALTER TABLE owners ADD COLUMN subscription_status   TEXT NOT NULL DEFAULT 'active';
ALTER TABLE owners ADD COLUMN current_period_end    TEXT NOT NULL DEFAULT '';

-- Audit log for all MP platform webhook events
CREATE TABLE IF NOT EXISTS subscription_events (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT REFERENCES owners(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  resource_id TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT '',
  payload     TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subevt_owner ON subscription_events(owner_id);

-- Add preapproval_id to subscriptions table so each payment row links back to the recurring plan
ALTER TABLE subscriptions ADD COLUMN preapproval_id TEXT NOT NULL DEFAULT '';
