-- Add category and visibility fields to products.
-- category: free-text tag used for filtering and bulk edits.
-- visible:  0 = draft/hidden, 1 = public (default).

ALTER TABLE products ADD COLUMN category TEXT    NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN visible  INTEGER NOT NULL DEFAULT 1;
