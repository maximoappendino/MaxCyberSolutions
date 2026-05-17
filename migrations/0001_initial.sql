-- MaxCyberSolutions — Multi-tenant edge commerce schema
-- Apply with: wrangler d1 migrations apply maxcybersolutions-db --remote
-- Local dev:  wrangler d1 migrations apply maxcybersolutions-db --local

-- ── Owners ────────────────────────────────────────────────────────────────────
-- One row per SaaS tenant (store owner). Auth is self-contained via PBKDF2.
CREATE TABLE IF NOT EXISTS owners (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  salt       TEXT NOT NULL,
  hash       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Sessions ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Stores ────────────────────────────────────────────────────────────────────
-- Each row is one tenant's storefront. Isolated by owner_id in all CRUD ops.
-- config (JSON): { name, theme, seo, features }
CREATE TABLE IF NOT EXISTS stores (
  id         TEXT PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  owner_id   TEXT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  config     TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Products ──────────────────────────────────────────────────────────────────
-- price_cents: stored as INTEGER to avoid floating-point errors.
-- metadata: JSON blob for dynamic attributes (size, color, material, …).
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  store_id    TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sku         TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  metadata    TEXT NOT NULL DEFAULT '{}',
  in_stock    INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(store_id, sku)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stores_slug    ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner   ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_sessions_owner ON sessions(owner_id);
