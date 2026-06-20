# MOONSTRIKE - System Reference Document

> **Read this before touching any code.** Single source of truth for the project.
> Design references are stored in `/design-refs/`.

---

## Current Progress Snapshot

_Last refreshed: 2026-06-20_

Moon Strike has moved past the static prototype phase. The current working surface is Supabase-backed auth, admin auth, game CMS, genre CMS, service category CMS, service CMS, service image upload, CMS-backed storefront browsing, CMS-backed Quick Select, browser-session cart APIs, real add-to-cart/remove-cart flows, real-cart checkout, Stripe sandbox Checkout Sessions, NowPayments crypto checkout, frozen checkout snapshots, idempotent payment webhook fulfillment, confirmed-payment transactions, internal order/transaction references, order confirmation, real customer order/transaction history/detail readout, real admin order/transaction management, protected API-refresh chat, in-app notifications, and selected customer transactional emails.

**Implemented / mostly working:**
- Customer auth: email/password, Google OAuth, verification, reset password, profile edit, connected accounts, and auth gates.
- Admin auth: one seeded admin account, no OTP, signed HttpOnly admin session, `/admin/*` guard through `proxy.ts`, login rate limit, and audit logging coverage.
- Admin games: create/edit/list/delete/archive, image upload, genre add/delete, active/draft/archived states.
- Admin services: list/filter/search/delete, service categories per game, slug-based edit/preview routes, service images, custom badges, sticky editor layout, and validated option schema builder.
- Storefront catalog: landing game section, `/games`, `/services`, `/[game-slug]`, category pages, service detail pages, and Quick Select use CMS data instead of mock service data.
- Seeds: `npm run admin:seed`, `npm run admin:reseed`, `npm run catalog:seed`, `npm run refund-orders:reseed`, `npm run notifications:seed`, and `npm run chat-user:seed` for test data.
- Browser-session cart: anonymous/login/logout in the same browser all use the same `ms_cart_session` cart; service detail Add to Cart and Buy Now persist selected option snapshots.
- Orders/payments: one internal order per checkout, `order_items` for purchased services, `transactions` for confirmed provider payments, `order_ref` and `transaction_ref` user/admin-facing IDs, Stripe refund execution, manual non-Stripe refund recording, customer/admin notification events, and customer emails for delivered/refund decisions.
- Chat: persisted support/order tickets, protected API polling/local events, unread badges, image/shared-link attachments, lazy loading, and cleanup cron are wired.

**Still pending / mock-backed:**
- Google Sheets sync.
- Dedicated `/hot-offers` route and final CMS polish for all landing blocks.

**Current route direction:**
- Public service detail: `/[game-slug]/[category-slug]/[service-slug]`.
- Admin service edit: `/admin/services/[game-slug]/[service-slug]/edit`.
- Admin service preview: `/admin/services/[game-slug]/[service-slug]/preview`.
- Compatibility catch-all: `app/admin/services/[...servicePath]/page.tsx` handles old ID URLs when possible.

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
| **Type** | Game Boosting Marketplace - Web Platform |
| **Business Model** | Customers purchase boosting services (leveling, raid carries, ranked placement, dungeon runs, item farming, etc.) for specific games. Admin/pro players deliver the service. |
| **Tone** | Dark, premium, gamer-focused. Esports meets e-commerce. |

---

## 2. Design System

### 2.1 Color Tokens

#### Dark Mode (default - always implement this)

| Token | Hex | Usage |
|---|---|---|
| `--ms-primary` | `#050816` | Page background |
| `--ms-secondary` | `#0F172A` | Card / surface background |
| `--ms-accent` | `#172554` | Borders, hover states, subtle highlights |
| `--ms-gradient-start` | `#8B5CF6` | Gradient start (purple) - CTAs, logo, active states |
| `--ms-gradient-end` | `#22D3EE` | Gradient end (cyan) - prices, highlights, logo |
| `--ms-text-primary` | `#F1F5F9` | Headings, labels, primary content |
| `--ms-text-secondary` | `#94A3B8` | Body text, descriptions, placeholders |

**Primary gradient:** `linear-gradient(to right, #8B5CF6, #22D3EE)` - logo, CTAs, active nav, price highlights.

#### Light Mode (color token swap only - same layout as dark)

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
| `--ms-lm-yellow-primary` | `#F3C623` | PRIMARY accent - replaces purple gradient |
| `--ms-lm-purple` | `#794BB8` | Decorative elements only (step shapes, etc.) |

**Light mode key differences:**
- Primary CTA changes from purple-to-cyan gradient to golden yellow `#F3C623`
- Backgrounds invert to light blue-white; text hierarchy inverts to dark navy on light
- Teal `#117680` replaces cyan as secondary accent; purple demoted to decorative use only
- Logo uses golden yellow instead of gradient

> Light mode is a **CSS variable swap only** - same components, same layout.
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
| `<Navbar>` / `<SiteHeader>` | Logo, Quick Select trigger, global search overlay, currency toggle (USD/EUR, persisted in `localStorage`), Games link, Notifications link, cart icon (`/cart`) with count badge, theme toggle, and Login/Profile state from Supabase Auth. Current implementation lives in `components/site-header.tsx`. |
| `<QuickSelectMenu>` | CMS-backed services menu. Fetches `/api/catalog/quick-select`, renders active games/services only, uses a body portal overlay, closes on outside click/Escape, and uses a one-step game carousel with fixed All + prev/next controls. |
| `<Footer>` | Logo, sitemap, legal links, genres, social links, disclaimer, copyright. |
| `<GameCard>` | Image thumbnail, genre tags, game name, short description. |
| `<ServiceCard>` | Service image/thumbnail, custom badges, title, description, price, and service detail link. |
| `<CategoryTabs>` | Scrollable horizontal pill tabs with left/right arrow nav. Landing genre tabs and Quick Select game tabs scroll one item at a time. |
| `<StarRating>` | 5-star display with username and comment (TrustPilot style). |
| `<CurrencySelector>` | USD / EUR display toggle. Controls visible prices only; never controls service availability. |
| `<Badge>` | Custom badge text from CMS for services; do not hardcode a fixed service badge list. |
| `<ThemeToggle>` | Switches dark and light mode; persisted in user preference. |
| `<SearchResults>` | Global search overlay for games and services. Searches service/game names and includes related game services when a game name is searched. `/services`, `/games`, and Quick Select also have CMS-backed search/filter behavior. |

---

## 3. Storefront Pages

### 3.1 Landing Page (`/`)

**Purpose:** Main entry point. Converts visitors via offers, social proof, and trust signals.

| Section | Details |
|---|---|
| Navbar | Global component |
| Hero / Promo Banner | CMS-editable (`hero` block). Label - Headline - Subtext - CTA button. Fields: label, headline, subtext, CTA text/link, background image. |
| Game Filter + Grid | Category tabs: auto-populated from distinct genre values via `JOIN genres ON games.genre_id = genres.id` (e.g. ALL - ACTION RPG - TACTICAL SHOOTER - LOOTER SHOOTER). 4-column game card grid. Clicking a game card opens `/[game-slug]`. `Load More Games` button (click to load more, not infinite scroll). |
| Best Offers | Section header + `VIEW ALL DEALS` link to `/hot-offers`. 4 service cards selected at random from all active `isHotOffer = true` services, re-randomized on each page load (server-side via `ORDER BY RANDOM() LIMIT 4`). Shows price + Buy Now. If fewer than 4 hot offer services exist, shows however many are available. No admin curation - fully automatic. |
| Trust Stats Bar | CMS-editable. 4 stats: 50K+ GAMES BOOSTED - 99.9% SUCCESS RATE - 24/7 ACTIVE SUPPORT - TOP 1% PRO PLAYERS |
| Why Choose Us | CMS-editable. Full-width media block + 3 benefit items (icon + label + description). |
| How It Works | CMS-editable. 4 numbered steps: Choose Service - Log Into Account - Daily Progress Updates - Enjoy Result. |
| TrustPilot Reviews | Carousel of review cards (avatar - 5 stars - comment). Left/right nav. |
| Payment Methods Strip | PayPal - Mastercard - Apple Pay - Google Pay - Stripe logos |
| Footer | Global component |

---

### 3.2 Game Services Page (`/[game-slug]`, `/[game-slug]/[category-slug]`)

**Route:** `/[game-slug]` (base) - `/[game-slug]/[category-slug]` (filtered by category)

**Purpose:** Browse all boosting services for a specific game, filterable by service category.

| Section | Details |
|---|---|
| Navbar | Global |
| Page Header | Game name as title, genre eyebrow, and description. |
| Featured Game Banner | Wide card with game art/placeholder, game title left, and USD/EUR global currency selector right. Region toggles are not used; currency is display-only. |
| Service Category Tabs | Scrollable pill tabs. See tab behaviour below. |
| Result/Search Row | Shows `Showing X services in [category]` on the left and game-local search input on the same line on desktop. Search filters the currently loaded game/category services in real time. |
| Service Cards Grid | 2-row x 4-column initial load. Infinite scroll. Each card: HOT badge - image - title - description - price - Buy Now |
| TrustPilot Reviews | Same carousel component as landing page |
| Footer | Global |

**Category Tabs - full list and URL behaviour:**

`ALL` is always the first tab and always hardcoded. Selecting it navigates to `/[game-slug]` (no category segment).

`HOT OFFERS` is always the second tab and always hardcoded. Selecting it navigates to `/[game-slug]/hot-offers`. It filters by `isHotOffer = true`. Never query `serviceCategory = "HOT OFFERS"` - that row will never exist in the DB.

All remaining tabs are auto-populated from `ServiceCategory` records where `gameId = this game`, ordered by `sortOrder ASC`. Selecting one navigates to `/[game-slug]/[category.slug]`.

Tab - URL - filter mapping:

| Tab | URL | Filter logic |
|---|---|---|
| ALL | `/[game-slug]` | No filter - all active services for this game |
| HOT OFFERS | `/[game-slug]/hot-offers` | `isHotOffer = true` |
| `[Category Name]` | `/[game-slug]/[category-slug]` | `serviceCategoryId = category.id` |

**Routing rules:**

On page load, read `[category-slug]` from the URL:
- No segment - render ALL tab as active, no category filter
- `hot-offers` - render HOT OFFERS tab as active, filter `isHotOffer = true`
- Any other value - look up `ServiceCategory` where `slug = [category-slug]` AND `gameId = this game`. If found - render that tab as active, filter by `serviceCategoryId`. If not found - call `notFound()`.

If no Game record matches `[game-slug]` - call `notFound()`.

**Featured Game Banner - query logic (unchanged):**
1. Fetch active `PromoBanner` where `gameId = this game`.
2. If none found, fall back to a global banner where `gameId IS NULL`.
3. If still none found, hide the section entirely.

---

### 3.3 Games Page (`/games`)

**Purpose:** Browse all supported games with genre filtering.

**Layout:** Two-column - sidebar (left) + main content (right).

**Sidebar:**
- `All Games` link (clears all filters)
- `GENRES` multi-select tag pills - auto-populated from distinct genres via `JOIN genres ON games.genre_id = genres.id` query: `ACTION RPG - MMORPG - FPS - MOBA - TACTICAL SHOOTER - BATTLE ROYALE - LOOTER SHOOTER - SPORTS ACTION`
- Selecting a genre filters the main grid to matching games. Multiple genres can be selected (OR logic - shows games matching any selected genre).

**Main Content:** All games header - Search input - 3-column game card grid - infinite scroll (auto-loads on scroll). Clicking a game card opens `/[game-slug]`.

---

### 3.4 Hot Offers Page (`/hot-offers`)

**Purpose:** Dedicated deals page. Shows all services where `isHotOffer = true` across all games, filterable by game.

| Section | Details |
|---|---|
| Navbar | Global |
| Page Header | Title: `Hot Offers` / Subtitle: "Best deals across all games" |
| Game Tabs | Auto-populated from games that have at least one `isHotOffer = true` service: `ALL - [Game Name] - [Game Name] -...`. ALL shown by default. |
| Service Cards Grid | Same card style as game services page. HOT badge on every card. Sorted by most recently marked as hot offer. Infinite scroll - auto-loads on scroll. |
| Footer | Global |

**Data source:** `Service WHERE isHotOffer = true AND status = "active"`, sorted by `hotOfferAt DESC`. Filtered by selected game tab.

---

### 3.5 Service Detail Page (`/[game-slug]/[category-slug]/[service-slug]`)

**Purpose:** Full service view with configurator. Primary conversion page.

**Canonical route:** `/[game-slug]/[category-slug]/[service-slug]` for categorized services. Legacy `/services/[game]/[slug]` redirects to the modern storefront route when enough context exists.

**Layout:** Two-column - detail (left) + sticky configurator sidebar (right).

**Left Column:**
1. Breadcrumb (game name and category)
2. Title and description
3. Quick badges rendered from custom `service.badges[]`
4. Service image from the service CMS upload
5. "What You Get" benefit cards from `service.whatYouGet[]`
6. Requirements checklist from `service.requirements[]`
7. Shared trust / why choose us content where applicable

**Right Configurator:**
- Currency-aware price display using independent USD/EUR values.
- Base price plus live option pricing.
- Current supported option widgets: dropdown, radio, checkbox group, range slider, number stepper, quantity, toggle, text, and textarea.
- Quantity is CMS-controlled. It appears only if the service has a `quantity` option and multiplies the configured unit total.
- Add to Cart persists configured snapshots. Buy Now adds the configured service and moves the customer into the cart/checkout flow.

**Price calculation:**
```
unitTotal = basePrice
 + selected choice prices
 + range/number stepper price impact
 + enabled toggle price

total = unitTotal * quantityOptionValue (or 1)
```

USD and EUR are calculated independently. Do not convert one currency into the other at runtime.

---

### 3.6 Login & Register (`/login`, `/register`)

**Google register completion:** When Google OAuth is started from the Register tab, `/auth/callback` redirects Google accounts without email/password login to `/register/complete`. The page shows the verified Google email as read-only and asks only for password + confirm password. Saving calls Supabase `updateUser({password, data: {has_email_password: true}})`, so the same Google-created account can immediately log in with email/password without needing to connect email again from Profile Edit.

**Layout:** Centered card on full background. No navbar or footer.

**Login:** Logo + tagline - Login/Register tab toggle - Email - Password (eye toggle) - Forgot Password - Google OAuth divider - Login CTA.

**Register:** Username - Email - Password - Confirm Password - Google OAuth divider - Create Account CTA.

**Implementation:** Supabase Auth: `signUp` / `signInWithPassword` / `signInWithOAuth({provider: 'google'})`. On success: redirect to previous page or `/profile`.

**Forgot Password flow:**
- "Forgot Password" link on login card - replaces card content with a "Reset Password" form (same card, same style - no new page)
- User enters email - Supabase sends reset link via Resend
- Reset link - opens a "Set New Password" form (same card style at `/reset-password`)
- On success: redirect to `/login`

**Email verification:**
- Supabase sends confirmation email on register via Resend
- Unverified users can: browse all pages, view services, view games
- Unverified users cannot: access `/profile`, add to cart, or proceed to checkout
- Unverified users see a banner: "Please verify your email to make purchases. [Resend email]"

---

### 3.7 Customer Profile (`/profile`)

**Layout:** Left sidebar (profile info) + main tabbed content.

**Current order/profile implementation note:**
- `/profile/orders` is the default dashboard destination and uses a left profile/menu card plus a customer order list.
- Order filters are active client-side: All, Pending, Confirmed, In Progress, Delivered, Completed, Refund Requested, Refunded.
- Customer order URLs use public internal refs, e.g. `/profile/orders/MS-20260604-000007`; UUID fallback remains supported internally.
- Order list rows show thumbnail, `order_ref`, status badge, game badges, date/time, item count, amount, and View Details.
- Order detail shows timeline first, then order/payment information, then an accordion list of services in the order.
- Refund request button is shown for `pending`, `confirmed`, `in_progress`, `delivered`, and `completed` only until the configured refund window after `completed_at`.
- Refund request button is hidden for `refund_requested` and `refunded`.
- Crypto refund details are not collected from the user at request time. Admin handles crypto refunds manually or through whichever external provider/wallet transfer is appropriate.

**Sidebar:** Avatar - Username - Email - Member since - Total Orders + Total Spent - Edit Profile button - Logout.

**Edit Profile (`/profile/edit`):**
- Avatar: choose from app-generated initials avatar OR upload custom image (max 2MB, JPEG/PNG only, compressed before storing to Supabase Storage)
- Username: text input with real-time availability check
- Password: current password - new password - confirm new password fields
- Save Changes button (gradient) - Cancel (outlined - back to profile)

**Tab 1 - Order History (default):**
- Filter tabs: All - Pending - Confirmed - In Progress - Delivered - Completed - Refund Requested - Refunded
- Each row: thumbnail + name - options summary - date - amount - status badge - View Details

**Order Detail (`/profile/orders/[id]`):**
- Service name + thumbnail
- Full selected options breakdown with prices
- Price breakdown: base + options + total
- Order timeline: placed > pending > confirmed > in_progress > delivered > completed
- `Open Support Chat` button
- `Request Refund` button - visibility rules:
- Shown when status is `pending`, `confirmed`, or `in_progress` (no time limit - service not yet delivered)
- Shown when status is `completed` AND within the configured refund window after `completed_at`
- Hidden once `refund_requested`, `refunded`, or `completed` (terminal or already attempted)
- On click: confirmation dialog - sets `status = refund_requested`
- If `paymentProvider = "nowpayments"`: wallet address input is required before confirming a refund request

If `orderId` doesn't belong to the logged-in user - call `notFound()` to render the 404 page.

**Tab 2 - Transaction History:** Read-only. Columns: Transaction ID - Provider - Date - Amount - Status - Detail.

**Current transaction implementation note:**
- `/profile/transactions` reads real confirmed-payment rows from `transactions`.
- Transaction list rows show transaction ID (`transaction_ref`), provider, date, amount, status, and a Detail action.
- `/profile/transactions/[transaction_ref]` shows only customer-relevant payment/order information: transaction ID, related order ID/link, provider, amount, payment status, refund status, created date, and payment reference.
- Provider session IDs, checkout session IDs, and no-refund placeholder fields are hidden from the customer detail view. Refund detail appears only when a refund exists or is in progress.

---

### 3.8 Global Chat Bubble (all storefront pages)

- Fixed, bottom-right corner of every storefront page
- Collapsed: circular icon + unread count badge
- Expanded: 320x480px chat panel (does not navigate away)
- Same data source as Admin Messages (`SupportTicket` + `Message` models)
- Near real-time via protected API refresh/local update events; no direct browser table subscription for private message payloads
- Excluded from `/admin/*`, `/login`, `/register`

---

### 3.9 Cart Page (`/cart`)

**Purpose:** Review selected services before checkout.

**Access:** Cart icon in navbar (with item count badge) - redirects to `/cart`.

**Layout:** Single-column centered, max-width content.

**Content:**
1. Page title: `Your Cart`
2. Currency toggle (synced to global currency state)
3. Service rows - one per CartItem:
- Service thumbnail + name
- Selected options summary (e.g. "Level: 21-40 / Add-ons: Loot bag / Runs: 2")
- Line total (base + options, in active currency, cyan)
- Remove item button
4. Order total (sum of all CartItems in active currency, large, cyan)
5. `Proceed to Checkout` button (full-width, gradient) - auth-gate: anonymous or unverified users are redirected to `/login` then returned to cart after login
6. Empty state: "Your cart is empty." + `Browse Services` link (- `/games`)

**Rules:**
- Anonymous users can add to cart - items stored against a `session_id` in a cookie (`ms_cart_session`, 6-hour HttpOnly cookie)
- All anonymous cart operations go through server-side API routes using the service role key - the Supabase client is never used directly for anonymous cart writes
- Cart is browser-session based: anonymous, logged-in, and logged-out states in the same browser all use the same `ms_cart_session` cart
- Anonymous cart cookie (`ms_cart_session`) has a **6-hour expiry** - independent of the support chat session (1-hour TTL). These are two separate cookies with separate lifetimes
- Same service can appear multiple times as separate rows (each is a distinct CartItem)
- Prices are locked at add-to-cart time - no live recalculation from service changes
- Cart is emptied automatically after successful payment - all CartItems removed

---

### 3.10 Secure Checkout (`/checkout`)

**Auth-gate:** Requires authenticated + verified user. Anonymous or unverified users clicking "Buy Now" or "Proceed to Checkout" are redirected to `/login`, then returned to checkout after login.

**Layout:** Two-column - payment form (left) + order summary (right).

**Left:** Payment method tabs: CREDIT CARD (Stripe) - PAYPAL (Stripe) - CRYPTO (NowPayments). Card details form shown when Credit Card is active.

**Right:** Order summary - lists ALL CartItems (one row per service: thumbnail - name - options summary - line total) - Grand total (sum of all items, large, cyan, taxes included) - Complete Purchase button (gradient) - SSL note - legal note.

> Prototype shows one item - actual implementation shows all cart items. One payment covers the full cart. Backend creates one `Order` record per `CartItem` on payment success. All orders from the same payment share a `checkoutSessionId` (Stripe Checkout Session ID for card payments, NowPayments payment ID for crypto).

**On payment success:** Redirect to `/order-confirmed?session=[checkoutSessionId]`.

---

### 3.11 Order Confirmed (`/order-confirmed`)

**Route:** `/order-confirmed?session=[checkoutSessionId]`

**Purpose:** Post-payment success page. Confirms all orders from the completed payment and sets expectations for what happens next.

**Layout:** Centered single-column card on full dark background.

**Content (top to bottom):**
1. Large gradient checkmark icon
2. Heading: `Order Confirmed!` (gradient text)
3. All orders from this checkout - one row per order: service thumbnail + name + selected options summary + line total
4. Grand total paid (cyan, large)
5. Divider
6. **"What happens next?"** - 4 horizontal steps with icons:
`Admin Confirms` - `Service In Progress` - `Delivered` - `Enjoy!`
7. Note: "Have questions? Open a support chat anytime."
8. Two CTAs: `View My Orders` (gradient, `/profile` with Order History tab open) - `Browse More Services` (outlined, `/games`)

**Rules:**
- Fetches all orders where `checkoutSessionId` matches the query param AND `userId` = logged-in user
- If no matching orders found for the logged-in user - redirect to `/profile`
- Chat bubble visible on this page

---

### 3.12 Refund Policy (`/refund-policy`)

Sections: Overview - How Refunds Work (admin reviews and issues directly via payment gateway - no middleman or escrow) - Eligibility (Non-Delivery, Not as Described, Change of Mind) - Refund Window (configurable window after completion; any time before completion) - Crypto Refunds (wallet address required) - Dispute Resolution - Contact Support CTA.

---

### 3.13 Privacy Policy (`/privacy-policy`)

Same layout as Terms of Service and Refund Policy. Content written during build.

---

### 3.14 Terms of Service (`/terms-of-service`)

TOC sidebar (left) + content (right) on desktop. Single column on mobile.

TOC: Acceptance of Terms - User Conduct - Service Delivery - Limitation of Liability - Termination.

---

### 3.15 Quick Select Mega Menu (Global Component)

**Purpose:** Fast route into active games and services from the global header.

**Current implementation:** `components/quick-select-menu.tsx`.

**Behavior:**
- Opened from the header menu button.
- Rendered through a portal into `document.body` so it is not clipped by the navbar.
- Full-page overlay, scrollable content, close button, outside-click close, and Escape close.
- Fetches `/api/catalog/quick-select` on open.
- Shows active CMS games in a one-step carousel: fixed `All` button, fixed previous/next buttons, animated game window in the middle.
- Selecting a game filters visible services without navigating away.
- Services are grouped by service category. In `All`, links include the game name for clarity.
- Service links use canonical storefront detail routes: `/[game-slug]/[category-slug]/[service-slug]`.

**Data source:** Active `games`, active `services`, and their `service_categories`. Do not import mock `gameServices` data here.

---

### 3.16 Not Found (`/404`)

**Purpose:** Shown whenever a route doesn't resolve - typo'd URL, deleted game slug, expired link, etc.

**Layout:** Centered single-column on full dark background. No navbar. No footer. No chat bubble.

**Content (top to bottom):**
1. MoonStrike logo (links to `/`)
2. Large `404` in primary gradient text (Montserrat Bold, display size)
3. Heading: `Page Not Found`
4. Subtext: "The page you're looking for doesn't exist or has been moved."
5. Two CTAs side by side: `Go to Homepage` (gradient, `/`) - `Browse Services` (outlined, `/games`)

**Implementation:** Next.js `app/not-found.tsx` - automatically caught by the framework for any unresolved route. Also call `notFound()` explicitly in:
- `/[game-slug]` - if no Game record matches the slug
- `/[game-slug]/[category-slug]` - if no ServiceCategory matches the slug for the given game
- `/[game-slug]/[category-slug]/[service-slug]` - if no Service matches the slug for the given game/category pair
- `/profile/orders/[id]` - if the order doesn't belong to the logged-in user
- `/order-confirmed` - if no orders found for `checkoutSessionId` belonging to the logged-in user

> Do not redirect to `/` on unresolved slugs - always render the 404 page so the user understands what happened.

---

## 4. User Flows

```
Landing Page
 - Click game card -> /[game-slug] -> click category tab -> /[game-slug]/[category-slug]
 - Click game card -> /[game-slug] -> click service -> /[game-slug]/[category-slug]/[service-slug]
 - Click offer card -> Service Detail -> Configure -> Buy Now -> Cart -> Checkout
 - VIEW ALL DEALS -> /hot-offers
 - Navbar > Services -> Quick Select mega menu -> sub-service -> Service Detail
 - Footer > Legal -> Refund Policy / Terms of Service

Games Page (/games)
 - Click game card -> /[game-slug]

/[game-slug]
 - Click category tab -> /[game-slug]/[category-slug]
 - Click service card -> /[game-slug]/[category-slug]/[service-slug]

Hot Offers (/hot-offers)
 - Click service card -> /[game-slug]/[category-slug]/[service-slug]

Checkout
 - On success -> /order-confirmed?session=[checkoutSessionId]
 - Cancel & Return -> back to Cart
```

---

## 5. Agent Rules

### DO
- Keep dark theme consistent across ALL pages - light mode only when explicitly asked
- Use purple-to-cyan gradient for all primary CTAs and the logo
- Use cyan/electric blue for prices and key numbers
- Keep the navbar fixed/sticky at the top
- Use the same `<Footer>` on every page
- Make all cards hoverable (subtle lift + border glow)
- All prices in USD by default; currency toggle persists in global state
- Currency (USD/EUR) is a single global state. Changing it in the header or service detail updates visible prices site-wide. Persists across navigation.

### DO NOT
- Do not use white or light backgrounds anywhere in dark mode
- Do not use generic fonts (Inter, Roboto, Arial)
- Do not hardcode game/service data - all comes from API/DB
- Do not put payment logic in the frontend
- Do not use lorem ipsum in final builds
- Do not create separate components or content records per theme - light mode is CSS only

### Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `service-detail.tsx` |
| Components | `PascalCase` | `ServiceCard.tsx` |
| Functions / hooks | `camelCase` | `useCartTotal` |
| CSS variables | `--ms-*` prefix | `--ms-accent` |
| API routes | App Router route handlers under `/api/[scope]` | `/api/admin/services`, `/api/catalog/quick-select` |

---

## 6. Data Models

> All models use Supabase PostgreSQL. Dynamic fields are stored as JSONB. All TypeScript fields use camelCase - Supabase maps these to snake_case DB columns automatically (e.g. `optionsSchema` -> `options_schema`).

**Shared type used throughout:**
Currency = "USD" | "EUR" controls visible pricing only. Service availability is not region-based; active services are globally available unless modeled later as an option schema field. Region fields have been removed from the active order/payment schema.

---

### Game

> Games do not have prices - prices live on Services.

| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| slug | string | |
| image | string | |
| genreId | string | FK - Genre. Required. |
| platforms | string[] | `"PC"`, `"Console"`, `"Cross-play"` |
| description | string | |
| status | string | `"active" \| "draft" \| "archived"` |

---

### Genre

> New table. Replaces the freeform `genre` string on `Game`. Globally scoped - not per-game.

| Field | Type | Notes |
|---|---|---|
| id | string | UUID |
| name | string | Display name. e.g. `"ACTION RPG"`, `"MMORPG"`. Stored uppercase. Must be globally unique. |
| slug | string | URL-safe slug. e.g. `"action-rpg"`, `"mmorpg"`. Auto-generated from name. Globally unique. |
| createdAt | Date | |

**Canonical seed genres (seeded on first deploy - not hardcoded in application code after that):**
`ACTION RPG - MMORPG - FPS - MOBA - TACTICAL SHOOTER - BATTLE ROYALE - LOOTER SHOOTER - SPORTS ACTION`

The `/games` page sidebar and Landing Page game filter tabs auto-populate from distinct genres of active games via `JOIN genres ON games.genre_id = genres.id`.

---

### Service

> `serviceCategory` is not `genre`. Category = what the booster does (Dungeon, Raid). Genre = type of game (MMORPG, FPS).

| Field | Type | Notes |
|---|---|---|
| id | string | |
| gameId | string | FK - Game |
| title | string | e.g. "Mythic+ Dungeons Boost" |
| slug | string | |
| image | string | |
| description | string | |
| serviceCategoryId | string \| null | FK - ServiceCategory. `null` only for draft services that haven't been assigned a category yet. Must be set before a service can be published (`status = "active"`). |
| status | string | `"active" \| "draft" \| "archived"` |
| isHotOffer | boolean | `true` - appears in HOT OFFERS tab |
| hotOfferAt | Date \| null | Set to `NOW()` when `isHotOffer` toggled on; cleared to `null` when toggled off. Used to sort Hot Offers page (`hotOfferAt DESC`). |
| badges | string[] | Admin-managed. Options: `"Starts in < 15 mins"`, `"100% Completion"`, `"Safe & Secure"`, `"24/7 Support"` |
| requirements | string[] | Rendered as checklist on Service Detail |
| whatYouGet | Benefit[] | 2x2 benefit cards on Service Detail - see Benefit model below |
| basePriceUSD | number | Flat fee always charged - admin sets manually, no runtime conversion |
| basePriceEUR | number | Set independently from USD |
| optionsSchema | JSONB | Array of ServiceOption - see below. DB column: `options_schema` |

**Benefit**

| Field | Type | Notes |
|---|---|---|
| icon | string | Tabler icon name, e.g. `"ti-shield"` |
| title | string | |
| description | string | |

---

### ServiceCategory

> New table. Replaces the freeform `serviceCategory` string on `Service`. Scoped per game.

| Field | Type | Notes |
|---|---|---|
| id | string | UUID |
| gameId | string | FK - Game. Each category belongs to exactly one game. |
| name | string | Display name shown in tabs and admin UI. e.g. `"Dungeon"`, `"Raid"`, `"Powerleveling"` |
| slug | string | URL-safe version of name. e.g. `"dungeon"`, `"rank-boost"`. Must be unique per game (unique constraint on `gameId + slug`). Auto-generated from name; admin can override. |
| sortOrder | number | Controls tab display order. Lower = further left. Admin can drag-reorder. |
| createdAt | Date | |

**Slug generation rule:** lowercase, spaces to hyphens, strip non-alphanumeric except hyphens. `"Rank Boost"` -> `"rank-boost"`. `"Mythic+"` -> `"mythic"`.

**Reserved slugs (per game) - never usable as a ServiceCategory slug:**
- `hot-offers` (reserved for the HOT OFFERS tab)

**Canonical seed categories (apply to games during initial setup - not hardcoded globally):**
`Dungeon - Leveling - Raid - Stories - Powerleveling - Rank Boost - Item Farm - Coaching - Placement Matches`

> `serviceCategory` is not `genre`. Category = what the booster does (Dungeon, Raid). Genre = type of game (MMORPG, FPS). This distinction is unchanged.

---

### Service Options (`optionsSchema`)

Each service's `optionsSchema` is an array of `ServiceOption` objects stored as JSONB. Admins build this through the Service CMS form - they never write raw JSON.

**Current option types:**

| Type | Customer UI | Pricing behavior | CMS fields |
|---|---|---|---|
| `dropdown` | Native dropdown/select | selected option price | choices: label, USD, EUR |
| `radio` | Single-choice rows with circular indicator | selected option price | choices: label, USD, EUR |
| `checkbox_group` | Multi-choice rows with square indicator | sum of selected option prices | choices: label, USD, EUR |
| `range` | Slider with current value + calculated price | selected numeric value * price per value | min, max, USD/value, EUR/value |
| `number_stepper` | Minus/value/plus control with calculated price | selected count * price per count | min, max, USD/count, EUR/count |
| `quantity` | Minus/value/plus control | multiplies the configured service total; adds no option price by itself | min quantity, max quantity |
| `toggle` | On/off toggle row with custom labels | enabled price, disabled is 0 | disabled text, enabled text, USD if enabled, EUR if enabled |
| `text` | Short text input | no price effect | placeholder |
| `textarea` | Long text input | no price effect | placeholder |

Legacy saved option types are read for backwards compatibility only:
- `single_choice` maps to `radio`
- `multiple_choice` maps to `checkbox_group`
- `scalar` maps to `number_stepper`

**ServiceOption**

| Field | Type | Notes |
|---|---|---|
| label | string | Required. Used as the display label and selection key. |
| required | boolean | Whether the customer must provide/select this option. |
| type | string | One of the current option types listed above. |
| options | OptionItem[] | For `dropdown`, `radio`, and `checkbox_group`. |
| min | number | For `range`, `number_stepper`, and `quantity`. |
| max | number | For `range`, `number_stepper`, and `quantity`. |
| pricePerUnitUSD | number | For `range` and `number_stepper`. |
| pricePerUnitEUR | number | For `range` and `number_stepper`. |
| priceUSD | number | For `toggle` enabled state. |
| priceEUR | number | For `toggle` enabled state. |
| enabledLabel | string | For `toggle`. Defaults to `Yes`. |
| disabledLabel | string | For `toggle`. Defaults to `No`. |
| placeholder | string | For `text` and `textarea`. |

**OptionItem**

| Field | Type | Notes |
|---|---|---|
| label | string | Required, unique within an option. |
| priceUSD | number | |
| priceEUR | number | Set independently - never converted from USD. |

**Validation rules:**
- Option label is required.
- Choice labels are required and must be unique per option.
- `min` and `max` must be valid numbers; `max >= min`.
- `quantity.min >= 1`.
- Only one `quantity` option is allowed per service.

**Price calculation** (pure function, run client-side on every option change):
```
unitTotal = basePriceUSD/EUR
 + dropdown/radio selected option price
 + checkbox_group selected option prices sum
 + range selected value * pricePerUnit
 + number_stepper selected count * pricePerUnit
 + toggle enabled price
 + text/textarea 0

total = unitTotal * quantityOptionValue (or 1 if no quantity option exists)
```

USD and EUR totals are always calculated independently. Never convert between currencies at runtime.
---

### Cart

Each CartItem becomes exactly one Order on checkout. Adding the same service twice creates two separate CartItems and two Orders.

**Cart**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| userId | string \| null | `null` for anonymous carts |
| sessionId | string \| null | Browser-session cart key (`ms_cart_session` cookie, 6-hour TTL). Stays consistent across anonymous/login/logout in the same browser. |
| createdAt | Date | |
| updatedAt | Date | |

> Anonymous cart operations always go through server-side API routes using the service role key. The Supabase client is never used directly for anonymous cart reads or writes. Cart is browser-session based: the same `ms_cart_session` cart remains visible across anonymous, logged-in, and logged-out states in the same browser.

**CartItem**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| cartId | string | FK - Cart |
| serviceId | string | FK - Service |
| selectedOptions | Record\<string, string \| number \| string[]\> | Live user selections, keyed by option label. Used for price display in the cart. |
| selectedOptionsSnapshot | JSONB | Frozen copy of selections at add-to-cart time, including prices at that moment. Preserved so historical orders still reflect what the customer paid for even if the service is later edited. Shape: `{[optionLabel]: {value, priceUSD, priceEUR}}` |
| priceUSD | number | Calculated total at add-to-cart time (base + all options) |
| priceEUR | number | |
| addedAt | Date | |

---

### Order

**Current normalized order model:**
- `orders`: internal lifecycle record. Fields include `id`, `order_ref`, `user_id`, `checkout_session_id`, `status`, `delivered_at`, `completed_at`, `refund_requested_at`, `refund_previous_status`, `created_at`, and `updated_at`.
- `order_items`: purchased service rows for an order. Stores `service_id`, frozen `selected_options_snapshot`, item `total`, and `currency`.
- `transactions`: confirmed-payment ledger. Stores `transaction_ref`, provider, provider payment/session refs, amount, currency, method, status, refund status, refund amount/currency, optional provider refund ID, and raw provider payload.
- `checkout_sessions`: frozen cart snapshot used to fulfill one payment into one internal order with one or more order items.
- UI/support should use `orders.order_ref` and `transactions.transaction_ref`, not Supabase UUIDs, for user/admin-facing order/transaction URLs.
- Payment provider refs must stay in `transactions`, not in `orders`.

Current implementation: `orders` stores lifecycle and internal `order_ref` only; `order_items` stores purchased services/options/item totals; `transactions` stores confirmed provider payments, internal `transaction_ref`, gateway references, paid amount, currency, and refund metadata. Region is not stored in active order/payment tables.

Orders only exist post-payment. No pre-payment state. No escrow - refunds go directly through the payment gateway. See Section 11 for the full state machine.

| Field | Type | Notes |
|---|---|---|
| id | string | |
| cartItemId | string | FK - CartItem |
| serviceId | string | FK - Service |
| userId | string | FK - auth.users |
| checkoutSessionId | string | Groups all Orders from the same payment. For Stripe this is the Checkout Session ID (`cs_...`); the Payment Intent is stored separately in `stripePaymentIntentId`. For NowPayments this is the payment ID. Used by `/order-confirmed?session=[id]` to fetch all sibling orders. |
| selectedOptionsSnapshot | JSONB | Copied from `CartItem.selectedOptionsSnapshot` at checkout. Use this for all display, history, and Google Sheets writes - `selectedOptions` does not exist on Order. |
| total | number | Taxes and fees included in base price |
| currency | string | `"USD"` \| `"EUR"` |
| region | Region | Single value - whichever was active at checkout |
| paymentProvider | string | `"stripe"` \| `"nowpayments"` - stored at checkout, used to route refunds automatically |
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
| `delivered` | Admin marked delivered. Customer can confirm completion or request refund. |
| `completed` | Customer confirmed completion, auto-complete window passed, or refund was denied. Refunds remain available until the configured refund window after `completed_at`. |
| `refund_requested` | Customer opened a refund. One attempt per order. |
| `refunded` | Terminal. Admin approved and issued refund via payment gateway. |

**Refund rules:**
- Refund can be requested from any non-terminal status, and from `completed` until the configured refund window after `completed_at`.
- One attempt per order - once attempted (approved or denied), no further requests

---

### Transaction

One row per confirmed successful payment. Transactions are the payment ledger; Orders are the fulfillment records created from that paid checkout. A single Transaction maps to one internal `orders` row through `checkoutSessionId`; that order may contain multiple `order_items`.

| Field | Type | Notes |
|---|---|---|
| id | string | Supabase UUID. Internal DB key only; do not show as the user/admin transaction ID. |
| transactionRef | string | Public/internal transaction ID shown in UI and URLs, e.g. `TXN-20260607-ABC123`. DB column: `transaction_ref`. |
| checkoutSessionId | string | Unique internal checkout snapshot ID (`co_...` for Stripe snapshot, `np_...` for NOWPayments). Provider session IDs are stored separately. |
| userId | string | FK -> auth.users |
| provider | string | `"stripe"` \| `"nowpayments"` |
| providerPaymentId | string | Stripe PaymentIntent ID or NowPayments payment ID |
| providerSessionId | string \| null | Stripe Checkout Session ID when provider = `stripe` |
| amount | number | Amount actually paid according to the provider |
| currency | string | `"USD"` \| `"EUR"` |
| method | string | e.g. `Stripe Checkout` |
| status | string | Current UI uses `success` and `refunded`. DB remains flexible for future `pending`, `disputed`, and `failed` provider events, but checkout attempts are tracked in `checkout_sessions`, not customer/admin transaction history. |
| refundStatus | string | `none` \| `requested` \| `approved` \| `rejected` \| `refunded` |
| rawProviderPayload | JSONB | Minimal provider payload snapshot for audit/debugging. Never store secrets. |
| createdAt | Date | |
| updatedAt | Date | |

---
### AdminUser

One role only: `ADMIN`. Admin = booster. No partial-access roles. Auth is manual (scrypt password hash + signed JWT cookie) - not Supabase Auth. See Section 8 and ?10.2.

| Field | Type | Notes |
|---|---|---|
| id | string | |
| displayName | string | |
| email | string | |
| passwordHash | string | scrypt hash - never plain text |
| role | string | Always `"ADMIN"` |
| status | string | `"active" \| "suspended" \| "banned"` |
| avatar | string | |
| lastLogin | Date | |
| knownDevices | string[] | Reserved for future trusted-device/session metadata. Admin OTP is not used. |
| createdAt | Date | |

---

### Support Chat

A `SupportTicket` is the container for a conversation. `Message` records are a separate table joined by `ticketId` - **not a JSONB array on the ticket row**. This keeps message loading paginated and lets protected API routes enforce customer/admin access before returning private chat data.

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
| ticketId | string | FK - SupportTicket |
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
| actorType | string | `"admin"` - actorId is set, actorLabel is admin's display name. `"system"` - actorId is null, actorLabel is `"System (Cron)"` or `"System (Webhook)"`. |
| actorLabel | string | Always set - displayed in the Audit Logs table |
| action | string | |
| ipAddress | string \| null | `null` for system-generated events |
| status | string | `"success" \| "critical" \| "blocked"` |

---

### CMS Models

One record per block - shared across dark and light mode. Theme changes CSS only, not content. Never create separate records per theme.

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
| createdBy | string | Admin UUID from `admin_users.id` - not `auth.uid()`. Join with `admin_users` to display creator name. |

**PromoBanner**

| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| image | string | Media Library URL |
| gameId | string \| null | FK - Game. If set, banner only shows on that game's Services page. If null, acts as a global default/fallback. |
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
| usedIn | {type: "content_block" \| "promo_banner", id: string}[] | Typed references. Delete is blocked if this array is non-empty. Remove entries when a ContentBlock or PromoBanner is deleted. |
| uploadedAt | Date | |
| uploadedBy | string | Admin UUID from `admin_users.id` |

**SystemSettings**

A singleton - exactly one row ever exists, created by the seed script.

| Field | Type | Notes |
|---|---|---|
| id | string | Always `"singleton"` |
| adminDisplayName | string | |
| adminEmail | string | |
| adminAvatar | string | |

```ts
// Always query with.single()
const {data: settings} = await supabase.from('system_settings').select('*').eq('id', 'singleton').single()
```

> **Hot Offers** have no CMS model - auto-populated by querying `Service WHERE isHotOffer = true`.
> **TrustPilot reviews** use a TrustBox widget embed - no DB storage, no server API calls needed.

---

## 7. Feature Progress Tracker

`STATUS: done | in-progress | not-started | blocked`

### Current Implementation Audit (2026-05-31)

- Verification: `npm.cmd run lint` passes after the current auth/admin/CMS/service updates.
- Data/integration state: Supabase-backed auth, admin session, games CMS, genres CMS, service categories, service CMS, service images, CMS-backed `/services`, CMS-backed Quick Select, browser-session cart APIs, and real-cart checkout UI are implemented. NowPayments, chat persistence, Google Sheets, refund gateway handling, and full order lifecycle automation remain pending or mock-backed.
- Routing state: canonical service routes are `/:game-slug/:category-slug/:service-slug`. Admin service edit/preview uses `/admin/services/[...servicePath]` and supports slug URLs like `/admin/services/:game-slug/:service-slug/edit`.
- Generated/seed data: `npm run catalog:seed` seeds games, genres, service categories, services, and representative `options_schema` entries.

### Storefront

| Feature | Status | Notes |
|---|---|---|
| Landing Page UI | in-progress | CMS content blocks feed major landing content. Game section is DB-backed and genre carousel scrolls one item at a time. Some sections still need final CMS polish/media QA. |
| Games Page UI | done | `/games` uses CMS games/genres with real-time client search and dynamic genre filters. |
| Services Catalog (`/services`) | in-progress | Now CMS-backed via `listActiveServices()`. Category tabs are generated from active services and ordered by service category `sortOrder`. Submit search is wired; pagination/infinite scroll is pending. |
| Game Services Page UI | in-progress | `/[game-slug]`, `/[game-slug]/hot-offers`, and `/[game-slug]/[category-slug]` are DB-backed. Category tabs use service category `sortOrder`; service count + search share one row below tabs; banner USD/EUR selector updates global visible prices. Infinite scroll and promo banner CMS are pending. |
| Hot Offers Page UI | not-started | Dedicated `/hot-offers` route is still pending; hot-offer filtering exists inside game routes and service catalog logic. |
| Service Detail UI | in-progress | DB-backed service detail renders image, badges, benefits, requirements, global currency, current option schema types, live pricing, and real Add to Cart / Buy Now persistence into the cart/checkout flow. |
| Checkout Page UI | in-progress | `/checkout` is verified-user gated, loads the real browser-session cart, shows all cart items in the order summary, honors global USD/EUR display, handles empty/error states, and redirects to Stripe sandbox Checkout through `POST /api/checkout`. The cart is frozen into a `checkout_sessions` snapshot before redirect. |
| Refund Policy UI | done | Implemented. |
| Terms of Service UI | done | Implemented. |
| Privacy Policy UI | not-started | Same layout as ToS and Refund Policy. |
| Quick Select Mega Menu | done | CMS-backed via `/api/catalog/quick-select`; game carousel uses fixed All + prev/next + animated one-step scrolling; service links use canonical detail URLs. |
| Global Navbar | in-progress | Shared header uses Supabase auth state, quick select, global search overlay, Games link, Notifications link, cart count badge, cart link, theme toggle, and persisted currency toggle. |
| Global Footer | done | Shared footer exists; some placeholder links may remain. |
| Global Chat Bubble | in-progress | Persisted support chat exists with protected API refresh, unread badge, image/shared-link attachments, lazy loaded messages, and anonymous `ms_chat_session` support. Opening the bubble does not create a ticket until a chat is started or the first message is sent. |
| Customer Login | in-progress | Supabase email/password, Google OAuth, reset password, rate limits, safe `next`, callback errors, resend verification, and auth gates are wired. Cart is browser-session based, so the same browser cart remains visible before/after login/logout. |
| Customer Register | in-progress | Supabase sign-up, provider-aware checks, app rate limit, Google OAuth, Google register completion at `/register/complete`, confirm password validation, verification/resend UX are wired. Profile persistence beyond auth metadata is pending. |
| Customer Profile | in-progress | Auth-gated profile and edit flow exist, including metadata username updates, password changes, Google identity linking, connected accounts, email/password addition for OAuth users, real order history from `orders`, and real transaction history from `transactions`. Avatar upload remains pending. |
| Order History | in-progress | `/profile/orders` reads real customer `orders` lifecycle rows with internal `order_ref`, joins service details from `order_items`, and reads totals/transaction refs from `transactions`. Status filtering is active client-side. Transaction History reads confirmed-payment `transactions` rows and links to transaction detail. |
| Order Detail | in-progress | `/profile/orders/[id]` reads real customer-owned orders by `order_ref` or UUID fallback, verifies ownership, shows provider payment ref, service accordions, selected option snapshots, timeline, price summary, chat link, and refund request action with settings-driven completed-order rule. |
| Cart | in-progress | Real browser-session cart APIs, selected option snapshots, Add to Cart, Buy Now, remove item, Stripe checkout handoff, cart clearing after paid checkout, and currency display are wired. Cart count badge and edit configured options remain pending. |
| Search | in-progress | `/services`, `/games`, and Quick Select search are wired. Global live overlay below navbar remains pending. |
| Currency toggle | in-progress | Header, game-services banner, service cards, service detail, cart, and checkout use global USD/EUR currency display. |
| Light mode theme | done | CSS variable swap exists. |
| Theme toggle | done | Toggle persists to `localStorage` and updates `<html data-theme>`. |
| TrustPilot integration | not-started | Static review cards exist; TrustBox/API integration is pending. |
| Notifications | in-progress | Customer/admin notification tables, feeds, unread badges, filter tabs, read/delete actions, cleanup cron, seeds, and event wiring are implemented. Customer emails are sent only for `order_delivered`, `refund_approved`, and `refund_denied`. |
| Mobile / responsive layouts | in-progress | Tailwind breakpoints exist; browser screenshot QA still recommended. |
| Not Found page (404) | in-progress | `app/not-found.tsx` exists; dynamic route behavior should be rechecked after slug-route changes. |

### Admin Terminal

| Feature | Status | Notes |
|---|---|---|
| Admin Login | done | Single seeded admin account; password login issues signed HttpOnly admin session cookie. No OTP by design. Login attempts are rate-limited/audited. |
| Admin Dashboard Overview | done | UI exists; KPI/chart data still mostly static. |
| Admin Users | in-progress | Reads real Supabase Auth users, supports name/email search, active/banned filter, detail pages by readable user slug, ban/unban actions, customer activity, ban history, order/transaction summaries, and pagination. |
| Admin Games | in-progress | CMS-backed list/create/edit/archive/delete flows exist with upload support; further validation/polish may remain. |
| Admin Services List | done | CMS-backed list/filter/search/delete with active/draft/archived tabs, game/category filters, image thumbnails, slug-based edit/preview links, and service category management modal. |
| Admin Service CMS | done | CMS-backed create/edit with upload image, custom badges, base USD/EUR price, service category, benefits, requirements, sticky section nav/actions, and validated option builder. |
| Admin Service Preview | done | `/admin/services/:game-slug/:service-slug/preview` via catch-all route renders draft storefront preview. Old ID URLs redirect when possible. |
| Admin Order Management | in-progress | `/admin/orders` reads real `orders` rows as lifecycle records, displays internal `order_ref`, enriches customer/service/payment data from `order_items` and `transactions`, supports search/filter tabs, and links to real order detail. Pagination is still single-page. |
| Admin Order Detail | in-progress | `/admin/orders/[id]` reads real order data by `order_ref` or UUID fallback, keeps gateway refs in the payment panel, persists status transitions through `PATCH /api/admin/orders/[id]` with audit logging, issues Stripe refunds, and records manual non-Stripe refunds. |
| Admin Transactions | in-progress | `/admin/transactions` reads real confirmed-payment `transactions` rows as the payment ledger, uses `transaction_ref` for UI/detail URLs, stores gateway refs via `provider_payment_id` / `provider_session_id`, enriches customer/order reference data, shows payment/refund stats, and filters visible statuses to `success` / `refunded`. |
| Admin Content Library | in-progress | CMS-backed content rows/forms and image upload are partially wired. Landing content uses several CMS blocks; full coverage/QA pending. |
| Landing Page CMS blocks | in-progress | Hero and several landing blocks are CMS-managed; remaining sections need cleanup. |
| Promotional Banners CMS | in-progress | Banner/content management exists; full scheduling/fallback behavior pending. |
| Media Library CMS | in-progress | Supabase Storage upload exists for content/game/service images. Dedicated library/usage tracking/delete guards are pending. |
| Hot Offers auto-population | in-progress | Services support `is_hot_offer`; dedicated `/hot-offers` page pending. |
| Admin Messages / Chat | in-progress | Admin inbox reads real support/order tickets, uses protected API refresh/local events, unread badges, lazy loads messages, supports attachments/shared links, and does not auto-select the first chat. |
| Admin Audit Logs | in-progress | Audit logs now include `event_type` plus status. Coverage includes admin auth/CMS/settings/order actions, checkout, payment webhooks, refunds, customer order lifecycle actions, and cron outcomes. |
| Admin Settings | in-progress | Settings persist to `system_settings`, support admin profile/password changes, session timeout, refund window, delivered-order auto-complete window, and notification-event toggles. |
| Admin Auth Guard | done | `proxy.ts` verifies signed admin cookie for `/admin/*` except `/admin/login`. |
| Admin Sidebar | done | Shared across admin pages. |
| Admin Top Bar | done | Shared across admin pages. |
| System Pulse indicator | in-progress | Static footer indicator exists. |
| CSV export | in-progress | Export buttons exist; generation/download pending. |

### System

| Feature | Status | Notes |
|---|---|---|
| Auto-complete delivered orders | in-progress | Vercel Cron calls `/api/cron/orders/auto-complete` daily; order fetch still runs the same completion rule as a backup. |
| Order state machine | in-progress | Mock labels/helpers exist. Backend enforcement pending. |
| Payment provider abstraction | in-progress | `lib/payments/*` now provides a shared provider interface for checkout creation and refunds. Stripe and NOWPayments plug into the same `createPaymentCheckout()` and `provider.refund()` paths. Webhook fulfillment still uses provider-specific files but writes normalized checkout/order/transaction records. |
| Stripe integration | in-progress | Stripe sandbox Checkout Session creation, frozen checkout snapshots, internal checkout IDs, idempotent `checkout.session.completed` webhook fulfillment, transaction ledger writes, signature verification, and refund API are wired. Stripe may remain sandbox/fallback because direct production activation is difficult for Indonesia. |
| NowPayments integration | in-progress | Hosted crypto invoice checkout, checkout snapshots, IPN webhook verification, and order fulfillment are wired. Crypto refunds are manual/admin-assisted and can be recorded in Moon Strike after external transfer. |
| NowPayments webhook verification | in-progress | `/api/v1/webhooks/nowpayments` verifies `x-nowpayments-sig` with HMAC-SHA512 over sorted JSON body. |
| Refund router | in-progress | Admin can choose automatic provider refund or manual refund recording. Stripe supports automatic + manual. NOWPayments is manual-only; automatic attempts are rejected with a warning and do not mark the order refunded. Future providers should declare refund capabilities behind the same interface. |
| Rate limiting | in-progress | Auth/admin login/password-reset/register limits exist. Broader API limits pending. |
| Audit log (admin/system/customer actions) | in-progress | Covers admin auth/CMS/settings/order actions plus checkout creation/block/failure, payment webhook signature/fulfillment outcomes, refund success/failure/block, customer refund requests, customer completion confirmation, and auto-complete cron outcomes. |
| Google Sheets integration | not-started | Orders + Transactions tabs pending. |
| Real-time chat | in-progress | Uses fast protected API refresh and local update events instead of exposing private message payloads through browser-side table subscriptions. Active chats, ticket previews, and unread badges update without manual reload. |
| Admin second factor | removed | Extra login factors intentionally out of scope. |
| Anonymous cart API routes | in-progress | Browser-session cart uses `ms_cart_session` and server-side service role routes for add/list/remove plus checkout readout. |
| Backend API routes | in-progress | Auth/admin/CMS/catalog/cart APIs, provider-backed checkout, Stripe/NOWPayments webhooks, chat APIs, notification APIs, cleanup cron routes, and provider dispatch in `lib/payments` exist. |
---

## 8. Stack & Decisions

### Tech Stack

| Item | Decision |
|---|---|
| Frontend | Next.js |
| CSS | Tailwind CSS |
| Backend | Supabase |
| Database | Supabase PostgreSQL - dynamic fields as JSONB |
| Auth (customers) | Supabase Auth - email/password + Google OAuth |
| Auth (admin) | Manual - scrypt password hash in `admin_users` table, signed HttpOnly JWT cookie on successful login. No OTP. Verified server-side on every `/admin/*` request. Single Supabase project - no separate project needed. |
| Image hosting | Supabase Storage (origin) + Cloudflare Images (CDN + transforms) |
| Payment | Provider-flexible. Current implementation uses Stripe sandbox for hosted checkout/refunds and NowPayments for crypto. Stripe production is not ideal because Indonesia support/business verification is difficult. Preferred card/PayPal direction is a Merchant of Record provider if Moon Strike's game-service model is approved. |
| SMTP | Resend - auth emails + order notifications. See Section 13. |
| Currency | Fixed USD/EUR values per service - no runtime conversion. Global state shared across navbar, service detail, and cart. Changing in any one location updates all others. |

### Payment Provider Direction

- Stripe is useful for sandbox validation and as a fallback integration, but it should not be assumed to be the production primary because business verification and country support are difficult for Indonesia.
- Merchant of Record providers are preferred for primary card/PayPal checkout because they can simplify merchant onboarding, tax/VAT handling, compliance, and fraud operations.
- Current MoR candidates: Lemon Squeezy first, then Paddle or Polar depending on acceptable-use approval and API fit.
- Main approval risk: Moon Strike sells digital game services such as coaching, rank support, dungeon/raid completion help, and account progression. Before integrating an MoR provider, ask support whether this model is allowed. Do not describe the business as selling accounts, cheats, hacks, gambling, stolen goods, or game currency.
- Provider architecture rule: keep `orders` internal and provider-neutral; store external payment references only in `transactions.provider_payment_id`, `transactions.provider_session_id`, and `transactions.raw_provider_payload`.
- Provider code rule: new gateways should implement the shared provider interface in `lib/payments/providers.ts` instead of creating another full checkout/refund flow. Keep provider-specific API objects out of UI components and admin/customer pages.

### Recent Payment/Order Changes

- `orders` now represent internal order lifecycle only and expose `order_ref` for UI/support.
- `order_items` now represent purchased services, frozen option snapshots, item totals, and item currency.
- `transactions` now represent the payment ledger and own provider, provider payment ID, provider session ID, paid amount, currency, raw provider payload, and refund metadata.
- Stripe checkout now uses internal checkout IDs for `checkout_sessions`; Stripe Checkout Session IDs are provider refs, not primary Moon Strike order identity.
- NowPayments hosted crypto checkout and IPN fulfillment are wired.
- Stripe and NOWPayments checkout creation now share the same checkout preparation path. Admin refunds call the provider router: Stripe executes a gateway refund; NOWPayments records a manual refund after external transfer.
- Region-based checkout/order data was removed. Currency is display-only and services are globally available unless modeled later as an option schema field.

### Third-Party APIs

| Service | Notes |
|---|---|
| Stripe | Current sandbox implementation for hosted checkout, dynamic payment methods, webhooks, transaction ledger, and refunds. Likely fallback/sandbox because production business verification and country support are problematic for Indonesia. |
| Lemon Squeezy / Polar / Paddle | Merchant of Record candidates for card/PayPal checkout. MoR is preferred because it can simplify taxes/compliance/merchant onboarding. Before integration, confirm that game coaching/boosting/progression services are allowed by acceptable-use policy. |
| PayOp / 2Checkout / other PSP | Candidate payment-service providers if broader payment-method coverage is needed. They may not simplify tax/compliance as much as MoR. Must support hosted checkout or payment redirect, webhooks, transaction references, refunds, and Indonesia-compatible payout/onboarding. |
| NowPayments | Hosted invoice checkout and IPN fulfillment are wired for crypto payments. Crypto refund/payout API remains pending and requires customer wallet address for refunds. |
| TrustPilot | TrustBox **Carousel** widget embed (script tag). Loads reviews client-side from TrustPilot's CDN - no server-side API calls, no rate limits, no caching needed. Displays on Landing and Services pages. |
| Google Sheets | Orders tab + Transactions tab. See Section 13 for schema and trigger rules. |

### Feature Decisions

| Feature | Decision |
|---|---|
| Auth | Customer: email/password + Google OAuth via Supabase Auth (free under 50K MAU). Admin: manual scrypt + signed cookie JWT - no separate Supabase project. |
| Booster role | No separate booster role - Admin = booster. One role only. |
| Order state machine | No escrow - refunds go directly to the payment gateway. See Section 11. |
| Search | Real-time overlay, debounced 300ms. Service titles only - image + name, max 6 results. Closes on click outside or Escape. |
| Cart | Same service can be added multiple times as separate CartItems. Cart uses the browser `ms_cart_session` cookie (6-hour TTL) consistently across anonymous/login/logout states. All cart operations go server-side via service role key. |
| Reviews | TrustPilot TrustBox Carousel embed - client-side, no DB storage, no server API calls. |
| Crypto refund | Wallet address collected at refund request time (required by NowPayments). |
| Service fees | Taxes and fees included in base price. No extra fee at checkout. |
| Order cancellation | No cancelled state - customers request refunds instead. Admin approves or denies. |
| Hot Offers | 4 random `isHotOffer = true` services via `ORDER BY RANDOM() LIMIT 4` - re-randomized per page load. No admin curation. |
| Currency | Single global state (USD / EUR). Updates header and service detail prices. Persists across navigation. Does not affect service availability. |
| Light mode | CSS variable swap only - `<html data-theme="light">`. Same components, no separate content. |
| Rate limiting | Supabase API gateway. See Section 12. |
| Multi-order checkout | One payment - one Order per CartItem. All share a `checkoutSessionId`. Redirect: `/order-confirmed?session=[checkoutSessionId]`. |

---

## 9. File & Folder Structure

```
src/
 components/
 common/ Navbar, Footer, Badge, StarRating, ThemeToggle
 cards/ GameCard, ServiceCard
 layout/ PageWrapper, Section
 configurator/ Dropdown, Radio, CheckboxGroup, RangeSlider, NumberStepper, Quantity, Toggle, TextInput
 checkout/ PaymentForm, OrderSummary
 app/
 page.tsx Landing
 games/
 [game-slug]/
 page.tsx Game Services Page (ALL tab - no category filter)
 [category-slug]/
 page.tsx Service-category filtered view
 [service-slug]/
 page.tsx Service Detail

> Service detail URLs include the category slug: `/[game-slug]/[category-slug]/[service-slug]`. The legacy short form `/[game-slug]/[service-slug]` may redirect to the canonical category-aware route when resolvable.

 hot-offers/
 cart/
 checkout/
 order-confirmed/
 page.tsx Order Confirmed (?session=[checkoutSessionId])
 login/
 register/
 profile/
 profile/edit/
 profile/orders/[id]/
 reset-password/
 refund-policy/
 privacy-policy/
 terms-of-service/
 not-found.tsx Global 404 page
 admin/ All admin routes (see Section 10.14)
 hooks/ useCart, useCurrency
 store/ Global state (currency, cart)
 lib/ API clients, utils, webhook verification
 types/ TypeScript interfaces (mirrors Section 6 models)
 styles/ Global CSS vars, theme tokens
```

---

## 10. Admin Terminal

The Admin Terminal is a **separate application** from the storefront with its own login, layout, routing, and access control. Never accessible from the public storefront.

**Single role: ADMIN** - full access to all sections. Admin = booster. No partial-access roles.

**Admin auth:** Uses manual scrypt password hashing + signed HttpOnly JWT cookie authentication (not Supabase Auth). Admin credentials live in the `admin_users` table. On successful login, the backend issues a signed JWT with `role: "admin"`. Every `/admin/*` route verifies this JWT server-side. This runs in the same single Supabase project as the storefront - no separate project needed.

### 10.1 Admin Design System

Same dark theme as storefront, with these differences:
- Fixed left sidebar (~240px, persistent) + top header bar
- Active nav item: purple background pill highlight
- Surface cards: slightly lighter than storefront (`#161828` range)
- LOGOUT: red text, always visible top-right next to admin name

**Status colors:** Active/Success - green - Pending/Scheduled - amber - Draft - muted gray - Critical/Disputed - red - Archived/Banned - dark red - Refunded - gray

**Global layout:**
```
+------------------------------------------------------------------+
| MoonStrike / Admin Terminal [Search orders/users/txns] [Bell] Admin LOGOUT |
+----------------+--------------------------------------------------+
| Dashboard | |
| Users | Page Content |
| Games | |
| Services | |
| Orders | |
| Transactions | |
| Content | |
| Messages | |
| Logs | |
| Settings | |
+----------------+--------------------------------------------------+
| Moon Strike 2024 | Support | Privacy | API Docs | STABLE |
+------------------------------------------------------------------+
```

**Admin search (top bar):** Searches across orders (by ID), transactions (by ID), and users (by username or email). Shows results as a dropdown overlay with labeled sections (ORDERS / TRANSACTIONS / USERS).

**Global Admin Components:** `<AdminSidebar>` - `<AdminTopBar>` - `<AdminFooter>` - `<StatCard>` - `<DataTable>` - `<StatusBadge>` - `<ActionIcons>` (Edit - Hide - Delete - Ban)

---

### 10.2 Admin Login (`/admin/login`)

Centered card. No sidebar or header.

- Logo + ADMIN TERMINAL sub-label
- Email + Password (eye toggle) + Forgot Password link
- Remember this terminal session checkbox
- Enter Terminal button (purple)
- Contact System Admin help link
- Security badges: Admin Session - SSL Encrypted

**Admin account creation rules:**
- Admin accounts are **never self-registered**. There is no public admin registration page.
- Moon Strike currently supports one admin account only.
- Seed/reseed the admin account with `npm run admin:seed` or `npm run admin:reseed`.
- The seed script hashes the password with scrypt and enforces the single-admin rule by removing other `admin_users` rows.
- Admin OTP/2FA is intentionally not used.

**"Remember this terminal session" checkbox:**
- **Unchecked (default):** JWT expires after 8 hours. Admin must re-login after timeout.
- **Checked:** JWT expiry extends to 30 days. Intended for dedicated admin devices.
- Implementation: set JWT expiry to `8h` or `30d` at token issuance time based on checkbox value.

---

### 10.3 Admin Dashboard (`/admin/dashboard`)

**KPI Cards:** TOTAL REVENUE - ACTIVE USERS - COMPLETED BOOSTS - PENDING DISPUTES

**Main content (2-column):** Traffic vs Performance chart (left) - Top Selling Services list (right).

**Recent Activity table:** TRANSACTION ID - CUSTOMER - SERVICE - DATE - AMOUNT - STATUS.

---

### 10.4 Admin Users (`/admin/users`)

Admin Users is the storefront customer registry. Storefront customers authenticate through Supabase Auth; the single internal admin account still uses the separate manual admin auth flow.

**List table:** CUSTOMER | EMAIL | STATUS | ORDERS | SPENT | LAST SIGN IN | ACTIONS

**List features:** real Supabase Auth users, name/email search, active/banned status filter, 10/20/50/100 pagination, detail action, ban/unban action, and non-native confirmation dialogs.

**Customer detail:** `/admin/users/[user-name]` uses a readable customer slug with UUID fallback. It shows profile/auth providers, email verification, created/last sign-in, Supabase user ID, status, order summary cards, refund/risk summary cards, recent orders, recent transactions, related audit events, and moderation history.

**Ban/unban behavior:** Admin can ban or unban storefront customers. Bans require a reason; unbans can include an optional note. The action updates Supabase Auth ban state, writes `user_moderation_events`, and writes an audit log entry.

**Stat cards:** TOTAL CUSTOMERS | VERIFIED EMAILS | NEW THIS MONTH | BANNED ACCOUNTS

---

### 10.5 Admin Games (`/admin/games`)

> Do not confuse these three separate fields on three separate models:
> - **Game Name** = the game title (World of Warcraft, Dota 2)
> - **Game Genre/Type** = gameplay category (ACTION RPG, MOBA, FPS, MMORPG)
> - **Service Category** = type of boost (Dungeon, Leveling, Raid)

**Table:** GAME NAME - GENRE/TYPE - PLATFORM - STATUS - ACTIONS

The GENRE/TYPE column and its filter/create dropdown are now populated from the `genres` table, not a hardcoded list.

Platform values: `PC - Console - Cross-play`

**Add: "New Genre" button**

Position: top-right of the Games list page, next to "New Game".

Clicking opens a modal: **Add Genre**

| Field | Notes |
|---|---|
| Genre Name | Text input - required. Written in uppercase by convention (enforced on save). e.g. `"SURVIVAL HORROR"`. Must be globally unique. |
| Slug | Auto-generated from name; admin can override. Validated: globally unique, no spaces. |

Actions: **Save Genre** (purple) - **Cancel**.

On save: `POST /api/admin/genres` - inserts into `genres`. Toast: "Genre created." The genre immediately appears in the Genre dropdown when creating or editing a game, and in the sidebar filter on `/games`.

**Duplicate name guard:** If a genre with the same name (case-insensitive) already exists, show inline error: "This genre already exists."

**Editing genres:** Genres are not editable after creation to preserve data integrity (existing game records reference the genre by ID; changing the name changes it everywhere automatically since it's denormalised via JOIN). If a typo needs correction, the admin must delete and recreate. Add a note in the modal: "Genre names cannot be edited after creation."

**Deleting genres:** Not permitted if any game references the genre (`ON DELETE RESTRICT`). The delete icon is disabled with tooltip: "Cannot delete - [N] games use this genre." Admins must re-assign all games to a different genre first.

---

### 10.6 Admin Services List (`/admin/services`)

**Table:** SERVICE NAME, GAME, SERVICE CATEGORY, BASE PRICE, STATUS, IMAGE, ACTIONS.

**Filters:** Status tabs (All / Active / Draft / Archived), game filter, category filter, and search.

Service Category dropdowns are populated from `ServiceCategory` records filtered by the selected game when a game is selected. No hardcoded category list should be used.

**Category management:** The Services list includes a service category manager.

| Field | Notes |
|---|---|
| Game | Required. Category ownership is scoped to one game. |
| Category Name | Required. Example: `Dungeon`, `Rank Boost`. |
| Slug | Auto-generated from name; admin can override. Must be unique per game. Reserved slug: `hot-offers`. |
| Sort Order | Controls category tab ordering within that game only. Same `sort_order` across different games is allowed. If two categories in the same game share an order, fall back to name/created order for stable display. |

**Edit / Delete category:** Categories can be edited or deleted from admin. Deleting a category clears `service_category_id` on affected services via `ON DELETE SET NULL`; those services stay in admin and should be recategorized before publishing.

**Service actions:** Edit and preview use slug-based links. Delete removes the service record and should also clean up service-owned images when that cleanup is implemented.

---

### 10.7 Admin Service CMS (`/admin/services/new`, `/admin/services/[game-slug]/[service-slug]/edit`)

**Routing:** Canonical edit URL is `/admin/services/[game-slug]/[service-slug]/edit`. The catch-all route `app/admin/services/[...servicePath]/page.tsx` also supports old ID edit/preview URLs and redirects to the canonical slug URL when possible.

**Layout:**
- Left: sticky section navigation card. Section links scroll to the matching form section.
- Right: input form sections.
- Bottom/top action area: sticky Save and Discard controls so edits can be saved from anywhere on the page.

**Sections:**
1. **Basic Info:** Service name, game, service category filtered by selected game, slug, status, hot offer, short description, and full description.
2. **Media:** Service thumbnail/image upload with recommended dimensions. Service cards and game service pages use this uploaded service image.
3. **Pricing:** `basePriceUSD` and `basePriceEUR`. Currency values are entered independently.
4. **Badges:** Fully custom free-text badge rows. Admin can add/remove badge names. No fixed badge list.
5. **Options:** Dynamic option schema builder saved to `options_schema` JSONB.
6. **What You Get:** Repeatable benefit cards with icon, title, and description.
7. **Requirements:** Repeatable checklist rows.

**Current option builder types:** dropdown, radio, checkbox group, range slider, number stepper, quantity, toggle, text, and textarea.

**Option builder validation:**
- Option label is required.
- Choice options require at least one choice.
- Choice labels must be unique within an option.
- Range, stepper, and quantity require valid min/max with `max >= min`.
- Quantity min must be at least 1.
- Only one quantity option is allowed per service.

Legacy saved option types are mapped for compatibility only: `single_choice -> radio`, `multiple_choice -> checkbox_group`, `scalar -> number_stepper`.

---

### 10.7b Admin Service Preview (`/admin/services/[game-slug]/[service-slug]/preview`)

Full-page storefront render using draft data. Read-only - no checkout.

- Amber banner: `PREVIEW MODE - This service is not yet published`
- Back to Editor link in the admin page header
- Renders the same `ServiceDetail` component as the public Service Detail page (section 3.5)
- Add to Cart and Buy Now are disabled in preview mode
- Old ID preview URLs redirect to the canonical slug preview URL when possible

> Publishing is handled by saving the service status from the editor. A dedicated Deploy Now action can be added later if needed.

---

### 10.8 Admin Transactions (`/admin/transactions`)

**KPI Cards:** TOTAL REVENUE - PENDING PAYOUTS - SUCCESS RATE - REFUNDED

**Table:** TRANSACTION ID - CUSTOMER - DATE - AMOUNT - PROVIDER - STATUS - ACTIONS

**Visible status filters:** All Status - success - refunded. `pending`, `failed`, and `disputed` remain possible DB values for future provider-event handling, but checkout attempts are tracked in `checkout_sessions` and are not shown in the main transaction ledger UI.

**Current implementation note:**
- `transactions` represents confirmed payment records only. Stripe writes a transaction after a paid Checkout Session; NOWPayments writes one after `payment_status = finished`.
- Transaction list actions only open Detail. The list does not issue refunds.
- `/admin/transactions/[transaction_ref]` shows payment/order/customer references. Service/order-item detail remains in the related order page.
- Debug-only values such as DB UUID and raw provider payload are hidden in a collapsed Debug Information section.
- Refund execution remains on Admin Order Detail. Admin opens the related order and uses the order refund panel only when the order is in refund review.

---

### 10.9 Admin Orders (`/admin/orders`, `/admin/orders/[id]`)

**Filter tabs:** All - Pending - Confirmed - In Progress - Delivered - Completed - Refund Requested - Refunded

**Default sort:** Newest first by `createdAt`.

**Table:** ORDER ID - CUSTOMER - SERVICE - OPTIONS SUMMARY - DATE - AMOUNT - STATUS - ACTIONS

**Order Detail - left column:** Service + customer info - full options breakdown with prices - price breakdown - order timeline with timestamps per state.

**Order Detail - right column (Actions panel):**
- Current status badge (large)
- Status update buttons - context-aware, only valid next states shown:
- `pending` - Confirm Order
- `confirmed` - Mark as In Progress
- `in_progress` - Mark as Delivered
- `refund_requested` - Approve Refund (red) or Deny Refund (outlined)
- Open Chat button (links to Admin Messages filtered to this customer)
- Current refund panel: payment method display, refund amount text input, and provider-aware Issue/Record Refund button.
- No refund category or refund note fields in the admin UI. Refund metadata shape can differ per provider.
- Stripe refunds call the real Stripe refund API. NOWPayments/crypto refunds are recorded manually after admin completes the external wallet/provider transfer.
- Refund panel (visible when `refund_requested`): payment method display - wallet address field (crypto only, pre-filled if provided) - Issue Refund button

---

### 10.10 Admin Content (`/admin/content`)

**Three tabs:** LANDING PAGE SECTIONS - PROMOTIONAL BANNERS - MEDIA LIBRARY

> Light and dark mode share one set of content blocks - admin edits once, both modes reflect it.
> Never create separate content entries per theme.
> Hot Offers is NOT managed here - auto-populated from `isHotOffer` on Service.

**Tab 1 - Landing Page Sections:**

| Block | CMS Type | Editable Fields |
|---|---|---|
| Hero | `hero` | Label - headline - subtext - CTA text/link - background image |
| Trust Stats Bar | `stats_bar` | 4 stat values + labels |
| Why Choose Us | `benefits_section` | Media (image/video) - 3 benefit icon + title + description |
| How It Works | `steps_section` | 4 step titles + descriptions |

**Tab 2 - Promotional Banners:** Banner title - Game (optional dropdown - if set, banner only shows on that game's Services page; if left blank, acts as a regional default) - image (from Media Library) - region (USA / EUROPE / Both) - optional CTA link - status (active / scheduled / draft) - schedule date.

**Tab 3 - Media Library:** Upload via drag + drop. Served via Cloudflare Images CDN. Usage tracking shown per asset. Delete blocked if asset is in use.

---

### 10.11 Admin Messages (`/admin/messages`)

**Layout:** Conversation list + large active chat panel. User/order context is opened in a modal so the chat surface stays wide.

**Two thread types, one unified inbox:**
- `[Support]` - general support; available to anonymous and logged-in customers.
- `[Order MS-...]` - order-specific chat linked to a paid order.

**Creation rules:**
- Opening a chat UI does not create a ticket by itself.
- Customer/admin create-chat actions open an existing matching ticket when one exists.
- If no matching ticket exists, the UI starts as a draft and writes the ticket only when the first message is sent.
- Admin and customer message lists do not auto-select the first chat by default.
- Duplicate support/order tickets are prevented by uniqueness rules for customer general chat, customer order chat, and anonymous general chat.

**Read state and badges:**
- `support_tickets.admin_last_read_at` tracks unread customer messages for admins.
- `support_tickets.customer_last_read_at` tracks unread admin messages for customers.
- Admin sidebar Messages badge shows the count of unread tickets, capped as `9+`.
- Each admin/customer chat row shows unread message count for that ticket, capped as `9+`.
- Opening, typing in, interacting with, or scrolling through a chat may mark it read.
- Browser tab title can show unread chat count when messages arrive.

**Realtime model:** Chat uses protected API refresh loops and local update events. Browser-side direct Supabase table subscriptions for private message payloads are avoided. Active chats refresh quickly; ticket lists/unread badges refresh on a slower interval and on focus/visibility return.

**Messages and attachments:**
- Enter sends a message; Shift+Enter can be reserved for multiline behavior where supported.
- Older messages lazy-load in pages of 10 when scrolling upward.
- Messages support text, image attachments, and shared game/service links.
- Uploaded chat images are cleaned up if removed/cancelled before send.
- Image attachments can be opened in a full-size viewer; click outside or Escape closes it.
- Shared game/service cards keep consistent preview sizing and open target pages in a new tab.

**Anonymous session merge:** Anonymous users get a temporary `session_id` stored in the `ms_chat_session` cookie. On login, matching anonymous support chat can be merged into the user account. Chat session TTL is 1 hour and refreshes from recent chat activity so active users do not lose the thread mid-conversation. Cart data is separate and uses `ms_cart_session`.

**Retention/cleanup:**
- Anonymous support chats can be deleted after their session expires.
- Logged-in general support chats can be deleted after the configured support retention window.
- Order chats are retained until a few days after the linked order is completed or refunded.
- Cleanup route: `/api/cron/chat/cleanup`.

---

### 10.12 Admin Audit Logs (`/admin/logs`)

**Table:** TIMESTAMP | ACTOR | EVENT TYPE | ACTION | IP ADDRESS | STATUS

> ACTOR column shows `actorLabel`: admin display name for admin actions, "System (Cron)" or "System (Webhook)" for system-generated events.

**Event types:** `auth` | `admin_action` | `checkout` | `payment_webhook` | `refund` | `order_lifecycle` | `cms` | `settings` | `cron` | `security`

**Status types:** `success` (green) | `critical` (red filled) | `blocked` (amber)

**Example events:** Admin Console Login (`auth`, success) | Stripe checkout created (`checkout`, success) | NOWPayments webhook blocked (`payment_webhook`, blocked) | Automatic refund unavailable (`refund`, blocked) | Auto-complete cron failed (`cron`, critical)

**Bottom stat cards:** UPTIME PERFORMANCE - BLOCKED THREATS - ACTIVE ANOMALIES

---

### 10.13 Admin Settings (`/admin/settings`)


**Profile card:** Admin display name, email, and avatar upload. Avatar uploads are compressed to WebP, stored in the shared media bucket, persisted to `system_settings` and the single `admin_users` row, and the previous stored avatar is removed after saving a replacement.

**Security card:** Current password, new password, and confirm password. Password changes verify the current admin password before writing a new scrypt hash.

**Application card:** Session timeout duration (default 8 hours, configurable for future logins), refund window after completion, and delivered-order auto-complete window.

**Notification Events card:** Toggles for new order, refund requested, and order completed events. These are stored now and should be read by the later notification/email implementation.

**Actions:** Sticky Save All Changes (purple) and Discard (outlined). Settings writes are audit-logged.
---

### 10.14 Route Map

```
# Storefront
/ Landing Page
/games Games Page (all games)
/hot-offers Hot Offers Page (all hot offer services, filterable by game)
/[game-slug] Game Services Page (ALL tab)
/[game-slug]/hot-offers Game Services Page (HOT OFFERS tab)
/[game-slug]/[category-slug] Game Services Page (filtered by service category)
/[game-slug]/[category-slug]/[service-slug] Service Detail
/cart Cart Page
/checkout Checkout
/order-confirmed Order Confirmed (?session=[checkoutSessionId])
/login Customer Login
/register Customer Register
/profile Customer Profile
/profile/edit Edit Profile
/profile/orders/[id] Order Detail
/reset-password Reset Password (from email link)
/refund-policy Refund Policy
/privacy-policy Privacy Policy
/terms-of-service Terms of Service
/404 Not Found (handled by Next.js not-found.tsx - no explicit route needed)

# Admin Terminal
/admin/login Admin Login
/admin/dashboard Operational Overview
/admin/users User Registry
/admin/users/new Add User
/admin/users/[user-name] User Detail
/admin/games Games List
/admin/games/new Add Game
/admin/games/[id]/edit Edit Game
/admin/services Service Catalog
/admin/services/new Create Service
/admin/services/[game-slug]/[service-slug]/edit Edit Service (canonical)
/admin/services/[game-slug]/[service-slug]/preview Service Preview (canonical)
/admin/services/[...servicePath] Compatibility catch-all for old ID edit/preview URLs
/admin/orders Order Management
/admin/orders/[id] Order Detail
/admin/transactions Financial Ledger
/admin/content Content Library
/admin/content/[id]/edit Edit Content Block
/admin/messages Support Inbox
/admin/messages/[ticketId] Active Conversation
/admin/logs Audit Logs
/admin/settings Terminal Configuration
```

**Route guard:** All `/admin/*` routes require a valid signed JWT with `role: "admin"` verified server-side. Session timeout after 8 hours of inactivity (configurable in Settings) - redirects to `/admin/login`.

---

## 11. Order State Machine

**Current implementation note:**
- `pending -> confirmed -> in_progress -> delivered` is admin-driven.
- `delivered -> completed` can be customer-driven through Confirm Complete, admin-driven when support verifies completion, or system-driven when the configured auto-complete window passes.
- `completed_at` is set when the customer confirms completion, admin marks the order completed, or the auto-complete rule marks the delivered order completed.
- Customers can request refunds from active statuses, and from `completed` until the configured refund window after `completed_at`.
- Denied refunds restore `refund_previous_status`; there is no `refund_rejected` order status.
- Stripe refunds execute through Stripe. NOWPayments/crypto refunds are recorded manually after admin completes an external transfer.

### State Diagram

```
[Customer pays]
 |
 v
+------------------+
| pending | Payment cleared. Awaiting admin acknowledgment.
+--------+---------+
 | admin acknowledges
 v
+------------------+
| confirmed | Admin confirmed. Service about to begin.
+--------+---------+
 | admin starts service
 v
+------------------+
| in_progress | Service actively underway.
+--------+---------+
 | admin marks as delivered
 v
+------------------+
| delivered | Customer notified. Awaiting customer confirmation.
+--------+---------+
 |
 +----+-----------------------------+
 | |
customer confirms complete customer requests refund
(or auto-complete window) (before refund window ends)
 v v
+----------+ +--------------------+
| completed| | refund_requested |
| (terminal)| +--------+-----------+
+----------+ |
 +----------+----------+
 | |
 admin approves admin denies
 v v
 +-----------+ +-----------+
 | refunded | | completed|
 | (terminal)| | (terminal)|
 +-----------+ +-----------+
```

Refund can also be requested from `pending`, `confirmed`, and `in_progress`
(customer changed their mind before delivery - no time limit in this case).

### Transition Rules

| From | To | Trigger | Actor |
|---|---|---|---|
| - | `pending` | Payment gateway webhook confirms charge | System |
| `pending` | `confirmed` | Admin acknowledges the order | Admin |
| `confirmed` | `in_progress` | Admin starts the service | Admin |
| `in_progress` | `delivered` | Admin marks as delivered | Admin |
| `delivered` | `completed` | Customer confirms completion, admin verifies completion, or configured auto-complete window passes with no refund request | Customer/Admin/System |
| `pending` / `confirmed` / `in_progress` | `refund_requested` | Customer changed mind (no time limit) | Customer |
| `delivered` / `completed` | `refund_requested` | Customer requests refund before terminal/refund-window cutoff | Customer |
| `refund_requested` | `refunded` | Admin approves and issues via gateway | Admin |
| `refund_requested` | previous workflow status | Admin denies refund. Restore `refund_previous_status`, clear it, and set transaction `refund_status = rejected`. Customer notification can be added by the later notification system. | Admin |

**Rules:**
- `completed` and `refunded` are terminal - no further transitions
- Orders only exist post-payment - no pre-payment state
- Refund from pre-delivery states: no time limit
- Refund from `completed`: within the configured refund window after `completed_at` only
- **One refund attempt per order** - once attempted (approved or denied), no further requests
- Auto-completion uses the configured auto-complete window. Vercel Cron runs `/api/cron/orders/auto-complete` daily, and order reads still run the same rule as backup.
- All transitions must be written to Audit Log

### Refund Routing by Provider

**Automatic provider refund:**
- Available only when the provider implementation declares `refundCapabilities.automatic = true`.
- Stripe supports this path and calls the Stripe refund API.
- If the provider call fails, Moon Strike shows the provider error and does not mark the order or transaction as refunded.

**Manual refund record:**
- Available when the admin already refunded the customer outside Moon Strike.
- Used for NOWPayments/crypto, wallet transfer, provider dashboard refunds, bank transfer, or any future provider without an automatic refund API.
- Manual mode only records the refund in Moon Strike; it does not move money.

### Refund Flow

```
STRIPE (card / PayPal) NOWPAYMENTS (crypto)
---------------------- --------------------
Customer requests refund Customer requests refund
 | |
status -> refund_requested status -> refund_requested
 | |
Admin reviews in dashboard Admin reviews in dashboard
 | |
Admin chooses automatic/manual Admin completes external refund
 | |
Automatic: Stripe API called Admin records manual refund
Manual: record external refund |
 | |
status -> refunded status -> refunded
```

### Backend Routing Pseudocode

```ts
async function issueRefund(orderId: string, mode: "automatic" | "manual") {const order = await db.orders.findById(orderId)
 const transaction = await db.transactions.findByCheckout(order.checkoutSessionId)
 const provider = getPaymentProvider(transaction.provider)

 const result = await provider.refund({order, transaction, amount, mode})
 // If provider.refund throws, do not update order/transaction status.

 await db.transactions.update(transaction.id, {status: "refunded",
 refundStatus: "refunded",
 providerRefundId: result.providerRefundId,
 rawProviderPayload: {...transaction.rawProviderPayload, refund: result.payload},})
 await db.orders.update(orderId, {status: "refunded"})}
```

---

## 12. Rate Limiting

> Caps requests per IP/user per time window. Prevents brute force, scraping, and abuse.

### Tiers

```
Anonymous (no session) -> Strictest - unknown, untrusted
Authenticated customer -> Moderate - known, untrusted for payments
Admin -> Strict at login, relaxed after session verification
```

### Limits

| Endpoint | Anonymous | Customer | Admin | Reason |
|---|---|---|---|---|
| `POST /api/auth/register-check` | 5 / 15 min / IP+email | - | - | Duplicate account probing / spam |
| `POST /api/auth/password-reset` | 3 / 15 min / IP+email | - | - | Email spam |
| `POST /api/admin/login` | 20 / 15 min / IP + 5 / 15 min / IP+email | - | - | Admin brute force |
| `GET /api/search` | 15 / 1 min / IP | 40 / 1 min / user | unlimited | Scraping |
| `GET /api/games` | 20 / 1 min / IP | 60 / 1 min / user | unlimited | Scraping |
| `GET /api/services` | 20 / 1 min / IP | 60 / 1 min / user | unlimited | Scraping |
| `POST /api/checkout` | blocked | 5 / 1 min / user | unlimited | Auth required |
| `POST /api/orders` | blocked | 3 / 1 min / user | unlimited | Duplicate prevention |
| `POST /api/refunds` | blocked | 2 / 1 hour / user | unlimited | Abuse prevention |
| Payment webhooks | signature check only | - | - | Replay attack prevention |

**Rules:**
- Violations return HTTP 429. Admin login includes a `Retry-After` response header.
- Audit Log entries with status `blocked` should be added once admin audit persistence is wired.
- Payment webhook endpoints use signature verification - IP-based limiting does not apply.
- Limits above are starting estimates - tune after launch with real traffic data.
- Supabase Auth has its own built-in rate limiting on `/auth/v1/token`. Verify it is enabled: Supabase Dashboard -> Authentication -> Rate Limits. App-level auth limits are defense-in-depth - both should be active.

**Implementation:** Current auth endpoints use in-memory per-runtime counters. Move these to Redis/Upstash or Supabase-backed counters before production if running multiple server instances.

---
## 13. Implementation Notes

### Notifications

**Storage:** Notifications are persisted in the `notifications` table. Chat unread badges are separate and do not use this table.

**Delivery model:** Notification feeds and badges use protected API polling. Customer notification APIs are called only for logged-in customers. Admin notification APIs are called only inside admin layout/pages. Feed pages poll about every 30 seconds while visible and refresh on focus/visibility return and read/delete actions.

**Customer events:**

| Event | In-app | Email |
|---|---|---|
| `order_confirmed` | Yes | No |
| `order_in_progress` | Yes | No |
| `order_delivered` | Yes | Yes |
| `order_completed` | Yes | No |
| `refund_approved` | Yes | Yes |
| `refund_denied` | Yes | Yes |

**Admin events:**

| Event | In-app | Email |
|---|---|---|
| `order_created` | Yes | No |
| `refund_requested` | Yes | No |
| `order_completed` | Yes | No |

**Notification feed UX:**
- Customer page: `/notifications`.
- Admin page: `/admin/notifications`.
- Filters: All, Unread, Orders, Refunds.
- Actions: mark read, mark all read, delete notification with confirmation.
- Cleanup: `/api/cron/notifications/cleanup` deletes read notifications older than 30 days; unread notifications are never deleted by cleanup.

**Email rule:** Customer transactional email is intentionally limited to `order_delivered`, `refund_approved`, and `refund_denied`. Do not add email for routine status changes without a product decision.

---

### Resend Email

Resend is used in two ways:
- Supabase Auth emails can be routed through Resend SMTP from the Supabase dashboard.
- MoonStrike app transactional emails use the Resend HTTP API from `lib/email.ts`.

**What it sends for Moon Strike:**
- Auth emails: email confirmation on register and password reset links, triggered by Supabase Auth.
- App emails: `order_delivered`, `refund_approved`, and `refund_denied`, triggered by backend notification helpers.

**Implementation:**
- `lib/email.ts` provides `sendEmail()` and the reusable branded `renderMoonStrikeEmail()` template.
- `lib/notifications.ts` sends app emails only after the matching in-app notification is newly created, so deduped/retried actions do not spam the customer.
- `scripts/test-email.mjs` sends a branded test email without touching orders/refunds/notifications.
- Test command: `npm run email:test` or `npm.cmd run email:test`.

**Required env for app email:**
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `EMAIL_TEST_TO` only for the test script

---

### Google Sheets Integration

**Why it needs auth:** Google's API requires authentication even for your own spreadsheets - it doesn't allow anonymous writes. You authenticate using a **service account**: a bot Google identity that your backend acts as. The spreadsheet is shared with the service account's email address, and your backend uses a JSON key to sign API requests. Zero cost, one-time setup, key lives in env vars.

**Setup:**
1. Go to Google Cloud Console - Create a project (or use existing)
2. Enable the Google Sheets API
3. Create a Service Account - generate a JSON key - download it
4. Add the key to env: `GOOGLE_SERVICE_ACCOUNT_JSON` (the full JSON as a string)
5. Create your Google Spreadsheet - Share it with the service account's email (Editor access)
6. Copy the Spreadsheet ID from the URL - add to env: `GOOGLE_SHEET_ID`

One spreadsheet, two tabs. Written on order events only.

Not written to Sheets: user registrations, admin actions, failed payments.

**Orders tab** - one row per order, updated in place on status change:

| Column | Notes |
|---|---|
| `order_id` | Anchor key - used to find and update the row |
| `user_id` | FK reference |
| `username` | Denormalized for readability |
| `email` | Denormalized |
| `service` | Service name at purchase time |
| `options_snapshot` | e.g. `{"difficulty":"Mythic","loot_traders":2}` |
| `status` | Updated in place on every state transition |
| `created_at` | Set once on order creation |
| `delivered_at` | Set when status hits `delivered` |

**Transactions tab** - one row per payment, `refund_status` updated in place (no new row for refunds):

| Column | Notes |
|---|---|
| `transaction_id` | Anchor key |
| `order_id` | FK reference |
| `user_id` / `username` | Denormalized |
| `amount` | Positive value for payments |
| `currency` | USD or EUR |
| `provider` | `stripe` or `nowpayments` |
| `payment_status` | `paid` or `failed` |
| `refund_status` | Updated in place - `refunded` or `denied` when resolved |
| `created_at` | Set once |
| `refunded_at` | Set when refund approved |

**Write triggers:**

| Event | Action |
|---|---|
| Payment webhook fires - order enters `pending` | Append new row to Orders tab + Transactions tab |
| Order status changes to any subsequent state | Update existing Orders row by `order_id` |
| Refund resolved | Update `refund_status` + `refunded_at` on Transactions row |

> "Order enters `pending`" = payment confirmed by webhook. This is the first write. Do not wait for admin to set `confirmed` - that would miss orders admin never acknowledges.

---

### NowPayments Webhook Verification

**Approach:** Hosted invoice checkout with IPN verification. The webhook parses JSON, recursively sorts object keys, signs the sorted JSON with HMAC-SHA512, and timing-safe compares it with `x-nowpayments-sig`.

**Required env var:** `NOWPAYMENTS_IPN_SECRET` - from NowPayments dashboard > API Settings > IPN Secret. WARNING: Setup pending.

```ts
// lib/webhooks/verifyNowPayments.ts
import crypto from "crypto";

export function verifyNowPaymentsSignature(rawBody: string,
signature: string,
secret: string): boolean {const hmac = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

// Use timing-safe comparison to prevent timing attacks
if (hmac.length !== signature.length) return false;
return crypto.timingSafeEqual(Buffer.from(hmac, "hex"),
Buffer.from(signature, "hex"));}
```

```ts
// api/v1/webhooks/nowpayments.ts
export async function POST(req: Request) {const signature = req.headers.get("x-nowpayments-sig");
const rawBody = await req.text(); // must be raw - never parse first

if (!signature || !verifyNowPaymentsSignature(rawBody,
signature,
process.env.NOWPAYMENTS_IPN_SECRET!)) {return new Response("Unauthorized", {status: 401});}

const payload = JSON.parse(rawBody);

if (payload.payment_status === "finished") {// confirm order, write to Sheets, notify admin}

return new Response("OK", {status: 200});}
```

**Critical rules:**
- Always read raw body before any JSON parsing - parsing mutates the body and breaks HMAC comparison
- Use `crypto.timingSafeEqual` for the comparison - plain `===` is vulnerable to timing attacks
- Log failed verifications to Audit Logs - repeated failures may signal an attack
- Always return 200 after verification passes, even on business logic errors - NowPayments retries on non-200, which risks duplicate order creation

---

### Image Hosting

- **Origin:** Supabase Storage (free tier, 1 GB included)
- **CDN:** Cloudflare Images - caches at edge globally after first pull from Supabase
- **Estimated cost:** $0-$5/month at early-to-mid traffic

---

### Auth - Google OAuth

Both auth methods active for storefront customers. Both free under Supabase's 50K MAU free tier.

```ts
supabase.auth.signInWithPassword({email, password})
supabase.auth.signInWithOAuth({provider: 'google'})
```

Admin auth does not use Supabase Auth - see Sections 8 and 10.2.

---

*Last updated: 2026-06-05 - Order refs in user/admin URLs, normalized order/items/transaction model, completed-at refund window, Stripe refunds, manual non-Stripe refund recording, active customer order filters, and refund seed/reseed scripts reflected.*
*Design references: all screenshots stored in `/design-refs/`.*

---

## 14. Quality & Launch Checklist

### 14.1 UAT (User Acceptance Testing)

Test every flow end-to-end as a real user before going live. Use Stripe test cards and NowPayments sandbox - never live keys during testing.

**Stripe test card:** `4242 4242 4242 4242` - any future expiry - any CVC

| Flow | What to verify |
|---|---|
| Register - verify email - login | Confirmation email arrives via Resend, link works, redirects to profile |
| Register with Google OAuth | Account created, redirected correctly |
| Forgot password | Reset email arrives, link opens reset form, redirect to login on success |
| Add to cart (anonymous) -> login/logout same browser | Items stay visible because cart is keyed by `ms_cart_session`, not auth state |
| Add same service twice | Two separate CartItems appear in cart |
| Configure service - Add to Cart - Buy Now - Cart | Cart opens, item shown with correct options and price |
| Cart currency toggle | Prices update across cart, navbar, and service detail simultaneously |
| Cart currency toggle after login/logout | Same browser cart keeps items and prices update with global USD/EUR toggle |
| Proceed to Checkout (anonymous) | Redirected to login, returned to cart after login |
| Full purchase - Stripe card | Payment clears, orders created, Order Confirmed page shows all purchased services, cart emptied, admin notified |
| Full purchase - NowPayments crypto | Webhook fires, signature verified, orders created, wallet address flow works on refund |
| Multi-item checkout | All CartItems shown in order summary, one payment, one Order per CartItem created, all visible on Order Confirmed page |
| Order Confirmed page | All orders from checkout shown, View My Orders links to profile Order History |
| Admin: Confirm Order - In Progress - Delivered | Each status transition updates customer profile and sends in-app notification; delivered also sends customer email |
| Customer requests refund (pre-delivery) | Button visible on pending/confirmed/in_progress, refund_requested status set |
| Customer requests refund after completion within configured window | Button visible, configured refund window enforced |
| Customer requests refund (post-delivery, after 7 days) | Button hidden - refund not available |
| Admin approves refund - Stripe | Refund issued via Stripe API, status = refunded, customer in-app notification + email sent |
| Admin approves refund - NowPayments | Wallet address collected, refund issued via NowPayments API, status = refunded |
| Admin denies refund | Status restores to pre-refund workflow state; transaction refund status is `rejected`; customer in-app notification + email sent |
| Second refund attempt on same order | Not possible - button hidden after first attempt |
| Auto-complete delivered orders | Delivered order auto-moves to completed after the configured auto-complete window with no refund request |
| Support chat (anonymous) | Chat opens without creating a ticket until first message/start action; message appears in admin inbox |
| Support chat - login - name updates | History preserved, username shown going forward |
| Chat unread badges | Admin/customer unread badges clear after opening, scrolling, typing, or interacting with the chat |
| Notification feed | `/notifications` and `/admin/notifications` show filters, unread badges, mark read/all read, delete with confirmation |
| Email test | `npm run email:test` sends a branded test email to `EMAIL_TEST_TO` without changing app data |
| Admin search | Finds orders by ID, transactions by ID, users by email/username |
| Unverified user tries to purchase | Blocked, verification banner shown, resend email works |
| Admin login | Seeded admin credentials log in, cookie session is created, and protected admin routes open |
| Admin session timeout | After 8 hours inactivity, redirected to /admin/login |
| Light mode toggle | Colors swap correctly, layout unchanged, preference persists on reload |
| 404 page - bad game slug | notFound() renders correctly, no redirect to homepage |
| 404 page - bad service slug | notFound() renders correctly |
| 404 page - wrong order ID | notFound() renders for order not belonging to logged-in user |

---

### 14.2 Security Checklist

All items must be checked before going live. Items marked **CRITICAL** are non-negotiable - the app should not launch without them.

| Item | Priority | Details |
|---|---|---|
| Supabase RLS enabled on all tables | **CRITICAL** | See Section 14.3 - without this, any logged-in customer can read other customers' data directly |
| All env vars in hosting platform, not in code | **CRITICAL** | Use Vercel / hosting dashboard env vars. Never hardcode secrets. |
| `.env` files in `.gitignore` | **CRITICAL** | One leaked commit = compromised keys |
| NowPayments webhook signature verified | **CRITICAL** | Without this, fake payments can create real orders - See Section 13 |
| Stripe webhook signature verified | **CRITICAL** | Same risk as above |
| Admin routes server-side auth-gated | **CRITICAL** | `/admin/*` must verify JWT server-side, not just client-side |
| Single admin account enforced | **CRITICAL** | Admin account is seeded/reseeded only; no public admin registration and no extra admin accounts |
| HTTPS only | **CRITICAL** | Enforce via hosting platform - no HTTP fallback |
| Anonymous cart goes through server-side routes only | **CRITICAL** | Supabase client never used for anonymous cart reads/writes - service role key only via API routes |
| Avatar upload validates file type + size | High | Accept JPEG/PNG only, reject all others, compress before storing |
| Rate limiting active | High | Supabase API gateway limits per Section 12 |
| Supabase Storage bucket policies | High | Game/service images: public read. User avatars: private, owner-only write. |
| Order ownership verified on Order Confirmed page | High | If `checkoutSessionId` doesn't belong to logged-in user - redirect to `/profile` |
| Cart ownership verified | High | Users can only read/write their own CartItems |
| Admin self-ban and last-admin-ban blocked | High | Server-side guard - see Section 10.4 |
| Audit log covers all admin actions | Medium | Every state transition, login, and settings change logged |
| Failed webhook attempts logged | Medium | Repeated failures flagged as `blocked` in Audit Log |

---

### 14.3 Supabase RLS Policies

RLS (Row Level Security) restricts which rows a user can read or write at the database level. Without it, a logged-in customer using the Supabase client can query any table and read other users' data - even if your frontend doesn't expose it.

**Enable RLS on every table. Then add these policies:**

```sql
-- ORDERS ----------------------------------------------------------------------
-- Customers can only see their own orders
CREATE POLICY "customer_read_own_orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Only backend (service role) can insert/update orders
CREATE POLICY "service_role_write_orders"
ON orders FOR ALL
USING (auth.role() = 'service_role');

-- CART ------------------------------------------------------------------------
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
-- used directly for anonymous cart reads or writes - no RLS policy needed for anon carts.

-- CART ITEMS ------------------------------------------------------------------
CREATE POLICY "customer_manage_own_cart_items"
ON cart_items FOR ALL
USING (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));

-- SUPPORT TICKETS & MESSAGES -------------------------------------------------
-- Customers can only read their own tickets
CREATE POLICY "customer_read_own_tickets"
ON support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Customers can only send messages on their own tickets
CREATE POLICY "customer_send_own_messages"
ON messages FOR INSERT
WITH CHECK (ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()));

-- NOTE: Anonymous support ticket operations (userId = null) also go through
-- server-side API routes with the service role key - same pattern as the cart.

-- GAMES & SERVICES ------------------------------------------------------------
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

-- GENRES ----------------------------------------------------------------------
-- Public read for all genres
CREATE POLICY "public_read_genres"
ON genres FOR SELECT
USING (true);

-- Only service role can write
CREATE POLICY "service_role_write_genres"
ON genres FOR ALL
USING (auth.role() = 'service_role');

-- SERVICE CATEGORIES ----------------------------------------------------------
-- Public read for all service categories (needed for tab rendering)
CREATE POLICY "public_read_service_categories"
ON service_categories FOR SELECT
USING (true);

-- Only service role can write
CREATE POLICY "service_role_write_service_categories"
ON service_categories FOR ALL
USING (auth.role() = 'service_role');

-- ADMIN TABLES ----------------------------------------------------------------
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

> All backend API routes that write to the database must use the **Supabase service role key** (never the anon key) - this bypasses RLS intentionally for trusted server-side operations. The anon key is for the frontend client only.

#### DB Migration SQL

**Genres table:**

```sql
-- 1. Create the genres table
CREATE TABLE genres (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name TEXT NOT NULL UNIQUE,
 slug TEXT NOT NULL UNIQUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now());

-- 2. Seed canonical genres
INSERT INTO genres (name, slug) VALUES
 ('ACTION RPG', 'action-rpg'),
 ('MMORPG', 'mmorpg'),
 ('FPS', 'fps'),
 ('MOBA', 'moba'),
 ('TACTICAL SHOOTER', 'tactical-shooter'),
 ('BATTLE ROYALE', 'battle-royale'),
 ('LOOTER SHOOTER', 'looter-shooter'),
 ('SPORTS ACTION', 'sports-action');

-- 3. Add FK column to games
ALTER TABLE games
 ADD COLUMN genre_id UUID REFERENCES genres(id) ON DELETE RESTRICT;

-- 4. (Data migration - run after seeding genres)
-- UPDATE games SET genre_id = (-- SELECT id FROM genres WHERE name = games.genre LIMIT 1
--);

-- 5. Make column NOT NULL after data migration is verified
-- ALTER TABLE games ALTER COLUMN genre_id SET NOT NULL;

-- 6. Drop old column after data migration is verified
-- ALTER TABLE games DROP COLUMN genre;

-- 7. Enable RLS
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
```

**Service Categories table:**

```sql
-- 1. Create the service_categories table
CREATE TABLE service_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 slug TEXT NOT NULL,
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (game_id, slug));

-- 2. Add FK column to services
ALTER TABLE services
 ADD COLUMN service_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;

-- 3. (Data migration - run after seeding service_categories)
-- UPDATE services SET service_category_id = (-- SELECT id FROM service_categories
-- WHERE game_id = services.game_id
-- AND name = services.service_category -- old string column
-- LIMIT 1
--);

-- 4. Drop old column after data migration is verified
-- ALTER TABLE services DROP COLUMN service_category;

-- 5. Enable RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
```

#### Current API Routes

**Implemented auth/admin/catalog routes:**
```
POST /api/auth/register-check Provider-aware registration precheck
POST /api/auth/password-reset Rate-limited password reset request
POST /api/admin/login Admin login
POST /api/admin/logout Admin logout
GET /api/admin/me Current admin session
POST /api/admin/genres Create genre
DELETE /api/admin/genres/[id] Delete genre
GET /api/admin/games Admin games list
POST /api/admin/games Create game
PATCH /api/admin/games/[id] Edit game
DELETE /api/admin/games/[id] Delete game
POST /api/admin/games/image Upload/compress game image
GET /api/admin/services Admin services list
POST /api/admin/services Create service
PATCH /api/admin/services/[id] Edit service
DELETE /api/admin/services/[id] Delete service
POST /api/admin/services/image Upload/compress service image
POST /api/admin/service-categories Create category
PATCH /api/admin/service-categories/[id] Edit category
DELETE /api/admin/service-categories/[id] Delete category
GET /api/catalog/quick-select Active games/services for Quick Select
```

All admin write routes require the signed admin session cookie, use server-side credentials for DB writes, and should write an audit log entry on success.

**Seed scripts:**
```
npm run admin:seed Seed the single admin account
npm run admin:reseed Replace/reseed the single admin account
npm run catalog:seed Seed 20 games, genres, categories, and 20 services per game with option schemas
npm run refund-orders:seed Clean seed refund/order test scenarios for USD and EUR
npm run refund-orders:reseed Alias for the same clean refund/order reseed
npm run refund-orders:cleanup Remove refund/order test data
npm run notifications:seed Seed customer/admin notification examples
npm run notifications:reseed Alias for notification reseed
npm run notifications:cleanup Remove seeded notifications
npm run chat-user:seed Seed support/order chat examples for the test user
npm run chat-user:reseed Alias for chat-user reseed
npm run chat-user:cleanup Remove seeded test-user chats
npm run email:test Send a branded Resend test email to EMAIL_TEST_TO
npm run chat:cleanup Delete all chat history when called with confirmation
```

---

### 14.4 Performance Guidelines

Follow these during development - not as a post-launch fix.

| Area | Rule |
|---|---|
| Images | Lazy load all game/service images. Use Cloudflare Images URLs with size transforms (e.g. `?width=600`). Never serve original upload URLs directly to the frontend. |
| Infinite scroll | Fetch in pages of 16 items. Never load entire table. Use Supabase `.range(from, to)` pagination. |
| Search debounce | Already specced at 300ms - do not reduce. Each keystroke = one DB query. |
| Chat refresh | Use protected API refresh/local events for private chat data. Active chats refresh quickly; ticket lists/unread badges refresh slower and on focus/visibility return. Avoid browser-side direct table subscriptions for private message payloads. |
| TrustBox widget | Load async via script tag. Does not block page render - no action needed. |
| Options schema render | Service Detail configurator reads `optionsSchema` JSONB. Parse once on load, do not re-parse on every price recalculation. |
| Price calculation | Run entirely client-side on each option change - no API call needed. One pure function (see section 6). |
| Admin dashboard charts | Fetch aggregated data server-side. Never query raw orders/transactions table on the client for chart data. |
| Cart item count badge | Store count in global state (useCart hook). Do not re-fetch cart on every page to get the count. |

---

## 15. Environment Variables

> All secrets go in your hosting platform's env var dashboard (Vercel, etc.) - never hardcoded, never committed to git. Add `.env.local` to `.gitignore` before the first commit.

### Required Variables

| Variable | Used in | When needed | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend + Backend | Build + Runtime | Supabase project URL. Safe to expose - prefixed `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend + SSR auth client | Build + Runtime | Supabase publishable key (`sb_publishable_...`). Safe to expose; RLS and user JWTs enforce access. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted only as a legacy fallback. |
| `SUPABASE_SECRET_KEY` | Backend API routes only | Runtime | Supabase secret key (`sb_secret_...`). **Never expose to frontend.** Bypasses RLS. Legacy fallback: `SUPABASE_SERVICE_ROLE_KEY`. |
| `JWT_SECRET` | Backend | Runtime | Signs and verifies admin JWTs. Min 32 chars, random. Generate with `openssl rand -base64 32`. |
| `CRON_SECRET` | Backend cron routes | Runtime | Optional local/manual authorization for cron endpoints. Vercel Cron also sends `x-vercel-cron: 1`. |
| `NEXT_PUBLIC_SITE_URL` | Backend emails + links | Runtime | Canonical app URL used in transactional email CTA links. Local default: `http://localhost:3000`. |
| `ADMIN_EMAIL` | Seed script | Local reseed + deploy setup | Email for the single seeded admin account. Defaults to `admin@moonstrike.io` if omitted. |
| `ADMIN_PASSWORD` | Seed script | Local reseed + deploy setup | Password for the single seeded admin account. Required for `npm run admin:seed` / `npm run admin:reseed`. |
| `ADMIN_DISPLAY_NAME` | Seed script | Local reseed + deploy setup | Display name for the single seeded admin account. Defaults to `Admin Alpha`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend checkout | Build + Runtime | Stripe publishable key - safe to expose. |
| `STRIPE_SECRET_KEY` | Backend | Runtime | **Never expose to frontend.** Used to create Payment Intents and process refunds. |
| `STRIPE_WEBHOOK_SECRET` | Backend webhook handler | Runtime | From Stripe Dashboard - Webhooks - signing secret. Used to verify webhook signatures. |
| `NOWPAYMENTS_API_KEY` | Backend | Runtime | From NowPayments dashboard. Used to create crypto payments. |
| `NOWPAYMENTS_IPN_SECRET` | Backend webhook handler | Runtime | WARNING: Setup pending. From NowPayments dashboard > API Settings > IPN Secret. Used to verify webhook signatures. |
| `RESEND_API_KEY` | Backend | Runtime | From resend.com dashboard. Used by MoonStrike app transactional emails. Supabase Auth email may also use Resend SMTP from Supabase dashboard config. |
| `RESEND_FROM_EMAIL` | Backend | Runtime | Sender address for app transactional emails. Use `onboarding@resend.dev` only for local testing; production should use a verified domain sender. |
| `EMAIL_TEST_TO` | Seed/test script | Local testing | Recipient used by `npm run email:test`. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Backend | Runtime | Full JSON key file contents as a string. From Google Cloud Console - Service Accounts. Used for Sheets writes. |
| `GOOGLE_SHEET_ID` | Backend | Runtime | Spreadsheet ID from the Google Sheets URL. The sheet must be shared with the service account email. |
| `NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH` | Frontend | Build + Runtime | From Cloudflare Images dashboard. Used to construct CDN image URLs. |

### Setup Order

Set these up in this order - each depends on the service being configured first:

1. Supabase - create project, copy URL + anon key + service role key
2. JWT secret - generate locally, add to env
3. Stripe - create account, get publishable + secret key, set up webhook and copy signing secret
4. NowPayments: create account, get API key, configure IPN and copy secret WARNING
5. Resend - create account, verify domain, copy API key, configure Supabase SMTP
6. Google Cloud - create project, enable Sheets API, create service account, download JSON key, create spreadsheet, share with service account email
7. Cloudflare Images - enable in Cloudflare dashboard, copy account hash

### Local Development

```bash
#.env.local (never commit this file)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
JWT_SECRET=your-32-char-random-secret
CRON_SECRET=your-random-cron-secret
ADMIN_EMAIL=admin@moonstrike.io
ADMIN_PASSWORD=change-this-before-seeding
ADMIN_DISPLAY_NAME=Admin Alpha
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=MoonStrike <noreply@yourdomain.com>
EMAIL_TEST_TO=you@example.com
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH=abc123xyz
```

> For Stripe webhooks in local dev: use the Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) to forward webhook events to your local server. The CLI provides a temporary `STRIPE_WEBHOOK_SECRET` for local use only.

---

## Current QA Overrides

- Multi-item checkout should create one internal `orders` row and multiple `order_items` rows, not one order per cart item.
- NowPayments checkout should create one internal order after verified IPN fulfillment. Crypto refunds are manual/admin-assisted: admin completes the external transfer first, then records the refund in Moon Strike.
- `checkout_sessions` is the payment-attempt/debug table and stays DB/admin-internal for now. Do not build customer-facing checkout-session pages.
- `transactions` is the confirmed-payment ledger. Real app flows should create transaction rows only after Stripe paid fulfillment or NOWPayments `finished` IPN.
- Transaction UI should use `transaction_ref` for user/admin IDs and URLs. Supabase UUIDs stay debug-only; provider payment/session IDs stay payment-reference/debug fields.
- Admin transaction list filters should only expose `success` and `refunded` until pending/failed/disputed provider-event handling is deliberately wired.
- Transaction detail pages should stay payment/order-reference focused. Service/options detail belongs in order detail.
- Completed-order refund eligibility uses `orders.completed_at`; customer refund is allowed until the configured refund window after completion.
- Game services pages keep the service count and game-local search in one row below category tabs. Banner USD/EUR selector controls global visible currency only.
- Use `npm run refund-orders:reseed` to seed USD/EUR refund scenarios covering active, completed-window, completed-expired, refund-requested, and refunded states. The same seed also creates related audit events for every audit event type and moderation history rows for the refund test user.



