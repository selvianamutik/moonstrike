-- Add voucher_id to carts table
-- Allows associating a validated voucher directly with the server-side cart session
ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_carts_voucher_id ON carts(voucher_id);
