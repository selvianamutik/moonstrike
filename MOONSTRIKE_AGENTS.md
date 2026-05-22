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

| Element | Style |
|---|---|
| Logo / Display | Bold, purple-to-cyan gradient |
| Headings | `--ms-text-primary`, bold |
| Body | `--ms-text-secondary`, regular weight |
| Badges / Tags | Uppercase, small, colored pill shapes |

> Do not use generic fonts (Inter, Roboto, Arial). Use a gaming/premium aesthetic font.

### 2.4 Global Components

| Component | Description |
|---|---|
| `<Navbar>` | Logo · Hamburger · Search bar · Currency selector (USD/EUR + flag) · Services · About · Profiles |
| `<Footer>` | Logo · Sitemap · Legal · Genres · Social Media · Disclaimer · copyright |
| `<GameCard>` | Image thumbnail · Genre tags · Game name · Short description |
| `<ServiceCard>` | Image · HOT badge (conditional) · Title · Description · Price · Buy Now button |
| `<CategoryTabs>` | Scrollable horizontal pill tabs with left/right arrow nav |
| `<StarRating>` | 5-star display with username and comment (TrustPilot style) |
| `<RegionSelector>` | USA / EUROPE toggle pills |
| `<Badge>` | HOT · NEW UPDATE · COMING SOON · FEATURED — corner/inline labels |
| `<ThemeToggle>` | Switches dark and light mode; persisted in user preference |
| `<SearchResults>` | Service cards only (image + title). On-submit, not real-time. Zero state: "No services found for [query]." |

---

## 3. Storefront Pages

### 3.1 Landing Page (`/`)

**Purpose:** Main entry point. Converts visitors via offers, social proof, and trust signals.

| Section | Details |
|---|---|
| Navbar | Global component |
| Hero / Promo Banner | CMS-editable (`hero` block). Label · Headline · Subtext · CTA button. Fields: label, headline, subtext, CTA text/link, background image. |
| Game Filter + Grid | Category tabs: ALL GAMES · ACTION RPG · TACTICAL SHOOTING · LOOTER SHOOTING. 4-column game card grid. Load More button. |
| Best Offers | Section header + VIEW ALL DEALS link. 4 horizontal service cards with price + Buy Now. |
| Trust Stats Bar | CMS-editable. 4 stats: 50K+ GAMES BOOSTED · 99.9% SUCCESS RATE · 24/7 ACTIVE SUPPORT · TOP 1% PRO PLAYERS |
| Why Choose Us | CMS-editable. Full-width media block + 3 benefit items (icon + label + description). |
| How It Works | CMS-editable. 4 numbered steps: Choose Service · Log Into Account · Daily Progress Updates · Enjoy Result. |
| TrustPilot Reviews | Carousel of review cards (avatar · 5 stars · comment). Left/right nav. |
| Payment Methods Strip | PayPal · Mastercard · Apple Pay · Google Pay · Stripe logos |
| Footer | Global component |

---

### 3.2 Services Page (`/services`)

**Purpose:** Browse all boosting services for a selected game, filterable by category.

| Section | Details |
|---|---|
| Navbar | Global |
| Page Header | Title: All Services · Search input right-aligned |
| Featured Game Banner | CMS-editable (Promotional Banner). Wide card with game art, game title left, USA/EUROPE toggle right. Schedulable. |
| Service Category Tabs | HOT OFFERS · DUNGEONS · POWERLEVELING · RAID · STORIES (scrollable) |
| Service Cards Grid | 2-row x 4-column. Each card: HOT badge · image · title · description · price · Buy Now |
| TrustPilot Reviews | Same carousel component as landing page |
| Footer | Global |

---

### 3.3 Games Page (`/games`)

**Purpose:** Browse all supported games with genre filtering.

**Layout:** Two-column — sidebar (left) + main content (right).

**Sidebar:** TOP TITLES list (All Games, WoW, Destiny 2, Valorant, LoL) · GENRES multi-select tag pills (Action RPG, MMO, Shooters, MOBA).

**Main Content:** All games header · Search input · 3-column game card grid · Load More button.

---

### 3.4 Service Detail Page (`/services/[game]/[service-slug]`)

**Purpose:** Full service view with configurator. Primary conversion page.

**Layout:** Two-column — detail (left) + sticky configurator sidebar (right).

**Left Column:**
1. Breadcrumb (game name, uppercase colored)
2. Title and description
3. Quick badges: Starts in < 15 mins · 100% Completion
4. Service image (wide, rounded)
5. "What You Get" — 2x2 benefit cards (icon + title + description)
6. Requirements checklist
7. "Why Choose Us" section (shared component)

**Right Column — "Configure Your Run" Sticky Sidebar:**
1. Option fields rendered from `options_schema` (see §6)
2. Currency selector
3. Total price (live-calculated, cyan)
4. Buy Now button (full-width, gradient)

---

### 3.5 Login & Register (`/login`, `/register`)

**Layout:** Centered card on full background. No navbar or footer.

**Login:** Logo + tagline · Login/Register tab toggle · Email · Password (eye toggle) · Forgot Password · Google OAuth divider · Login CTA.

**Register:** Username · Email · Password · Confirm Password · Google OAuth divider · Create Account CTA.

**Implementation:** Supabase Auth — `signUp` / `signInWithPassword` / `signInWithOAuth({ provider: 'google' })`. On success: redirect to previous page or `/profile`.

---

### 3.6 Customer Profile (`/profile`)

**Layout:** Left sidebar (profile info) + main tabbed content.

**Sidebar:** Avatar · Username · Email · Member since · Total Orders + Total Spent · Edit Profile · Logout.

**Tab 1 — Order History (default):**
- Filter tabs: All · Pending · In Progress · Delivered · Completed · Refund Requested · Refunded
- Each row: thumbnail + name · options summary · date · amount · status badge · View Details

**Order Detail (`/profile/orders/[id]`):**
- Service name + thumbnail
- Full selected options breakdown with prices
- Price breakdown: base + options + total
- Order timeline: placed > confirmed > delivered > completed
- `Open Support Chat` button
- `Request Refund` button (visible on any non-terminal status):
  - Confirmation dialog before submitting
  - Sets `order.status -> refund_requested` and `refundRequestedAt`
  - If `paymentProvider = "nowpayments"`: wallet address input shown before confirming

**Tab 2 — Transaction History:** Read-only. Columns: TXN ID · Service name · Date · Amount · Method · Status.

---

### 3.7 Global Chat Bubble (all storefront pages)

- Fixed, bottom-right corner of every storefront page
- Collapsed: circular icon + unread count badge
- Expanded: 320x480px chat panel (does not navigate away)
- Same data source as Admin Messages (`SupportTicket` + `Message` models)
- Real-time via Supabase Realtime WebSocket subscription
- Excluded from `/admin/*`, `/login`, `/register`

---

### 3.8 Secure Checkout (`/checkout`)

**Layout:** Two-column — payment form (left) + order summary (right).

**Left:** Payment method tabs: CREDIT CARD (Stripe) · PAYPAL (Stripe) · CRYPTO (NowPayments). Card details form shown when Credit Card is active.

**Right:** Item row (thumbnail · name · price · Immediate Start badge) · Total (large, cyan, taxes included in base price) · Complete Purchase button (gradient) · SSL note · legal note.

---

### 3.9 Refund Policy (`/refund-policy`)

Sections: Overview · Escrow Process (48-hour review window) · Eligibility (Non-Delivery, Not as Described, Mutual Cancellation) · Dispute Resolution · Note callout · Contact Support CTA.

---

### 3.10 Terms of Service (`/terms-of-service`)

TOC sidebar (left) + content (right) on desktop. Single column on mobile.

TOC: Acceptance of Terms · User Conduct · Service Delivery · Limitation of Liability · Termination.

---

### 3.11 Quick Select Mega Menu (Global Component)

Triggered by hamburger or "Services" nav item. Floating overlay.

1. Search bar: Search Game or Service
2. Category tabs: ALL GAMES · ACTION RPG · TACTICAL SHOOTING · LOOTER SHOOTING
3. Service grid — 4 columns, each column = one service category with 3–5 sub-service links

---

## 4. User Flows

```
Landing Page
  ├── Click game card     → Games Page → click game → Services Page
  ├── Click offer card    → Service Detail → Configure → Buy Now → Checkout
  ├── Navbar > Services   → Quick Select mega menu → sub-service → Service Detail
  └── Footer > Legal      → Refund Policy / Terms of Service

Services Page
  └── Click service card  → Service Detail → Configure → Checkout

Games Page
  └── Click game          → Services Page (filtered to that game)

Checkout
  └── Cancel & Return     → back to Service Detail
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
- Region (USA/EUROPE) is a global filter — persists across navigation

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

> All models use Supabase PostgreSQL. Dynamic fields are stored as JSONB.

```ts
// ─────────────────────────────────────────────────────────────────────────────
// GAME
// NOTE: Games do NOT have prices. Prices live on Services.
// ─────────────────────────────────────────────────────────────────────────────

Game {
  id: string
  name: string          // "World of Warcraft" | "Dota 2" | "Black Desert Online"
  slug: string          // "world-of-warcraft"
  image: string
  genre: string         // "MMORPG" | "MOBA" | "FPS" | "ACTION RPG"
                        // | "TACTICAL SHOOTER" | "BATTLE ROYALE" | "LOOTER SHOOTER"
  platforms: string[]   // ["PC"] | ["PC", "Console"] | ["Cross-play"]
  description: string
  isTopTitle: boolean
  status: "active" | "draft" | "archived"
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// NOTE: serviceCategory != game genre.
//   serviceCategory = what the booster does  (e.g. "Dungeon", "Raid")
//   genre           = the type of game       (e.g. "MMORPG", "FPS")
// ─────────────────────────────────────────────────────────────────────────────

Service {
  id: string
  gameId: string          // FK -> Game
  title: string           // "Mythic+ Dungeons Boost"
  slug: string
  image: string
  description: string
  serviceCategory: string // "Dungeon" | "Leveling" | "Raid" | "Stories" | "Coaching"
                          // | "Rank Boost" | "Item Farm" | "Powerleveling" | "Placement Matches"
  status: "active" | "draft" | "archived"
  isHotOffer: boolean     // true → appears in HOT OFFERS tab on Services page
  region: string[]        // ["USA", "EUROPE"]
  badges: string[]        // ["Starts in < 15 mins", "100% Completion"]
  requirements: string[]
  whatYouGet: Benefit[]

  // Base price — flat fee ALWAYS charged, regardless of option selections.
  // Admin sets both currencies manually. No runtime conversion.
  basePriceUSD: number
  basePriceEUR: number

  options_schema: JSONB   // array of ServiceOption — see below
}

Benefit {
  icon: string
  title: string
  description: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE OPTIONS  (stored as JSONB in options_schema)
//
// Types are predefined — admins pick from a dropdown, never free-type.
// Adding a NEW TYPE = define schema + build component + add to CMS dropdown = 1 deploy.
// Adding a NEW SERVICE with existing types = admin fills form, zero deploy.
// ─────────────────────────────────────────────────────────────────────────────

ServiceOption {
  label: string         // "Level up boost" | "Number of runs" | "Add-ons"
  required: boolean
  type:
    | "single_choice"   // pick exactly one — total += selected option's price
    | "multiple_choice" // pick one or more — total += each selected option's price
    | "scalar"          // numeric quantity — total += quantity x pricePerUnit
  options?: OptionItem[]       // used by single_choice and multiple_choice
  min?: number                 // used by scalar
  max?: number                 // used by scalar
  pricePerUnitUSD?: number     // used by scalar
  pricePerUnitEUR?: number     // used by scalar
}

OptionItem {
  label: string    // "1–20" | "21–40" | "Loot bag" | "Express delivery"
  priceUSD: number
  priceEUR: number // set independently — never converted from USD
}

// Storefront component mapping:
//   "single_choice"   → <SingleChoice />   (pill/card grid, single select)
//   "multiple_choice" → <MultiChoice />    (checklist, multi select)
//   "scalar"          → <Scalar />         (slider or stepper)
// Unknown types: log a warning, render nothing (no crash).

// Price calculation (one pure function, no exceptions):
//   total = basePriceUSD (or EUR)                    always charged, flat
//         + single_choice   → selected OptionItem's priceUSD/EUR
//         + multiple_choice → each checked OptionItem's priceUSD/EUR
//         + scalar          → quantity x pricePerUnitUSD/EUR
// USD and EUR totals calculated independently. Never convert between them at runtime.

// Example options_schema (Level Boost service — basePriceUSD: 45, basePriceEUR: 40):
// [
//   {
//     "type": "single_choice", "label": "Level up boost", "required": true,
//     "options": [
//       { "label": "1–20",  "priceUSD": 5,  "priceEUR": 4  },
//       { "label": "21–40", "priceUSD": 10, "priceEUR": 15 },
//       { "label": "41–60", "priceUSD": 18, "priceEUR": 22 },
//       { "label": "61–80", "priceUSD": 25, "priceEUR": 30 }
//     ]
//   },
//   {
//     "type": "multiple_choice", "label": "Add-ons", "required": false,
//     "options": [
//       { "label": "Loot bag",         "priceUSD": 5, "priceEUR": 4 },
//       { "label": "Express delivery", "priceUSD": 8, "priceEUR": 7 }
//     ]
//   },
//   {
//     "type": "scalar", "label": "Number of runs", "required": true,
//     "min": 1, "max": 10, "pricePerUnitUSD": 5, "pricePerUnitEUR": 4
//   }
// ]
// Example total — "21–40" + "Loot bag" + 2 runs, USD:
//   45(base) + 10(level) + 5(lootbag) + 10(2x5 runs) = $70 USD

// ─────────────────────────────────────────────────────────────────────────────
// CART & CART ITEM
//
// Each CartItem becomes exactly one Order on checkout.
// Same service added twice = two separate CartItems = two Orders.
// Account-specific details communicated via support chat after purchase.
// ─────────────────────────────────────────────────────────────────────────────

Cart {
  id: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

CartItem {
  id: string
  cartId: string
  serviceId: string
  selectedOptions: Record<string, any>  // user's selections (label → value)
  optionsSchemaSnapshot: JSONB          // snapshot of SELECTED values at add-to-cart time
                                        // prevents drift if admin edits service later
  priceUSD: number                      // calculated total at add-to-cart time (base + options)
  priceEUR: number
  addedAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER
//
// Orders only exist post-payment. No pending_payment state.
// No escrow — refunds handled directly via payment gateway API.
// See §11 for full state machine and transitions.
// ─────────────────────────────────────────────────────────────────────────────

Order {
  id: string
  cartItemId: string
  serviceId: string
  userId: string
  selectedOptions: Record<string, any>
  optionsSchemaSnapshot: JSONB          // from CartItem — preserved for history
  total: number                         // taxes and fees included in base price
  currency: "USD" | "EUR"
  region: "USA" | "EUROPE"

  // Payment provider — stored at checkout, used to route refunds automatically
  paymentProvider: "stripe" | "nowpayments"
  stripePaymentIntentId: string | null  // set when provider = "stripe"
  nowpaymentsPaymentId: string | null   // set when provider = "nowpayments"
  cryptoRefundAddress: string | null    // collected at refund request time (crypto only)

  status:
    | "pending"            // payment cleared, awaiting admin acknowledgment
    | "in_progress"        // admin acknowledged, service actively underway
    | "delivered"          // admin marked delivered, customer notified, 7-day refund window starts
    | "completed"          // terminal — customer confirmed, or admin closed, or refund denied
    | "refund_requested"   // customer opened refund — one attempt per order, within 7 days of deliveredAt
    | "refunded"           // terminal — admin approved and issued via payment gateway

  // Refund rules:
  //   - Only available if no previous refund attempt on this order
  //   - Request window: within 7 days of deliveredAt
  //   - Once refund_requested, status can only move to refunded (approved) or completed (denied)
  //   - completed (denied) is terminal — no further refund attempts allowed

  deliveredAt: Date | null
  refundRequestedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN USER
//
// One role only: ADMIN. Admin = booster. No partial-access roles.
// Separate Supabase Auth instance from storefront customers.
// ─────────────────────────────────────────────────────────────────────────────

AdminUser {
  id: string
  displayName: string
  email: string
  role: "ADMIN"
  avatar: string
  lastLogin: Date
  createdAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT CHAT
// ─────────────────────────────────────────────────────────────────────────────

SupportTicket {
  id: string
  orderId?: string    // set for order-specific threads
  userId: string
  subject: string
  status: "open" | "in_progress" | "resolved" | "refund_requested"
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

Message {
  id: string
  ticketId: string
  senderId: string
  senderRole: "admin" | "customer"
  content: string
  attachments?: Attachment[]
  sentAt: Date
}

Attachment {
  filename: string
  sizeBytes: number
  url: string
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

AuditLog {
  id: string
  timestamp: Date
  userId: string | "SYSTEM_NODE"
  userLabel: string
  action: string
  ipAddress: string
  status: "SUCCESS" | "CRITICAL" | "BLOCKED"
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT (CMS)
//
// ONE record per block type — shared across dark and light mode.
// Theme changes CSS/layout only, not the underlying data.
// Never create separate content entries per theme.
// ─────────────────────────────────────────────────────────────────────────────

ContentBlock {
  id: string
  name: string
  type:
    | "hero"              // label + headline + subtext + CTA + background image
    | "stats_bar"         // 4 trust stats
    | "benefits_section"  // Why Choose Us — media + 3 benefits
    | "steps_section"     // How It Works — 4 steps
  status: "ACTIVE" | "SCHEDULED" | "DRAFT"
  data: JSONB
  thumbnail?: string
  scheduledAt?: Date
  modifiedAt: Date
  createdBy: string
}

PromoBanner {
  id: string
  name: string
  image: string           // Media Library URL
  region: "USA" | "EUROPE" | "BOTH"
  link?: string
  status: "ACTIVE" | "SCHEDULED" | "DRAFT"
  scheduledAt?: Date
  modifiedAt: Date
  createdBy: string
}

MediaAsset {
  id: string
  filename: string
  url: string             // Cloudflare CDN URL (origin: Supabase Storage)
  type: "image" | "video"
  sizeBytes: number
  usedIn: string[]        // IDs of ContentBlocks or PromoBanners referencing this asset
  uploadedAt: Date
  uploadedBy: string
}

SystemSettings {
  maintenanceMode: boolean
  adminDisplayName: string
  adminEmail: string
  adminAvatar: string
}

// Hot Offers: no content model — auto-populated by querying Service WHERE isHotOffer = true.
// TrustPilot: TrustBox widget embed — no server API calls, no DB storage needed.
```

---

## 7. Feature Progress Tracker

`STATUS: done | in-progress | not-started | blocked`

### Storefront

| Feature | Status | Notes |
|---|---|---|
| Landing Page UI | not-started | Design ref: Moon_Strike_Landing_Page.png |
| Games Page UI | not-started | Design ref: Moon_Strike_Game.png |
| Services Page UI | not-started | Design ref: Moon_Strike_Services.png |
| Service Detail UI | not-started | Design ref: Moon_Strike_Service_Detail.png |
| Checkout Page UI | not-started | Design ref: Moon_Strike_-_Secure_Checkout.png |
| Refund Policy UI | not-started | Design ref: Moon_Strike_-_Refund_Policy.png |
| Terms of Service UI | not-started | Design ref: Moon_Strike_-_Terms_of_Service.png |
| Privacy Policy UI | not-started | Same layout as ToS and Refund Policy. Content written during build. |
| Quick Select Mega Menu | not-started | Design ref: quick_select.png |
| Global Navbar | not-started | Shared component |
| Global Footer | not-started | Shared component |
| Global Chat Bubble | not-started | Fixed bottom-right, Supabase Realtime |
| Customer Login | not-started | Email/password + Google OAuth via Supabase Auth |
| Customer Register | not-started | Email/password + Google OAuth via Supabase Auth |
| Customer Profile | not-started | Order History + Transaction History tabs |
| Order History | not-started | Filter tabs, status badges, View Detail |
| Order Detail | not-started | Options breakdown, timeline, refund request + wallet prompt |
| Cart | not-started | Same service = new CartItem; account details via chat |
| Search | not-started | Service titles only — image + title card, zero-state message |
| Currency toggle | not-started | Fixed USD/EUR — no conversion, toggle persists |
| Region toggle | not-started | USA/EUROPE — persists across navigation |
| Light mode theme | not-started | CSS variable swap on `<html data-theme="light">` |
| Theme toggle | not-started | Persisted in user preference |
| TrustPilot integration | not-started | Read-only API |
| Notifications | not-started | In-app bell + email for customers. See §13 |
| Mobile / responsive layouts | not-started | Built alongside desktop pages |

### Admin Terminal

| Feature | Status | Notes |
|---|---|---|
| Admin Login | not-started | Design ref: Admin_Dashboard_-_Login.png |
| Admin Dashboard Overview | not-started | Design ref: Admin_Dashboard_-_Overview.png |
| Admin Users | not-started | Design ref: Admin_Dashboard_-_Users.png |
| Admin Games | not-started | Design ref: Admin_Games_List.png |
| Admin Services List | not-started | Design ref: Admin_Services_List.png |
| Admin Service CMS | not-started | Design ref: Admin_Services_List_CMS.png — JSON options_schema |
| Admin Service Preview | not-started | /admin/services/[id]/preview — draft storefront render |
| Admin Order Management | not-started | Filter tabs, date sort, status update actions |
| Admin Order Detail | not-started | Status update, refund panel, chat link |
| Admin Transactions | not-started | Design ref: Admin_Transactions_List.png |
| Admin Content Library | not-started | 3 tabs: Landing Page Sections, Promo Banners, Media Library |
| Landing Page CMS blocks | not-started | Hero, Stats Bar, Benefits, Steps |
| Promotional Banners CMS | not-started | Schedulable — Services page banner + seasonal |
| Media Library CMS | not-started | Upload, CDN serve, usage tracking, delete guard |
| Hot Offers auto-population | not-started | Query Service WHERE isHotOffer = true |
| Admin Messages / Chat | not-started | [Support] + [Order #id] threads, anon session merge |
| Admin Audit Logs | not-started | Design ref: Admin_Dashboard_-_Audit_Logs.png |
| Admin Settings | not-started | Design ref: Admin_Settings_Page.png |
| Admin Auth Guard | not-started | All /admin/* routes require admin session + 2FA |
| Admin Sidebar | not-started | Shared across all admin pages |
| Admin Top Bar | not-started | Shared across all admin pages |
| System Pulse indicator | not-started | Live status in admin footer |
| Maintenance Mode toggle | not-started | Disables public storefront |
| CSV export | not-started | Dashboard + Logs + Transactions |

### System

| Feature | Status | Notes |
|---|---|---|
| Order state machine | not-started | See §11 — no escrow, direct gateway refund |
| Stripe integration | not-started | Checkout + auto-routed refund API |
| NowPayments integration | not-started | Checkout + auto-routed refund + wallet address collection |
| NowPayments webhook verification | not-started | HMAC-SHA512 middleware. `NOWPAYMENTS_IPN_SECRET` setup pending. See §13 |
| Refund router | not-started | Reads paymentProvider, routes to Stripe or NowPayments automatically |
| Rate limiting | not-started | See §12 — depends on framework |
| Audit log (every admin action) | not-started | Backend middleware |
| Google Sheets integration | not-started | Orders + Transactions tabs. See §13 |
| Real-time chat | not-started | Supabase Realtime WebSocket |
| 2FA enforcement | not-started | Required for all admin logins |

---

## 8. Stack & Decisions

### Tech Stack

| Item | Decision |
|---|---|
| Frontend | Next.js |
| CSS | Tailwind CSS |
| Backend | Supabase |
| Database | Supabase PostgreSQL — dynamic fields as JSONB |
| Auth | Supabase Auth — storefront customers and admin as separate instances |
| Image hosting | Supabase Storage (origin, free tier) + Cloudflare Images (CDN + transforms) |
| Payment | Stripe (card + PayPal + Google Pay + Apple Pay) + NowPayments (crypto) |
| SMTP | Resend — see §13 for setup details. Required for auth emails (confirm, reset password) and order notification emails. |
| Currency | Fixed USD/EUR values — no conversion API. Toggle persists globally. Cart follows the last selected currency and includes a currency toggle button inside the cart panel. At checkout, the currency active at that moment determines which price (USD or EUR) is charged. |

### Third-Party APIs

| Service | Notes |
|---|---|
| Stripe | Card, PayPal, Google Pay, Apple Pay — all via Stripe. Single integration. |
| NowPayments | Crypto payments + refund API. Requires customer wallet address for refunds. |
| TrustPilot | TrustBox widget embed (script tag). Loads reviews client-side from TrustPilot's CDN — no server-side API calls, no rate limits, no caching needed. Reviews display on Landing and Services pages. |
| Google Sheets | Orders tab + Transactions tab. See §13 for schema and trigger rules. |

### Feature Decisions

| Feature | Decision |
|---|---|
| Auth | Email/password + Google OAuth via Supabase Auth. Both free under 50K MAU. |
| Booster role | No separate booster role — Admin = booster. One admin role only. |
| Order state machine | No escrow — direct refund via payment gateway. See §11. |
| Search | Service titles only. Image + title card view. On-submit, not real-time. No games in results. |
| Cart | Same service can be added multiple times as separate CartItems. |
| Reviews | TrustPilot read-only API. No DB storage. |
| Crypto refund wallet | Customer wallet address collected at refund request time (required by NowPayments). |
| Service fees | Taxes and fees included in base price. No separate fee at checkout. |
| Order cancellation | No cancelled state — customers request refunds instead. Admin approves or denies. |
| Hot Offers | Random selection from services where `isHotOffer = true`. Landing page shows ~4 cards initially, loads more on scroll. Services page HOT OFFERS tab shows all, paginated. No CMS entry needed. |
| Light mode hero | Prototype/palette reference only. Single Hero component — CSS token swap only. |
| Rate limiting | Documented in §12. Implementation depends on framework. |

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
    page.tsx            Landing
    games/
    services/
    services/[game]/[slug]/
    checkout/
    login/
    register/
    profile/
    profile/orders/[id]/
    refund-policy/
    terms-of-service/
    admin/              All admin routes (see §10.14)
  hooks/                useCart, useCurrency, useRegion
  store/                Global state (currency, region, cart)
  lib/                  API clients, utils, webhook verification
  types/                TypeScript interfaces (mirrors §6 models)
  styles/               Global CSS vars, theme tokens
```

---

## 10. Admin Terminal

The Admin Terminal is a **separate application** from the storefront with its own login, layout, routing, and access control. Never accessible from the public storefront.

**Single role: ADMIN** — full access to all sections. Admin = booster. No partial-access roles.

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
|  MoonStrike / Admin Terminal   [Search]  [Bell][?]  Admin  LOGOUT |
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
|  ───────────   |                                                  |
|  Manage Server |                                                  |
+----------------+--------------------------------------------------+
|  Moon Strike 2024  |  Support  |  Privacy  |  API Docs  |  STABLE |
+------------------------------------------------------------------+
```

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

**Rules:** 2FA enforced for all accounts. Failed logins logged to Audit Logs. Session timeout after inactivity (configurable in Settings).

---

### 10.3 Admin Dashboard (`/admin/dashboard`)

**KPI Cards:** TOTAL REVENUE · ACTIVE USERS · COMPLETED BOOSTS · PENDING DISPUTES

**Main content (2-column):** Traffic vs Performance chart (left) · Top Selling Services list (right).

**Recent Activity table:** TRANSACTION ID · CUSTOMER · SERVICE · DATE · AMOUNT · STATUS.

---

### 10.4 Admin Users (`/admin/users`)

**Table:** NAME · EMAIL · ROLE · STATUS · LAST LOGIN · ACTIONS

Only `ADMIN` role in admin terminal. Storefront customers are a separate Supabase Auth instance — not listed here.

**Row actions:** Edit · Activity history · Ban/Suspend

**Stat cards:** TOTAL USERS · ACTIVE ORDERS · PENDING REFUNDS · BANNED/FLAGGED

---

### 10.5 Admin Games (`/admin/games`)

> Do not confuse these three separate fields on three separate models:
> - **Game Name** = the game title (World of Warcraft, Dota 2)
> - **Game Genre/Type** = gameplay category (ACTION RPG, MOBA, FPS, MMORPG)
> - **Service Category** = type of boost (Dungeon, Leveling, Raid)

**Table:** GAME NAME · GENRE/TYPE · PLATFORM · STATUS · ACTIONS

Genre/Type values: `ACTION RPG · MOBA · FPS · MMORPG · TACTICAL SHOOTER · BATTLE ROYALE · LOOTER SHOOTER · SPORTS ACTION`

Platform values: `PC · Console · Cross-play`

> Games table has no price column. Prices live on Services only.

---

### 10.6 Admin Services List (`/admin/services`)

**Table:** SERVICE NAME · GAME · SERVICE CATEGORY · BASE PRICE (cyan) · STATUS · ACTIONS

**Two-axis filters:** Status tabs (All / Active / Draft) · Filter Game dropdown · Filter Category dropdown.

Service Category values: `Dungeon · Leveling · Raid · Stories · Powerleveling · Rank Boost · Item Farm · Coaching · Placement Matches`

---

### 10.7 Admin Service CMS (`/admin/services/new`, `/admin/services/[id]/edit`)

**Left column:**

1. **Basic Info:** Service Name · Game (dropdown) · Service Category (dropdown) · Hot Offer checkbox (true = appears in HOT OFFERS tab)

2. **Custom Service Options (JSONB):** Dynamic field builder. Each field: label input · type dropdown (Single Choice / Multiple Choice / Scalar) · required toggle · type-specific price inputs. Saved as `options_schema` JSONB in Supabase.
   - Single / Multiple Choice: option rows with label + `$USD` + `€EUR` per option
   - Scalar: min · max · `$pricePerUnitUSD` · `€pricePerUnitEUR`

3. **Service Details:** Rich text editor (B / I / List / Link) for description.

**Right column:** BASE PRICE (basePriceUSD + basePriceEUR — always charged flat, options stack on top) · Thumbnail upload (drag + drop, recommended 1200x1080px) · Pro Tip card.

---

### 10.7b Admin Service Preview (`/admin/services/[id]/preview`)

Full-page storefront render using draft data. Read-only — no checkout.

- Amber banner: `PREVIEW MODE — This service is not yet published`
- Buttons: Back to Editor · Deploy Now
- Renders identical components as the public Service Detail page (§3.4)
- What admins see = what customers see

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

**Filter tabs:** All · Pending · In Progress · Delivered · Completed · Refund Requested · Refunded

**Default sort:** Newest first by `createdAt`.

**Table:** ORDER ID · CUSTOMER · SERVICE · OPTIONS SUMMARY · DATE · AMOUNT · STATUS · ACTIONS

**Order Detail — left column:** Service + customer info · full options breakdown with prices · price breakdown · order timeline with timestamps per state.

**Order Detail — right column (Actions panel):**
- Current status badge (large)
- Status update buttons — context-aware, only valid next states shown:
  - `pending` → Mark as In Progress
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

**Tab 2 — Promotional Banners:** Banner title · image (from Media Library) · region (USA / EUROPE / Both) · optional CTA link · status (Active / Scheduled / Draft) · schedule date.

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

**Anonymous session merge:** Anonymous users get a temporary `session_id`. On login, `user_id` and `username` are attached to existing records — chat history preserved, and the customer's display name updates to their actual username going forward. Pre-login messages retain the anonymous label. Session expiry: anonymous = 1 hour, logged-in = 1 week. Expired sessions and records deleted.

---

### 10.12 Admin Audit Logs (`/admin/logs`)

**Table:** TIMESTAMP · USER · ACTION · IP ADDRESS · STATUS

**Status types:** `SUCCESS` (green) · `CRITICAL` (red filled) · `BLOCKED` (amber)

**Example events:** Admin Console Login (SUCCESS) · Database Connection Timeout (CRITICAL) · Modified User Permissions (SUCCESS) · Unauthorized API Request (BLOCKED)

**Bottom stat cards:** UPTIME PERFORMANCE · BLOCKED THREATS · ACTIVE ANOMALIES

---

### 10.13 Admin Settings (`/admin/settings`)

**Profile card:** Avatar upload · Admin Display Name · Email · Change Security Password link.

**Application card:** Maintenance Mode toggle (disables public storefront when on).

**Actions:** Save All Changes (purple) · Discard (outlined).

---

### 10.14 Route Map

```
# Storefront
/                               Landing Page
/games                          Games Page
/services                       Services Page
/services/[game]/[slug]         Service Detail
/checkout                       Checkout
/login                          Customer Login
/register                       Customer Register
/profile                        Customer Profile
/profile/orders/[id]            Order Detail
/privacy-policy                 Privacy Policy
/terms-of-service               Terms of Service

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

**Route guard:** All `/admin/*` routes require authenticated admin session with 2FA verified. Session timeout redirects to `/admin/login`.

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
         |  admin acknowledges order
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
customer confirms               customer requests refund
(or 7-day window passes)        (within 7 days, one attempt only)
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

### Transition Rules

| From | To | Trigger | Actor |
|---|---|---|---|
| — | `pending` | Payment gateway webhook confirms charge | System |
| `pending` | `in_progress` | Admin acknowledges order | Admin |
| `in_progress` | `delivered` | Admin marks as delivered | Admin |
| `delivered` | `completed` | Customer confirms, or 7-day window passes with no dispute | Customer / System |
| `delivered` | `refund_requested` | Customer requests refund (within 7 days of `deliveredAt`) | Customer |
| `refund_requested` | `refunded` | Admin approves and issues via gateway | Admin |
| `refund_requested` | `completed` | Admin denies refund — terminal, no further attempts | Admin |

**Rules:**
- `completed` and `refunded` are terminal — no further transitions
- Orders only exist post-payment — no pre-payment state
- Refund requests only allowed within **7 days of `deliveredAt`**
- **One refund attempt per order** — once attempted (approved or denied), no further requests allowed
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
| `POST /admin/login` | 5 / 15 min / IP | — | 10 / 15 min / IP | Brute force |
| `GET /api/search` | 15 / 1 min / IP | 40 / 1 min / user | unlimited | Scraping |
| `GET /api/games` | 20 / 1 min / IP | 60 / 1 min / user | unlimited | Scraping |
| `GET /api/services` | 20 / 1 min / IP | 60 / 1 min / user | unlimited | Scraping |
| `POST /api/checkout` | blocked | 5 / 1 min / user | unlimited | Auth required |
| `POST /api/orders` | blocked | 3 / 1 min / user | unlimited | Duplicate prevention |
| `POST /api/refunds` | blocked | 2 / 1 hour / user | unlimited | Abuse prevention |
| Payment webhooks | signature check only | — | — | Replay attack prevention |

**Rules:**
- Violations return HTTP 429 + Audit Log entry with status `BLOCKED`
- Payment webhook endpoints use signature verification — IP-based limiting does not apply
- Limits above are starting estimates — tune after launch with real traffic data

**Implementation:** TBD — options: Supabase API gateway limits, Upstash Redis, or framework middleware.

---

## 13. Implementation Notes

### Notifications

**Customer (in-app bell + email):**

| Trigger | Message |
|---|---|
| `confirmed → delivered` | "Your boost is complete!" |
| `refund_requested → refunded` | "Your refund has been approved and is being processed." |
| `refund_requested → completed` (denied) | "Your refund request has been denied." |

**Admin (in-app bell only):**

| Trigger | Message |
|---|---|
| New order confirmed | "New order received — [service name]" |
| Order hits `refund_requested` | "Refund requested — [order ID]" |

**In-App Bell:** Unread counter badge on bell icon. Clicking opens notification feed. Marked as read on open/click. Present in both storefront navbar and admin top bar.

---

### Resend (SMTP)

Resend is a developer-focused email API. It handles transactional emails — no newsletter features, no drag-and-drop builder. Just reliable email delivery via API or SDK.

**What it sends for Moon Strike:**
- Auth emails: email confirmation on register, password reset link (both triggered by Supabase Auth automatically when configured)
- Order notification emails: boost complete, refund approved, refund denied (triggered by your backend on state transitions)

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
| Order confirmed | Append new row to Orders tab + Transactions tab |
| Order status changes | Update existing Orders row by `order_id` |
| Refund resolved | Update `refund_status` + `refunded_at` on Transactions row |

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

  return hmac === signature;
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
- Log failed verifications to Audit Logs — repeated failures may signal an attack
- Always return 200 after verification passes, even on business logic errors — NowPayments retries on non-200, which risks duplicate order creation

---

### Image Hosting

- **Origin:** Supabase Storage (free tier, 1 GB included)
- **CDN:** Cloudflare Images — caches at edge globally after first pull from Supabase
- **Estimated cost:** $0–$5/month at early-to-mid traffic

---

### Auth — Google OAuth

Both auth methods active. Both free under Supabase's 50K MAU free tier.

```ts
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signInWithOAuth({ provider: 'google' })
```

---

*Last updated: see git history — update §7 Feature Progress Tracker when any feature status changes.*
*Design references: all screenshots stored in `/design-refs/`.*
