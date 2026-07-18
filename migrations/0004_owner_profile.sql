-- Owner profile, subscription limits, and admin flag
-- Apply: npm run db:migrate (remote) | npm run db:migrate:local (local dev)
--
-- After applying, set your own account as admin:
--   Remote: wrangler d1 execute maxcybersolutions-db --remote \
--           --command="UPDATE owners SET is_admin=1 WHERE email='your@email.com'"
--   Local:  wrangler d1 execute maxcybersolutions-db --local \
--           --command="UPDATE owners SET is_admin=1 WHERE email='your@email.com'"

ALTER TABLE owners ADD COLUMN name             TEXT    NOT NULL DEFAULT '';
ALTER TABLE owners ADD COLUMN brand            TEXT    NOT NULL DEFAULT '';
ALTER TABLE owners ADD COLUMN category         TEXT    NOT NULL DEFAULT '';
ALTER TABLE owners ADD COLUMN plan             TEXT    NOT NULL DEFAULT 'basic';
ALTER TABLE owners ADD COLUMN phone            TEXT    NOT NULL DEFAULT '';
ALTER TABLE owners ADD COLUMN address          TEXT    NOT NULL DEFAULT '';
ALTER TABLE owners ADD COLUMN description      TEXT    NOT NULL DEFAULT '';
ALTER TABLE owners ADD COLUMN payment_method   TEXT    NOT NULL DEFAULT '';
ALTER TABLE owners ADD COLUMN payment_notes    TEXT    NOT NULL DEFAULT '';
ALTER TABLE owners ADD COLUMN is_admin         INTEGER NOT NULL DEFAULT 0;
ALTER TABLE owners ADD COLUMN product_limit    INTEGER NOT NULL DEFAULT 50;
ALTER TABLE owners ADD COLUMN storage_limit_mb INTEGER NOT NULL DEFAULT 100;
ALTER TABLE owners ADD COLUMN storage_used_bytes INTEGER NOT NULL DEFAULT 0;
-- 'active' | 'paused' | 'archived'
-- paused:   storefront blocked, uploads blocked, data intact
-- archived: same as paused + all R2 images deleted to free storage
ALTER TABLE owners ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
