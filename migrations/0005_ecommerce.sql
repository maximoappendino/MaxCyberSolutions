-- 0005_ecommerce.sql
-- Orders, payments, shipping dimensions, onboarding
-- Apply: wrangler d1 execute maxcybersolutions-db --remote --file=migrations/0005_ecommerce.sql

CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  store_id          TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending',
  -- pending | awaiting_transfer | paid | processing | shipped | delivered | cancelled
  customer_name     TEXT NOT NULL DEFAULT '',
  customer_email    TEXT NOT NULL DEFAULT '',
  customer_phone    TEXT NOT NULL DEFAULT '',
  shipping_address  TEXT NOT NULL DEFAULT '',
  shipping_zip      TEXT NOT NULL DEFAULT '',
  shipping_city     TEXT NOT NULL DEFAULT '',
  shipping_province TEXT NOT NULL DEFAULT '',
  shipping_method   TEXT NOT NULL DEFAULT '',
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  subtotal_cents    INTEGER NOT NULL DEFAULT 0,
  total_cents       INTEGER NOT NULL DEFAULT 0,
  payment_method    TEXT NOT NULL DEFAULT '',
  payment_id        TEXT NOT NULL DEFAULT '',
  mp_preference_id  TEXT NOT NULL DEFAULT '',
  notes             TEXT NOT NULL DEFAULT '',
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL DEFAULT '',
  sku         TEXT NOT NULL DEFAULT '',
  name        TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  image       TEXT NOT NULL DEFAULT ''
);

-- Platform subscriptions (Maximo's clients paying for the service)
CREATE TABLE IF NOT EXISTS subscriptions (
  id               TEXT PRIMARY KEY,
  owner_id         TEXT REFERENCES owners(id) ON DELETE SET NULL,
  plan             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  mp_preference_id TEXT NOT NULL DEFAULT '',
  mp_payment_id    TEXT NOT NULL DEFAULT '',
  amount_cents     INTEGER NOT NULL DEFAULT 0,
  payer_email      TEXT NOT NULL DEFAULT '',
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_store    ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_ord ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_subs_owner      ON subscriptions(owner_id);

-- Store: payment & shipping origin settings
ALTER TABLE stores ADD COLUMN mp_public_key   TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN mp_access_token TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN cbu_cvu         TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN bank_name       TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN bank_holder     TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN store_address   TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN store_zip       TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN store_city      TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN store_province  TEXT NOT NULL DEFAULT '';

-- Products: shipping dimensions for MercadoEnvíos / Andreani
ALTER TABLE products ADD COLUMN weight_grams INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN width_cm     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN height_cm    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN depth_cm     INTEGER NOT NULL DEFAULT 0;

-- Owners: onboarding (DEFAULT 1 = existing owners already onboarded)
ALTER TABLE owners ADD COLUMN onboarded           INTEGER NOT NULL DEFAULT 1;
ALTER TABLE owners ADD COLUMN pending_setup_token TEXT    NOT NULL DEFAULT '';
