ALTER TABLE cart_items ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE cart_items ADD COLUMN private_offer_id UUID REFERENCES private_offers(id) ON DELETE SET NULL;
