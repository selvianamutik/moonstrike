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
| **App Name** | Moon Strike |
| **Tagline** | "Dominate the Game." |
| **Type** | Game Boosting Marketplace — Web Platform |
| **Business Model** | Customers purchase boosting services (leveling, raid carries, ranked placement, dungeon runs, item farming, etc.) for specific games. Admin/pro players deliver the service. |
| **Tone** | Dark, premium, gamer-focused. Esports meets e-commerce. |

---

## 2. Design System

### 2.1 Color Tokens

#### Dark Mode (default — always implement this)

| Token | Hex | Usage |
|---|---|---|
| `--ms-primary` | `#050816` | Page background |
| `--ms-secondary` | `#0F172A` | Card / surface background |
| `--ms-accent` | `#172554` | Borders, hover states, subtle highlights |
| `--ms-gradient-start` | `#8B5CF6` | Gradient start (purple) — CTAs, logo, active states |
| `--ms-gradient-end` | `#22D3EE` | Gradient end (cyan) — prices, highlights, logo |
| `--ms-text-primary` | `#F1F5F9` | Headings, labels, primary content |
| `--ms-text-secondary` | `#94A3B8` | Body text, descriptions, placeholders |

**Primary gradient:** `linear-gradient(to right, #8B5CF6, #22D3EE)` — logo, CTAs, active nav, price highlights.

#### Light Mode (color token swap only — same layout as dark)

| Token | Hex | Usage |
|---|---|---|
| `--ms-lm-bg-page` | `#F3F6FF` | Page background |
| `--ms-lm-bg-card` | `#FFFFFF` | Card / surface background |
| `--ms-lm-bg-navbar` | `#FFFFFD` | Navbar background |
| `--ms-lm-navy-dark` | `#0E2D4A` | Primary headings, logo text |
| `--ms-lm-navy-mid` | `#10385C` | Section headings, strong text |
| `--ms-lm-slate` | `#22374C` | Body text, secondary labels |
| `--ms-lm-teal` | `#117680` | Badges, tags, secondary accents |
| `--ms-lm-yellow-pale` | `#F4DE92` | Hover states, subtle highlights |
| `--ms-lm-yellow-mid` | `#F4D159` | Secondary CTA backgrounds |
| `--ms-lm-yellow-primary` | `#F3C623` | PRIMARY accent — replaces purple gradient |
| `--ms-lm-purple` | `#794BB8` | Decorative elements only (step shapes, etc.) |

**Light mode key differences:**
- Primary CTA changes from purple-to-cyan gradient to golden yellow `#F3C623`
- Backgrounds invert to light blue-white; text hierarchy inverts to dark navy on light
- Teal `#117680` replaces cyan as secondary accent; purple demoted to decorative use only
- Logo uses golden yellow instead of gradient

> Light mode is a **CSS variable swap only** — same components, same layout.
> Toggle switches `<html data-theme="light">`. No separate components or content entries per theme.

### 2.2 Theme Rules

| Rule | Dark Mode | Light Mode |
|---|---|---|
| Cards | `--ms-secondary` bg + `--ms-accent` border | `#FFFFFF` bg + light border |
| Primary CTA | Purple to cyan gradient | Golden yellow `#F3C623` |
| Active tab | Purple fill | Yellow `#F3C623` fill |
| Danger / HOT badge | `#EF4444` | `#EF4444` (same both modes) |

### 2.3 Typography

| Element | Font | Style |
|---|---|---|
| Logo / Display / Headings | Montserrat | Bold |
| Body / Labels | Montserrat | Regular weight |
| IDs / Code / Monospace elements | JetBrains Mono | Regular |
| Badges / Tags | Montserrat | Uppercase, small |

> Additional fonts may be introduced during development. Montserrat and JetBrains Mono are the confirmed base. Never use generic fallbacks (Inter, Roboto, Arial, sans-serif) as primary fonts.

### 2.4 Global Components

| Component | Description |
|---|---|
| `<Navbar>` | Logo · Currency selector (USD/EUR + flag) · Services (mega menu trigger) · Cart icon (→ `/cart`) · Dark/Light mode toggle · Profile icon |
| `<Footer>` | Logo · Sitemap · Legal · Genres · Social Media · Disclaimer · copyright |
| `<GameCard>` | Image thumbnail · Genre tags · Game name · Short description |
| `<ServiceCard>` | Image · HOT badge (conditional) · Title · Description · Price · Buy Now button |
| `<CategoryTabs>` | Scrollable horizontal pill tabs with left/right arrow nav |
| `<StarRating>` | 5-star display with username and comment (TrustPilot style) |
| `<RegionSelector>` | USA / EUROPE toggle pills |
| `<Badge>` | HOT · NEW UPDATE · COMING SOON · FEATURED — corner/inline labels |
| `<ThemeToggle>` | Switches dark and light mode; persisted in user preference |
| `<SearchResults>` | Real-time overlay below the navbar search bar. Triggered on input (debounced 300ms) — no enter key needed. Shows closest matching service cards (image + name, max 6 results). Click result → navigate to service detail. Closes on click outside or Escape. Zero state: "No services found for [query]." |

---

## 3. Storefront Pages

### 3.1 Landing Page (`/`)

**Purpose:** Main entry point. Converts visitors via offers, social proof, and trust signals.

| Section | Details |
|---|---|
| Navbar | Global component |
| Hero / Promo Banner | CMS-editable (`hero` block). Label · Headline · Subtext · CTA button. Fields: label, headline, subtext, CTA text/link, background image. |
| Game Filter + Grid | Category tabs: auto-populated from distinct `genre` values in the Game table (e.g. ALL · ACTION RPG · TACTICAL SHOOTER · LOOTER SHOOTER). 4-column game card grid. Clicking a game card → `/[game-slug]/services`. `Load More Games` button (click to load more — not infinite scroll). |
| Best Offers | Section header + `VIEW ALL DEALS →` link (→ `/hot-offers`). 4 service cards selected at random from all active `isHotOffer = true` services, re-randomized on each page load (server-side via `ORDER BY RANDOM() LIMIT 4`). Shows price + Buy Now. If fewer than 4 hot offer services exist, shows however many are available. No admin curation — fully automatic. |
| Trust Stats Bar | CMS-editable. 4 stats: 50K+ GAMES BOOSTED · 99.9% SUCCESS RATE · 24/7 ACTIVE SUPPORT · TOP 1% PRO PLAYERS |
| Why Choose Us | CMS-editable. Full-width media block + 3 benefit items (icon + label + description). |
| How It Works | CMS-editable. 4 numbered steps: Choose Service · Log Into Account · Daily Progress Updates · Enjoy Result. |
| TrustPilot Reviews | Carousel of review cards (avatar · 5 stars · comment). Left/right nav. |
| Payment Methods Strip | PayPal · Mastercard · Apple Pay · Google Pay · Stripe logos |
| Footer | Global component |

---

### 3.2 Game Services Page (`/[game-slug]/services`)

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

### 3.14 Terms of Service (`/terms-of-service`)

TOC sidebar (left) + content (right) on desktop. Single column on mobile.

TOC: Acceptance of Terms · User Conduct · Service Delivery · Limitation of Liability · Termination.

---

### 3.15 Quick Select Mega Menu (Global Component)

Triggered by "Services" nav item click. Floating overlay panel.

**Layout:**
1. Game tabs (horizontal, scrollable): `All · [Game Name] · [Game Name] · ...` — auto-populated from `Game` table WHERE `status = "active"`
2. Service grid below the tabs:
   - **"All" tab:** services grouped by game name (game name as a section header), then by `serviceCategory` as column headers, individual service links below each column
   - **Single game tab:** service categories as column headers, individual service links below each column — no game header needed
3. Each service link → navigates to `/[game-slug]/services/[service-slug]`

**Data source:** Auto-queried from `Service` table — no CMS entry needed. Filtered by selected game tab. Only `status = "active"` services shown.

---

### 3.16 Not Found (`/404`)

**Purpose:** Shown whenever a route doesn't resolve — typo'd URL, deleted game slug, expired link, etc.

**Layout:** Centered single-column on full dark background. No navbar. No footer. No chat bubble.

**Content (top to bottom):**
1. MoonStrike logo (links to `/`)
2. Large `404` in primary gradient text (Montserrat Bold, display size)
3. Heading: `Page Not Found`
4. Subtext: "The page you're looking for doesn't exist or has been moved."
5. Two CTAs side by side: `Go to Homepage` (gradient → `/`) · `Browse Services` (outlined → `/games`)

**Implementation:** Next.js `app/not-found.tsx` — automatically caught by the framework for any unresolved route. Also call `notFound()` explicitly in:
- `/[game-slug]/services` — if no Game record matches the slug
- `/[game-slug]/services/[service-slug]` — if no Service record matches the slug
- `/profile/orders/[id]` — if the order doesn't belong to the logged-in user
- `/order-confirmed` — if no orders found for `checkoutSessionId` belonging to the logged-in user

> Do not redirect to `/` on unresolved slugs — always render the 404 page so the user understands what happened.

---

## 4. User Flows

```
Landing Page
  ├── Click game card     → /[game-slug]/services → click service → Service Detail
  ├── Click offer card    → Service Detail → Configure → Buy Now → Cart → Checkout
  ├── VIEW ALL DEALS      → /hot-offers
  ├── Navbar > Services   → Quick Select mega menu → sub-service → Service Detail
  └── Footer > Legal      → Refund Policy / Terms of Service

Games Page (/games)
  └── Click game card     → /[game-slug]/services

/[game-slug]/services
  └── Click service card  → /[game-slug]/services/[slug]

Hot Offers (/hot-offers)
  └── Click service card  → /[game-slug]/services/[slug]

Checkout
  └── On success          → /order-confirmed?session=[checkoutSessionId]
  └── Cancel & Return     → back to Cart
```

---

## 5. Agent Rules

### DO
- Keep dark theme consistent across ALL pages — light mode only when explicitly asked
- Use purple-to-cyan gradient for all primary CTAs and the logo
- Use cyan/electric blue for prices and key numbers
- Keep the navbar fixed/sticky at the top
- Use the same `<Footer>` on every page
- Make all cards hoverable (subtle lift + border glow)
- All prices in USD by default; currency toggle persists in global state
- Region (USA/EUROPE) is a single global state — same as currency. Changing in one place updates all `<RegionSelector>` instances site-wide. Persists across navigation.

### DO NOT
- Do not use white or light backgrounds anywhere in dark mode
- Do not use generic fonts (Inter, Roboto, Arial)
- Do not hardcode game/service data — all comes from API/DB
- Do not put payment logic in the frontend
- Do not use lorem ipsum in final builds
- Do not create separate components or content records per theme — light mode is CSS only

### Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `service-detail.tsx` |
| Components | `PascalCase` | `ServiceCard.tsx` |
| Functions / hooks | `camelCase` | `useCartTotal` |
| CSS variables | `--ms-*` prefix | `--ms-accent` |
| API routes | `/api/v1/[resource]` | `/api/v1/orders` |

---

## 6. Data Models

> All models use Supabase PostgreSQL. Dynamic fields are stored as JSONB. All TypeScript fields use camelCase — Supabase maps these to snake_case DB columns automatically (e.g. `optionsSchema` ↔ `options_schema`).

**Shared type used throughout:**
`Region = "USA" | "EUROPE"` — `Service.region` and `PromoBanner.region` are `Region[]`. `Order.region` is a single `Region` value (whichever was active at checkout). `"BOTH"` is never used — represent both regions as `["USA", "EUROPE"]`.

---

### Game

> Games do not have prices — prices live on Services.

| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| slug | string | |
| image | string | |
| genre | string | `"ACTION RPG" \| "MMORPG" \| "FPS" \| "MOBA" \| "TACTICAL SHOOTER" \| "BATTLE ROYALE" \| "LOOTER SHOOTER" \| "SPORTS ACTION"` |
| platforms | string[] | `"PC"`, `"Console"`, `"Cross-play"` |
| description | string | |
| status | string | `"active" \| "draft" \| "archived"` |

---

### Service

> `serviceCategory` ≠ `genre`. Category = what the booster does (Dungeon, Raid). Genre = type of game (MMORPG, FPS).

| Field | Type | Notes |
|---|---|---|
| id | string | |
| gameId | string | FK → Game |
| title | string | e.g. "Mythic+ Dungeons Boost" |
| slug | string | |
| image | string | |
| description | string | |
| serviceCategory | string | `"Dungeon" \| "Leveling" \| "Raid" \| "Stories" \| "Coaching" \| "Rank Boost" \| "Item Farm" \| "Powerleveling" \| "Placement Matches"` |
| status | string | `"active" \| "draft" \| "archived"` |
| isHotOffer | boolean | `true` → appears in HOT OFFERS tab |
| hotOfferAt | Date \| null | Set to `NOW()` when `isHotOffer` toggled on; cleared to `null` when toggled off. Used to sort Hot Offers page (`hotOfferAt DESC`). |
| region | Region[] | `["USA"]`, `["EUROPE"]`, or `["USA", "EUROPE"]` |
| badges | string[] | Admin-managed. Options: `"Starts in < 15 mins"`, `"100% Completion"`, `"Safe & Secure"`, `"24/7 Support"` |
| requirements | string[] | Rendered as checklist on Service Detail |
| whatYouGet | Benefit[] | 2×2 benefit cards on Service Detail — see Benefit model below |
| basePriceUSD | number | Flat fee always charged — admin sets manually, no runtime conversion |
| basePriceEUR | number | Set independently from USD |
| optionsSchema | JSONB | Array of ServiceOption — see below. DB column: `options_schema` |

**Benefit**

| Field | Type | Notes |
|---|---|---|
| icon | string | Tabler icon name, e.g. `"ti-shield"` |
| title | string | |
| description | string | |

---

### Service Options (`optionsSchema`)

Each service's `optionsSchema` is an array of `ServiceOption` objects stored as JSONB. Admins build this through the CMS form — they never write raw JSON.

**Adding a new option type** requires: define the schema shape + build the UI component + add to CMS dropdown = one deploy. Adding a new service using existing types = admin fills form, zero deploy.

**ServiceOption**

| Field | Type | Notes |
|---|---|---|
| label | string | e.g. `"Level up boost"`, `"Number of runs"` |
| required | boolean | |
| type | string | `"single_choice"` \| `"multiple_choice"` \| `"scalar"` |
| options | OptionItem[] | For `single_choice` and `multiple_choice` only |
| min | number | For `scalar` only |
| max | number | For `scalar` only |
| pricePerUnitUSD | number | For `scalar` only |
| pricePerUnitEUR | number | For `scalar` only |

**OptionItem**

| Field | Type | Notes |
|---|---|---|
| label | string | e.g. `"1–20"`, `"Loot bag"` |
| priceUSD | number | |
| priceEUR | number | Set independently — never converted from USD |

**Component mapping:**
- `single_choice` → `<SingleChoice />` — pill/card grid, pick one
- `multiple_choice` → `<MultiChoice />` — checklist, pick any
- `scalar` → `<Scalar />` — slider or stepper

**Price calculation** (pure function, run client-side on every option change):
```
total = basePriceUSD/EUR (always charged, flat)
      + single_choice   → the selected OptionItem's price
      + multiple_choice → sum of all checked OptionItems' prices
      + scalar          → quantity × pricePerUnit
```
USD and EUR totals are always calculated independently. Never convert between currencies at runtime.

**Example** (Level Boost, `basePriceUSD: 45` — selecting "21–40" + "Loot bag" + 2 runs):
```
$45 base + $10 level + $5 loot bag + $10 (2 × $5 runs) = $70 USD
```

---

### Cart

Each CartItem becomes exactly one Order on checkout. Adding the same service twice creates two separate CartItems and two Orders.

**Cart**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| userId | string \| null | `null` for anonymous carts |
| sessionId | string \| null | Set for anonymous carts (`ms_cart_session` cookie, 30-day TTL). Cleared after login merge. |
| createdAt | Date | |
| updatedAt | Date | |

> Anonymous cart operations always go through server-side API routes using the service role key. The Supabase client is never used directly for anonymous cart reads or writes. On login, CartItems are moved to the user's cart and the anonymous cart is deleted automatically.

**CartItem**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| cartId | string | FK → Cart |
| serviceId | string | FK → Service |
| selectedOptions | Record\<string, string \| number \| string[]\> | Live user selections, keyed by option label. Used for price display in the cart. |
| selectedOptionsSnapshot | JSONB | Frozen copy of selections at add-to-cart time, including prices at that moment. Preserved so historical orders still reflect what the customer paid for even if the service is later edited. Shape: `{ [optionLabel]: { value, priceUSD, priceEUR } }` |
| priceUSD | number | Calculated total at add-to-cart time (base + all options) |
| priceEUR | number | |
| addedAt | Date | |

---

### Order

Orders only exist post-payment. No pre-payment state. No escrow — refunds go directly through the payment gateway. See §11 for the full state machine.

| Field | Type | Notes |
|---|---|---|
| id | string | |
| cartItemId | string | FK → CartItem |
| serviceId | string | FK → Service |
| userId | string | FK → auth.users |
| checkoutSessionId | string | Groups all Orders from the same payment. Equals the Stripe Payment Intent ID or NowPayments payment ID. Used by `/order-confirmed?session=[id]` to fetch all sibling orders. |
| selectedOptionsSnapshot | JSONB | Copied from `CartItem.selectedOptionsSnapshot` at checkout. Use this for all display, history, and Google Sheets writes — `selectedOptions` does not exist on Order. |
| total | number | Taxes and fees included in base price |
| currency | string | `"USD"` \| `"EUR"` |
| region | Region | Single value — whichever was active at checkout |
| paymentProvider | string | `"stripe"` \| `"nowpayments"` — stored at checkout, used to route refunds automatically |
| stripePaymentIntentId | string \| null | Set when `paymentProvider = "stripe"` |
| nowpaymentsPaymentId | string \| null | Set when `paymentProvider = "nowpayments"` |
| cryptoRefundAddress | string \| null | Collected at refund request time for crypto orders |
| status | string | See statuses below |
| deliveredAt | Date \| null | |
| refundRequestedAt | Date \| null | |
| createdAt | Date | |
| updatedAt | Date | |

**Order statuses:**

| Status | Meaning |
|---|---|
| `pending` | Payment cleared. Awaiting admin acknowledgment. |
| `confirmed` | Admin acknowledged the order. |
| `in_progress` | Service actively underway. |
| `delivered` | Admin marked delivered. Customer notified. 7-day refund window starts. |
| `completed` | Terminal. 7-day window passed with no refund request, or refund was denied. |
| `refund_requested` | Customer opened a refund. One attempt per order. |
| `refunded` | Terminal. Admin approved and issued refund via payment gateway. |

**Refund rules:**
- Refund can be requested from any non-terminal status (pre-delivery: no time limit; post-delivery: within 7 days of `deliveredAt`)
- One attempt per order — once attempted (approved or denied), no further requests

---

### AdminUser

One role only: `ADMIN`. Admin = booster. No partial-access roles. Auth is manual (bcrypt + signed JWT) — not Supabase Auth. See §8 and §10.2.

| Field | Type | Notes |
|---|---|---|
| id | string | |
| displayName | string | |
| email | string | |
| passwordHash | string | bcrypt hash — never plain text |
| role | string | Always `"ADMIN"` |
| status | string | `"active" \| "suspended" \| "banned"` |
| avatar | string | |
| lastLogin | Date | |
| knownDevices | string[] | Device fingerprint hashes verified via 2FA OTP. On login: known device → skip OTP; unknown → require OTP. Clearable from Settings to force re-verification. |
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

---

### CMS Models

One record per block — shared across dark and light mode. Theme changes CSS only, not content. Never create separate records per theme.

**ContentBlock**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| type | string | `"hero" \| "stats_bar" \| "benefits_section" \| "steps_section"` |
| status | string | `"active" \| "scheduled" \| "draft"` |
| data | JSONB | Block-specific fields |
| thumbnail | string? | |
| scheduledAt | Date? | |
| modifiedAt | Date | |
| createdBy | string | Admin UUID from `admin_users.id` — not `auth.uid()`. Join with `admin_users` to display creator name. |

**PromoBanner**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| image | string | Media Library URL |
| gameId | string \| null | FK → Game. If set, banner only shows on that game's Services page. If null, acts as a regional default/fallback. |
| region | Region[] | |
| link | string? | Optional CTA link |
| status | string | `"active" \| "scheduled" \| "draft"` |
| scheduledAt | Date? | |
| modifiedAt | Date | |
| createdBy | string | Admin UUID from `admin_users.id` |

**MediaAsset**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| filename | string | |
| url | string | Cloudflare CDN URL (origin: Supabase Storage) |
| type | string | `"image" \| "video"` |
| sizeBytes | number | |
| usedIn | { type: "content_block" \| "promo_banner", id: string }[] | Typed references. Delete is blocked if this array is non-empty. Remove entries when a ContentBlock or PromoBanner is deleted. |
| uploadedAt | Date | |
| uploadedBy | string | Admin UUID from `admin_users.id` |

**SystemSettings**

A singleton — exactly one row ever exists, created by the seed script.

| Field | Type | Notes |
|---|---|---|
| id | string | Always `"singleton"` |
| adminDisplayName | string | |
| adminEmail | string | |
| adminAvatar | string | |

```ts
// Always query with .single()
const { data: settings } = await supabase
  .from('system_settings')
  .select('*')
  .eq('id', 'singleton')
  .single()
```

> **Hot Offers** have no CMS model — auto-populated by querying `Service WHERE isHotOffer = true`.
> **TrustPilot reviews** use a TrustBox widget embed — no DB storage, no server API calls needed.

---

## 7. Feature Progress Tracker

`STATUS: done | in-progress | not-started | blocked`

### Current Implementation Audit (2026-05-28)

- Reviewed scope: Next app routes/components, `lib/catalog.ts`, `lib/admin-mock.ts`, and `/design-refs/` prototype inventory.
- Verification: `npm.cmd run lint` passes, and `npm.cmd run build` passes after installing dependencies and refreshing Next optional SWC packages.
- Runtime route check: the built app was served on `http://localhost:3005`; implemented storefront/admin routes returned 200 for `/`, `/games`, `/services`, `/services/world-of-warcraft/wow-mythic-plus`, `/cart`, `/checkout`, `/profile`, `/profile/orders/MS-2401`, legal pages, and the main admin pages.
- Missing routes versus PRD: `/hot-offers`, `/privacy-policy`, `/order-confirmed`, `/reset-password`, `/profile/edit`, and the documented `/[game-slug]/services` route are not implemented.
- Data/integration state: current storefront/admin data is static mock data from `lib/catalog.ts` and `lib/admin-mock.ts`. There are no `app/api` routes, Supabase clients, payment gateway handlers, webhook handlers, storage uploads, Resend emails, or Google Sheets writes yet.
- Design state: current UI follows the dark premium gamer direction and maps to the design-ref page set, but most game/service media are placeholder assets. Storefront CSS gradient tokens currently use `#4735A5 -> #A561CA`, which differs from the system token spec of `#8B5CF6 -> #22D3EE`.
- Known issue: dynamic invalid service/order slugs render the custom not-found UI, but production route checks returned HTTP 200 for those dynamic misses. Top-level missing routes returned HTTP 404.

### Storefront

| Feature | Status | Notes |
|---|---|---|
| Landing Page UI | done | `/` build-verified. Matches the main design direction, but uses placeholder media and static content instead of CMS blocks. |
| Games Page UI | done | `/games` build-verified with query-param filters and load-more. Infinite scroll is not implemented. |
| Game Services Page UI | in-progress | `/services` build-verified as a global catalog. The PRD route `/[game-slug]/services` is missing. |
| Hot Offers Page UI | not-started | `/hot-offers` — game tabs + hot offer service grid |
| Service Detail UI | in-progress | `/services/[game]/[slug]` build-verified. Static configurator only; `optionsSchema`, live price changes, add-to-cart, and buy-now behavior are pending. |
| Checkout Page UI | in-progress | `/checkout` build-verified against mock cart data. Payment tabs are visual only; Stripe/PayPal/Crypto actions are pending. |
| Refund Policy UI | done | Design ref: Moon_Strike_Refund_Policy_Page.png |
| Terms of Service UI | done | Design ref: Moon_Strike_Terms_of_Service_Page.png |
| Privacy Policy UI | not-started | Same layout as ToS and Refund Policy. Content written during build. |
| Quick Select Mega Menu | done | Overlay UI implemented from `Quick_Select_Mega_Menu_Component.png`; links/search are hardcoded/static. |
| Global Navbar | in-progress | Shared header exists. Cart icon/count, functional currency selector, and live search overlay are missing. |
| Global Footer | done | Shared footer exists; privacy/social links still use placeholder `#` where routes are missing. |
| Global Chat Bubble | in-progress | Fixed bottom-right UI exists with static messages. Supabase Realtime, send action, unread state, and anon session merge are pending. |
| Customer Login | in-progress | Supabase email/password, Google OAuth redirect, rate-limited forgot-password API, safe `next` redirects, clearer callback errors, unverified resend action, and `/profile` + `/checkout` auth gates are wired. Cart merge API and full purchase gating are pending. |
| Customer Register | in-progress | Supabase sign-up, provider-aware existing-email precheck, app-level registration rate limit, Google OAuth, confirm password validation, and email verification/resend banner are wired. Username persistence beyond auth metadata is pending. |
| Customer Profile | in-progress | Profile route is auth-gated and displays the Supabase user's email, auth metadata username/name, member-since date, and real logout. `/profile/edit` supports auth metadata username updates, password changes, Google identity linking, and adding email/password login to OAuth users. Avatar upload, username uniqueness, real order totals, and profile table persistence are pending. |
| Order History | in-progress | Mock order rows and status badges exist. Filter tabs are visual only. |
| Order Detail | in-progress | Mock order detail, timeline, selected options, and refund button exist. Refund action/ownership checks are pending. |
| Cart | in-progress | `/cart` UI build-verified with mock lines/totals. Quantity/remove/currency/auth-gate/API behavior is pending. |
| Search | in-progress | Services/games pages support submit-based query filtering; global real-time overlay is not wired. |
| Currency toggle | in-progress | Header has a visual `US USD / EUR` button only. No global state, conversion, persistence, or cart/detail sync yet. |
| Region toggle | in-progress | Selector UI exists on service catalog/detail. No persistence, filtering, or shared state yet. |
| Light mode theme | done | CSS variable swap exists for `<html data-theme="light">`; visual QA across all pages still recommended. |
| Theme toggle | done | Toggle persists to `localStorage` and updates `<html data-theme>`. Header only exposes it at `xl` width. |
| TrustPilot integration | not-started | Static review cards exist; TrustBox/API integration is pending. |
| Notifications | not-started | In-app bell + email for customers. See §13 |
| Mobile / responsive layouts | in-progress | Tailwind breakpoints are present across pages. Dedicated browser screenshot QA is still pending. |
| Not Found page (404) | in-progress | `app/not-found.tsx` exists. Top-level missing routes return 404; dynamic bad slugs render the UI but returned HTTP 200 in production checks. |

### Admin Terminal

| Feature | Status | Notes |
|---|---|---|
| Admin Login | in-progress | UI exists. Admin JWT, 2FA OTP, session timeout, and server-side guard are pending. |
| Admin Dashboard Overview | done | `/admin/dashboard` build-verified. KPI/chart/table data is static. |
| Admin Users | in-progress | UI/search/actions exist with mock data. Ban/self-ban guards are client alerts only. |
| Admin Games | in-progress | UI/filtering exists with mock data. Create/edit persistence is pending. |
| Admin Services List | in-progress | UI/filtering exists with mock data. CRUD persistence is pending. |
| Admin Service CMS | in-progress | Form UI exists for badges/options/benefits/requirements. JSONB save, validation, upload, and storefront binding are pending. |
| Admin Service Preview | done | /admin/services/[id]/preview — draft storefront render |
| Admin Order Management | in-progress | Filter tabs/date sort exist with mock orders. Status transitions are not persisted. |
| Admin Order Detail | in-progress | Status update/refund/chat UI exists. Gateway refund APIs and audit logging are pending. |
| Admin Transactions | in-progress | UI exists with mock transactions. Refund actions are alerts only. |
| Admin Content Library | in-progress | Landing/banners/media tabs exist with mock data. Real CMS persistence and storefront rendering are pending. |
| Landing Page CMS blocks | in-progress | Admin content rows/forms exist. Storefront still uses hardcoded sections. |
| Promotional Banners CMS | in-progress | Admin banner rows exist. Scheduling/query fallback logic is pending. |
| Media Library CMS | in-progress | Media tab/upload UI exists. Supabase Storage, CDN URLs, usage tracking, and delete guard are pending. |
| Hot Offers auto-population | in-progress | Static mock filtering exists for `isHotOffer`. DB query and `hotOfferAt` sorting are pending. |
| Admin Messages / Chat | in-progress | Inbox UI exists with mock support/order threads. Realtime, persistence, attachments, and anon merge are pending. |
| Admin Audit Logs | in-progress | Logs UI exists with mock audit entries. Backend middleware/log writes are pending. |
| Admin Settings | in-progress | Settings form exists with local "saved" state. Persistence and enforcement are pending. |
| Admin Auth Guard | not-started | All /admin/* routes require admin session + 2FA |
| Admin Sidebar | done | Shared across all admin pages |
| Admin Top Bar | done | Shared across all admin pages |
| System Pulse indicator | in-progress | Static "System Pulse: Stable" footer exists. Live status source is pending. |
| CSV export | in-progress | Export buttons exist. Actual CSV generation/download is pending. |

### System

| Feature | Status | Notes |
|---|---|---|
| Auto-complete cron (7-day window) | not-started | Supabase scheduled function — moves `delivered` orders to `completed` after 7 days if no refund request |
| Order state machine | in-progress | Mock admin/client status labels and next-action helpers exist. Backend enforcement and audit logging are pending. |
| Stripe integration | not-started | Checkout + auto-routed refund API |
| NowPayments integration | not-started | Checkout + auto-routed refund + wallet address collection |
| NowPayments webhook verification | not-started | HMAC-SHA512 middleware with timing-safe comparison. `NOWPAYMENTS_IPN_SECRET` setup pending. See §13 |
| Refund router | not-started | Reads paymentProvider, routes to Stripe or NowPayments automatically |
| Rate limiting | not-started | See §12 — depends on framework |
| Audit log (every admin action) | not-started | Backend middleware |
| Google Sheets integration | not-started | Orders + Transactions tabs. See §13 |
| Real-time chat | not-started | Supabase Realtime WebSocket |
| Admin 2FA enforcement | not-started | Email OTP on first login / new device. Default session timeout: 8 hours. |
| Anonymous cart API routes | not-started | All anonymous cart operations go through server-side routes with service role key |
| Backend API routes | not-started | No `app/api` routes exist yet. Needed for cart, payments, webhooks, chat, CMS, admin mutations, and notification flows. |

---

## 8. Stack & Decisions

### Tech Stack

| Item | Decision |
|---|---|
| Frontend | Next.js |
| CSS | Tailwind CSS |
| Backend | Supabase |
| Database | Supabase PostgreSQL — dynamic fields as JSONB |
| Auth (customers) | Supabase Auth — email/password + Google OAuth |
| Auth (admin) | Manual — bcrypt password in `admin_users` table, signed JWT on successful login + 2FA. Verified server-side on every `/admin/*` request. Single Supabase project — no separate project needed. |
| Image hosting | Supabase Storage (origin) + Cloudflare Images (CDN + transforms) |
| Payment | Stripe (card, PayPal, Google Pay, Apple Pay) + NowPayments (crypto) |
| SMTP | Resend — auth emails + order notifications. See §13. |
| Currency | Fixed USD/EUR values per service — no runtime conversion. Global state shared across navbar, service detail, and cart. Changing in any one location updates all others. |

### Third-Party APIs

| Service | Notes |
|---|---|
| Stripe | Card, PayPal, Google Pay, Apple Pay — all via Stripe. Single integration. |
| NowPayments | Crypto payments + refund API. Requires customer wallet address for refunds. |
| TrustPilot | TrustBox **Carousel** widget embed (script tag). Loads reviews client-side from TrustPilot's CDN — no server-side API calls, no rate limits, no caching needed. Displays on Landing and Services pages. |
| Google Sheets | Orders tab + Transactions tab. See §13 for schema and trigger rules. |

### Feature Decisions

| Feature | Decision |
|---|---|
| Auth | Customer: email/password + Google OAuth via Supabase Auth (free under 50K MAU). Admin: manual bcrypt + JWT — no separate Supabase project. |
| Booster role | No separate booster role — Admin = booster. One role only. |
| Order state machine | No escrow — refunds go directly to the payment gateway. See §11. |
| Search | Real-time overlay, debounced 300ms. Service titles only — image + name, max 6 results. Closes on click outside or Escape. |
| Cart | Same service can be added multiple times as separate CartItems. Anonymous cart uses `ms_cart_session` cookie (30-day TTL). All anonymous cart operations go server-side via service role key. |
| Reviews | TrustPilot TrustBox Carousel embed — client-side, no DB storage, no server API calls. |
| Crypto refund | Wallet address collected at refund request time (required by NowPayments). |
| Service fees | Taxes and fees included in base price. No extra fee at checkout. |
| Order cancellation | No cancelled state — customers request refunds instead. Admin approves or denies. |
| Hot Offers | 4 random `isHotOffer = true` services via `ORDER BY RANDOM() LIMIT 4` — re-randomized per page load. No admin curation. |
| Region | Single global state (USA / EUROPE). Updates all `<RegionSelector>` instances site-wide. Persists across navigation. `Region[]` everywhere except `Order.region` (single value at checkout). |
| Light mode | CSS variable swap only — `<html data-theme="light">`. Same components, no separate content. |
| Rate limiting | Supabase API gateway. See §12. |
| Multi-order checkout | One payment → one Order per CartItem. All share a `checkoutSessionId`. Redirect: `/order-confirmed?session=[checkoutSessionId]`. |

---

## 9. File & Folder Structure

```
src/
  components/
    common/             Navbar, Footer, Badge, StarRating, ThemeToggle
    cards/              GameCard, ServiceCard
    layout/             PageWrapper, Section
    configurator/       SingleChoice, MultiChoice, Scalar
    checkout/           PaymentForm, OrderSummary
  app/
    page.tsx                    Landing
    games/
    [game-slug]/
      services/
        page.tsx                Game Services Page
        [service-slug]/
          page.tsx              Service Detail
    hot-offers/
    cart/
    checkout/
    order-confirmed/
      page.tsx                  Order Confirmed (?session=[checkoutSessionId])
    login/
    register/
    profile/
    profile/edit/
    profile/orders/[id]/
    reset-password/
    refund-policy/
    privacy-policy/
    terms-of-service/
    not-found.tsx               Global 404 page
    admin/                      All admin routes (see §10.14)
  hooks/                useCart, useCurrency, useRegion  ← both are global state, same pattern
  store/                Global state (currency, region, cart)
  lib/                  API clients, utils, webhook verification
  types/                TypeScript interfaces (mirrors §6 models)
  styles/               Global CSS vars, theme tokens
```

---

## 10. Admin Terminal

The Admin Terminal is a **separate application** from the storefront with its own login, layout, routing, and access control. Never accessible from the public storefront.

**Single role: ADMIN** — full access to all sections. Admin = booster. No partial-access roles.

**Admin auth:** Uses manual bcrypt + JWT authentication (not Supabase Auth). Admin credentials live in the `admin_users` table. On successful login + 2FA, the backend issues a signed JWT with `role: "admin"`. Every `/admin/*` route verifies this JWT server-side. This runs in the same single Supabase project as the storefront — no separate project needed.

### 10.1 Admin Design System

Same dark theme as storefront, with these differences:
- Fixed left sidebar (~240px, persistent) + top header bar
- Active nav item: purple background pill highlight
- Surface cards: slightly lighter than storefront (`#161828` range)
- LOGOUT: red text, always visible top-right next to admin name

**Status colors:** Active/Success → green · Pending/Scheduled → amber · Draft → muted gray · Critical/Disputed → red · Archived/Banned → dark red · Refunded → gray

**Global layout:**
```
+------------------------------------------------------------------+
|  MoonStrike / Admin Terminal   [Search orders/users/txns]  [Bell]  Admin  LOGOUT |
+----------------+--------------------------------------------------+
|  Dashboard     |                                                  |
|  Users         |  Page Content                                    |
|  Games         |                                                  |
|  Services      |                                                  |
|  Orders        |                                                  |
|  Transactions  |                                                  |
|  Content       |                                                  |
|  Messages      |                                                  |
|  Logs          |                                                  |
|  Settings      |                                                  |
+----------------+--------------------------------------------------+
|  Moon Strike 2024  |  Support  |  Privacy  |  API Docs  |  STABLE |
+------------------------------------------------------------------+
```

**Admin search (top bar):** Searches across orders (by ID), transactions (by ID), and users (by username or email). Shows results as a dropdown overlay with labeled sections (ORDERS / TRANSACTIONS / USERS).

**Global Admin Components:** `<AdminSidebar>` · `<AdminTopBar>` · `<AdminFooter>` · `<StatCard>` · `<DataTable>` · `<StatusBadge>` · `<ActionIcons>` (Edit · Hide · Delete · Ban)

---

### 10.2 Admin Login (`/admin/login`)

Centered card. No sidebar or header.

- Logo + ADMIN TERMINAL sub-label
- Email + Password (eye toggle) + Forgot Password link
- Remember this terminal session checkbox
- Enter Terminal button (purple)
- Contact System Admin help link
- Security badges: 2FA Protected · SSL Encrypted

**Admin account creation rules:**
- Admin accounts are **never self-registered**. There is no public admin registration page.
- The first admin account is seeded directly into the database (via a protected one-time script that bcrypt-hashes the password).
- After that, only existing admins can create new admin accounts from `/admin/users/new`.

**2FA — email OTP on first login or new device:**
- On first login (or any new device), the backend sends a one-time passcode to the admin's email via Resend
- Admin enters the OTP to complete login; on success the device fingerprint hash is added to `AdminUser.knownDevices`
- Subsequent logins from a known device skip OTP
- Failed logins logged to Audit Logs. Session timeout after inactivity (default: 8 hours, configurable in Settings).

**"Remember this terminal session" checkbox:**
- **Unchecked (default):** JWT expires after 8 hours of inactivity. Admin must re-login after timeout.
- **Checked:** JWT expiry extends to 30 days. Intended for dedicated admin devices. 2FA is still required on the first login from that device. Can be revoked from Settings.
- Implementation: set JWT expiry to `8h` or `30d` at token issuance time based on checkbox value.

---

### 10.3 Admin Dashboard (`/admin/dashboard`)

**KPI Cards:** TOTAL REVENUE · ACTIVE USERS · COMPLETED BOOSTS · PENDING DISPUTES

**Main content (2-column):** Traffic vs Performance chart (left) · Top Selling Services list (right).

**Recent Activity table:** TRANSACTION ID · CUSTOMER · SERVICE · DATE · AMOUNT · STATUS.

---

### 10.4 Admin Users (`/admin/users`)

**Table:** NAME · EMAIL · ROLE · STATUS · LAST LOGIN · ACTIONS

Only `ADMIN` role in admin terminal. Storefront customers authenticate via Supabase Auth in the same project — their records live in the Supabase `auth.users` table and are not listed in this admin table.

**Row actions:** Edit · Activity history · Ban/Suspend

**Ban/Suspend guard:**
- An admin cannot ban their own account
- If only one admin account exists, the Ban action is disabled for that account with a tooltip: "Cannot ban the only admin account."
- Both checks are enforced server-side — not just in the UI. Attempting either via a direct API call returns HTTP 403 with error `SELF_BAN_NOT_ALLOWED` or `LAST_ADMIN_NOT_ALLOWED`.

**Stat cards:** TOTAL USERS · ACTIVE ORDERS · PENDING REFUNDS · BANNED/FLAGGED

> Game card image recommended upload size: **600×400px** (3:2 ratio). Cloudflare Images serves optimized versions at render time.

---

### 10.5 Admin Games (`/admin/games`)

> Do not confuse these three separate fields on three separate models:
> - **Game Name** = the game title (World of Warcraft, Dota 2)
> - **Game Genre/Type** = gameplay category (ACTION RPG, MOBA, FPS, MMORPG)
> - **Service Category** = type of boost (Dungeon, Leveling, Raid)

**Table:** GAME NAME · GENRE/TYPE · PLATFORM · STATUS · ACTIONS

Genre/Type values (canonical — must match §6 exactly): `ACTION RPG · MMORPG · FPS · MOBA · TACTICAL SHOOTER · BATTLE ROYALE · LOOTER SHOOTER · SPORTS ACTION`

Platform values: `PC · Console · Cross-play`

---

### 10.6 Admin Services List (`/admin/services`)

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

### 10.8 Admin Transactions (`/admin/transactions`)

**KPI Cards:** TOTAL REVENUE · PENDING PAYOUTS · SUCCESS RATE · NEW DISPUTES

**Table:** TXN ID · CUSTOMER · SERVICE · DATE · AMOUNT · METHOD · STATUS · ACTIONS

**Method display:** Card (Stripe) · PayPal (Stripe) · Crypto (NowPayments)

**Issue Refund button — context-aware, auto-routes, admin never manually selects an API:**

| Scenario | State | Action |
|---|---|---|
| Stripe order | Active | Calls Stripe refund API with `stripePaymentIntentId` automatically |
| Crypto — no wallet address yet | Disabled + tooltip: "Awaiting wallet address" | Blocked until address provided |
| Crypto — wallet address provided | Active | Calls NowPayments API with `nowpaymentsPaymentId` + `cryptoRefundAddress` |

---

### 10.9 Admin Orders (`/admin/orders`, `/admin/orders/[id]`)

**Filter tabs:** All · Pending · Confirmed · In Progress · Delivered · Completed · Refund Requested · Refunded

**Default sort:** Newest first by `createdAt`.

**Table:** ORDER ID · CUSTOMER · SERVICE · OPTIONS SUMMARY · DATE · AMOUNT · STATUS · ACTIONS

**Order Detail — left column:** Service + customer info · full options breakdown with prices · price breakdown · order timeline with timestamps per state.

**Order Detail — right column (Actions panel):**
- Current status badge (large)
- Status update buttons — context-aware, only valid next states shown:
  - `pending` → Confirm Order
  - `confirmed` → Mark as In Progress
  - `in_progress` → Mark as Delivered
  - `refund_requested` → Approve Refund (red) or Deny Refund (outlined)
- Open Chat button (links to Admin Messages filtered to this customer)
- Refund panel (visible when `refund_requested`): payment method display · wallet address field (crypto only, pre-filled if provided) · Issue Refund button

---

### 10.10 Admin Content (`/admin/content`)

**Three tabs:** LANDING PAGE SECTIONS · PROMOTIONAL BANNERS · MEDIA LIBRARY

> Light and dark mode share one set of content blocks — admin edits once, both modes reflect it.
> Never create separate content entries per theme.
> Hot Offers is NOT managed here — auto-populated from `isHotOffer` on Service.

**Tab 1 — Landing Page Sections:**

| Block | CMS Type | Editable Fields |
|---|---|---|
| Hero | `hero` | Label · headline · subtext · CTA text/link · background image |
| Trust Stats Bar | `stats_bar` | 4 stat values + labels |
| Why Choose Us | `benefits_section` | Media (image/video) · 3 benefit icon + title + description |
| How It Works | `steps_section` | 4 step titles + descriptions |

**Tab 2 — Promotional Banners:** Banner title · Game (optional dropdown — if set, banner only shows on that game's Services page; if left blank, acts as a regional default) · image (from Media Library) · region (USA / EUROPE / Both) · optional CTA link · status (active / scheduled / draft) · schedule date.

**Tab 3 — Media Library:** Upload via drag + drop. Served via Cloudflare Images CDN. Usage tracking shown per asset. Delete blocked if asset is in use.

---

### 10.11 Admin Messages (`/admin/messages`)

**Layout:** Left sidebar · Middle panel (conversation list) · Right panel (active chat + user profile)

**Two thread types, one unified tab:**
- `[Support]` — general support; available to anonymous and logged-in customers
- `[Order #id]` — order-specific; initiated from order list or order management page

**Chat:** Customer messages left (dark bubble) · Admin messages right (purple gradient bubble) · timestamps · file attachments inline.

**Composer:** Formatting toolbar (B · I · Link · List · Emoji) · text input · attach button · Send button.

**User profile sidebar:** Avatar · username · location · orders + spend stats · recent activity · management actions (Update Ticket · Ban User).

**Anonymous session merge:** Anonymous users get a temporary `session_id` (stored in `SupportTicket.sessionId`). On login, `userId` and `username` are attached to existing ticket records — chat history preserved, and the customer's display name updates to their actual username going forward. Pre-login messages retain the anonymous label. Chat session TTL: anonymous = 1 hour. Expired chat session records deleted. (Cart data is on a separate 30-day cookie — independent of this expiry.)

---

### 10.12 Admin Audit Logs (`/admin/logs`)

**Table:** TIMESTAMP · ACTOR · ACTION · IP ADDRESS · STATUS

> ACTOR column shows `actorLabel` — admin display name for admin actions, "System (Cron)" or "System (Webhook)" for system-generated events.

**Status types:** `success` (green) · `critical` (red filled) · `blocked` (amber)

**Example events:** Admin Console Login (success) · Database Connection Timeout (critical) · Modified User Permissions (success) · Unauthorized API Request (blocked)

**Bottom stat cards:** UPTIME PERFORMANCE · BLOCKED THREATS · ACTIVE ANOMALIES

---

### 10.13 Admin Settings (`/admin/settings`)

**Profile card:** Avatar upload · Admin Display Name · Email · Change Security Password link.

**Application card:** Session timeout duration (default 8 hours, adjustable).

**Actions:** Save All Changes (purple) · Discard (outlined).

---

### 10.14 Route Map

```
# Storefront
/                               Landing Page
/games                          Games Page (all games)
/hot-offers                     Hot Offers Page (all hot offer services, filterable by game)
/[game-slug]/services           Game Services Page
/[game-slug]/services/[slug]    Service Detail
/cart                           Cart Page
/checkout                       Checkout
/order-confirmed                Order Confirmed (?session=[checkoutSessionId])
/login                          Customer Login
/register                       Customer Register
/profile                        Customer Profile
/profile/edit                   Edit Profile
/profile/orders/[id]            Order Detail
/reset-password                 Reset Password (from email link)
/refund-policy                  Refund Policy
/privacy-policy                 Privacy Policy
/terms-of-service               Terms of Service
/404                            Not Found (handled by Next.js not-found.tsx — no explicit route needed)

# Admin Terminal
/admin/login                    Admin Login
/admin/dashboard                Operational Overview
/admin/users                    User Registry
/admin/users/new                Add User
/admin/users/[id]               Edit User
/admin/games                    Games List
/admin/games/new                Add Game
/admin/games/[id]/edit          Edit Game
/admin/services                 Service Catalog
/admin/services/new             Create Service
/admin/services/[id]/edit       Edit Service
/admin/services/[id]/preview    Service Preview (draft storefront render)
/admin/orders                   Order Management
/admin/orders/[id]              Order Detail
/admin/transactions             Financial Ledger
/admin/content                  Content Library
/admin/content/[id]/edit        Edit Content Block
/admin/messages                 Support Inbox
/admin/messages/[ticketId]      Active Conversation
/admin/logs                     Audit Logs
/admin/settings                 Terminal Configuration
```

**Route guard:** All `/admin/*` routes require a valid signed JWT with `role: "admin"` verified server-side. Session timeout after 8 hours of inactivity (configurable in Settings) — redirects to `/admin/login`.

---

## 11. Order State Machine

### State Diagram

```
[Customer pays]
      |
      v
+------------------+
|     pending      |  Payment cleared. Awaiting admin acknowledgment.
+--------+---------+
         |  admin acknowledges
         v
+------------------+
|    confirmed     |  Admin confirmed. Service about to begin.
+--------+---------+
         |  admin starts service
         v
+------------------+
|   in_progress    |  Service actively underway.
+--------+---------+
         |  admin marks as delivered
         v
+------------------+
|    delivered     |  Customer notified. 7-day refund window starts.
+--------+---------+
         |
    +----+-----------------------------+
    |                                  |
7-day window passes             customer requests refund
(no refund request)             (within 7 days of deliveredAt)
    v                                  v
+----------+                +--------------------+
| completed|                |  refund_requested  |
| (terminal)|               +--------+-----------+
+----------+                         |
                          +----------+----------+
                          |                     |
                    admin approves         admin denies
                          v                     v
                    +-----------+         +-----------+
                    |  refunded |         |  completed|
                    | (terminal)|         | (terminal)|
                    +-----------+         +-----------+
```

Refund can also be requested from `pending`, `confirmed`, and `in_progress`
(customer changed their mind before delivery — no time limit in this case).

### Transition Rules

| From | To | Trigger | Actor |
|---|---|---|---|
| — | `pending` | Payment gateway webhook confirms charge | System |
| `pending` | `confirmed` | Admin acknowledges the order | Admin |
| `confirmed` | `in_progress` | Admin starts the service | Admin |
| `in_progress` | `delivered` | Admin marks as delivered | Admin |
| `delivered` | `completed` | 7-day window passes with no refund request | Cron |
| `pending` / `confirmed` / `in_progress` | `refund_requested` | Customer changed mind (no time limit) | Customer |
| `delivered` | `refund_requested` | Customer disputes delivery (within 7 days of `deliveredAt`) | Customer |
| `refund_requested` | `refunded` | Admin approves and issues via gateway | Admin |
| `refund_requested` | `completed` | Admin denies refund — terminal, no further attempts | Admin |

**Rules:**
- `completed` and `refunded` are terminal — no further transitions
- Orders only exist post-payment — no pre-payment state
- Refund from pre-delivery states: no time limit
- Refund from `delivered`: within **7 days of `deliveredAt`** only
- **One refund attempt per order** — once attempted (approved or denied), no further requests
- Auto-completion after 7 days requires a scheduled cron function (see §7 System tracker)
- All transitions must be written to Audit Log

### Refund Routing by Provider

**Stripe (card + PayPal):**
```ts
stripe.refunds.create({ payment_intent: order.stripePaymentIntentId })
// Returns to original card/PayPal automatically. Customer does nothing.
```

**NowPayments (crypto):**
```ts
POST /v1/refunds { payment_id: order.nowpaymentsPaymentId, address: order.cryptoRefundAddress }
// Requires customer wallet address. Amount converted at rate at time of refund (not purchase time).
```

### Refund Flow

```
STRIPE (card / PayPal)               NOWPAYMENTS (crypto)
----------------------               --------------------
Customer requests refund             Customer requests refund
         |                                    |
status → refund_requested            status → refund_requested
         |                                    |
Admin reviews in dashboard           Customer prompted: "Provide wallet address"
         |                                    |
Admin clicks Issue Refund            Customer submits wallet address
         |                                    |
Backend reads paymentProvider        cryptoRefundAddress saved to order
= "stripe"                                    |
         |                           Admin reviews in dashboard
Stripe API called automatically               |
         |                           Issue Refund button becomes active
status → refunded                             |
                                     Admin clicks Issue Refund
                                              |
                                     Backend reads paymentProvider
                                     = "nowpayments"
                                              |
                                     NowPayments API called automatically
                                              |
                                     status → refunded
```

### Backend Routing Pseudocode

```ts
async function issueRefund(orderId: string) {
  const order = await db.orders.findById(orderId)

  if (order.paymentProvider === "stripe") {
    await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId })
  }

  if (order.paymentProvider === "nowpayments") {
    if (!order.cryptoRefundAddress) {
      throw new Error("AWAITING_WALLET_ADDRESS") // button stays disabled in admin UI
    }
    await nowpayments.refunds.create({
      payment_id: order.nowpaymentsPaymentId,
      address:    order.cryptoRefundAddress
    })
  }

  await db.orders.update(orderId, { status: "refunded" })
  await auditLog.write({ action: "REFUND_ISSUED", orderId, provider: order.paymentProvider })
}
```

---

## 12. Rate Limiting

> Caps requests per IP/user per time window. Prevents brute force, scraping, and abuse.

### Tiers

```
Anonymous (no session)   →  Strictest — unknown, untrusted
Authenticated customer   →  Moderate  — known, untrusted for payments
Admin                    →  Relaxed   — trusted, still protected
```

### Limits

| Endpoint | Anonymous | Customer | Admin | Reason |
|---|---|---|---|---|
| `POST /api/auth/login` (customer) | 10 / 15 min / IP | — | — | Brute force |
| `POST /admin/login` | 5 / 15 min / IP | — | 10 / 15 min / IP | Brute force |
| `GET /api/search` | 15 / 1 min / IP | 40 / 1 min / user | unlimited | Scraping |
| `GET /api/games` | 20 / 1 min / IP | 60 / 1 min / user | unlimited | Scraping |
| `GET /api/services` | 20 / 1 min / IP | 60 / 1 min / user | unlimited | Scraping |
| `POST /api/checkout` | blocked | 5 / 1 min / user | unlimited | Auth required |
| `POST /api/orders` | blocked | 3 / 1 min / user | unlimited | Duplicate prevention |
| `POST /api/refunds` | blocked | 2 / 1 hour / user | unlimited | Abuse prevention |
| Payment webhooks | signature check only | — | — | Replay attack prevention |

**Rules:**
- Violations return HTTP 429 + Audit Log entry with status `blocked`
- Payment webhook endpoints use signature verification — IP-based limiting does not apply
- Limits above are starting estimates — tune after launch with real traffic data
- Supabase Auth has its own built-in rate limiting on `/auth/v1/token`. Verify it is enabled: Supabase Dashboard → Authentication → Rate Limits. The custom customer login limit above is a defense-in-depth layer — both should be active.

**Implementation:** Supabase API gateway rate limiting.

---

## 13. Implementation Notes

### Notifications

**Customer (in-app bell + email):**

| Trigger | Message |
|---|---|
| `in_progress → delivered` | "Your boost is complete!" |
| `refund_requested → refunded` | "Your refund has been approved and is being processed." |
| `refund_requested → completed` (denied) | "Your refund request has been denied." |

**Admin (in-app bell + email via Resend):**

| Trigger | Message |
|---|---|
| New order enters `pending` | In-app bell: "New order received — [service name]" + email to admin |
| Order enters `refund_requested` | In-app bell: "Refund requested — [order ID]" + email to admin |

**In-App Bell:** Unread counter badge on bell icon. Clicking opens notification feed. Marked as read on open/click. Present in both storefront navbar and admin top bar.

---

### Resend (SMTP)

Resend is a developer-focused email API. It handles transactional emails — no newsletter features, no drag-and-drop builder. Just reliable email delivery via API or SDK.

**What it sends for Moon Strike:**
- Auth emails: email confirmation on register, password reset link (both triggered by Supabase Auth automatically when configured)
- Order notification emails: boost complete, refund approved, refund denied (triggered by your backend on state transitions)
- Admin 2FA OTP emails (triggered by backend on admin login)

**How it works:**
1. Create a free account at resend.com (100 emails/day free, 3,000/month)
2. Verify your sending domain (adds DNS records — one-time setup)
3. Add `RESEND_API_KEY` to env vars
4. Install the SDK: `npm install resend`
5. Send emails from your backend:

```ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'MoonStrike <noreply@yourdomain.com>',
  to: customer.email,
  subject: 'Your boost is complete!',
  html: '<p>Your order has been delivered...</p>'
});
```

**Supabase integration:** In Supabase dashboard → Authentication → Email → set custom SMTP to Resend's SMTP details. This routes all Supabase auth emails (confirm, reset) through Resend automatically.

---

### Google Sheets Integration

**Why it needs auth:** Google's API requires authentication even for your own spreadsheets — it doesn't allow anonymous writes. You authenticate using a **service account**: a bot Google identity that your backend acts as. The spreadsheet is shared with the service account's email address, and your backend uses a JSON key to sign API requests. Zero cost, one-time setup, key lives in env vars.

**Setup:**
1. Go to Google Cloud Console → Create a project (or use existing)
2. Enable the Google Sheets API
3. Create a Service Account → generate a JSON key → download it
4. Add the key to env: `GOOGLE_SERVICE_ACCOUNT_JSON` (the full JSON as a string)
5. Create your Google Spreadsheet → Share it with the service account's email (Editor access)
6. Copy the Spreadsheet ID from the URL → add to env: `GOOGLE_SHEET_ID`

One spreadsheet, two tabs. Written on order events only.

Not written to Sheets: user registrations, admin actions, failed payments.

**Orders tab** — one row per order, updated in place on status change:

| Column | Notes |
|---|---|
| `order_id` | Anchor key — used to find and update the row |
| `user_id` | FK reference |
| `username` | Denormalized for readability |
| `email` | Denormalized |
| `service` | Service name at purchase time |
| `options_snapshot` | e.g. `{"difficulty":"Mythic","loot_traders":2}` |
| `status` | Updated in place on every state transition |
| `created_at` | Set once on order creation |
| `delivered_at` | Set when status hits `delivered` |

**Transactions tab** — one row per payment, `refund_status` updated in place (no new row for refunds):

| Column | Notes |
|---|---|
| `transaction_id` | Anchor key |
| `order_id` | FK reference |
| `user_id` / `username` | Denormalized |
| `amount` | Positive value for payments |
| `currency` | USD or EUR |
| `provider` | `stripe` or `nowpayments` |
| `payment_status` | `paid` or `failed` |
| `refund_status` | Updated in place — `refunded` or `denied` when resolved |
| `created_at` | Set once |
| `refunded_at` | Set when refund approved |

**Write triggers:**

| Event | Action |
|---|---|
| Payment webhook fires — order enters `pending` | Append new row to Orders tab + Transactions tab |
| Order status changes to any subsequent state | Update existing Orders row by `order_id` |
| Refund resolved | Update `refund_status` + `refunded_at` on Transactions row |

> "Order enters `pending`" = payment confirmed by webhook. This is the first write. Do not wait for admin to set `confirmed` — that would miss orders admin never acknowledges.

---

### NowPayments Webhook Verification

**Approach:** HMAC-SHA512 signature middleware, same pattern as Stripe.

**Required env var:** `NOWPAYMENTS_IPN_SECRET` — from NowPayments dashboard > API Settings > IPN Secret. ⚠️ Setup pending.

```ts
// lib/webhooks/verifyNowPayments.ts
import crypto from "crypto";

export function verifyNowPaymentsSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  if (hmac.length !== signature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(hmac, "hex"),
    Buffer.from(signature, "hex")
  );
}
```

```ts
// api/v1/webhooks/nowpayments.ts
export async function POST(req: Request) {
  const signature = req.headers.get("x-nowpayments-sig");
  const rawBody = await req.text(); // must be raw — never parse first

  if (!signature || !verifyNowPaymentsSignature(
    rawBody,
    signature,
    process.env.NOWPAYMENTS_IPN_SECRET!
  )) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.payment_status === "finished") {
    // confirm order, write to Sheets, notify admin
  }

  return new Response("OK", { status: 200 });
}
```

**Critical rules:**
- Always read raw body before any JSON parsing — parsing mutates the body and breaks HMAC comparison
- Use `crypto.timingSafeEqual` for the comparison — plain `===` is vulnerable to timing attacks
- Log failed verifications to Audit Logs — repeated failures may signal an attack
- Always return 200 after verification passes, even on business logic errors — NowPayments retries on non-200, which risks duplicate order creation

---

### Image Hosting

- **Origin:** Supabase Storage (free tier, 1 GB included)
- **CDN:** Cloudflare Images — caches at edge globally after first pull from Supabase
- **Estimated cost:** $0–$5/month at early-to-mid traffic

---

### Auth — Google OAuth

Both auth methods active for storefront customers. Both free under Supabase's 50K MAU free tier.

```ts
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signInWithOAuth({ provider: 'google' })
```

Admin auth does not use Supabase Auth — see §8 and §10.2.

---

*Last updated: see git history — update §7 Feature Progress Tracker when any feature status changes.*
*Design references: all screenshots stored in `/design-refs/`.*

---

## 14. Quality & Launch Checklist

### 14.1 UAT (User Acceptance Testing)

Test every flow end-to-end as a real user before going live. Use Stripe test cards and NowPayments sandbox — never live keys during testing.

**Stripe test card:** `4242 4242 4242 4242` · any future expiry · any CVC

| Flow | What to verify |
|---|---|
| Register → verify email → login | Confirmation email arrives via Resend, link works, redirects to profile |
| Register with Google OAuth | Account created, redirected correctly |
| Forgot password | Reset email arrives, link opens reset form, redirect to login on success |
| Add to cart (anonymous) → login → cart merge | Items survive login, prices and options intact |
| Add same service twice | Two separate CartItems appear in cart |
| Configure service → Add to Cart → Buy Now → Cart | Cart opens, item shown with correct options and price |
| Cart currency toggle | Prices update across cart, navbar, and service detail simultaneously |
| Cart region toggle | Services filter correctly, persists across navigation |
| Proceed to Checkout (anonymous) | Redirected to login, returned to cart after login |
| Full purchase — Stripe card | Payment clears, orders created, Order Confirmed page shows all purchased services, cart emptied, admin notified |
| Full purchase — NowPayments crypto | Webhook fires, signature verified, orders created, wallet address flow works on refund |
| Multi-item checkout | All CartItems shown in order summary, one payment, one Order per CartItem created, all visible on Order Confirmed page |
| Order Confirmed page | All orders from checkout shown, View My Orders links to profile Order History |
| Admin: Confirm Order → In Progress → Delivered | Each status transition updates customer profile and sends notification |
| Customer requests refund (pre-delivery) | Button visible on pending/confirmed/in_progress, refund_requested status set |
| Customer requests refund (post-delivery, within 7 days) | Button visible, 7-day window enforced |
| Customer requests refund (post-delivery, after 7 days) | Button hidden — refund not available |
| Admin approves refund — Stripe | Refund issued via Stripe API, status → refunded |
| Admin approves refund — NowPayments | Wallet address collected, refund issued via NowPayments API, status → refunded |
| Admin denies refund | Status → completed (terminal), refund button no longer shown |
| Second refund attempt on same order | Not possible — button hidden after first attempt |
| 7-day auto-complete cron | Delivered order auto-moves to completed after 7 days with no refund request |
| Support chat (anonymous) | Chat opens, message sent to admin |
| Support chat → login → name updates | History preserved, username shown going forward |
| Admin search | Finds orders by ID, transactions by ID, users by email/username |
| Unverified user tries to purchase | Blocked, verification banner shown, resend email works |
| Admin login + 2FA | OTP email arrives, login completes, session persists for 8 hours |
| Admin session timeout | After 8 hours inactivity, redirected to /admin/login |
| Light mode toggle | Colors swap correctly, layout unchanged, preference persists on reload |
| 404 page — bad game slug | notFound() renders correctly, no redirect to homepage |
| 404 page — bad service slug | notFound() renders correctly |
| 404 page — wrong order ID | notFound() renders for order not belonging to logged-in user |

---

### 14.2 Security Checklist

All items must be checked before going live. Items marked **CRITICAL** are non-negotiable — the app should not launch without them.

| Item | Priority | Details |
|---|---|---|
| Supabase RLS enabled on all tables | **CRITICAL** | See §14.3 — without this, any logged-in customer can read other customers' data directly |
| All env vars in hosting platform, not in code | **CRITICAL** | Use Vercel / hosting dashboard env vars. Never hardcode secrets. |
| `.env` files in `.gitignore` | **CRITICAL** | One leaked commit = compromised keys |
| NowPayments webhook signature verified | **CRITICAL** | Without this, fake payments can create real orders — See §13 |
| Stripe webhook signature verified | **CRITICAL** | Same risk as above |
| Admin routes server-side auth-gated | **CRITICAL** | `/admin/*` must verify JWT server-side, not just client-side |
| Admin 2FA enforced | **CRITICAL** | Email OTP on every new device login |
| HTTPS only | **CRITICAL** | Enforce via hosting platform — no HTTP fallback |
| Anonymous cart goes through server-side routes only | **CRITICAL** | Supabase client never used for anonymous cart reads/writes — service role key only via API routes |
| Avatar upload validates file type + size | High | Accept JPEG/PNG only, reject all others, compress before storing |
| Rate limiting active | High | Supabase API gateway limits per §12 |
| Supabase Storage bucket policies | High | Game/service images: public read. User avatars: private, owner-only write. |
| Order ownership verified on Order Confirmed page | High | If `checkoutSessionId` doesn't belong to logged-in user → redirect to `/profile` |
| Cart ownership verified | High | Users can only read/write their own CartItems |
| Admin self-ban and last-admin-ban blocked | High | Server-side guard — see §10.4 |
| Audit log covers all admin actions | Medium | Every state transition, login, and settings change logged |
| Failed webhook attempts logged | Medium | Repeated failures flagged as `blocked` in Audit Log |

---

### 14.3 Supabase RLS Policies

RLS (Row Level Security) restricts which rows a user can read or write at the database level. Without it, a logged-in customer using the Supabase client can query any table and read other users' data — even if your frontend doesn't expose it.

**Enable RLS on every table. Then add these policies:**

```sql
-- ── ORDERS ────────────────────────────────────────────────────────────────
-- Customers can only see their own orders
CREATE POLICY "customer_read_own_orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Only backend (service role) can insert/update orders
CREATE POLICY "service_role_write_orders"
ON orders FOR ALL
USING (auth.role() = 'service_role');

-- ── CART ──────────────────────────────────────────────────────────────────
-- Authenticated users read their own cart by user_id
CREATE POLICY "customer_read_own_cart_auth"
ON carts FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Authenticated users can create their own cart
CREATE POLICY "customer_insert_own_cart"
ON carts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own cart (e.g. updatedAt)
CREATE POLICY "customer_update_own_cart"
ON carts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- NOTE: Anonymous cart operations (userId = null) are handled entirely through
-- server-side API routes using the service role key. The Supabase client is never
-- used directly for anonymous cart reads or writes — no RLS policy needed for anon carts.

-- ── CART ITEMS ──────────────────────────────────────────────────────────────
CREATE POLICY "customer_manage_own_cart_items"
ON cart_items FOR ALL
USING (
  cart_id IN (
    SELECT id FROM carts WHERE user_id = auth.uid()
  )
);

-- ── SUPPORT TICKETS & MESSAGES ─────────────────────────────────────────────
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

-- NOTE: Anonymous support ticket operations (userId = null) also go through
-- server-side API routes with the service role key — same pattern as the cart.

-- ── GAMES & SERVICES ───────────────────────────────────────────────────────
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

-- ── ADMIN TABLES ───────────────────────────────────────────────────────────
-- Audit logs, admin users, content blocks: service role only
CREATE POLICY "service_role_only_audit_logs"
ON audit_logs FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_admin_users"
ON admin_users FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_content_blocks"
ON content_blocks FOR ALL
USING (auth.role() = 'service_role');
```

> All backend API routes that write to the database must use the **Supabase service role key** (never the anon key) — this bypasses RLS intentionally for trusted server-side operations. The anon key is for the frontend client only.

---

### 14.4 Performance Guidelines

Follow these during development — not as a post-launch fix.

| Area | Rule |
|---|---|
| Images | Lazy load all game/service images. Use Cloudflare Images URLs with size transforms (e.g. `?width=600`). Never serve original upload URLs directly to the frontend. |
| Infinite scroll | Fetch in pages of 16 items. Never load entire table. Use Supabase `.range(from, to)` pagination. |
| Search debounce | Already specced at 300ms — do not reduce. Each keystroke = one DB query. |
| Supabase Realtime | Subscribe to chat WebSocket only when chat bubble is open. Unsubscribe on close. Never keep open connections across all pages. |
| TrustBox widget | Load async via script tag. Does not block page render — no action needed. |
| Options schema render | Service Detail configurator reads `optionsSchema` JSONB. Parse once on load, do not re-parse on every price recalculation. |
| Price calculation | Run entirely client-side on each option change — no API call needed. One pure function (see §6). |
| Admin dashboard charts | Fetch aggregated data server-side. Never query raw orders/transactions table on the client for chart data. |
| Cart item count badge | Store count in global state (useCart hook). Do not re-fetch cart on every page to get the count. |

---

## 15. Environment Variables

> All secrets go in your hosting platform's env var dashboard (Vercel, etc.) — never hardcoded, never committed to git. Add `.env.local` to `.gitignore` before the first commit.

### Required Variables

| Variable | Used in | When needed | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend + Backend | Build + Runtime | Supabase project URL. Safe to expose — prefixed `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend + SSR auth client | Build + Runtime | Supabase publishable key (`sb_publishable_...`). Safe to expose; RLS and user JWTs enforce access. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted only as a legacy fallback. |
| `SUPABASE_SECRET_KEY` | Backend API routes only | Runtime | Supabase secret key (`sb_secret_...`). **Never expose to frontend.** Bypasses RLS. Legacy fallback: `SUPABASE_SERVICE_ROLE_KEY`. |
| `JWT_SECRET` | Backend | Runtime | Signs and verifies admin JWTs. Min 32 chars, random. Generate with `openssl rand -base64 32`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend checkout | Build + Runtime | Stripe publishable key — safe to expose. |
| `STRIPE_SECRET_KEY` | Backend | Runtime | **Never expose to frontend.** Used to create Payment Intents and process refunds. |
| `STRIPE_WEBHOOK_SECRET` | Backend webhook handler | Runtime | From Stripe Dashboard → Webhooks → signing secret. Used to verify webhook signatures. |
| `NOWPAYMENTS_API_KEY` | Backend | Runtime | From NowPayments dashboard. Used to create crypto payments. |
| `NOWPAYMENTS_IPN_SECRET` | Backend webhook handler | Runtime | ⚠️ Setup pending. From NowPayments dashboard → API Settings → IPN Secret. Used to verify webhook signatures. |
| `RESEND_API_KEY` | Backend | Runtime | From resend.com dashboard. Used for all transactional emails (auth, order notifications, admin 2FA OTP). |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Backend | Runtime | Full JSON key file contents as a string. From Google Cloud Console → Service Accounts. Used for Sheets writes. |
| `GOOGLE_SHEET_ID` | Backend | Runtime | Spreadsheet ID from the Google Sheets URL. The sheet must be shared with the service account email. |
| `NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH` | Frontend | Build + Runtime | From Cloudflare Images dashboard. Used to construct CDN image URLs. |

### Setup Order

Set these up in this order — each depends on the service being configured first:

1. Supabase — create project, copy URL + anon key + service role key
2. JWT secret — generate locally, add to env
3. Stripe — create account, get publishable + secret key, set up webhook and copy signing secret
4. NowPayments — create account, get API key, configure IPN and copy secret ⚠️
5. Resend — create account, verify domain, copy API key, configure Supabase SMTP
6. Google Cloud — create project, enable Sheets API, create service account, download JSON key, create spreadsheet, share with service account email
7. Cloudflare Images — enable in Cloudflare dashboard, copy account hash

### Local Development

```bash
# .env.local (never commit this file)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
JWT_SECRET=your-32-char-random-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...
RESEND_API_KEY=re_...
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH=abc123xyz
```

> For Stripe webhooks in local dev: use the Stripe CLI (`stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe`) to forward webhook events to your local server. The CLI provides a temporary `STRIPE_WEBHOOK_SECRET` for local use only.

