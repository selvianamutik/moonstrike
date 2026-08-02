-- =============================================================================
-- Refactor chat: order-based → customer-based
-- 1. Hapus semua data chat lama (fresh start)
-- 2. Hapus kolom order_id dari support_tickets
-- 3. Tambah reply_to_id di messages
-- 4. Update unique constraints
-- =============================================================================

-- 1. Hapus semua data chat lama
DELETE FROM messages;
DELETE FROM support_tickets;

-- 2. Hapus unique constraint lama yang berbasis order
DROP INDEX IF EXISTS uniq_support_tickets_customer_order;

-- 3. Hapus kolom order_id (tidak dibutuhkan lagi)
ALTER TABLE support_tickets DROP COLUMN IF EXISTS order_id;

-- 4. Tambah kolom reply_to_id di messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);

-- 5. Re-create unique constraint untuk 1 ticket per customer (tanpa order filter)
DROP INDEX IF EXISTS uniq_support_tickets_customer_general;
CREATE UNIQUE INDEX uniq_support_tickets_customer_general
  ON support_tickets(user_id)
  WHERE user_id IS NOT NULL;
