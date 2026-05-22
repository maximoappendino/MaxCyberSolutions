-- Preview draft support + product images
-- Apply with: node scripts/migrate-local.js  (local dev)
--             npm run db:migrate              (production)

ALTER TABLE stores   ADD COLUMN preview_config TEXT;
ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT '';
