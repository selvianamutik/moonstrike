-- Add voucher_discount column to orders so the applied voucher amount is
-- visible in customer and admin order detail price breakdowns.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS voucher_discount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (voucher_discount >= 0);