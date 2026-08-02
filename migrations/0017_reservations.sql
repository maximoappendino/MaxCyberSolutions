-- Add reservation fields to orders table
ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'order';
ALTER TABLE orders ADD COLUMN reservation_at TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN reservation_slots INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN reservation_notes TEXT NOT NULL DEFAULT '';
