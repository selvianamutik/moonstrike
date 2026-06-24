-- =============================================================================
-- MOONSTRIKE — Initial Database Migration (Idempotent)
-- Generated from MOONSTRIKE_AGENTS.md (§6 Data Models + §13 RLS Policies)
-- Updated: genres table + service_categories table replace freeform TEXT fields
--
-- Safe to run multiple times — every statement is guarded against duplicates.
-- Run in your Supabase SQL editor or via `supabase db push`.
-- =============================================================================

-- ── EXTENSIONS ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- SECTION 1 — ENUM TYPES
-- Each wrapped in a DO block to skip silently if the type already exists.
-- =============================================================================

DO $$ BEGIN CREATE TYPE game_status AS ENUM ('active', 'draft', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE service_status AS ENUM ('active', 'draft', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'in_progress', 'delivered',
  'completed', 'refund_requested', 'refunded'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payment_provider AS ENUM ('stripe', 'nowpayments');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE region_value AS ENUM ('USA', 'EUROPE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE admin_status AS ENUM ('active', 'suspended', 'banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE sender_role AS ENUM ('admin', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE actor_type AS ENUM ('admin', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE audit_status AS ENUM ('success', 'critical', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE content_block_type AS ENUM (
  'hero', 'stats_bar', 'benefits_section', 'steps_section'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE cms_status AS ENUM ('active', 'scheduled', 'draft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE media_asset_type AS ENUM ('image', 'video');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE currency_code AS ENUM ('USD', 'EUR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================================
-- SECTION 2 — GENRES
-- Global lookup table. Admin-managed. Replaces the freeform genre TEXT column
-- on games. Seeded with canonical values; new genres added via admin UI.
-- =============================================================================

CREATE TABLE IF NOT EXISTS genres (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,  -- Stored uppercase. e.g. "ACTION RPG", "MMORPG"
  slug       TEXT        NOT NULL,  -- URL-safe. e.g. "action-rpg", "mmorpg"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT genres_name_unique UNIQUE (name),
  CONSTRAINT genres_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres (slug);

-- Seed canonical genres — skipped silently if already present
INSERT INTO genres (name, slug) VALUES
  ('ACTION RPG',       'action-rpg'),
  ('MMORPG',           'mmorpg'),
  ('FPS',              'fps'),
  ('MOBA',             'moba'),
  ('TACTICAL SHOOTER', 'tactical-shooter'),
  ('BATTLE ROYALE',    'battle-royale'),
  ('LOOTER SHOOTER',   'looter-shooter'),
  ('SPORTS ACTION',    'sports-action')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 3 — CORE CATALOGUE TABLES
-- =============================================================================

-- ── GAMES ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS games (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  image       TEXT        NOT NULL,
  genre_id    UUID        NOT NULL REFERENCES genres (id) ON DELETE RESTRICT,
    -- FK to genres. ON DELETE RESTRICT: a genre cannot be deleted while games reference it.
    -- Admin must re-assign all affected games to a different genre first.
  platforms   TEXT[]      NOT NULL DEFAULT '{}',
    -- "PC" | "Console" | "Cross-play"
  description TEXT        NOT NULL DEFAULT '',
  status      game_status NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- UPGRADE PATCH — Existing DB support for games.genre TEXT -> games.genre_id UUID
-- Fresh installs already have genre_id from CREATE TABLE. Existing installs may
-- still have the old games.genre TEXT column, so this patch backfills genre_id.
-- =============================================================================

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS genre_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'games'
      AND column_name = 'genre'
  ) THEN
    EXECUTE $sql$
      UPDATE public.games g
      SET genre_id = ge.id
      FROM public.genres ge
      WHERE g.genre_id IS NULL
        AND (
          UPPER(TRIM(g.genre)) = ge.name
          OR LOWER(
            REGEXP_REPLACE(
              REGEXP_REPLACE(TRIM(g.genre), '[^a-zA-Z0-9\s-]', '', 'g'),
              '\s+',
              '-',
              'g'
            )
          ) = ge.slug
        )
    $sql$;
  END IF;
END $$;

-- Fallback for existing rows whose old genre value did not match the seed list.
-- Change 'mmorpg' here if you prefer a different default fallback.
UPDATE public.games
SET genre_id = (
  SELECT id
  FROM public.genres
  WHERE slug = 'mmorpg'
  LIMIT 1
)
WHERE genre_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'games_genre_id_fkey'
      AND conrelid = 'public.games'::regclass
  ) THEN
    ALTER TABLE public.games
    ADD CONSTRAINT games_genre_id_fkey
    FOREIGN KEY (genre_id)
    REFERENCES public.genres (id)
    ON DELETE RESTRICT;
  END IF;
END $$;

ALTER TABLE public.games
ALTER COLUMN genre_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_games_status   ON games (status);
CREATE INDEX IF NOT EXISTS idx_games_slug     ON games (slug);
CREATE INDEX IF NOT EXISTS idx_games_genre_id ON games (genre_id);


-- ── SERVICE CATEGORIES ────────────────────────────────────────────────────────
-- Per-game lookup table. Admin-managed via /admin/services.
-- Replaces the freeform service_category TEXT column on services.
-- "hot-offers" is a reserved slug — enforced by CHECK constraint.

CREATE TABLE IF NOT EXISTS service_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     UUID        NOT NULL REFERENCES games (id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: deleting a game removes all its service categories.
  name        TEXT        NOT NULL,
    -- Display name shown in tabs and admin UI. e.g. "Dungeon", "Rank Boost"
  slug        TEXT        NOT NULL,
    -- URL-safe. e.g. "dungeon", "rank-boost". Unique per game.
    -- Auto-generated from name; admin can override.
    -- Generation rule: lowercase, spaces → hyphens, strip non-alphanumeric except hyphens.
  sort_order  INTEGER     NOT NULL DEFAULT 0,
    -- Controls tab display order. Lower = further left. Admin can drag-reorder.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT service_categories_slug_per_game UNIQUE (game_id, slug),
  CONSTRAINT service_categories_reserved_slug CHECK  (slug <> 'hot-offers')
    -- 'hot-offers' is permanently reserved for the HOT OFFERS hardcoded tab.
);

CREATE INDEX IF NOT EXISTS idx_service_categories_game_id    ON service_categories (game_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_sort_order ON service_categories (game_id, sort_order);


-- ── SERVICES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id             UUID            NOT NULL REFERENCES games (id) ON DELETE RESTRICT,
  title               TEXT            NOT NULL,
  slug                TEXT            NOT NULL,
  image               TEXT            NOT NULL,
  description         TEXT            NOT NULL DEFAULT '',
  service_category_id UUID            REFERENCES service_categories (id) ON DELETE SET NULL,
    -- FK to service_categories. NULL allowed for drafts not yet assigned a category.
    -- ON DELETE SET NULL: if a category is deleted, affected services become uncategorised
    -- and must be re-assigned before they can be (re-)published.
    -- Validation rule: must be set before status can be set to 'active'.
  status              service_status  NOT NULL DEFAULT 'draft',
  is_hot_offer        BOOLEAN         NOT NULL DEFAULT FALSE,
  hot_offer_at        TIMESTAMPTZ,
    -- Set to NOW() when is_hot_offer toggled on; cleared to NULL when toggled off.
    -- Managed by the sync_hot_offer_at trigger — do not set manually.
  region              region_value[]  NOT NULL DEFAULT '{"USA","EUROPE"}',
  badges              TEXT[]          NOT NULL DEFAULT '{}',
    -- Options: "Starts in < 15 mins" | "100% Completion" | "Safe & Secure" | "24/7 Support"
  requirements        TEXT[]          NOT NULL DEFAULT '{}',
  what_you_get        JSONB           NOT NULL DEFAULT '[]',
    -- Benefit[]: [{ icon: string, title: string, description: string }]
  base_price_usd      NUMERIC(10, 2)  NOT NULL DEFAULT 0,
  base_price_eur      NUMERIC(10, 2)  NOT NULL DEFAULT 0,
  options_schema      JSONB           NOT NULL DEFAULT '[]',
    -- ServiceOption[]: see §6 of MOONSTRIKE_AGENTS.md for full shape
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  UNIQUE (game_id, slug),

  CONSTRAINT service_active_requires_category CHECK (
    status <> 'active' OR service_category_id IS NOT NULL
  )
    -- A service cannot be published (status = 'active') without a category assigned.
);


-- =============================================================================
-- UPGRADE PATCH — Existing DB support for services.service_category TEXT ->
-- service_categories rows + services.service_category_id UUID
-- Fresh installs already have service_category_id from CREATE TABLE. Existing
-- installs may still have the old services.service_category TEXT column.
-- =============================================================================

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS service_category_id UUID;

-- Create lookup categories from old freeform service_category values, if the old
-- column exists. The reserved 'hot-offers' slug is intentionally not inserted.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services'
      AND column_name = 'service_category'
  ) THEN
    EXECUTE $sql$
      INSERT INTO public.service_categories (game_id, name, slug, sort_order)
      SELECT DISTINCT
        s.game_id,
        TRIM(s.service_category) AS name,
        LOWER(
          REGEXP_REPLACE(
            REGEXP_REPLACE(TRIM(s.service_category), '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+',
            '-',
            'g'
          )
        ) AS slug,
        0 AS sort_order
      FROM public.services s
      WHERE s.service_category IS NOT NULL
        AND TRIM(s.service_category) <> ''
        AND LOWER(
          REGEXP_REPLACE(
            REGEXP_REPLACE(TRIM(s.service_category), '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+',
            '-',
            'g'
          )
        ) <> 'hot-offers'
      ON CONFLICT (game_id, slug) DO NOTHING
    $sql$;

    EXECUTE $sql$
      UPDATE public.services s
      SET service_category_id = sc.id
      FROM public.service_categories sc
      WHERE s.service_category_id IS NULL
        AND sc.game_id = s.game_id
        AND LOWER(
          REGEXP_REPLACE(
            REGEXP_REPLACE(TRIM(s.service_category), '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+',
            '-',
            'g'
          )
        ) = sc.slug
    $sql$;
  END IF;
END $$;

-- Fallback category for any existing services that still could not be matched,
-- including old rows whose service_category was 'hot-offers'. This keeps active
-- services valid without using the reserved hot-offers category slug.
INSERT INTO public.service_categories (game_id, name, slug, sort_order)
SELECT DISTINCT
  s.game_id,
  'Uncategorized' AS name,
  'uncategorized' AS slug,
  999 AS sort_order
FROM public.services s
WHERE s.service_category_id IS NULL
ON CONFLICT (game_id, slug) DO NOTHING;

UPDATE public.services s
SET service_category_id = sc.id
FROM public.service_categories sc
WHERE s.service_category_id IS NULL
  AND sc.game_id = s.game_id
  AND sc.slug = 'uncategorized';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'services_service_category_id_fkey'
      AND conrelid = 'public.services'::regclass
  ) THEN
    ALTER TABLE public.services
    ADD CONSTRAINT services_service_category_id_fkey
    FOREIGN KEY (service_category_id)
    REFERENCES public.service_categories (id)
    ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'services_game_id_slug_key'
      AND conrelid = 'public.services'::regclass
  ) THEN
    ALTER TABLE public.services
    ADD CONSTRAINT services_game_id_slug_key UNIQUE (game_id, slug);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'service_active_requires_category'
      AND conrelid = 'public.services'::regclass
  ) THEN
    ALTER TABLE public.services
    ADD CONSTRAINT service_active_requires_category CHECK (
      status <> 'active' OR service_category_id IS NOT NULL
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validate_service_category_game()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.service_category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.service_categories sc
    WHERE sc.id = NEW.service_category_id
      AND sc.game_id = NEW.game_id
  ) THEN
    RAISE EXCEPTION 'service_category_id must belong to the same game as the service';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_service_category_game ON public.services;

CREATE TRIGGER trg_validate_service_category_game
  BEFORE INSERT OR UPDATE OF game_id, service_category_id ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.validate_service_category_game();

CREATE INDEX IF NOT EXISTS idx_services_game_id             ON services (game_id);
CREATE INDEX IF NOT EXISTS idx_services_status              ON services (status);
CREATE INDEX IF NOT EXISTS idx_services_service_category_id ON services (service_category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_hot_offer        ON services (is_hot_offer) WHERE is_hot_offer = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_hot_offer_at        ON services (hot_offer_at DESC NULLS LAST);


-- =============================================================================
-- SECTION 4 — CART & CHECKOUT TABLES
-- =============================================================================

-- ── CARTS ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS carts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users (id) ON DELETE CASCADE,
  session_id TEXT,
    -- ms_cart_session cookie value (anonymous carts, 30-day TTL). Cleared after login merge.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_cart UNIQUE (user_id),
  CONSTRAINT cart_has_owner CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL     AND session_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id    ON carts (user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts (session_id);


-- ── CART ITEMS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cart_items (
  id                        UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id                   UUID           NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  service_id                UUID           NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  selected_options          JSONB          NOT NULL DEFAULT '{}',
    -- Live user selections: { [optionLabel]: value }
  selected_options_snapshot JSONB          NOT NULL DEFAULT '{}',
    -- Frozen at add-to-cart: { [optionLabel]: { value, priceUSD, priceEUR } }
  price_usd                 NUMERIC(10, 2) NOT NULL,
  price_eur                 NUMERIC(10, 2) NOT NULL,
  added_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id    ON cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_service_id ON cart_items (service_id);


-- =============================================================================
-- SECTION 5 — ORDERS
-- Orders only exist post-payment. No pre-payment state.
-- =============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id                        UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_item_id              UUID             REFERENCES cart_items (id) ON DELETE SET NULL,
  service_id                UUID             NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  user_id                   UUID             NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  checkout_session_id       TEXT             NOT NULL,
    -- Stripe Payment Intent ID or NowPayments payment ID.
    -- Groups all Orders from the same payment.
    -- Used by /order-confirmed?session=[id] to fetch all sibling orders.
  selected_options_snapshot JSONB            NOT NULL DEFAULT '{}',
    -- Copied from CartItem.selected_options_snapshot at checkout.
    -- Use this for all display, history, and Google Sheets writes.
  total                     NUMERIC(10, 2)   NOT NULL,
  currency                  currency_code    NOT NULL,
  region                    region_value     NOT NULL,
    -- Single value — whichever was active at checkout
  payment_provider          payment_provider NOT NULL,
  stripe_payment_intent_id  TEXT,
  nowpayments_payment_id    TEXT,
  crypto_refund_address     TEXT,
    -- Collected at refund request time for NowPayments orders
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

CREATE INDEX IF NOT EXISTS idx_orders_user_id             ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session_id ON orders (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status              ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_service_id          ON orders (service_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at          ON orders (created_at DESC);


-- =============================================================================
-- SECTION 6 — ADMIN USERS
-- Custom auth — scrypt password hash + signed JWT. NOT Supabase Auth.
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  TEXT         NOT NULL,
  email         TEXT         NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,  -- scrypt hash — never plain text
  role          TEXT         NOT NULL DEFAULT 'ADMIN' CHECK (role = 'ADMIN'),
  status        admin_status NOT NULL DEFAULT 'active',
  avatar        TEXT         NOT NULL DEFAULT '',
  last_login    TIMESTAMPTZ,
  known_devices TEXT[]       NOT NULL DEFAULT '{}',
    -- Reserved for future trusted-device/session metadata. Admin OTP is not used.
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email  ON admin_users (email);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users (status);


-- =============================================================================
-- SECTION 7 — SUPPORT CHAT
-- SupportTicket → Message (separate table required for Supabase Realtime)
-- =============================================================================

-- ── SUPPORT TICKETS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID          REFERENCES orders (id) ON DELETE SET NULL,
  user_id    UUID          REFERENCES auth.users (id) ON DELETE SET NULL,
  session_id TEXT,
    -- ms_chat_session cookie value (anonymous users, 1-hour TTL).
    -- Cleared after login merge. Independent of the cart session cookie.
  subject    TEXT          NOT NULL,
  status     ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT ticket_has_owner CHECK (
    user_id IS NOT NULL OR session_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id    ON support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order_id   ON support_tickets (order_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_session_id ON support_tickets (session_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON support_tickets (status);


-- ── MESSAGES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES support_tickets (id) ON DELETE CASCADE,
  sender_id   TEXT        NOT NULL,
    -- auth.users UUID or admin_users UUID stored as string
  sender_role sender_role NOT NULL,
  content     TEXT        NOT NULL,
  attachments JSONB       NOT NULL DEFAULT '[]',
    -- Attachment[]: [{ filename: string, sizeBytes: number, url: string }]
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages (ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at   ON messages (sent_at);

-- Idempotent: setting REPLICA IDENTITY on an already-configured table is a no-op
ALTER TABLE messages REPLICA IDENTITY FULL;


-- =============================================================================
-- SECTION 8 — AUDIT LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actor_id    UUID,        -- admin_users.id; NULL for system events
  actor_type  actor_type   NOT NULL,
  actor_label TEXT         NOT NULL,
    -- Admin display name for admin actions.
    -- "System (Cron)" or "System (Webhook)" for system events.
  action      TEXT         NOT NULL,
  ip_address  INET,        -- NULL for system events
  status      audit_status NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id  ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status    ON audit_logs (status);


-- =============================================================================
-- SECTION 9 — CMS TABLES
-- =============================================================================

-- ── CONTENT BLOCKS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_blocks (
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

CREATE INDEX IF NOT EXISTS idx_content_blocks_type   ON content_blocks (type);
CREATE INDEX IF NOT EXISTS idx_content_blocks_status ON content_blocks (status);


-- ── PROMO BANNERS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS promo_banners (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT           NOT NULL,
  image        TEXT           NOT NULL,
  game_id      UUID           REFERENCES games (id) ON DELETE SET NULL,
    -- NULL = global/default banner (fallback when no game-specific banner matches).
    -- If set, banner only shows on that game's services page.
  region       region_value[] NOT NULL DEFAULT '{"USA","EUROPE"}',
  link         TEXT,
  status       cms_status     NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  modified_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_by   UUID           NOT NULL REFERENCES admin_users (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_promo_banners_game_id ON promo_banners (game_id);
CREATE INDEX IF NOT EXISTS idx_promo_banners_status  ON promo_banners (status);


-- ── MEDIA ASSETS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_assets (
  id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  filename    TEXT             NOT NULL,
  url         TEXT             NOT NULL,  -- Cloudflare CDN URL
  type        media_asset_type NOT NULL,
  size_bytes  BIGINT           NOT NULL,
  used_in     JSONB            NOT NULL DEFAULT '[]',
    -- { type: "content_block" | "promo_banner", id: string }[]
    -- Delete is blocked at the application layer if this array is non-empty.
  uploaded_at TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  uploaded_by UUID             NOT NULL REFERENCES admin_users (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_media_assets_type        ON media_assets (type);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_at ON media_assets (uploaded_at DESC);


-- =============================================================================
-- SECTION 10 — SYSTEM SETTINGS (SINGLETON)
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id                 TEXT PRIMARY KEY DEFAULT 'singleton' CHECK (id = 'singleton'),
  admin_display_name TEXT NOT NULL DEFAULT '',
  admin_email        TEXT NOT NULL DEFAULT '',
  admin_avatar       TEXT NOT NULL DEFAULT ''
);

INSERT INTO system_settings (id)
VALUES ('singleton')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- SECTION 11 — UPDATED_AT TRIGGERS
-- DROP IF EXISTS + CREATE is the correct idempotency pattern for triggers
-- (PostgreSQL has no CREATE TRIGGER IF NOT EXISTS).
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_games_updated_at           ON games;
DROP TRIGGER IF EXISTS trg_services_updated_at        ON services;
DROP TRIGGER IF EXISTS trg_carts_updated_at           ON carts;
DROP TRIGGER IF EXISTS trg_orders_updated_at          ON orders;
DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON support_tickets;

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
-- SECTION 12 — HOT OFFER TRIGGER
-- Auto-sets hot_offer_at when is_hot_offer is toggled on; clears it when off.
-- Do not set hot_offer_at manually — let this trigger manage it.
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_hot_offer_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_hot_offer = TRUE
     AND (TG_OP = 'INSERT' OR OLD.is_hot_offer = FALSE OR OLD.is_hot_offer IS NULL)
  THEN
    NEW.hot_offer_at = COALESCE(NEW.hot_offer_at, NOW());
  ELSIF NEW.is_hot_offer = FALSE THEN
    NEW.hot_offer_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_services_hot_offer_at ON services;

CREATE TRIGGER trg_services_hot_offer_at
  BEFORE INSERT OR UPDATE OF is_hot_offer ON services
  FOR EACH ROW EXECUTE FUNCTION sync_hot_offer_at();


-- =============================================================================
-- SECTION 13 — ROW LEVEL SECURITY (RLS)
-- Enabling RLS on an already-enabled table is a no-op — safe to re-run.
-- Policies use DROP IF EXISTS + CREATE (no CREATE POLICY IF NOT EXISTS in PG).
-- =============================================================================

ALTER TABLE genres             ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE games              ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_banners      ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings    ENABLE ROW LEVEL SECURITY;

-- ── GENRES ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_genres"        ON genres;
DROP POLICY IF EXISTS "service_role_write_genres" ON genres;

CREATE POLICY "public_read_genres"
ON genres FOR SELECT USING (true);

CREATE POLICY "service_role_write_genres"
ON genres FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── SERVICE CATEGORIES ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_service_categories"        ON service_categories;
DROP POLICY IF EXISTS "service_role_write_service_categories" ON service_categories;

CREATE POLICY "public_read_service_categories"
ON service_categories FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.games g
    WHERE g.id = service_categories.game_id
      AND g.status = 'active'
  )
);

CREATE POLICY "service_role_write_service_categories"
ON service_categories FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── GAMES ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_active_games"  ON games;
DROP POLICY IF EXISTS "service_role_write_games"  ON games;

CREATE POLICY "public_read_active_games"
ON games FOR SELECT USING (status = 'active');

CREATE POLICY "service_role_write_games"
ON games FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── SERVICES ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_active_services"  ON services;
DROP POLICY IF EXISTS "service_role_write_services"  ON services;

CREATE POLICY "public_read_active_services"
ON services FOR SELECT
USING (
  status = 'active'
  AND EXISTS (
    SELECT 1
    FROM public.games g
    WHERE g.id = services.game_id
      AND g.status = 'active'
  )
);

CREATE POLICY "service_role_write_services"
ON services FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── ORDERS ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "customer_read_own_orders"    ON orders;
DROP POLICY IF EXISTS "service_role_insert_orders"  ON orders;
DROP POLICY IF EXISTS "service_role_update_orders"  ON orders;

-- Authenticated customers read only their own orders
CREATE POLICY "customer_read_own_orders"
ON orders FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Only the service role can create orders (via payment webhook)
CREATE POLICY "service_role_insert_orders"
ON orders FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Only the service role can update orders (status transitions, refunds)
CREATE POLICY "service_role_update_orders"
ON orders FOR UPDATE
USING (auth.role() = 'service_role');

-- ── CARTS ─────────────────────────────────────────────────────────────────────
-- NOTE: Anonymous cart operations go through server-side API routes (service
-- role key only) — the Supabase client is never used for anonymous cart I/O.

DROP POLICY IF EXISTS "customer_read_own_cart_auth"  ON carts;
DROP POLICY IF EXISTS "customer_insert_own_cart"     ON carts;
DROP POLICY IF EXISTS "customer_update_own_cart"     ON carts;

CREATE POLICY "customer_read_own_cart_auth"
ON carts FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "customer_insert_own_cart"
ON carts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "customer_update_own_cart"
ON carts FOR UPDATE
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ── CART ITEMS ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "customer_manage_own_cart_items" ON cart_items;

CREATE POLICY "customer_manage_own_cart_items"
ON cart_items FOR ALL
USING (
  cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
)
WITH CHECK (
  cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
);

-- ── SUPPORT TICKETS ───────────────────────────────────────────────────────────
-- NOTE: Anonymous ticket operations go through server-side API routes (service
-- role key only) — same pattern as the cart.

DROP POLICY IF EXISTS "customer_read_own_tickets" ON support_tickets;

CREATE POLICY "customer_read_own_tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- ── MESSAGES ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "customer_read_own_messages" ON messages;
DROP POLICY IF EXISTS "customer_send_own_messages" ON messages;

CREATE POLICY "customer_read_own_messages"
ON messages FOR SELECT
USING (
  ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
);

CREATE POLICY "customer_send_own_messages"
ON messages FOR INSERT
WITH CHECK (
  ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
  AND sender_role = 'customer'
  AND sender_id = auth.uid()::text
);

-- ── AUDIT LOGS ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "service_role_only_audit_logs" ON audit_logs;

CREATE POLICY "service_role_only_audit_logs"
ON audit_logs FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── ADMIN USERS ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "service_role_only_admin_users" ON admin_users;

CREATE POLICY "service_role_only_admin_users"
ON admin_users FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── MEDIA ASSETS ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "service_role_only_media_assets" ON media_assets;

CREATE POLICY "service_role_only_media_assets"
ON media_assets FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── SYSTEM SETTINGS ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "service_role_only_system_settings" ON system_settings;

CREATE POLICY "service_role_only_system_settings"
ON system_settings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── CONTENT BLOCKS ───────────────────────────────────────────────────────────
-- Storefront reads active blocks for CMS landing sections.

DROP POLICY IF EXISTS "public_read_active_content_blocks"  ON content_blocks;
DROP POLICY IF EXISTS "service_role_write_content_blocks"  ON content_blocks;

CREATE POLICY "public_read_active_content_blocks"
ON content_blocks FOR SELECT USING (status = 'active');

CREATE POLICY "service_role_write_content_blocks"
ON content_blocks FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ── PROMO BANNERS ─────────────────────────────────────────────────────────────
-- Storefront reads active banners for game services pages.

DROP POLICY IF EXISTS "public_read_active_promo_banners"  ON promo_banners;
DROP POLICY IF EXISTS "service_role_write_promo_banners"  ON promo_banners;

CREATE POLICY "public_read_active_promo_banners"
ON promo_banners FOR SELECT USING (status = 'active');

CREATE POLICY "service_role_write_promo_banners"
ON promo_banners FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');


-- =============================================================================
-- END OF MIGRATION
--
-- IMPORTANT:
--   All backend API routes that write to the database must use the Supabase
--   SERVICE ROLE KEY (never the anon key). This bypasses RLS intentionally
--   for trusted server-side operations. The anon key is for the frontend only.
--
-- Table creation order (dependency chain):
--   genres → games → service_categories → services → cart_items → orders
--
-- Next steps:
--   1. Run `supabase db push` or paste into the Supabase SQL editor
--   2. Set up env vars per §15 of MOONSTRIKE_AGENTS.md
--   3. Seed the single admin user: `npm run admin:seed`
--   4. Enable Supabase Realtime for the `messages` table in the dashboard
--      (Dashboard → Database → Replication → messages → enable)
-- =============================================================================