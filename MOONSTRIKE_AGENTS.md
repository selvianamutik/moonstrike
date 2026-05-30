# MOONSTRIKE — System Reference Document

> **Read this before touching any code.** Single source of truth for the project.
> Design references are stored in `/design-refs/`.

---

## Table of Contents

1. Project Overview
2. Design System
3. Storefront Pages
4. User Flows
5. Agent Rules
6. Data Models
7. Feature Progress Tracker
8. Stack & Decisions
9. File & Folder Structure
10. Admin Terminal
11. Order State Machine
12. Rate Limiting
13. Implementation Notes
14. Quality & Launch Checklist
15. Environment Variables

---

## 1. Project Overview

| Field | Value |
|---|---|
| Game card → `/[game-slug]/services` | Game card → `/[game-slug]` |
| Category tab switch → URL stays `/[game-slug]/services`, filter is internal state | Category tab switch → URL changes to `/[game-slug]/[service-category-slug]` |
| "All" tab renders all services | "All" tab renders at `/[game-slug]` with no category segment |

The page component, layout, and design do **not** change — only the URL structure and routing.

---

### 3.2 — Replace: Game Services Page

**Route:** `/[game-slug]` (base) · `/[game-slug]/[service-category-slug]` (filtered by category)

**Purpose:** Browse all boosting services for a specific game, filterable by service category.

| Section | Details |
|---|---|
| Navbar | Global |
| Page Header | Game name as title · Search input right-aligned (filters services within this game only) |
| Featured Game Banner | CMS-editable. Wide card with game art, game title left, USA/EUROPE toggle right. Schedulable. |
| Service Category Tabs | Scrollable pill tabs. HOT OFFERS is always first (hardcoded). Remaining tabs auto-populated from distinct `serviceCategory` values for this game. |
| Service Cards Grid | 2-row × 4-column initial load. Infinite scroll. Each card: HOT badge · image · title · description · price · Buy Now |
| TrustPilot Reviews | Same carousel component as landing page |
| Footer | Global |

**Featured Game Banner — query logic:**
1. Fetch active `PromoBanner` where `gameId = this game` and `region` includes the active region
2. If none found, fall back to a banner where `gameId IS NULL` and region matches (a default banner)
3. If still none found, hide the section entirely — do not render an empty card

**Service Category Tabs — important:**
`HOT OFFERS` is hardcoded — it filters by `isHotOffer = true`. It is **not** a `serviceCategory` value in the DB. Never query for `serviceCategory = "HOT OFFERS"` — that row will never exist. All other tabs (e.g. `DUNGEON · POWERLEVELING · RAID`) are auto-populated from the DB.

If no Game record matches `[game-slug]` → call `notFound()` to render the 404 page.

---

### 3.3 Games Page (`/games`)

**Purpose:** Browse all supported games with genre filtering.

**Layout:** Two-column — sidebar (left) + main content (right).

**Sidebar:**
- `All Games` link (clears all filters)
- `GENRES` multi-select tag pills — auto-populated from distinct `genre` values in the Game table: `ACTION RPG · MMORPG · FPS · MOBA · TACTICAL SHOOTER · BATTLE ROYALE · LOOTER SHOOTER · SPORTS ACTION`
- Selecting a genre filters the main grid to matching games. Multiple genres can be selected (OR logic — shows games matching any selected genre).

**Main Content:** All games header · Search input · 3-column game card grid · infinite scroll (auto-loads on scroll). Clicking a game card → `/[game-slug]/services`.

---

### 3.4 Hot Offers Page (`/hot-offers`)

**Purpose:** Dedicated deals page. Shows all services where `isHotOffer = true` across all games, filterable by game.

| Section | Details |
|---|---|
| Navbar | Global |
| Page Header | Title: `Hot Offers 🔥` · Subtitle: "Best deals across all games" |
| Game Tabs | Auto-populated from games that have at least one `isHotOffer = true` service: `ALL · [Game Name] · [Game Name] · ...`. ALL shown by default. |
| Service Cards Grid | Same card style as game services page. HOT badge on every card. Sorted by most recently marked as hot offer. Infinite scroll — auto-loads on scroll. |
| Footer | Global |

**Data source:** `Service WHERE isHotOffer = true AND status = "active"`, sorted by `hotOfferAt DESC`. Filtered by selected game tab.

---

### 3.5 Service Detail Page (`/[game-slug]/services/[service-slug]`)

**Purpose:** Full service view with configurator. Primary conversion page.

**Layout:** Two-column — detail (left) + sticky configurator sidebar (right).

**Left Column:**
1. Breadcrumb (game name, uppercase colored)
2. Title and description
3. Quick badges: rendered from `service.badges[]`
4. Service image (wide, rounded)
5. "What You Get" — 2x2 benefit cards (icon + title + description) from `service.whatYouGet[]`
6. Requirements checklist from `service.requirements[]`
7. "Why Choose Us" section (shared component)

**Right Column — "Configure Your Run" Sticky Sidebar:**
1. Option fields rendered from `optionsSchema` (see §6)
2. Currency selector (synced to global currency state)
3. Total price (live-calculated, cyan)
4. Two action buttons side by side: `Add to Cart` (outlined) + `Buy Now` (gradient)
   - Both add the configured service to cart
   - `Add to Cart` → adds silently, shows cart item count badge update
   - `Buy Now` → adds to cart then opens the cart page so customer reviews before proceeding to checkout

> All service content is admin-managed via CMS: title, description, badges, image, What You Get items, requirements list, and option schema. Nothing on this page is hardcoded.

If no Service record matches `[service-slug]` for the given game → call `notFound()` to render the 404 page.

---

### 3.6 Login & Register (`/login`, `/register`)

**Layout:** Centered card on full background. No navbar or footer.

**Login:** Logo + tagline · Login/Register tab toggle · Email · Password (eye toggle) · Forgot Password · Google OAuth divider · Login CTA.

**Register:** Username · Email · Password · Confirm Password · Google OAuth divider · Create Account CTA.

**Implementation:** Supabase Auth — `signUp` / `signInWithPassword` / `signInWithOAuth({ provider: 'google' })`. On success: redirect to previous page or `/profile`.

**Forgot Password flow:**
- "Forgot Password" link on login card → replaces card content with a "Reset Password" form (same card, same style — no new page)
- User enters email → Supabase sends reset link via Resend
- Reset link → opens a "Set New Password" form (same card style at `/reset-password`)
- On success: redirect to `/login`

**Email verification:**
- Supabase sends confirmation email on register via Resend
- Unverified users can: browse all pages, view services, view games
- Unverified users cannot: access `/profile`, add to cart, or proceed to checkout
- Unverified users see a banner: "Please verify your email to make purchases. [Resend email]"

---

### 3.7 Customer Profile (`/profile`)

**Layout:** Left sidebar (profile info) + main tabbed content.

**Sidebar:** Avatar · Username · Email · Member since · Total Orders + Total Spent · Edit Profile button · Logout.

**Edit Profile (`/profile/edit`):**
- Avatar: choose from app-generated initials avatar OR upload custom image (max 2MB, JPEG/PNG only, compressed before storing to Supabase Storage)
- Username: text input with real-time availability check
- Password: current password → new password → confirm new password fields
- Save Changes button (gradient) · Cancel (outlined → back to profile)

**Tab 1 — Order History (default):**
- Filter tabs: All · Pending · Confirmed · In Progress · Delivered · Completed · Refund Requested · Refunded
- Each row: thumbnail + name · options summary · date · amount · status badge · View Details

**Order Detail (`/profile/orders/[id]`):**
- Service name + thumbnail
- Full selected options breakdown with prices
- Price breakdown: base + options + total
- Order timeline: placed > pending > confirmed > in_progress > delivered > completed
- `Open Support Chat` button
- `Request Refund` button — visibility rules:
  - Shown when status is `pending`, `confirmed`, or `in_progress` (no time limit — service not yet delivered)
  - Shown when status is `delivered` AND within 7 days of `deliveredAt`
  - Hidden once `refund_requested`, `refunded`, or `completed` (terminal or already attempted)
  - On click: confirmation dialog → sets `status → refund_requested`
  - If `paymentProvider = "nowpayments"`: wallet address input shown before confirming

If `orderId` doesn't belong to the logged-in user → call `notFound()` to render the 404 page.

**Tab 2 — Transaction History:** Read-only. Columns: TXN ID · Service name · Date · Amount · Method · Status.

---

### 3.8 Global Chat Bubble (all storefront pages)

- Fixed, bottom-right corner of every storefront page
- Collapsed: circular icon + unread count badge
- Expanded: 320x480px chat panel (does not navigate away)
- Same data source as Admin Messages (`SupportTicket` + `Message` models)
- Real-time via Supabase Realtime WebSocket subscription
- Excluded from `/admin/*`, `/login`, `/register`

---

### 3.9 Cart Page (`/cart`)

**Purpose:** Review selected services before checkout.

**Access:** Cart icon in navbar (with item count badge) → redirects to `/cart`.

**Layout:** Single-column centered, max-width content.

**Content:**
1. Page title: `Your Cart`
2. Currency toggle (synced to global currency state)
3. Service rows — one per CartItem:
   - Service thumbnail + name
   - Selected options summary (e.g. "Level: 21–40 · Add-ons: Loot bag · Runs: 2")
   - Line total (base + options, in active currency, cyan)
   - Remove item button
4. Order total (sum of all CartItems in active currency, large, cyan)
5. `Proceed to Checkout` button (full-width, gradient) — auth-gate: anonymous or unverified users are redirected to `/login` then returned to cart after login
6. Empty state: "Your cart is empty." + `Browse Services` link (→ `/games`)

**Rules:**
- Anonymous users can add to cart — items stored against a `session_id` in a cookie (`ms_cart_session`, 30-day HttpOnly cookie)
- All anonymous cart operations go through server-side API routes using the service role key — the Supabase client is never used directly for anonymous cart writes
- On login, anonymous CartItems are merged into the user's account cart automatically
- Anonymous cart cookie (`ms_cart_session`) has a **30-day expiry** — independent of the support chat session (1-hour TTL). These are two separate cookies with separate lifetimes
- Same service can appear multiple times as separate rows (each is a distinct CartItem)
- Prices are locked at add-to-cart time — no live recalculation from service changes
- Cart is emptied automatically after successful payment — all CartItems removed

---

### 3.10 Secure Checkout (`/checkout`)

**Auth-gate:** Requires authenticated + verified user. Anonymous or unverified users clicking "Buy Now" or "Proceed to Checkout" are redirected to `/login`, then returned to checkout after login.

**Layout:** Two-column — payment form (left) + order summary (right).

**Left:** Payment method tabs: CREDIT CARD (Stripe) · PAYPAL (Stripe) · CRYPTO (NowPayments). Card details form shown when Credit Card is active.

**Right:** Order summary — lists ALL CartItems (one row per service: thumbnail · name · options summary · line total) · Grand total (sum of all items, large, cyan, taxes included) · Complete Purchase button (gradient) · SSL note · legal note.

> Prototype shows one item — actual implementation shows all cart items. One payment covers the full cart. Backend creates one `Order` record per `CartItem` on payment success. All orders from the same payment share a `checkoutSessionId` (the Stripe Payment Intent ID or NowPayments payment ID).

**On payment success:** Redirect to `/order-confirmed?session=[checkoutSessionId]`.

---

### 3.11 Order Confirmed (`/order-confirmed`)

**Route:** `/order-confirmed?session=[checkoutSessionId]`

**Purpose:** Post-payment success page. Confirms all orders from the completed payment and sets expectations for what happens next.

**Layout:** Centered single-column card on full dark background.

**Content (top to bottom):**
1. Large gradient checkmark icon
2. Heading: `Order Confirmed!` (gradient text)
3. All orders from this checkout — one row per order: service thumbnail + name + selected options summary + line total
4. Grand total paid (cyan, large)
5. Divider
6. **"What happens next?"** — 4 horizontal steps with icons:
   `Admin Confirms` → `Service In Progress` → `Delivered` → `Enjoy!`
7. Note: "Have questions? Open a support chat anytime."
8. Two CTAs: `View My Orders →` (gradient → `/profile` with Order History tab open) · `Browse More Services` (outlined → `/games`)

**Rules:**
- Fetches all orders where `checkoutSessionId` matches the query param AND `userId` = logged-in user
- If no matching orders found for the logged-in user → redirect to `/profile`
- Chat bubble visible on this page

---

### 3.12 Refund Policy (`/refund-policy`)

Sections: Overview · How Refunds Work (admin reviews and issues directly via payment gateway — no middleman or escrow) · Eligibility (Non-Delivery, Not as Described, Change of Mind) · Refund Window (7 days post-delivery for delivered orders; any time for pre-delivery orders) · Crypto Refunds (wallet address required) · Dispute Resolution · Contact Support CTA.

---

### 3.13 Privacy Policy (`/privacy-policy`)

Same layout as Terms of Service and Refund Policy. Content written during build.

---

### 3.5 — Update: Service Detail Page route

**Route:** `/[game-slug]/services/[service-slug]` → **`/[game-slug]/[service-slug]`**

The detail page moves up one level to match the new base path. All other behaviour is unchanged.

If no Service record matches `[service-slug]` for the given game → call `notFound()`.

---

### 4 — Update: User Flows

Replace the relevant flow lines:

```
Landing Page
  ├── Click game card     → /[game-slug]  → click category tab → /[game-slug]/[category-slug]
  ├── Click game card     → /[game-slug]  → click service → /[game-slug]/[service-slug]
  ├── Click offer card    → Service Detail → Configure → Buy Now → Cart → Checkout
  ├── VIEW ALL DEALS      → /hot-offers
  ├── Navbar > Services   → Quick Select mega menu → sub-service → Service Detail
  └── Footer > Legal      → Refund Policy / Terms of Service

Games Page (/games)
  └── Click game card     → /[game-slug]

/[game-slug]
  ├── Click category tab  → /[game-slug]/[category-slug]
  └── Click service card  → /[game-slug]/[service-slug]

Hot Offers (/hot-offers)
  └── Click service card  → /[game-slug]/[service-slug]
```

---

### 9 — Update: File & Folder Structure

```
src/
  app/
    [game-slug]/
      page.tsx                      Game Services Page (ALL tab — no category filter)
      [slug]/
        page.tsx                    Either: service-category filtered view OR service detail
                                    Resolved at request time:
                                    1. Check if slug matches a ServiceCategory.slug for this game → render category-filtered services page
                                    2. Else check if slug matches a Service.slug for this game → render Service Detail
                                    3. Else → notFound()
```

> The `[slug]` catch-all handles both category tabs and service detail in one dynamic segment. Resolution order: category first, then service, then 404.

---

### 10.14 — Update: Route Map (Storefront)

```
/[game-slug]                        Game Services Page (ALL tab)
/[game-slug]/hot-offers             Game Services Page (HOT OFFERS tab)
/[game-slug]/[category-slug]        Game Services Page (filtered by service category)
/[game-slug]/[service-slug]         Service Detail
```

Remove from route map:
```
/[game-slug]/services               (retired)
/[game-slug]/services/[slug]        (retired)
```

---

## Change 2 — Service Category: DB Model + Admin Management

### What changes

`serviceCategory` on the `Service` model was previously a plain `string` with a hardcoded enum. It is now a foreign key to a new `ServiceCategory` table. Admins can create, edit, and delete service categories per game from `/admin/services`.

---

### 6 — Add: ServiceCategory Model

> New table. Replaces the freeform `serviceCategory` string on `Service`.

**ServiceCategory**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| displayName | string | |
| email | string | |
| passwordHash | string | scrypt hash — never plain text |
| role | string | Always `"ADMIN"` |
| status | string | `"active" \| "suspended" \| "banned"` |
| avatar | string | |
| lastLogin | Date | |
| knownDevices | string[] | Reserved for future trusted-device/session metadata. Admin OTP is not used. |
| createdAt | Date | |

---

### Support Chat

A `SupportTicket` is the container for a conversation. `Message` records are a separate table joined by `ticketId` — **not a JSONB array on the ticket row**. This is required for Supabase Realtime to work on individual messages.

Two thread types: general support (`orderId` is null) and order-specific (`orderId` is set).

**SupportTicket**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| orderId | string? | Set for order-specific threads; null for general support |
| userId | string \| null | `null` for anonymous users. Set to the user's ID on login merge. |
| sessionId | string \| null | Set for anonymous users (`ms_chat_session` cookie, 1-hour TTL). Cleared after login merge. |
| subject | string | |
| status | string | `"open" \| "in_progress" \| "resolved"` |
| createdAt | Date | |
| updatedAt | Date | |

> On login: `userId` is attached to anonymous ticket records, `sessionId` is cleared. Chat history is preserved. Pre-login messages keep the anonymous label; display name updates to the customer's username going forward.

**Message**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| ticketId | string | FK → SupportTicket |
| senderId | string | |
| senderRole | string | `"admin" \| "customer"` |
| content | string | |
| attachments | Attachment[]? | Optional |
| sentAt | Date | |

**Attachment**

| Field | Type |
|---|---|
| filename | string |
| sizeBytes | number |
| url | string |

---

### AuditLog

| Field | Type | Notes |
|---|---|---|
| id | string | |
| timestamp | Date | |
| actorId | string \| null | Admin UUID from `admin_users.id`. `null` for system-generated events. |
| actorType | string | `"admin"` — actorId is set, actorLabel is admin's display name. `"system"` — actorId is null, actorLabel is `"System (Cron)"` or `"System (Webhook)"`. |
| actorLabel | string | Always set — displayed in the Audit Logs table |
| action | string | |
| ipAddress | string \| null | `null` for system-generated events |
| status | string | `"success" \| "critical" \| "blocked"` |

> `serviceCategory` ≠ `genre`. Category = what the booster does (Dungeon, Raid). Genre = type of game (MMORPG, FPS). This distinction is unchanged.

---

### 6 — Update: Service Model

Replace the `serviceCategory` field:

| Field | Type | Notes |
|---|---|---|
| ~~serviceCategory~~ | ~~string~~ | **Removed.** Replaced by `serviceCategoryId`. |
| serviceCategoryId | string \| null | FK → ServiceCategory. `null` only for draft services that haven't been assigned a category yet. Must be set before a service can be published (`status → "active"`). |

All other Service fields remain unchanged.

> `serviceCategory` ≠ `genre`. Category = what the booster does (Dungeon, Raid). Genre = type of game (MMORPG, FPS). This distinction is unchanged.

---

### 14.3 — Add: RLS Policies for ServiceCategory

```sql
-- ── SERVICE CATEGORIES ────────────────────────────────────────────
-- Public read for all service categories (needed for tab rendering)
CREATE POLICY "public_read_service_categories"
ON service_categories FOR SELECT
USING (true);

-- Only service role can write
CREATE POLICY "service_role_write_service_categories"
ON service_categories FOR ALL
USING (auth.role() = 'service_role');
```

---

### DB Migration SQL

```sql
-- 1. Create the service_categories table
CREATE TABLE service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, slug)
);

-- 2. Add FK column to services
ALTER TABLE services
  ADD COLUMN service_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;

-- 3. (Data migration — run after seeding service_categories)
-- UPDATE services SET service_category_id = (
--   SELECT id FROM service_categories
--   WHERE game_id = services.game_id
--     AND name = services.service_category  -- old string column
--   LIMIT 1
-- );

-- 4. Drop old column after data migration is verified
-- ALTER TABLE services DROP COLUMN service_category;

-- 5. Enable RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
```

---

### 10.6 — Update: Admin Services List (`/admin/services`)

**Table:** SERVICE NAME · GAME · SERVICE CATEGORY · BASE PRICE (cyan) · STATUS · ACTIONS

**Two-axis filters:** Status tabs (All / Active / Draft) · Filter Game dropdown · Filter Category dropdown.

Service Category values: `Dungeon · Leveling · Raid · Stories · Powerleveling · Rank Boost · Item Farm · Coaching · Placement Matches`

---

### 10.7 Admin Service CMS (`/admin/services/new`, `/admin/services/[id]/edit`)

**Left column:**

1. **Basic Info:** Service Name · Game (dropdown) · Service Category (dropdown) · Hot Offer checkbox — when checked, sets `isHotOffer = true` and `hotOfferAt = current timestamp`; when unchecked, sets `isHotOffer = false` and `hotOfferAt = null` · Region (multi-select: USA / EUROPE / Both)

2. **Service Badges:** Tag input with pre-defined options. Admin selects any combination:
   `Starts in < 15 mins` · `100% Completion` · `Safe & Secure` · `24/7 Support`
   Rendered as pill badges below the service title on Service Detail. Leave empty to show no badges.

3. **Custom Service Options (JSONB):** Dynamic field builder. Each field: label input · type dropdown (Single Choice / Multiple Choice / Scalar) · required toggle · type-specific price inputs. Saved as `optionsSchema` JSONB in Supabase (DB column: `options_schema`).
   - Single / Multiple Choice: option rows with label + `$USD` + `€EUR` per option
   - Scalar: min · max · `$pricePerUnitUSD` · `€pricePerUnitEUR`

4. **What You Get (Benefit Cards):** Repeatable field builder — up to 4 entries. Each entry: icon picker (Tabler icon name, text input with preview) · benefit title · benefit description. Rendered as the 2×2 grid on Service Detail. Minimum 1 entry required to publish.

5. **Service Details:** Rich text editor (B / I / List / Link) for description.

6. **Requirements:** Repeatable text field — one requirement per row. Rendered as checklist on Service Detail.

**Right column:** BASE PRICE (`basePriceUSD` + `basePriceEUR` — always charged flat, options stack on top) · Thumbnail upload (drag + drop, recommended 1200×1080px) · Pro Tip card.

---

### 10.7b Admin Service Preview (`/admin/services/[id]/preview`)

Full-page storefront render using draft data. Read-only — no checkout.

- Amber banner: `PREVIEW MODE — This service is not yet published`
- Buttons: Back to Editor · Deploy Now
- Renders identical components as the public Service Detail page (§3.5)
- What admins see = what customers see

**Deploy Now behavior:**
1. Runs the same field validation as Save in the CMS editor: minimum 1 `whatYouGet` entry, all required fields filled, `basePriceUSD` and `basePriceEUR` > 0.
2. If validation fails: show inline errors on the preview page. Stay on preview — do not publish.
3. If validation passes: sets `service.status → "active"`, redirect to `/admin/services` with a success toast: "Service published."
4. If the service is already `active` (re-previewing a live service): button label changes to `Update Live`. Same behavior — no confirmation dialog needed.

---

### 10.7 — Update: Admin Service CMS

In the **Basic Info** section, replace the `Service Category` dropdown:

**Service Category** — dropdown populated from `ServiceCategory` records where `gameId = selected game`. Updates when the Game dropdown changes. Shows category name + slug in the option label (e.g. `Dungeon (dungeon)`). Required before publishing.

If no categories exist for the selected game, show a warning: "No categories yet for [Game Name]. [Add one →]" — the link opens the Add Service Category modal inline.

---

### API Routes — Add

```
POST   /api/v1/admin/service-categories          Create category
PATCH  /api/v1/admin/service-categories/[id]     Edit category
DELETE /api/v1/admin/service-categories/[id]     Delete category
GET    /api/v1/service-categories?gameId=[id]    Public — fetch categories for a game (used by storefront tab render)
```

All write routes: admin JWT required, service role key for DB writes, audit log entry on success.

---

## Change 3 — Game Genre: DB Model + Admin Management

### What changes

`genre` on the `Game` model was previously a `string` with a hardcoded enum. It is now a foreign key to a new `Genre` table. Admins can add new genres from `/admin/games`.

---

### 6 — Add: Genre Model

> New table. Replaces the freeform `genre` string on `Game`.

**Genre**

| Field | Type | Notes |
|---|---|---|
| id | string | UUID |
| name | string | Display name. e.g. `"ACTION RPG"`, `"MMORPG"`. Stored uppercase. Must be globally unique. |
| slug | string | URL-safe slug. e.g. `"action-rpg"`, `"mmorpg"`. Auto-generated from name. Globally unique. |
| createdAt | Date | |

**Canonical seed genres (seeded on first deploy — not hardcoded in application code after that):**
`ACTION RPG · MMORPG · FPS · MOBA · TACTICAL SHOOTER · BATTLE ROYALE · LOOTER SHOOTER · SPORTS ACTION`

---

### 6 — Update: Game Model

Replace the `genre` field:

| Field | Type | Notes |
|---|---|---|
| ~~genre~~ | ~~string~~ | **Removed.** Replaced by `genreId`. |
| genreId | string | FK → Genre. Required. |

All other Game fields remain unchanged.

The `/games` page sidebar still auto-populates from distinct genre values — now via a `JOIN genres ON games.genre_id = genres.id` query instead of `SELECT DISTINCT genre FROM games`.

The Landing Page game filter tabs still auto-populate from distinct genres of active games — same join pattern.

---

### 14.3 — Add: RLS Policies for Genre

```sql
-- ── GENRES ────────────────────────────────────────────────────────
-- Public read for all genres
CREATE POLICY "public_read_genres"
ON genres FOR SELECT
USING (true);

-- Only service role can write
CREATE POLICY "service_role_write_genres"
ON genres FOR ALL
USING (auth.role() = 'service_role');
```

---

### DB Migration SQL

```sql
-- 1. Create the genres table
CREATE TABLE genres (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Seed canonical genres
INSERT INTO genres (name, slug) VALUES
  ('ACTION RPG',        'action-rpg'),
  ('MMORPG',            'mmorpg'),
  ('FPS',               'fps'),
  ('MOBA',              'moba'),
  ('TACTICAL SHOOTER',  'tactical-shooter'),
  ('BATTLE ROYALE',     'battle-royale'),
  ('LOOTER SHOOTER',    'looter-shooter'),
  ('SPORTS ACTION',     'sports-action');

-- 3. Add FK column to games
ALTER TABLE games
  ADD COLUMN genre_id UUID REFERENCES genres(id) ON DELETE RESTRICT;

-- 4. (Data migration — run after seeding genres)
-- UPDATE games SET genre_id = (
--   SELECT id FROM genres WHERE name = games.genre LIMIT 1
-- );

-- 5. Make column NOT NULL after data migration is verified
-- ALTER TABLE games ALTER COLUMN genre_id SET NOT NULL;

-- 6. Drop old column after data migration is verified
-- ALTER TABLE games DROP COLUMN genre;

-- 7. Enable RLS
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
```

---

### 10.5 — Update: Admin Games (`/admin/games`)

**Table:** GAME NAME · GENRE/TYPE · PLATFORM · STATUS · ACTIONS

The GENRE/TYPE column and its filter/create dropdown are now populated from the `genres` table, not a hardcoded list.

**Add: "New Genre" button**

Position: top-right of the Games list page, next to "New Game".

Clicking opens a modal: **Add Genre**

| Field | Notes |
|---|---|
| Genre Name | Text input — required. Written in uppercase by convention (enforced on save). e.g. `"SURVIVAL HORROR"`. Must be globally unique. |
| Slug | Auto-generated from name; admin can override. Validated: globally unique, no spaces. |

Actions: **Save Genre** (purple) · **Cancel**.

On save: `POST /api/v1/admin/genres` → inserts into `genres`. Toast: "Genre created." The genre immediately appears in the Genre dropdown when creating or editing a game, and in the sidebar filter on `/games`.

**Duplicate name guard:** If a genre with the same name (case-insensitive) already exists, show inline error: "This genre already exists."

**Editing genres:** Genres are not editable after creation to preserve data integrity (existing game records reference the genre by ID; changing the name changes it everywhere automatically since it's denormalised via JOIN). If a typo needs correction, the admin must delete and recreate. Add a note in the modal: "Genre names cannot be edited after creation."

**Deleting genres:** Not permitted if any game references the genre (`ON DELETE RESTRICT`). The delete icon is disabled with tooltip: "Cannot delete — [N] games use this genre." Admins must re-assign all games to a different genre first.

---

### 10.7 — Update: Admin Service CMS (Genre dropdown reference)

The `Game` dropdown in the Service CMS form now resolves the game's genre via `genre_id → genres.name` join. No change to the form UI — game names are unchanged.

---

### API Routes — Add

```
POST   /api/v1/admin/genres         Create genre
GET    /api/v1/genres               Public — fetch all genres (used by /games sidebar and landing page filter tabs)
```

Write route: admin JWT required, service role key for DB writes, audit log entry on success.

---

## Summary of All Affected Sections

| Section | Change |
|---|---|
| §3.2 Game Services Page | New URL scheme: `/[game-slug]` base, `/[game-slug]/[category-slug]` per tab |
| §3.5 Service Detail Page | Route changes from `/[game-slug]/services/[slug]` to `/[game-slug]/[slug]` |
| §4 User Flows | Updated flow paths |
| §6 Game Model | `genre` string → `genreId` FK |
| §6 Service Model | `serviceCategory` string → `serviceCategoryId` FK |
| §6 ServiceCategory (new model) | New table per game, with slug + sort order |
| §6 Genre (new model) | New global table, seeded with canonical genres |
| §9 File & Folder Structure | `[game-slug]/[slug]` catch-all for category + service detail |
| §10.5 Admin Games | "New Genre" button + modal; Genre dropdown from DB |
| §10.6 Admin Services List | "New Service Category" button + modal; Category dropdown from DB |
| §10.7 Admin Service CMS | `serviceCategoryId` FK dropdown instead of hardcoded string |
| §10.14 Route Map | Updated storefront routes |
| §14.3 RLS Policies | New policies for `genres` and `service_categories` tables |
| DB | Two new tables: `genres`, `service_categories`; migrations for `games.genre_id` and `services.service_category_id` |
