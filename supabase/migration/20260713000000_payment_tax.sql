ALTER TABLE payment_settings 
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_label TEXT DEFAULT 'Tax';

-- Update existing rows based on the requirements
UPDATE payment_settings SET tax_rate = 0.0521 WHERE method = 'paypal';
UPDATE payment_settings SET tax_rate = 0.0521 WHERE method = 'skrill';
UPDATE payment_settings SET tax_rate = 0.0350 WHERE method = 'crypto';
UPDATE payment_settings SET tax_rate = 0.0000 WHERE method = 'qris';
UPDATE payment_settings SET tax_rate = 0.0290 WHERE method = 'stripe'; -- Default stripe assumption, admin can change
