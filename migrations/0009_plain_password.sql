-- Store admin-visible plain-text passwords (admin feature only; clients cannot see these)
ALTER TABLE owners ADD COLUMN plain_password TEXT;
ALTER TABLE collaborators ADD COLUMN plain_password TEXT;
