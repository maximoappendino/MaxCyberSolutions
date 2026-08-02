-- Finance module: per-store bookkeeping

CREATE TABLE finance_categories (
  id         TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income','expense')),
  color      TEXT NOT NULL DEFAULT '#7a736a',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE finance_contacts (
  id           TEXT PRIMARY KEY,
  store_id     TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('client','provider')),
  name         TEXT NOT NULL,
  contact_info TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE finance_transactions (
  id                TEXT PRIMARY KEY,
  store_id          TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount            INTEGER NOT NULL CHECK (amount > 0),  -- in cents
  currency          TEXT NOT NULL DEFAULT 'ARS',
  occurred_at       TEXT NOT NULL,  -- YYYY-MM-DD
  category_id       TEXT REFERENCES finance_categories(id),
  contact_id        TEXT REFERENCES finance_contacts(id),
  linked_order_id   TEXT,
  payment_method    TEXT,
  receipt_asset_url TEXT,
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','voided')),
  voided_at         TEXT,
  void_reason       TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One income row per confirmed order (prevents webhook double-fire from double-counting)
CREATE UNIQUE INDEX idx_ftx_order_income
  ON finance_transactions(linked_order_id)
  WHERE linked_order_id IS NOT NULL AND type = 'income';

CREATE INDEX idx_ftx_store_date    ON finance_transactions(store_id, occurred_at DESC);
CREATE INDEX idx_ftx_store_contact ON finance_transactions(store_id, contact_id, occurred_at);
CREATE INDEX idx_fcat_store        ON finance_categories(store_id);
CREATE INDEX idx_fcon_store        ON finance_contacts(store_id, type);
