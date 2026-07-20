ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'skrill';
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'qris';
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'crypto';

CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_label TEXT DEFAULT 'Tax',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER set_payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Seed initial settings
INSERT INTO payment_settings (method, enabled, tax_rate) VALUES 
  ('paypal', true, 0.0521),
  ('skrill', true, 0.0521),
  ('crypto', true, 0.0350),
  ('nowpayments', true, 0.0350),
  ('qris', true, 0.0000), 
  ('stripe', true, 0.0290),
  ('credit_card', true, 0.0290)
ON CONFLICT (method) DO UPDATE SET tax_rate = EXCLUDED.tax_rate;
