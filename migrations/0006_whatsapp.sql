-- WhatsApp contact button for storefront cart
ALTER TABLE stores ADD COLUMN whatsapp_number  TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN whatsapp_message TEXT NOT NULL DEFAULT '';
