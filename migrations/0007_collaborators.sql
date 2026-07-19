-- Collaborators: additional logins attached to a client account
CREATE TABLE IF NOT EXISTS collaborators (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  salt       TEXT NOT NULL,
  hash       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collaborators_owner ON collaborators(owner_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators(email);
