-- 0010_emails.sql
-- Email notification limits per owner (monthly, like push daily/weekly)
-- Apply: wrangler d1 execute maxcybersolutions-db --remote --file=migrations/0010_emails.sql

ALTER TABLE owners ADD COLUMN email_monthly_limit INTEGER NOT NULL DEFAULT 200;
ALTER TABLE owners ADD COLUMN email_monthly_used  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE owners ADD COLUMN email_monthly_reset TEXT    NOT NULL DEFAULT '';
