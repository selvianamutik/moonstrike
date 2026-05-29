-- =============================================================================
-- MOONSTRIKE — Initial Database Migration
-- Generated from MOONSTRIKE_AGENTS.md (§6 Data Models + §13 RLS Policies)
-- Run this in your Supabase SQL editor or via `supabase db push`
-- =============================================================================

-- ── EXTENSIONS ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()


-- =============================================================================
-- SECTION 1 — ENUM TYPES
-- =============================================================================

CREATE TYPE game_status       AS ENUM ('active', 'draft', 'archived');
CREATE TYPE service_status    AS ENUM ('active', 'draft', 'archived');
CREATE TYPE order_status      AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'delivered',
  'completed',
  'refund_requested',
  'refunded'
);
CREATE TYPE payment_provider  AS ENUM ('stripe', 'nowpayments');
CREATE TYPE region_value      AS ENUM ('USA', 'EUROPE');
CREATE TYPE admin_status      AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE ticket_status     AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE sender_role       AS ENUM ('admin', 'customer');
CREATE TYPE actor_type        AS ENUM ('admin', 'system');
CREATE TYPE audit_status      AS ENUM ('success', 'critical', 'blocked');
CREATE TYPE content_block_type AS ENUM (
  'hero',
  'stats_bar',
  'benefits_section',
  'steps_section'
);
CREATE TYPE cms_status        AS ENUM ('active', 'scheduled', 'draft');
CREATE TYPE media_asset_type  AS ENUM ('image', 'video');
CREATE TYPE currency_code     AS ENUM ('USD', 'EUR');


-- =============================================================================
-- SECTION 2 — CORE CATALOGUE TABLES
-- =============================================================================

-- ── GAMES ─────────────────────────────────────────────────────────────────────

CREATE TABLE games (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT         NOT NULL,
  slug        TEXT         NOT NULL UNIQUE,
  image       TEXT         NOT NULL,
  genre       TEXT         NOT NULL,  -- "ACTION RPG" | "MMORPG" | "FPS" | etc.
  platforms   TEXT[]       NOT NULL DEFAULT '{}',
  description TEXT         NOT NULL DEFAULT '',
  status      game_status  NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_status ON games (status);
CREATE INDEX idx_games_slug   ON games (slug);
CREATE INDEX idx_games_genre  ON games (genre);


-- ── SERVICES ──────────────────────────────────────────────────────────────────

CREATE TABLE services (
  id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id          UUID            NOT NULL REFERENCES games (id) ON DELETE RESTRICT,
  title            TEXT            NOT NULL,
  slug             TEXT            NOT NULL,
  image            TEXT            NOT NULL,
  description      TEXT            NOT NULL DEFAULT '',
  service_category TEXT            NOT NULL,
    -- "Dungeon" | "Leveling" | "Raid" | "Stories" | "Coaching"
    -- "Rank Boost" | "Item Farm" | "Powerleveling" | "Placement Matches"
  status           service_status  NOT NULL DEFAULT 'draft',
  is_hot_offer     BOOLEAN         NOT NULL DEFAULT FALSE,
  hot_offer_at     TIMESTAMPTZ,            -- set to NOW() when toggled on, NULL when off
  region           region_value[]  NOT NULL DEFAULT '{"USA","EUROPE"}',
  badges           TEXT[]          NOT NULL DEFAULT '{}',
  requirements     TEXT[]          NOT NULL DEFAULT '{}',
  what_you_get     JSONB           NOT NULL DEFAULT '[]',
    -- Benefit[]: [{ icon, title, description }]
  base_price_usd   NUMERIC(10, 2)  NOT NULL DEFAULT 0,
  base_price_eur   NUMERIC(10, 2)  NOT NULL DEFAULT 0,
  options_schema   JSONB           NOT NULL DEFAULT '[]',
    -- ServiceOption[]: see §6 for full shape
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  UNIQUE (game_id, slug)
);

CREATE INDEX idx_services_game_id      ON services (game_id);
CREATE INDEX idx_services_status       ON services (status);
CREATE INDEX idx_services_is_hot_offer ON services (is_hot_offer) WHERE is_hot_offer = TRUE;
CREATE INDEX idx_services_hot_offer_at ON services (hot_offer_at DESC NULLS LAST);
CREATE INDEX idx_services_category     ON services (service_category);


-- =============================================================================
-- SECTION 3 — CART & CHECKOUT TABLES
-- =============================================================================

-- ── CARTS ─────────────────────────────────────────────────────────────────────

CREATE TABLE carts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users (id) ON DELETE CASCADE,
  session_id TEXT,       -- ms_cart_session cookie value (anonymous carts, 30-day TTL)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each authenticated user has at most one cart; session carts are keyed by session_id
  CONSTRAINT unique_user_cart    UNIQUE (user_id),
  CONSTRAINT cart_has_owner CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL     AND session_id IS NOT NULL)
  )
);

CREATE INDEX idx_carts_user_id    ON carts (user_id);
CREATE INDEX idx_carts_session_id ON carts (session_id);


-- ── CART ITEMS ────────────────────────────────────────────────────────────────

CREATE TABLE cart_items (
  id                         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id                    UUID           NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  service_id                 UUID           NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  selected_options           JSONB          NOT NULL DEFAULT '{}',
    -- Live user selections: { [optionLabel]: value }
  selected_options_snapshot  JSONB          NOT NULL DEFAULT '{}',
    -- Frozen at add-to-cart: { [optionLabel]: { value, priceUSD, priceEUR } }
  price_usd                  NUMERIC(10, 2) NOT NULL,
  price_eur                  NUMERIC(10, 2) NOT NULL,
  added_at                   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart_id    ON cart_items (cart_id);
CREATE INDEX idx_cart_items_service_id ON cart_items (service_id);


-- =============================================================================
-- SECTION 4 — ORDERS
-- =============================================================================

CREATE TABLE orders (
  id                        UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_item_id              UUID             REFERENCES cart_items (id) ON DELETE SET NULL,
  service_id                UUID             NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  user_id                   UUID             NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  checkout_session_id       TEXT             NOT NULL,
    -- Stripe Payment Intent ID or NowPayments payment ID.
    -- Groups all Orders from the same payment.
  selected_options_snapshot JSONB            NOT NULL DEFAULT '{}',
    -- Copied from CartItem at checkout. Use for all display and history.
  total                     NUMERIC(10, 2)   NOT NULL,
  currency                  currency_code    NOT NULL,
  region                    region_value     NOT NULL,
  payment_provider          payment_provider NOT NULL,
  stripe_payment_intent_id  TEXT,
  nowpayments_payment_id    TEXT,
  crypto_refund_address     TEXT,
  status                    order_status     NOT NULL DEFAULT 'pending',
  delivered_at              TIMESTAMPTZ,
  refund_requested_at       TIMESTAMPTZ,
  created_at                TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT stripe_id_when_stripe CHECK (
    payment_provider <> 'stripe' OR stripe_payment_intent_id IS NOT NULL
  ),
  CONSTRAINT nowpayments_id_when_crypto CHECK (
    payment_provider <> 'nowpayments' OR nowpayments_payment_id IS NOT NULL
  )
);

CREATE INDEX idx_orders_user_id             ON orders (user_id);
CREATE INDEX idx_orders_checkout_session_id ON orders (checkout_session_id);
CREATE INDEX idx_orders_status              ON orders (status);
CREATE INDEX idx_orders_service_id          ON orders (service_id);
CREATE INDEX idx_orders_created_at          ON orders (created_at DESC);


-- =============================================================================
-- SECTION 5 — ADMIN USERS
-- Custom auth — scrypt password hash + signed JWT. NOT Supabase Auth.
-- =============================================================================

CREATE TABLE admin_users (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name   TEXT         NOT NULL,
  email          TEXT         NOT NULL UNIQUE,
  password_hash  TEXT         NOT NULL,  -- scrypt hash — never plain text
  role           TEXT         NOT NULL DEFAULT 'ADMIN' CHECK (role = 'ADMIN'),
  status         admin_status NOT NULL DEFAULT 'active',
  avatar         TEXT         NOT NULL DEFAULT '',
  last_login     TIMESTAMPTZ,
  known_devices  TEXT[]       NOT NULL DEFAULT '{}',
    -- Reserved for future trusted-device/session metadata. Admin OTP is not used.
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email  ON admin_users (email);
CREATE INDEX idx_admin_users_status ON admin_users (status);


-- =============================================================================
-- SECTION 6 — SUPPORT CHAT
-- SupportTicket → Message (separate table for Supabase Realtime)
-- =============================================================================

-- ── SUPPORT TICKETS ───────────────────────────────────────────────────────────

CREATE TABLE support_tickets (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID          REFERENCES orders (id) ON DELETE SET NULL,
  user_id    UUID          REFERENCES auth.users (id) ON DELETE SET NULL,
  session_id TEXT,         -- ms_chat_session cookie (1-hour TTL, anonymous users)
  subject    TEXT          NOT NULL,
  status     ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT ticket_has_owner CHECK (
    user_id IS NOT NULL OR session_id IS NOT NULL
  )
);

CREATE INDEX idx_support_tickets_user_id   ON support_tickets (user_id);
CREATE INDEX idx_support_tickets_order_id  ON support_tickets (order_id);
CREATE INDEX idx_support_tickets_session_id ON support_tickets (session_id);
CREATE INDEX idx_support_tickets_status    ON support_tickets (status);


-- ── MESSAGES ──────────────────────────────────────────────────────────────────

CREATE TABLE messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES support_tickets (id) ON DELETE CASCADE,
  sender_id   TEXT        NOT NULL,  -- auth.users UUID or admin_users UUID (as string)
  sender_role sender_role NOT NULL,
  content     TEXT        NOT NULL,
  attachments JSONB       NOT NULL DEFAULT '[]',
    -- Attachment[]: [{ filename, sizeBytes, url }]
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_ticket_id ON messages (ticket_id);
CREATE INDEX idx_messages_sent_at   ON messages (sent_at);

-- Enable Realtime for live chat
ALTER TABLE messages REPLICA IDENTITY FULL;


-- =============================================================================
-- SECTION 7 — AUDIT LOGS
-- =============================================================================

CREATE TABLE audit_logs (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actor_id    UUID,        -- admin_users.id; NULL for system events
  actor_type  actor_type   NOT NULL,
  actor_label TEXT         NOT NULL,  -- display name or "System (Cron)" / "System (Webhook)"
  action      TEXT         NOT NULL,
  ip_address  INET,
  status      audit_status NOT NULL
);

CREATE INDEX idx_audit_logs_timestamp  ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_actor_id   ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_status     ON audit_logs (status);


-- =============================================================================
-- SECTION 8 — CMS TABLES
-- =============================================================================

-- ── CONTENT BLOCKS ────────────────────────────────────────────────────────────

CREATE TABLE content_blocks (
  id           UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT               NOT NULL,
  type         content_block_type NOT NULL,
  status       cms_status         NOT NULL DEFAULT 'draft',
  data         JSONB              NOT NULL DEFAULT '{}',
  thumbnail    TEXT,
  scheduled_at TIMESTAMPTZ,
  modified_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  created_by   UUID               NOT NULL REFERENCES admin_users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_content_blocks_type   ON content_blocks (type);
CREATE INDEX idx_content_blocks_status ON content_blocks (status);


-- ── PROMO BANNERS ─────────────────────────────────────────────────────────────

CREATE TABLE promo_banners (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  image        TEXT        NOT NULL,
  game_id      UUID        REFERENCES games (id) ON DELETE SET NULL,
    -- NULL = global/default banner (fallback when no game-specific banner matches)
  region       region_value[] NOT NULL DEFAULT '{"USA","EUROPE"}',
  link         TEXT,
  status       cms_status  NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  modified_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID        NOT NULL REFERENCES admin_users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_promo_banners_game_id ON promo_banners (game_id);
CREATE INDEX idx_promo_banners_status  ON promo_banners (status);


-- ── MEDIA ASSETS ──────────────────────────────────────────────────────────────

CREATE TABLE media_assets (
  id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  filename     TEXT             NOT NULL,
  url          TEXT             NOT NULL,  -- Cloudflare CDN URL
  type         media_asset_type NOT NULL,
  size_bytes   BIGINT           NOT NULL,
  used_in      JSONB            NOT NULL DEFAULT '[]',
    -- { type: "content_block" | "promo_banner", id: string }[]
    -- Delete is blocked if array is non-empty
  uploaded_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  uploaded_by  UUID             NOT NULL REFERENCES admin_users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_media_assets_type        ON media_assets (type);
CREATE INDEX idx_media_assets_uploaded_at ON media_assets (uploaded_at DESC);


-- =============================================================================
-- SECTION 9 — SYSTEM SETTINGS (SINGLETON)
-- =============================================================================

CREATE TABLE system_settings (
  id                  TEXT  PRIMARY KEY DEFAULT 'singleton' CHECK (id = 'singleton'),
  admin_display_name  TEXT  NOT NULL DEFAULT '',
  admin_email         TEXT  NOT NULL DEFAULT '',
  admin_avatar        TEXT  NOT NULL DEFAULT ''
);

-- Seed the singleton immediately
INSERT INTO system_settings (id)
VALUES ('singleton')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- SECTION 10 — UPDATED_AT TRIGGERS
-- Auto-update updated_at on every row change
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- SECTION 11 — HOT OFFER TRIGGER
-- Auto-sets hot_offer_at when is_hot_offer is toggled on; clears it when toggled off
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_hot_offer_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_hot_offer = TRUE AND (OLD.is_hot_offer = FALSE OR OLD.is_hot_offer IS NULL) THEN
    NEW.hot_offer_at = NOW();
  ELSIF NEW.is_hot_offer = FALSE THEN
    NEW.hot_offer_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_services_hot_offer_at
  BEFORE UPDATE OF is_hot_offer ON services
  FOR EACH ROW EXECUTE FUNCTION sync_hot_offer_at();


-- =============================================================================
-- SECTION 12 — ROW LEVEL SECURITY (RLS)
-- From §13 of MOONSTRIKE_AGENTS.md
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE games             ENABLE ROW LEVEL SECURITY;
ALTER TABLE services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_banners     ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings   ENABLE ROW LEVEL SECURITY;

-- ── ORDERS ───────────────────────────────────────────────────────────────────

-- Authenticated customers can read only their own orders
CREATE POLICY "customer_read_own_orders"
ON orders FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Only the service role can create orders (via webhook)
CREATE POLICY "service_role_insert_orders"
ON orders FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Only the service role can update orders (status transitions, refunds)
CREATE POLICY "service_role_update_orders"
ON orders FOR UPDATE
USING (auth.role() = 'service_role');

-- ── CARTS ─────────────────────────────────────────────────────────────────────

-- Authenticated users can read their own cart
CREATE POLICY "customer_read_own_cart_auth"
ON carts FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Authenticated users can create their own cart
CREATE POLICY "customer_insert_own_cart"
ON carts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own cart (e.g. updated_at)
CREATE POLICY "customer_update_own_cart"
ON carts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- NOTE: Anonymous cart operations (user_id = null) are handled entirely through
-- server-side API routes using the service role key. The Supabase client is never
-- used directly for anonymous cart reads or writes.

-- ── CART ITEMS ────────────────────────────────────────────────────────────────

CREATE POLICY "customer_manage_own_cart_items"
ON cart_items FOR ALL
USING (
  cart_id IN (
    SELECT id FROM carts WHERE user_id = auth.uid()
  )
);

-- ── SUPPORT TICKETS & MESSAGES ───────────────────────────────────────────────

-- Customers can only read their own tickets
CREATE POLICY "customer_read_own_tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Customers can only send messages on their own tickets
CREATE POLICY "customer_send_own_messages"
ON messages FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT id FROM support_tickets WHERE user_id = auth.uid()
  )
);

-- Customers can read messages on their own tickets
CREATE POLICY "customer_read_own_messages"
ON messages FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM support_tickets WHERE user_id = auth.uid()
  )
);

-- NOTE: Anonymous support ticket operations (user_id = null) go through
-- server-side API routes with the service role key — same pattern as the cart.

-- ── GAMES & SERVICES ─────────────────────────────────────────────────────────

-- Public read for active records only
CREATE POLICY "public_read_active_games"
ON games FOR SELECT
USING (status = 'active');

CREATE POLICY "public_read_active_services"
ON services FOR SELECT
USING (status = 'active');

-- Only service role can write
CREATE POLICY "service_role_write_games"
ON games FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_write_services"
ON services FOR ALL
USING (auth.role() = 'service_role');

-- ── ADMIN TABLES ─────────────────────────────────────────────────────────────
-- Audit logs, admin users, content blocks, promo banners, media, settings:
-- service role only (all admin mutations go through server-side API routes)

CREATE POLICY "service_role_only_audit_logs"
ON audit_logs FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_admin_users"
ON admin_users FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_content_blocks"
ON content_blocks FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_promo_banners"
ON promo_banners FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_media_assets"
ON media_assets FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_system_settings"
ON system_settings FOR ALL
USING (auth.role() = 'service_role');

-- Promo banners: public can read active ones (storefront fetches them)
CREATE POLICY "public_read_active_promo_banners"
ON promo_banners FOR SELECT
USING (status = 'active');

-- Content blocks: public can read active ones (storefront fetches CMS sections)
CREATE POLICY "public_read_active_content_blocks"
ON content_blocks FOR SELECT
USING (status = 'active');

-- =============================================================================
-- END OF MIGRATION
--
-- IMPORTANT:
--   All backend API routes that write to the database must use the Supabase
--   SERVICE ROLE KEY (never the anon key). This bypasses RLS intentionally
--   for trusted server-side operations. The anon key is for the frontend client only.
--
-- Next steps:
--   1. Run `supabase db push` or paste into the Supabase SQL editor
--   2. Set up env vars per §15 of MOONSTRIKE_AGENTS.md
--   3. Seed the single admin user via the seed script (scrypt hash the password)
--   4. Enable Supabase Realtime for the `messages` table in the dashboard
-- =============================================================================
