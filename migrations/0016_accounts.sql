-- Account role: 'client' (free) or 'owner' (active subscription)
ALTER TABLE owners ADD COLUMN role               TEXT    NOT NULL DEFAULT 'client';
ALTER TABLE owners ADD COLUMN email_verified     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE owners ADD COLUMN email_verify_token TEXT;
ALTER TABLE owners ADD COLUMN email_verify_expires TEXT;
-- Notification preference: receive order emails?
ALTER TABLE owners ADD COLUMN notif_email_orders INTEGER NOT NULL DEFAULT 1;

-- All existing owners already have active subscriptions and verified emails
UPDATE owners SET role = 'owner', email_verified = 1;

-- In-dashboard notification feed
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT    PRIMARY KEY,
  owner_id   TEXT    NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  type       TEXT    NOT NULL,
  title      TEXT    NOT NULL,
  body       TEXT    NOT NULL DEFAULT '',
  link       TEXT    NOT NULL DEFAULT '',
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notif_owner ON notifications(owner_id, read, created_at);
