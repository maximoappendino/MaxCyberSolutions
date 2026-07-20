-- 0011_variants_customers_reviews.sql
-- Apply: wrangler d1 execute maxcybersolutions-db --remote --file=migrations/0011_variants_customers_reviews.sql

-- ── Store type ─────────────────────────────────────────────────────────────────
ALTER TABLE stores ADD COLUMN store_type TEXT NOT NULL DEFAULT 'ecommerce';
-- ecommerce | services | memberships | reservations

-- ── Product variants ──────────────────────────────────────────────────────────
-- Options define the axes (Size, Color, Material, etc.) and their possible values
CREATE TABLE IF NOT EXISTS variant_options (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,           -- "Size", "Color", "Material"
  option_values TEXT NOT NULL DEFAULT '[]', -- JSON array: ["S","M","L"]
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_vo_product ON variant_options(product_id);

-- Variants are specific combinations (S/Red/Cotton) with their own price + stock
CREATE TABLE IF NOT EXISTS product_variants (
  id          TEXT PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku         TEXT NOT NULL DEFAULT '',
  combination TEXT NOT NULL DEFAULT '{}', -- JSON: {"Size":"M","Color":"Red"}
  price_cents INTEGER,                    -- NULL = inherit product price
  stock       INTEGER NOT NULL DEFAULT -1 -- -1 = unlimited
);
CREATE INDEX IF NOT EXISTS idx_pv_product ON product_variants(product_id);

-- Inventory log (optional, for stock movement history)
CREATE TABLE IF NOT EXISTS inventory_log (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  delta      INTEGER NOT NULL,  -- +N added, -N sold/removed
  reason     TEXT NOT NULL DEFAULT '', -- 'sale','restock','correction'
  order_id   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inv_product ON inventory_log(product_id);

-- ── Customers ─────────────────────────────────────────────────────────────────
-- Global customer identity (email is the unique key)
CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  address    TEXT NOT NULL DEFAULT '',
  city       TEXT NOT NULL DEFAULT '',
  province   TEXT NOT NULL DEFAULT '',
  zip        TEXT NOT NULL DEFAULT '',
  notes      TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cust_email ON customers(email);

-- Per-store customer relationship (discount groups, store-specific notes)
CREATE TABLE IF NOT EXISTS store_customers (
  id           TEXT PRIMARY KEY,
  store_id     TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id  TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  discount_pct INTEGER NOT NULL DEFAULT 0,  -- 0-100 percentage
  group_name   TEXT NOT NULL DEFAULT '',    -- "VIP", "Wholesale", etc.
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(store_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_sc_store    ON store_customers(store_id);
CREATE INDEX IF NOT EXISTS idx_sc_customer ON store_customers(customer_id);

-- ── Product reviews ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_reviews (
  id             TEXT PRIMARY KEY,
  product_id     TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id       TEXT NOT NULL,
  customer_name  TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '',
  rating         INTEGER NOT NULL DEFAULT 5, -- 1-5
  comment        TEXT NOT NULL DEFAULT '',
  visible        INTEGER NOT NULL DEFAULT 1, -- 0 = hidden by owner
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rev_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_rev_store   ON product_reviews(store_id);

-- Add stock tracking to products table directly (for simple non-variant inventory)
ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT -1; -- -1 = unlimited
ALTER TABLE products ADD COLUMN track_stock INTEGER NOT NULL DEFAULT 0; -- 0 = no tracking
