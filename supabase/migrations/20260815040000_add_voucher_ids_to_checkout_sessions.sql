-- Store the applied voucher IDs on the checkout session so fulfillment can
-- record single-use redemptions after payment is confirmed.
ALTER TABLE checkout_sessions
  ADD COLUMN IF NOT EXISTS voucher_ids TEXT;