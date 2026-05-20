# MOONSTRIKE — AI Agent Context Document
> Read this file first before touching any code. It is the single source of truth for the project.

---

## 1. Project Overview

**App Name:** Moon Strike  
**Tagline:** "Dominate the Game."  
**Type:** Game Boosting Marketplace (Web Platform)  
**Business Model:** Customers purchase boosting services (leveling, raid carries, ranked placement, dungeon runs, item farming, etc.) for specific games. Pro players / boosters deliver the service.  
**Tone:** Dark, premium, gamer-focused. Think esports meets e-commerce.

---

## 2. Design System

### Color Palette

#### Dark Mode (active — implement this)
| Token | Hex | Usage |
|---|---|---|
| `--ms-primary` | `#050816` | Page background |
| `--ms-secondary` | `#0F172A` | Card / surface background |
| `--ms-accent` | `#172554` | Borders, hover states, subtle highlights |
| `--ms-gradient-start` | `#8B5CF6` | Gradient from (purple) — CTAs, logo, active states |
| `--ms-gradient-end` | `#22D3EE` | Gradient to (cyan) — prices, highlights, logo end |
| `--ms-text-primary` | `#F1F5F9` | Headings, labels, primary content |
| `--ms-text-secondary` | `#94A3B8` | Body text, descriptions, placeholders |

**Gradient:** `linear-gradient(to right, #8B5CF6, #22D3EE)` — logo, primary CTAs, active nav, price highlights.

#### Light Mode (confirmed — implement when toggled)
| Token | Hex | Usage |
|---|---|---|
| `--ms-lm-bg-page` | `#F3F6FF` | Page background |
| `--ms-lm-bg-card` | `#FFFFFF` | Card / surface background |
| `--ms-lm-bg-navbar` | `#FFFFFD` | Navbar background |
| `--ms-lm-navy-dark` | `#0E2D4A` | Darkest navy — primary headings, logo text |
| `--ms-lm-navy-mid` | `#10385C` | Medium navy — section headings, strong text |
| `--ms-lm-slate` | `#22374C` | Dark slate — body text, secondary labels |
| `--ms-lm-teal` | `#117680` | Teal — badges, tags, secondary accents (replaces cyan from dark mode) |
| `--ms-lm-yellow-pale` | `#F4DE92` | Pale yellow — hover states, subtle highlights |
| `--ms-lm-yellow-mid` | `#F4D159` | Medium yellow — secondary CTA backgrounds |
| `--ms-lm-yellow-primary` | `#F3C623` | Golden yellow — PRIMARY accent (replaces purple gradient in dark mode) |
| `--ms-lm-purple` | `#794BB8` | Purple — decorative elements, step indicators (darker shade of dark mode gradient-start) |

> ⚠️ These are extracted from the provided design — verify exact values against source design files before finalizing.

**Key differences from dark mode:**
- Primary CTA color changes from purple→cyan gradient to **golden yellow `#F3C623`**
- "Buy Now" buttons, active tabs, highlighted text all use yellow instead of purple
- Background is light blue-white instead of deep navy
- Text hierarchy inverts: dark navy on light background
- Teal `#117680` replaces cyan as the secondary accent
- Purple `#794BB8` is demoted to decorative/illustrative use only (step shapes, etc.)
- Logo in light mode: golden yellow (`#F3C623`) instead of purple→cyan gradient

### Theme
- **Modes:** Dark (default) + Light (toggle available — tokens confirmed above)
- **Dark cards:** `--ms-secondary` background, `--ms-accent` border, rounded corners
- **Light cards:** `--ms-lm-bg-card` (`#FFFFFF`) background, light border
- **Danger / Badge:** `#EF4444` range — HOT badges, error states, ban/blocked UI (both modes)
- **Mode toggle:** Currency selector area in navbar (visible in light mode screenshot as `€ Euro ⇄` pill)

### Typography
- Logo / Display: Bold, gradient `--ms-gradient-start` → `--ms-gradient-end`
- Headings: `--ms-text-primary`, bold
- Body: `--ms-text-secondary`, regular weight
- Badges / Tags: Uppercase, small, colored pill shapes

### Components (Reusable)
- `<Navbar>` — Logo | Hamburger | Search bar | Currency selector (USD/EUR + flag) | Services (active tab) | About | Profiles
- `<GameCard>` — Image thumbnail | Genre tags | Game name | Short description
- `<ServiceCard>` — Image | HOT badge (conditional) | Title | Description | Price | "Buy Now" button
  - Dark mode: purple→cyan gradient button
  - Light mode: golden yellow `#F3C623` button with dark text
- `<CategoryTabs>` — Scrollable horizontal pill tabs with arrow nav
  - Dark mode active tab: purple fill | Light mode active tab: yellow `#F3C623` fill
- `<Footer>` — Logo | Sitemap | Legal | Genres | Social Media columns + disclaimer text
- `<StarRating>` — 5-star display with username and comment (TrustPilot style)
- `<RegionSelector>` — USA / EUROPE toggle pills
- `<Badge>` — HOT, NEW UPDATE, COMING SOON, FEATURED — colored small corner/inline labels on cards
- `<ThemeToggle>` — switches between dark and light mode; persisted in user preference
- `<SearchResults>` — service cards only (image + title). No games. Triggered on submit, not real-time. Zero state: "No services found for [query]" message.

---

## 3. Pages & Components

---

### 3.1 Landing Page (`/`)

**Purpose:** Main entry point. Converts visitors into buyers via offers, social proof, and trust signals.

**Sections (top to bottom):**

1. **Navbar** (global component)

2. **Hero / Promo Banner**

   **Dark mode:**
   - Label: `LIMITED TIME OFFER`
   - Headline: `Level Up Your Game with Seasonal Discounts`
   - Subtext: "Join the elite. Get up to 30% off all premium boosting bundles this weekend."
   - CTA Button: `Get your discount` (purple→cyan gradient)

   **Light mode (different layout):**
   - Left: Featured game card with image, `NEW UPDATE` teal badge, game title, description, `Learn More` CTA (dark navy)
   - Right: Upcoming services sidebar — 3 stacked rows each with thumbnail, status tag (`FEATURED` / `COMING SOON`), service name
   - Hero is a carousel (left/right arrow navigation)
   - No seasonal discount banner — replaced with featured game spotlight

3. **Game Filter + Grid**
   - Category tab strip: `ALL GAMES | ACTION RPG | TACTICAL SHOOTING | LOOTER SHOOTING` (scrollable, with left/right arrows)
   - Grid: 4-column responsive game cards
   - Each card: thumbnail image, genre tags (e.g., "Action RPG", "Cross-play"), game title, short description
   - `Load More Games` button (outlined, centered)

4. **Best Offers Section**
   - Section header: `Best Offers` + `VIEW ALL DEALS →` link (right-aligned)
   - Horizontal cards (4 visible): thumbnail, title, short desc, price, `Buy Now` button
   - Example offers: Mythic+ 15 Run ($24.99), Flawless Trials ($39.99), Ranked Placement ($19.00), Leveling 1-70 ($45.00)

5. **Trust Stats Bar**
   - 4 stats in a row: `50K+ GAMES BOOSTED` | `99.9% SUCCESS RATE` | `24/7 ACTIVE SUPPORT` | `TOP 1% PRO PLAYERS`

6. **Why Choose Us**
   - Section header: `Why Choose Us ?` (with colored "Choose Us")
   - Full-width media block (image or video embed placeholder)
   - 3 benefit items below with icon + label + description

7. **How It Works — "Up & Running in 4 Simple Steps"**
   - Section header with colored `4`
   - Sub-label: `(Desktop)`
   - 4 numbered steps with description, laid out in a 2x2 or diagonal visual:
     1. Choose Your Service
     2. We Log Into Your Account
     3. Receive Daily Progress Updates
     4. Enjoy The Result
   - Decorative purple shape element beside the steps

8. **TrustPilot Reviews**
   - Section header: `Rating TrustPilot` (with colored "TrustPilot")
   - Carousel of review cards: avatar/name | 5 stars | comment text
   - Left/right arrow navigation

9. **Payment Methods Strip**
   - Logos: PayPal | Mastercard | Apple Pay | Google Pay | Stripe

10. **Footer** (global component)
    - Left: Moon Strike logo (gradient)
    - Columns: Sitemap | Legal | Genres | Social Media
    - Disclaimer text (copyright / non-affiliation notice)
    - Bottom: `© 2024 Moon Strike. Dominate the Game.`

---

### 3.2 Services Page (`/services`)

**Purpose:** Browse all boosting services for a selected game. Filterable by service category.

**Sections:**

1. **Navbar** (global)

2. **Page Header**
   - Title: `All Services`
   - Search input: `Search games, services...` (right-aligned)

3. **Featured Game Banner**
   - Wide card with game art background
   - Left: Game title (large, white)
   - Right: `USA | EUROPE` region toggle
   - Link below toggle: region-specific sub-text/link

4. **Service Category Tabs**
   - Pills: `HOT OFFERS 🔥 | DUNGEONS | POWERLEVELING | RAID | STORIES` (scrollable with arrows)

5. **Service Cards Grid** (2-row × 4-column = 8 cards visible)
   - Each card: `HOT` badge (top-left) | image | title | description | price | `Buy Now` button

6. **TrustPilot Reviews**
   - Header: `Services in TrustPilot`
   - Carousel of review cards (same as landing page component)

7. **Footer** (global)

---

### 3.3 Games Page (`/games`)

**Purpose:** Browse all supported games with genre filtering.

**Layout:** Two-column (sidebar + main content)

**Sidebar (left):**
- Section label: `TOP TITLES`
- List of top game links: All Games, World of Warcraft, Destiny 2, Valorant, League of Legends
- Section label: `GENRES`
- Genre tag pills: Action RPG | MMO | Shooters | MOBA (multi-select filter)

**Main Content (right):**
- Page header: `All games`
- Search input: `Search games, services...`
- Game cards grid: 3-column
  - Each card: image thumbnail | genre + platform tags | game name (large) | short description
  - Games shown: Diablo IV, World of Warcraft, Destiny 2, Valorant, League of Legends, Rocket League
- `Load More Games` button (outlined, centered)

**Footer** (global)

---

### 3.4 Service Detail Page (`/services/[game]/[service-slug]`)

**Purpose:** Full detail view of a specific boosting service. Converts with configurator sidebar.

**Layout:** Two-column (detail left, configurator right)

**Left Column:**

1. **Breadcrumb:** `WORLD OF WARCRAFT` (colored, uppercase label)
2. **Title:** e.g., "Mythic+ Dungeons Boost"
3. **Description paragraph**
4. **Quick badges:** `⏱ Starts in < 15 mins` | `✅ 100% Completion`
5. **Service Image** (wide, rounded card)
6. **"What You Get" section** — 2×2 grid of benefit cards:
   - Icon | Benefit title | Description
   - Examples: Great Vault Reward, End of Dungeon Loot, Mythic+ Score, Flightstones & Crests
7. **Requirements section** — checklist:
   - Level 70 Character
   - Active WoW Subscription
   - No specific item level required for self-play
8. **"Why Choose Us" section** (same as landing page section)

**Right Column — "Configure Your Run" Sticky Sidebar:**

1. **KEY LEVEL** selector: `+10 | +15 (active) | +20` (pill toggle group)
2. **NUMBER OF RUNS** stepper: `− | 1 | +`
3. **Add-on checkboxes:**
   - `VIP Traders (More Loot)` — `+$15.00`
   - `Express Delivery` — `+20%`
4. **"more settings"** expandable section
5. **"Required items/skills unlock"** section
6. **Currency selector:** `$USD ⇄`
7. **Total Price:** e.g., `$45.00`
8. **`Buy Now` button** (full-width, purple gradient)

**Footer** (global)

---

### 3.5 Customer Login & Register Page (`/login` and `/register`)

**Purpose:** Authenticate existing customers or create new accounts. Two methods: Email/password and Google OAuth.

**Layout:** Centered card on full dark/light background (no navbar, no footer — isolated auth flow)

**Login Card:**
- Logo: `Moon Strike` + tagline
- Tab toggle: `Login` | `Register` (switches form below)
- Field: `Email Address`
- Field: `Password` — masked, eye toggle
- Link: `Forgot Password?` (right-aligned, cyan/yellow depending on mode)
- Divider: `or continue with`
- Button: `Continue with Google` (Google icon + text, outlined)
- CTA: `Login` (full-width, primary color)
- Bottom: `Don't have an account?` → `Register` link

**Register Card (same layout, different fields):**
- Field: `Username`
- Field: `Email Address`
- Field: `Password`
- Field: `Confirm Password`
- Divider: `or continue with`
- Button: `Continue with Google` (Google icon, outlined)
- CTA: `Create Account` (full-width, primary color)
- Bottom: `Already have an account?` → `Login` link

**Implementation:**
- Email/password: Supabase Auth `signUp` / `signInWithPassword`
- Google OAuth: Supabase Auth `signInWithOAuth({ provider: 'google' })` — built-in, no extra API
- On success: redirect to previous page or `/profile`
- Auth state persisted via Supabase session (JWT + refresh token)

---

### 3.6 Customer Profile Page (`/profile`)

**Purpose:** Customer's personal hub — view orders, transactions, and account settings.

**Layout:** Left sidebar (profile info) + main content area (tabbed)

**Left Sidebar:**
- Avatar (from Google OAuth or default)
- Username
- Email
- Member since date
- Quick stats: Total Orders | Total Spent (USD or EUR based on preference)
- `Edit Profile` link
- `Logout` button

**Main Content — Tab Navigation:**
`ORDER HISTORY` | `TRANSACTION HISTORY`

---

**Tab 1 — Order History:**
- Default tab
- Filter tabs: `All` | `In Progress` | `Delivered` | `Completed` | `Refund Requested` | `Refunded`
- Sort: newest first (default)
- Each order row (card style):
  - Service thumbnail + name
  - Selected options summary (e.g. "Level 21–40 · Express delivery")
  - Order date
  - Amount (USD or EUR)
  - Status badge
  - `View Details` button

**Order Detail (modal or sub-page `/profile/orders/[id]`):**
- Service name + thumbnail
- Full selected options breakdown with prices
- Price breakdown: base + options + service fee + total
- Order timeline: placed → confirmed → delivered → completed
- Current status badge
- `Open Support Chat` button → opens chat bubble focused on this order reference
- `Request Refund` button — always visible, any non-terminal status
  - On click: confirmation dialog "Are you sure? Admin will review your request."
  - Sets `order.status` → `refund_requested`, sets `refundRequestedAt`
  - If `paymentProvider = "nowpayments"`: shows wallet address input field before confirming

---

**Tab 2 — Transaction History:**
- List of all payments made
- Each row: TXN ID | Service name | Date | Amount | Method (Card/PayPal/Crypto) | Status
- Read-only — no actions

---

### 3.7 Global Chat Bubble (all storefront pages)

**Purpose:** Customer ↔ Admin support chat. Always accessible regardless of current page. Single general support thread per customer.

**Behavior:**
- Fixed position: bottom-right corner of every storefront page
- Collapsed state: circular button with chat icon + unread message count badge (red dot)
- Expanded state: chat panel slides up (320px wide, 480px tall)
- Does NOT navigate away from current page — overlay only

**Chat Panel (expanded):**
- Header: `Support` | `Moon Strike` sub-label | minimize button (×)
- Same thread as Admin Messages page — customer sees their full history
- Message bubbles: customer (right, primary color) | admin (left, dark surface)
- File attachment support (same as admin messages)
- Composer: text input + 📎 attach + Send button
- Typing indicator when admin is responding

**Implementation notes:**
- Same data source as Admin Messages — `SupportTicket` + `Message` models
- Real-time updates via Supabase Realtime (WebSocket subscription on the ticket's messages)
- Unread count: messages where `senderRole = "admin"` and not yet seen by customer
- Chat bubble renders on all `/` storefront routes — excluded from `/admin/*` and `/login`, `/register`

---

### 3.8 Secure Checkout Page (`/checkout`)

**Purpose:** Complete a purchase. Supports multiple payment methods.

**Layout:** Two-column (payment form left, order summary right)

**Left — Payment Form:**
1. **Header:** `Secure Checkout` | subtitle: "Complete your transaction to dominate the game."
2. **Payment Method selector** — 3 tab cards with icon + label:
   - `CREDIT CARD` (selected/active — purple border) → handled by **Stripe**
   - `PAYPAL` → handled by **Stripe** (Stripe supports PayPal as a payment method)
   - `CRYPTO` → handled by **NowPayments**
3. **Card Details form** (shown when Credit Card active):
   - Name on Card (text input)
   - Card Number (formatted: 0000 0000 0000 0000, card icon right)
   - Expiry Date (MM/YY) | CVC (123 with info icon)

**Right — Order Summary:**
1. **Card header:** `Order Summary`
2. **Item row:** thumbnail | service name | price (e.g., WoW Mythic+ 15 Run — $45.00) | `⚡ Immediate Start` badge
3. **Price breakdown:**
   - Subtotal: $45.00
   - Service Fee: $2.50
   - Taxes: $0.00
   - **Total: $47.50** (large, cyan)
4. **`🔒 Complete Purchase` button** (full-width, purple gradient)
5. **Security note:** `256-BIT SSL ENCRYPTED`
6. **Legal note:** "By completing your purchase, you agree to our Terms of Service and Privacy Policy."

---

### 3.9 Refund Policy Page (`/refund-policy`)

**Purpose:** Explain the refund and escrow process. Builds buyer trust.

**Sections:**
- **Page header:** `Refund Policy` | Effective Date: October 24, 2024
- **1. Overview** — Escrow-based system explanation
- **2. The Escrow Process** — Funds locked on order, 48-hour buyer review window, auto-release if no action
- **3. Eligibility for Refunds:**
  - Non-Delivery of Service (full refund from Escrow)
  - Service Not as Described (full or partial refund)
  - Mutual Cancellation (automatic full refund)
- **4. Dispute Resolution** — 48-hour dispute window, moderation team review
- **Note callout:** Once Escrow releases (manual or auto after 48h), refund no longer guaranteed
- **CTA card:** "Have questions about a specific transaction?" → `Contact Support` link

---

### 3.10 Terms of Service Page (`/terms-of-service`)

**Purpose:** Legal agreement between Moon Strike and users.

**Layout:** TOC sidebar (left) + content (right) OR single column on mobile

**TOC Items:**
1. Acceptance of Terms
2. User Conduct
3. Service Delivery
4. Limitation of Liability
5. Termination

**Key Sections:**
- **1. Acceptance of Terms** — Binding agreement on use of platform
- **2. Service Delivery** — Delivery within estimated timeframes; external delays exempt; Delivery Guarantee callout
- **3. Limitation of Liability** — No indirect/incidental/consequential damages; inherent risks of third-party account access

---

### 3.11 Quick Select — Game & Service Mega Menu (Global Component)

**Trigger:** Clicking the hamburger menu or "Services" nav item
**Purpose:** Fast navigation to any game's service category without going through full pages

**Layout:** Floating overlay / dropdown panel

**Structure:**
1. **Search bar** at top: `Search Game or Service` with search button
2. **Category tabs:** `ALL GAMES | ACTION RPG | TACTICAL SHOOTING | LOOTER SHOOTING` (same as landing page)
3. **Service grid** — 4-column layout:
   - Each column = one service category (e.g., Service 1, Service 2...)
   - Under each category: 3–5 clickable sub-service links
   - Categories can span across columns if many sub-items (e.g., Service 6 in column 3)

---

## 4. User Flows

```
Landing Page
  ├── Click game card → Games Page → click game → Services Page
  ├── Click offer card → Service Detail Page → Configure → Buy Now → Checkout
  ├── Navbar > Services → Quick Select mega menu → sub-service → Service Detail
  └── Footer > Legal → Refund Policy / Terms of Service

Services Page
  └── Click service card → Service Detail → Configure → Checkout

Games Page
  └── Click game → Services Page (filtered to that game)

Checkout
  └── Cancel & Return → back to Service Detail
```

---

## 5. Global Rules for Agents

### DO
- Keep dark theme consistent across ALL pages — no light mode unless explicitly asked
- Use purple→cyan gradient for all primary CTAs and logo
- Use cyan/electric blue for prices and key numbers
- Keep the navbar fixed/sticky at top
- Use the same `<Footer>` on every page
- Make all cards hoverable (subtle lift + border glow effect)
- All prices in USD by default; currency toggle must be persistent (global state)
- Region (USA/EUROPE) is a global filter — persist across navigation

### DO NOT
- Do not use white or light backgrounds anywhere
- Do not use generic fonts (Inter, Roboto, Arial) — use a gaming/premium aesthetic font
- Do not hardcode game data — assume all games, services, and prices come from API/DB
- Do not put real payment logic in frontend — integrate payment gateway (to be specified)
- Do not use placeholder lorem ipsum in final builds — use realistic dummy data

### Naming Conventions
- Files: `kebab-case` (e.g., `service-detail.tsx`)
- Components: `PascalCase` (e.g., `ServiceCard.tsx`)
- Functions / hooks: `camelCase` (e.g., `useCartTotal`)
- CSS variables: `--ms-*` prefix (e.g., `--ms-accent-purple`)
- API routes: `/api/v1/[resource]`

---

## 6. Data Models (Inferred from UI)

```ts
Game {
  id: string
  name: string          // "World of Warcraft", "Dota 2", "Black Desert Online"
  slug: string          // "world-of-warcraft"
  image: string         // thumbnail URL
  genre: string         // "MMORPG" | "MOBA" | "FPS" | "ACTION RPG" | "TACTICAL SHOOTER" | "BATTLE ROYALE"
  platforms: string[]   // ["PC"] | ["PC", "Console"] | ["Cross-play"]
  description: string
  isTopTitle: boolean
  status: "active" | "draft" | "archived"
  // NOTE: Games do NOT have prices. Prices are on Services.
}

Service {
  id: string
  gameId: string          // FK → Game (the game group this service belongs to)
  title: string           // "Mythic+ Dungeons Boost"
  slug: string
  image: string
  description: string
  serviceCategory: string // "Dungeon" | "Leveling" | "Raid" | "Stories" | "Coaching" | "Rank Boost" | "Item Farm"
  // NOTE: serviceCategory ≠ game genre. "Dungeon" is what the booster does; "MMORPG" is the game type.
  status: "active" | "draft" | "archived"
  isHotOffer: boolean     // when true → service appears in HOT OFFERS category on Services page

  // Base price — flat fee ALWAYS charged regardless of option selections
  // Admin sets both currencies manually. No conversion — independent values.
  basePriceUSD: number    // e.g. 45.00
  basePriceEUR: number    // e.g. 40.00

  region: string[]        // ["USA", "EUROPE"]
  badges: string[]        // ["Starts in < 15 mins", "100% Completion"]
  requirements: string[]
  whatYouGet: Benefit[]

  // JSONB fields (Supabase PostgreSQL):
  // options_schema stores the configurator fields (see ServiceOption below)
  // Each OptionItem and scalar field carries both USD and EUR prices
  options_schema: JSONB
}

// ── Pricing model ─────────────────────────────────────────────────────────────
// Total USD = basePriceUSD + sum of all selected option pricesUSD
// Total EUR = basePriceEUR + sum of all selected option pricesEUR
// Each currency is calculated independently — no conversion between them.
// Display currency is determined by customer's selected currency in storefront.
// Charge currency matches display currency (Stripe supports both; NowPayments converts to crypto).
//
// Example:
//   basePriceUSD: 45   basePriceEUR: 40
//   + Level 21-40:     +10 USD  +15 EUR
//   + Express:         + 8 USD  + 7 EUR
//   ─────────────────────────────────────
//   Total:              63 USD   62 EUR

// ── Fixed Option Type System (extensible but controlled) ─────────────────────
// Types are predefined — admins pick from a dropdown, never free-type a string.
// Current types: single_choice, multiple_choice, scalar (+ more added over time).
// Adding a NEW TYPE requires: define schema + build component + add to CMS dropdown = 1 code deploy.
// Adding a NEW SERVICE using existing types = admin fills form, zero code deploy.

ServiceOption {
  label: string       // displayed field label, e.g. "Level up boost", "Number of runs"
  required: boolean
  type:
    | "single_choice"   // pick exactly one option — total = selected option's price
    | "multiple_choice" // pick one or more — total += each selected option's price
    | "scalar"          // numeric quantity — total += quantity × pricePerUnit
    // future types added here as the platform grows — each requires a dev implementation
  options?: OptionItem[]    // used by single_choice and multiple_choice
  min?: number                  // used by scalar
  max?: number                  // used by scalar
  pricePerUnitUSD?: number      // used by scalar — e.g. 3 runs × $5 USD = $15 USD
  pricePerUnitEUR?: number      // used by scalar — e.g. 3 runs × €4 EUR = €12 EUR
}

OptionItem {
  label: string       // displayed label, e.g. "1–20", "21–40", "Loot bag", "Express"
  priceUSD: number    // e.g. 10.00
  priceEUR: number    // e.g. 15.00 — set manually by admin, independent of USD
}

// ── Price calculation rule (one pure function, no exceptions) ─────────────────
// total = basePriceUSD (or EUR) — always charged, flat, non-optional
//       + single_choice   → + priceUSD/EUR of the one selected OptionItem
//       + multiple_choice → + priceUSD/EUR of each checked OptionItem
//       + scalar          → + (quantity × pricePerUnitUSD/EUR)
// Calculate USD total and EUR total independently using their respective price fields.
// Never convert between currencies at runtime — use the stored value directly.

// ── Storefront renderer mapping (one component per type) ─────────────────────
// "single_choice"   → <SingleChoice />   — pill/card grid, single select, shows price per option
// "multiple_choice" → <MultiChoice />    — checklist, multi select, shows price per option
// "scalar"          → <Scalar />         — slider or stepper, shows quantity × unit price
// (future types)    → new component added alongside the type definition
//
// Renderer uses a lookup table — adding a new type = add one entry to the map.
// Unknown types log a warning and render nothing (no crash).
// Configurator iterates options_schema[], maps type → component, tracks state,
// runs calcTotal(currency) on every change — passing "USD" or "EUR" based on
// customer's active currency selection. Displays running total in selected currency.

// ── Example JSONB stored in Supabase ─────────────────────────────────────────
// Service row: basePriceUSD: 45, basePriceEUR: 40, isHotOffer: true
// options_schema for a "Level Boost" service:
// [
//   {
//     "type": "single_choice",
//     "label": "Level up boost",
//     "required": true,
//     "options": [
//       { "label": "1–20",  "priceUSD": 5,  "priceEUR": 4  },
//       { "label": "21–40", "priceUSD": 10, "priceEUR": 15 },
//       { "label": "41–60", "priceUSD": 18, "priceEUR": 22 },
//       { "label": "61–80", "priceUSD": 25, "priceEUR": 30 }
//     ]
//   },
//   {
//     "type": "multiple_choice",
//     "label": "Add-ons",
//     "required": false,
//     "options": [
//       { "label": "Loot bag",         "priceUSD": 5, "priceEUR": 4 },
//       { "label": "Express delivery", "priceUSD": 8, "priceEUR": 7 }
//     ]
//   },
//   {
//     "type": "scalar",
//     "label": "Number of runs",
//     "required": true,
//     "min": 1,
//     "max": 10,
//     "pricePerUnitUSD": 5,
//     "pricePerUnitEUR": 4
//   }
// ]
//
// Example total for customer selecting "21-40", "Loot bag", 2 runs, viewing in USD:
//   basePriceUSD(45) + level(10) + lootbag(5) + runs(2×5=10) = $70 USD
// Same order in EUR:
//   basePriceEUR(40) + level(15) + lootbag(4) + runs(2×4=8)  = €67 EUR

Benefit {
  icon: string
  title: string
  description: string
}

AddOn {
  id: string
  label: string
  priceType: "flat" | "percent"
  priceValue: number    // 15.00 or 20 (percent)
}

ServiceOption {
  label: string         // "KEY LEVEL"
  type: "toggle" | "stepper"
  values: string[]      // ["+10", "+15", "+20"]
}

Cart {
  id: string
  userId: string          // FK → Supabase Auth user
  createdAt: Date
  updatedAt: Date
  // Cart has many CartItems. Each CartItem = one future Order.
  // Same service can appear as multiple CartItems (e.g. same boost for two different accounts).
  // Account-specific details are NOT stored — communicated via support chat after purchase.
}

CartItem {
  id: string
  cartId: string          // FK → Cart
  serviceId: string       // FK → Service
  selectedOptions: Record<string, any>   // user's current selections (label → value)
  optionsSchemaSnapshot: JSONB           // full snapshot of options_schema at add-to-cart time
                                         // prevents price/option drift if admin edits service later
  priceUSD: number        // calculated total in USD at add-to-cart time (base + options)
  priceEUR: number        // calculated total in EUR at add-to-cart time
  addedAt: Date
  // NOTE: Each CartItem becomes exactly one Order on checkout.
  // Two identical CartItems = two separate Orders = two separate chat threads.
  // No quantity field — add the service again to get another item.
}

Order {
  id: string
  cartItemId: string      // FK → CartItem (preserves what was purchased)
  serviceId: string
  userId: string
  selectedOptions: Record<string, any>  // resolved from options_schema at purchase time
  subtotal: number
  serviceFee: number
  taxes: number
  total: number
  currency: string

  // Payment provider fields — stored at checkout, used for refunds
  paymentProvider: "stripe" | "nowpayments"
  stripePaymentIntentId: string | null  // set when provider = "stripe" — used for Stripe refund API
  nowpaymentsPaymentId: string | null   // set when provider = "nowpayments" — used for NowPayments refund API
  cryptoRefundAddress: string | null    // customer-provided wallet address — required for crypto refunds only
                                        // collected when customer submits a refund request for a crypto order

  // Order state machine (see §11 for full diagram and transition rules)
  // No escrow — refunds handled directly via payment gateway API
  status:
    | "pending_payment"   // order created, payment not yet confirmed
    | "confirmed"         // payment cleared, admin notified, service in progress
    | "delivered"         // admin marked as delivered, customer notified
    | "completed"         // customer confirmed or admin closed — terminal
    | "refund_requested"  // customer opened refund request
    | "refunded"          // admin approved and issued refund via gateway — terminal

  deliveredAt: Date | null         // set when admin marks delivered
  refundRequestedAt: Date | null   // set when customer taps refund request button
                                   // available on any non-terminal status — admin reviews before acting

  region: "USA" | "EUROPE"
  startType: "immediate" | "scheduled"
  createdAt: Date
  updatedAt: Date
}

// ── Reviews ───────────────────────────────────────────────────────────────────
// Reviews are NOT stored in the database.
// TrustPilot API fetches reviews directly from TrustPilot at runtime.
// Customers write reviews on TrustPilot's platform directly — not through MoonStrike.
// Post-order flow redirects customer to TrustPilot to leave a review (external link).
// No Review model, no review table, no review endpoints needed.
```

---

## 7. Feature Progress Tracker

```
STATUS KEY: ✅ Done | 🚧 In Progress | ⬜ Not Started | 🔴 Blocked
```

| Feature | Status | Notes |
|---|---|---|
| **STOREFRONT** | | |
| Landing Page UI | ⬜ | Design ref: Moon_Strike_Landing_Page.png |
| Games Page UI | ⬜ | Design ref: Moon_Strike_Game.png |
| Services Page UI | ⬜ | Design ref: Moon_Strike_Services.png |
| Service Detail UI | ⬜ | Design ref: Moon_Strike_Service_Detail.png |
| Checkout Page UI | ⬜ | Design ref: Moon_Strike_-_Secure_Checkout.png |
| Refund Policy UI | ⬜ | Design ref: Moon_Strike_-_Refund_Policy.png |
| Terms of Service UI | ⬜ | Design ref: Moon_Strike_-_Terms_of_Service.png |
| Quick Select Mega Menu | ⬜ | Design ref: quick_select.png |
| Global Navbar | ⬜ | Shared component |
| Global Footer | ⬜ | Shared component |
| Game data API | ⬜ | Stack TBD |
| Service data API | ⬜ | Stack TBD |
| Order/Cart system | ⬜ | Stack TBD |
| Payment integration | ⬜ | Gateway TBD |
| Auth / Profiles | ⬜ | Stack TBD |
| Currency toggle (global) | ⬜ | |
| Region toggle (global) | ⬜ | |
| TrustPilot integration | ⬜ | API TBD |
| Search (global) | ⬜ | Service titles only — image + title card view, no games, zero-state message |
| Cart | ⬜ | CartItem model defined — same service = new CartItem, account details via chat |
| Customer Login page | ⬜ | Email/password + Google OAuth via Supabase Auth |
| Customer Register page | ⬜ | Email/password + Google OAuth via Supabase Auth |
| Customer Profile page | ⬜ | Order History + Transaction History tabs |
| Order History (profile) | ⬜ | Filter tabs, status badges, View Detail |
| Order Detail (profile) | ⬜ | Options breakdown, timeline, refund request button |
| Refund request button | ⬜ | Any non-terminal status, admin reviews before acting |
| Global Chat Bubble | ⬜ | Fixed bottom-right, all storefront pages, Supabase Realtime |
| Notifications | ⚠️ | ⚠️ TBD — provider and triggers pending |
| Currency display (USD/EUR) | ⬜ | Fixed values, no conversion — toggle in navbar |
| Privacy Policy page | ⚠️ | ⚠️ TBD — content pending |
| Mobile / responsive layouts | ⚠️ | ⚠️ TBD — all designs currently desktop only |
| Light mode theme | ⬜ | Tokens confirmed — implement as CSS variable swap on `<html data-theme="light">` |
| Theme toggle (dark/light) | ⬜ | Persisted in user preference / localStorage |

---

## 8. Decisions & Open Questions

> Legend: ✅ Confirmed | ⚠️ TBD — do not implement until specified | ❓ Needs explanation / design decision

---

### Stack
| Item | Status | Decision |
|---|---|---|
| Frontend framework | ✅ | Next.js |
| CSS approach | ✅ | Tailwind CSS |
| Backend | ✅ | Supabase |
| Database | ✅ | Supabase PostgreSQL — dynamic fields as JSONB |
| Auth provider | ✅ | Supabase Auth |
| Image hosting | ⚠️ TBD | Cloudflare Images recommended (global CDN, auto WebP/AVIF, resizing) — deciding later |
| Payment gateway | ✅ | Stripe (card + PayPal + Google Pay + Apple Pay) + NowPayments (crypto) |
| Currency | ✅ | Fixed values — admin manually sets USD and EUR prices per service/option. No conversion API. |

---

### APIs & Third Parties
| Service | Status | Notes |
|---|---|---|
| Stripe | ✅ | Card, PayPal, Google Pay, Apple Pay — all via Stripe. Single integration. |
| NowPayments | ✅ | Crypto payments + refund API (requires customer wallet address) |
| TrustPilot | ✅ | Read-only API — displays existing reviews. Customers review on TrustPilot directly. |
| Google Sheets API | ⚠️ TBD | Writes customer service data — exact trigger and fields to be defined |
| Google Pay | ✅ | Handled via Stripe — not a separate API |
| Apple Pay | ✅ | Handled via Stripe — not a separate API |
| Currency converter | ✅ | Not needed — fixed USD + EUR values set manually by admin per service |

---

### Features
| Feature | Status | Decision |
|---|---|---|
| Customer auth & profiles | ⚠️ TBD | Required before any order flow can be built |
| Order tracking page (storefront) | ⚠️ TBD | Required — design pending |
| Booster workflow | ✅ | No separate booster role. Admin acts as both administrator and booster. |
| Order state machine | ✅ | No escrow — admin = booster, refunds via payment gateway. See §11 |
| Search | ✅ | Returns a mixed card view showing both related services AND games. Single results page. |
| Cart | ✅ | Cart exists. Same service can be added more than once (e.g. buy 3× Mythic runs separately). |
| Notifications | ⚠️ TBD | Email and/or in-app — provider and trigger events not yet decided |
| Review / Rating | ✅ | TrustPilot API integration — real, not manual |
| Crypto refund wallet | ✅ | NowPayments requires customer wallet address — collected at refund request time |
| Currency conversion | ⚠️ TBD | Real-time API or static rates — provider not yet chosen |
| Privacy Policy page | ⚠️ TBD | Required (linked in footer) — content pending |
| Mobile / responsive | ⚠️ TBD | All designs currently desktop — breakpoints and mobile layouts pending |
| Rate limiting | ✅ | Documented in §12 below |
| JSON configurator renderer | ✅ | Controlled type system — see §6 data models |

---

## 9. File & Folder Conventions (Placeholder — update when stack is confirmed)

```
src/
├── components/
│   ├── common/         # Navbar, Footer, Badge, StarRating
│   ├── cards/          # GameCard, ServiceCard
│   ├── layout/         # PageWrapper, Section
│   └── checkout/       # PaymentForm, OrderSummary
├── pages/ (or app/)
│   ├── index           # Landing
│   ├── games/          # Games list
│   ├── services/       # Services list + [game]
│   ├── services/[game]/[slug]   # Service detail
│   ├── checkout/
│   ├── refund-policy/
│   └── terms-of-service/
├── hooks/              # useCart, useCurrency, useRegion
├── store/              # Global state (currency, region, cart)
├── lib/                # API clients, utils
├── types/              # TypeScript interfaces (see Section 6)
└── styles/             # Global CSS vars, theme tokens
```

---

## 10. Admin Dashboard — "Admin Terminal"

The admin panel is a **separate application** from the storefront. It is called **"Admin Terminal"** and has its own login, layout, routing, and access control. It must never be accessible from the public storefront.

---

### 10.1 Admin Design System

**Same dark theme as storefront, with these differences:**
- **Layout:** Fixed left sidebar (not top navbar) + top header bar
- **Sidebar width:** ~240px, persistent, never collapses on desktop
- **Active nav item:** Purple background pill highlight
- **Surface cards:** Slightly lighter than storefront (`#161828` range)
- **Status colors:**
  - `Active / Success` → Green dot / green badge
  - `Pending / Scheduled` → Amber / orange
  - `Draft` → Muted gray
  - `Disputed / Critical` → Red / orange-red
  - `Archived / Banned / Blocked` → Dark red / muted red
  - `Refunded` → Gray
- **Role badges:** Colored pill labels — `ADMIN` (purple), `BOOSTER` (cyan/teal), `EDITOR` (gray)
- **LOGOUT text:** Red, always visible in top-right next to admin name

**Global Admin Layout (every page):**

```
┌─────────────────────────────────────────────────────────┐
│  [Logo: MoonStrike / Admin Terminal]  [Search bar]  [🔔][?]  [Admin Alpha  LOGOUT  🖼]  │
├──────────────┬──────────────────────────────────────────┤
│  Sidebar     │  Page Content                            │
│  Dashboard   │                                          │
│  Users       │                                          │
│  Games       │                                          │
│  Services    │                                          │
│  Transactions│                                          │
│  Content     │                                          │
│  Settings    │                                          │
│  Logs        │                                          │
│  Message     │                                          │
│              │                                          │
│ [Manage      │                                          │
│  Server]     │                                          │
├──────────────┴──────────────────────────────────────────┤
│  Moon Strike © 2024 ... | Support | Privacy | API Docs | ● SYSTEM PULSE: STABLE  │
└─────────────────────────────────────────────────────────┘
```

**Global Admin Components:**
- `<AdminSidebar>` — Logo + "Admin Terminal" sub-label, nav links with icons, "Manage Server" CTA at bottom (purple gradient)
- `<AdminTopBar>` — Global command search (`Search commands, users or transactions...`) | Bell | Help | Admin name + LOGOUT + avatar
- `<AdminFooter>` — Copyright | Support | Privacy Policy | API Docs | System Pulse status (green dot + "STABLE")
- `<StatCard>` — KPI card with label, large number, trend arrow + percent, colored progress bar
- `<DataTable>` — Sortable table with pagination (`Rows per page`, page numbers)
- `<StatusBadge>` — Colored dot + text pill
- `<ActionIcons>` — ✏️ Edit | 👁 View/Hide | 🗑 Delete | ⊘ Ban (per row)

---

### 10.2 Admin Login Page (`/admin/login`)

**Purpose:** Secure entry point. Separate from storefront. Admin-only.

**Layout:** Centered card on full dark background (no sidebar, no header)

**Card contents:**
- Title: `Moon Strike` (large, white bold)
- Sub-label: `ADMIN TERMINAL` (uppercase, muted, letter-spaced)
- Field: `Email Address` — placeholder `admin@moonstrike.io`
- Field: `Password` — masked, eye toggle, `Forgot Password?` link (right-aligned, cyan)
- Checkbox: `Remember this terminal session`
- CTA: `Enter Terminal →` (full-width, purple)
- Divider line
- Help text: `Need assistance?` + `Contact System Admin` (cyan link)

**Bottom security badges (below card):**
- `🛡 2FA Protected` | `🛡 SSL Encrypted`

**Rules:**
- 2FA must be enforced for all admin accounts
- Failed login attempts must be logged in Audit Logs
- Session timeout after inactivity (configurable in Settings)

---

### 10.3 Admin Dashboard — Overview (`/admin/dashboard`)

**Purpose:** Top-level operational snapshot. First screen after login.

**Breadcrumb:** `Home > Dashboard`

**Header:** `Operational Overview` | Date range selector: `Last 30 Days` | `Export CSV` button

**KPI Cards (4-column row):**
| Card | Value | Trend |
|---|---|---|
| TOTAL REVENUE | $124.5k | ▲ 12.5% |
| ACTIVE USERS | 12,840 | ▲ 8.2% |
| COMPLETED BOOSTS | 5,420 | ▲ 24.1% |
| PENDING DISPUTES | 12 | ▼ 3% (red) |

**Main content (2-column):**

Left — `Traffic vs Performance` chart:
- Subtitle: "Correlation between ad spend and user conversion."
- Legend: Traffic (blue dot) | Sales (purple dot)
- Chart area: line/area chart (empty placeholder in design)

Right — `Top Selling Services` list:
- 4 rows: icon | service name | category | revenue amount (cyan)
- Examples: Diamond Rank Boost $42k, Legendary Skins Pack $38k, Coaching Sessions $21k, Account Protection $14k
- `View All Services` button (outlined)

**Recent Activity table (full width):**
- Columns: TRANSACTION ID | CUSTOMER (avatar + username) | SERVICE | DATE | AMOUNT | STATUS
- Status pills: `Paid` (green), `Pending` (amber), `Refunded` (gray)
- Link: `View Transaction Log →` (top right of section)

---

### 10.4 Admin Users Page (`/admin/users`)

**Purpose:** Manage all platform users — customers, boosters, editors, admins.

**Breadcrumb:** `Management > Users`
**Header:** `User Registry` | subtitle: "Manage permissions, monitor activity, and adjust user status across the network."
**Controls:** `All Roles` dropdown filter | `+ ADD NEW USER` button (purple)

**Table columns:** NAME | EMAIL | ROLE | STATUS | LAST LOGIN | ACTIONS

**Role badge types:**
- `ADMIN` — purple pill (admin terminal users only)
- `CUSTOMER` — no badge (storefront users — managed separately via Supabase Auth)

> ⚠️ The original design shows BOOSTER and EDITOR role badges — these are removed.
> Only one admin role exists. Admin terminal and storefront auth are separate systems.

**Status:** `● Active` (green) | `● Banned` (red, row text muted/strikethrough)

**Row actions:** ✏️ Edit | 🕐 Activity history | ⊘ Ban/Suspend

**Bottom stat cards — update labels to reflect single role:**
| Stat | Value | Note |
|---|---|---|
| TOTAL USERS | 1,248 | ▲ 12% from last month |
| ACTIVE ORDERS | 24 | orders currently in progress |
| PENDING REFUNDS | 18 | ⚠ Needs action |
| BANNED/FLAGGED | 7 | 🛡 Safety score: 98% |

**User roles & permissions:**
```
ADMIN    → Full access to all Admin Terminal sections (Supabase Auth — admin)
CUSTOMER → Storefront only; no admin access (Supabase Auth — storefront)
```

---

### 10.5 Admin Games List Page (`/admin/games`)

**Purpose:** Manage the game catalog — game titles, their genre/type classifications, and metadata.

> ⚠️ **IMPORTANT — Do NOT confuse these three things:**
> - **Game Name** = the actual game title (e.g., World of Warcraft, Dota 2, League of Legends)
> - **Game Genre/Type** = the gameplay category (e.g., ACTION RPG, MOBA, FPS, MMORPG, Battle Royale)
> - **Service Category** = the type of boost within a game (e.g., Dungeon, Leveling, Raid, Stories)
> These are three separate fields on three separate models. Never merge them.

**Header:** `Games list` | subtitle: "Manage the game catalog and genre classifications."
**CTA:** `+ Add New Game` (purple, top right)

**Stat cards (2-column):**
- TOTAL GAMES: 15 (▲ +12 this week)
- TOTAL GENRES: 7 (across 14 titles)

**Table columns:** GAME NAME (thumbnail + name + ID) | GENRE/TYPE | PLATFORM | STATUS | ACTIONS
- **Genre/Type values:** `ACTION RPG` | `MOBA` | `FPS` | `MMORPG` | `TACTICAL SHOOTER` | `BATTLE ROYALE` | `LOOTER SHOOTER` | `SPORTS ACTION`
- **Platform values:** `PC` | `Console` | `Cross-play`
- **Status values:** `● Active` | `● Draft` | `● Archived`
- **Row actions:** ✏️ Edit | 👁 Hide/Show | 🗑 Delete

> **Agent Note:** The original design had a BASE PRICE column on the Games table — this is incorrect and has been removed. Games do not have prices. Prices live on Services. The Games table shows genre/type instead.

**Filters:** All | Active | Draft | Filter Genre dropdown

---

### 10.6 Admin Services List Page (`/admin/services`)

**Purpose:** Full catalog management for all boosting services, organized by game and service category.

> ⚠️ **Terminology reminder:**
> - **Game Group** = which game this service belongs to (WoW, Dota 2, LoL, BDO, etc.)
> - **Service Category** = the type of boost (Dungeon, Leveling, Raid, Stories, Coaching, etc.)
> These are two different filter axes. A service has both a game AND a category.

**Header:** `Service Catalog` | subtitle: "Manage game boosting, coaching, and item services."
**CTA:** `+ Add New Service` (purple)

**Stat cards (3-column):**
| Stat | Value | Note |
|---|---|---|
| Total Services | 1,248 | ▲ +12 this week |
| Active Boosts | 482 | Across 14 titles |
| Avg Delivery Time | 3.4 hrs | 98% on-time rate |

**Filters (two-axis):**
- Status tabs: `All Services` | `Active` | `Draft`
- `Filter Game` dropdown — filter by game group (WoW, LoL, BDO, Dota 2, etc.)
- `Filter Category` dropdown — filter by service category (Dungeon, Leveling, Raid, Stories, etc.)
- Right: `Showing 1-10 of 1,248`

**Service Category values (scope for this project):**
`Dungeon` | `Leveling` | `Raid` | `Stories` | `Powerleveling` | `Rank Boost` | `Item Farm` | `Coaching` | `Placement Matches`

**Table columns:** SERVICE NAME (thumbnail + name + ID) | GAME (game group) | SERVICE CATEGORY | BASE PRICE (cyan) | STATUS | ACTIONS
- **Status values:** `● Active` | `● Draft` | `● Archived` (red)
- **Row actions:** ✏️ Edit | 👁 Hide/Show toggle | 🗑 Delete
- **Pagination:** Rows per page selector (10) | page numbers with `...` ellipsis

---

### 10.7 Admin Service CMS Page (`/admin/services/new` and `/admin/services/[id]/edit`)

**Purpose:** Create or edit a boosting service. Full form with dynamic custom options stored as JSON.

**Breadcrumb:** `MARKETPLACE / CREATE NEW SERVICE`
**Header:** `Create New Service` | subtitle: "Deploy a new professional boosting or gaming service to the Moon Strike marketplace."
**Top actions:** `Discard` (outlined) | `Deploy Service` (purple)

**Left column — Main form:**

1. **Basic Info card:**
   - SERVICE NAME — text input (placeholder: "e.g. Radiant Rank Push")
   - GAME SELECTION — dropdown (game group: WoW, LoL, BDO, Dota 2, etc.)
   - SERVICE CATEGORY — dropdown (Dungeon, Leveling, Raid, Stories, etc.)
   - HOT OFFER — checkbox (boolean)
     - When checked → `isHotOffer: true` → service appears in HOT OFFERS tab on Services page
     - When unchecked → service only appears in its own category tab

2. **Custom Service Options card (JSONB, fixed type system):**
   - Header: `Custom Service Options` + `+ ADD NEW FIELD` link
   - Dynamic field rows, each with:
     - Field label input (e.g. "Level up boost", "Number of runs", "Add-ons")
     - **Field type dropdown — predefined types (extensible, currently includes):**
       - `Single Choice` → pick one option, each option has its own price. Selecting replaces the running total with that option's price. Example: Level 1–20 = $5, Level 21–40 = $10
       - `Multiple Choice` → pick one or more options, each option has its own price, all selected prices stack additively. Example: Loot bag +$5, Express delivery +$8
       - `Scalar` → numeric quantity via slider or stepper, has a price-per-unit. Total adds quantity × pricePerUnit. Example: 3 runs × $5 = $15
       - *(more types can be added as the platform grows — each requires a dev to define the schema, build the component, and add it to this dropdown)*
     - Required toggle
     - Option rows (for Single/Multiple Choice): label input + two price inputs per row (`$ USD` and `€ EUR`), `+ Add option` button
       - Example row: `Level 21-40` | `$ 10.00` | `€ 15.00`
     - Unit price input (for Scalar): min, max, `$ pricePerUnitUSD`, `€ pricePerUnitEUR` fields
     - 🗑 Delete field button
   - Fields can be added/removed dynamically; options within each field can be added/removed
   - **Storage:** Saved as JSONB `options_schema` in Supabase PostgreSQL (see §6 data models)
   - **Rendering:** Storefront reads `options_schema[]`, maps `type` → component, runs `calcTotal()` on every user interaction

3. **Service Details card:**
   - Rich text editor (B / I / List / Link toolbar)
   - Textarea: "Describe the service, rules, and delivery expectations..."

**Right column — Sidebar:**

1. **Pricing & Tiers card:**
   - BASE PRICE — two inputs side by side:
     - `$ USD` input (e.g. 45.00) — always charged flat fee in USD
     - `€ EUR` input (e.g. 40.00) — always charged flat fee in EUR
   - Both values stored as `basePriceUSD` and `basePriceEUR` on the Service model
   - Base price is a flat fee always added to the total — option prices stack on top

2. **Thumbnail card:**
   - Drag & drop zone with upload icon
   - "DRAG & DROP OR BROWSE" text
   - Note: "Recommended: 1200x1080 | 800Pixel"

3. **Pro Tip card:**
   - Tip text: "Adding a 'Play with Pro' toggle increases conversion by 24% on average. Make sure to define clear markup for premium tiers."

---

### 10.7b Admin Service Detail Preview Page (`/admin/services/[id]/preview`)

**Purpose:** Full-page preview of how the service detail page will look on the storefront, rendered with draft/unpublished data. Allows admin to verify the layout before deploying.

**Behavior:**
- Renders the exact same layout as the public Service Detail Page (§3.4)
- Uses draft data — not live data — so unpublished changes are visible
- Read-only — no buy/checkout functionality
- Banner or ribbon at top: `⚠ PREVIEW MODE — This service is not yet published` (amber)
- Button: `← Back to Editor` | `Deploy Now` (purple)

**What is previewed:**
- Service title, description, badges (Starts in X mins, Completion %)
- Service image / thumbnail
- "What You Get" benefit cards (rendered from JSON)
- Requirements checklist
- Configure Your Run sidebar — rendered from `options_schema` JSON (interactive but non-purchasing)
- Pricing breakdown with add-ons
- "Why Choose Us" section

> ✅ **Confirmed:** Full separate route (`/admin/services/[id]/preview`), not a modal or panel. Must consume the exact same rendering components as the public storefront. What admins see = what customers see.

---

### 10.8 Admin Transactions Page (`/admin/transactions`)

**Purpose:** Financial ledger — monitor all payments and manage disputes.

**Breadcrumb:** `Management > Transactions`
**Header:** `Financial Ledger` | subtitle: "Monitor and manage all platform payments and payouts."
**CTA:** `Export Report` (outlined with download icon)

**KPI cards (4-column):**
| Card | Value | Note |
|---|---|---|
| TOTAL REVENUE | $124.5k | ▲ +12.4% this month |
| PENDING PAYOUTS | $12k | ⏱ Next cycle in 4d |
| SUCCESS RATE | 98.2% | ✅ High Efficiency |
| NEW DISPUTES | 3 | ⚠ Action required |

**Filters:**
- Text search: `Filter by ID or Customer...`
- Status dropdown: `All Status`
- Date range: `Last 30 Days` (with calendar icon)

**Table columns:** TXN ID | CUSTOMER (avatar + name + email) | SERVICE (colored link) | DATE | AMOUNT | METHOD | STATUS | ACTIONS
- **Methods (mapped from `paymentProvider`):**
  - `💳 Card` → Stripe (card)
  - `💳 PayPal` → Stripe (PayPal)
  - `₿ Crypto` → NowPayments
- **Status values:** `● SUCCESS` | `● PENDING` | `● REFUND REQUESTED` | `● REFUNDED`
- **Row action — `Issue Refund` button behaviour (context-aware, no manual routing):**

| Scenario | Button state | Behaviour on click |
|---|---|---|
| Stripe order (card/PayPal) | Active | Calls Stripe refund API with `stripePaymentIntentId` automatically |
| Crypto order — wallet address not yet provided | Disabled + tooltip: "Awaiting wallet address from customer" | Blocked — does nothing until address is stored |
| Crypto order — wallet address provided | Active | Calls NowPayments refund API with `nowpaymentsPaymentId` + `cryptoRefundAddress` automatically |

- Admin never manually selects which API to call — routing is fully automatic based on `order.paymentProvider`.
- **Pagination:** standard

---

### 10.9 Admin Order Management Page (`/admin/orders` and `/admin/orders/[id]`)

**Purpose:** Central queue for all customer orders. Admin reviews, updates status, and manages fulfillment.

**Header:** `Order Management` | subtitle: "Track, fulfill, and manage all customer service orders."
**CTA:** `Export CSV` (top right)

**Summary stat cards (4-column):**
| Card | Value | Note |
|---|---|---|
| TOTAL ORDERS | — | All time |
| IN PROGRESS | — | Needs attention |
| PENDING REFUNDS | — | ⚠ Action required |
| COMPLETED TODAY | — | |

**Filter tabs:** `All Orders` | `Confirmed` | `In Progress` | `Delivered` | `Completed` | `Refund Requested` | `Refunded`

**Default sort:** Newest first (by `createdAt`). Sortable by status, amount.

**Table columns:** ORDER ID | CUSTOMER (avatar + name) | SERVICE | OPTIONS SUMMARY | DATE | AMOUNT (USD) | STATUS | ACTIONS
- **Options summary:** compact display of selected options e.g. "Level 21–40 · Express · 2 runs"
- **Status badges:** same colors as Order state machine (§11)
- **Row actions:** 👁 View Detail

---

**Order Detail Page (`/admin/orders/[id]`):**

**Breadcrumb:** `Orders > #TRX-XXXXX`

**Left column — Order Info:**
- Service thumbnail + name + link to service
- Customer name + avatar + link to user profile
- Full selected options breakdown with per-option prices (USD + EUR)
- Price breakdown: base + options + service fee + total (both currencies)
- Order timeline visual: placed → confirmed → delivered → completed
- Timestamps for each completed state

**Right column — Actions panel:**
- Current status badge (large)
- **Status update buttons** (context-aware — only valid next states shown):
  - `confirmed` → `Mark as Delivered` button (primary)
  - `refund_requested` → `Approve Refund` (danger/red) | `Deny Refund` (outlined)
- `Open Chat` button → links to Admin Messages filtered to this customer
- **Refund panel** (shown when `refund_requested`):
  - Payment method display (Card / PayPal / Crypto)
  - If Crypto: wallet address field (pre-filled if customer provided it, editable)
  - `Issue Refund` button (auto-routes to Stripe or NowPayments API — see §11)
- Order metadata: payment provider, TXN ID, region, created/updated timestamps

---

### 10.10 Admin Content Page (`/admin/content`)

**Purpose:** CMS for all storefront content — landing page sections, banners, game catalog entries, media.

**Header:** `Content Library` | subtitle: "Manage and deploy cosmic assets across the Moon Strike ecosystem."
**CTA:** `+ Add New Content` (purple)

**Section tabs (top):**
`LANDING PAGE SECTIONS` | `GAME CATALOG` | `PROMOTIONAL BANNERS` | `MEDIA LIBRARY`
- Tab underline highlight on active
- Right of tabs: grid/list view toggle icons

**Table columns:** CONTENT ITEM (thumbnail + name + ID) | TYPE | STATUS | MODIFIED | ACTIONS

**Content types (inferred from rows):**
- `Hero Section` — full-width landing hero
- `Banner` — promotional banner strip
- `Grid` — game/service grid section
- `Text Block` — body copy / CMS text

**Status values:**
- `● ACTIVE` (green) — live on storefront
- `⏱ SCHEDULED` (amber) — will go live at date
- `✏ DRAFT` (muted) — not published

**Row actions:** ✏️ Edit | 👁 Preview | ⋮ More options (3-dot menu)

**Pagination:** `Showing 4 of 128 assets` | page numbers

---

### 10.11 Admin Messages Page (`/admin/messages`)

**Purpose:** Support inbox — admins manage all customer support conversations. Three-panel layout.

**Layout:** Left sidebar (nav) | Middle panel (conversation list) | Right panel (active chat + user profile)

**Middle Panel — Conversation List:**
- Header: `Support` + green online indicator dot
- Each thread row:
  - Username + timestamp (relative, e.g. "2m ago")
  - Thread subject/title (e.g. "Order #TRX-94821 - WoW Boost") — highlighted/linked
  - Message preview (italic, truncated)
- Thread statuses implied by subject:
  - Order support, Refund requests, General questions

**Right Panel — Active Chat:**

Top bar:
- User avatar + username + ticket ID (e.g. `Arthas_King99 #8842`)
- Membership tier badge: `GOLD TIER MEMBER` (cyan)
- ⋮ options menu

Chat messages (bubble style):
- Customer messages — left-aligned, dark bubble
- Admin reply — right-aligned, purple gradient bubble
- Timestamps below each bubble
- File attachments displayed inline (filename + size + download icon)

**Message composer (bottom):**
- Toolbar: **B** / *I* / 🔗 Link / ≡ List / 😊 Emoji
- Input: `Type a message to [username]...`
- 📎 Attachment button | `Send ▶` button (purple)

**Right Panel — User Profile sidebar:**

- Label: `USER PROFILE`
- Avatar (large)
- Username: `Arthas_King99`
- Location: `Europe / London`
- Stats: ORDERS: 24 | SPENT: $1.2k

- `RECENT ACTIVITY` section:
  - Order rows: TXN ID | service name | status badge (`PROCESSING` amber, `COMPLETED` green)

- `MANAGEMENT` section (admin actions):
  - `Issue Refund` button (outlined)
  - `Update Ticket` button (outlined)
  - `Ban User` button (red/danger)

---

### 10.12 Admin Audit Logs Page (`/admin/logs`)

**Purpose:** Real-time system audit trail — every admin action and system event logged.

**Breadcrumb:** `System > Audit Logs`
**Header:** `System Audit Trail` | subtitle: "Real-time monitoring of all administrative and system-level events."
**CTA:** `Export CSV` (top right, outlined with download icon)

**Filter bar (4 controls):**
- DATE RANGE — dropdown (`Last 24 Hours`)
- EVENT TYPE — dropdown (`All Events`)
- USER FILTER — search input (`Any user...`)
- `↺ RESET FILTERS` button

**Table columns:** TIMESTAMP | USER (avatar + username) | ACTION | IP ADDRESS | STATUS

**Status badge types:**
- `SUCCESS` — green outlined badge
- `CRITICAL` — red filled badge with icon (system/server events)
- `BLOCKED` — amber/orange outlined badge

**Example log events:**
- `Admin Console Login` — SUCCESS
- `Database Connection Timeout - Cluster A` — CRITICAL (system node, not a user)
- `Modified User Permissions: valkyrie_77` — SUCCESS
- `Unauthorized API request to /v1/payments/secret` — BLOCKED
- `Created New Service: Galaxy_Elite_Pack` — SUCCESS

**Pagination:** `Showing 1-5 of 1,248 events`

**Bottom system stats (3 cards):**
| Stat | Value |
|---|---|
| UPTIME PERFORMANCE | 99.998% |
| BLOCKED THREATS | 142 Today |
| ACTIVE ANOMALIES | 2 Pending |

---

### 10.13 Admin Settings Page (`/admin/settings`)

**Purpose:** Platform-wide configuration and admin profile settings.

**Header:** `Terminal Configuration` | subtitle: "Manage platform-wide settings and administrative preferences."

**Card 1 — Profile Settings:**
- Avatar display + `Upload New Avatar` button (purple)
- File note: "JPG, PNG or GIF. Max size of 800K"
- `Admin Display Name` text input
- `Email Address` text input
- `🔒 Change Security Password` link (cyan, with icon)

**Card 2 — Application Settings:**
- `Maintenance Mode` toggle (off by default)
- Description: "Disable public access to the store front"

**Bottom actions:**
- `Save All Changes` (purple, primary)
- `Discard` (outlined, secondary)

---

### 10.14 Admin Data Models (Additional)

```ts
AdminUser {
  id: string
  displayName: string   // "Admin Alpha"
  email: string         // "alpha@moonstrike.admin"
  role: "ADMIN"         // only one role — all admin terminal users are admins
  avatar: string
  lastLogin: Date
  createdAt: Date
  // NOTE: No BOOSTER or EDITOR roles. Admin = booster. No partial-access roles needed.
  // Supabase Auth handles admin session — separate from storefront customer auth.
}

AuditLog {
  id: string
  timestamp: Date
  userId: string | "SYSTEM_NODE"
  userLabel: string
  action: string
  ipAddress: string
  status: "SUCCESS" | "CRITICAL" | "BLOCKED"
}

SupportTicket {
  id: string                // "#8842"
  orderId?: string          // "TRX-94821"
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

ContentAsset {
  id: string                // "MSC-8829"
  name: string              // "Hero Section - Season 4"
  type: "Hero Section" | "Banner" | "Grid" | "Text Block"
  status: "ACTIVE" | "SCHEDULED" | "DRAFT"
  thumbnail?: string
  scheduledAt?: Date
  modifiedAt: Date
  createdBy: string
}

SystemSettings {
  maintenanceMode: boolean
  adminDisplayName: string
  adminEmail: string
  adminAvatar: string
}
```

---

### 10.15 Admin Routes

```
# Storefront routes
/                               → Landing Page
/games                          → Games Page
/services                       → Services Page
/services/[game]/[slug]         → Service Detail
/checkout                       → Checkout
/login                          → Customer Login
/register                       → Customer Register
/profile                        → Customer Profile (Order History tab default)
/profile/orders/[id]            → Order Detail
/refund-policy                  → Refund Policy
/terms-of-service               → Terms of Service

# Admin routes
/admin/login                    → Admin Login
/admin/dashboard                → Operational Overview
/admin/users                    → User Registry
/admin/users/new                → Add User
/admin/users/[id]               → Edit User
/admin/games                    → Games List
/admin/games/new                → Add Game
/admin/games/[id]/edit          → Edit Game
/admin/services                 → Service Catalog
/admin/services/new             → Create Service (CMS)
/admin/services/[id]/edit       → Edit Service (CMS)
/admin/transactions             → Financial Ledger
/admin/orders                   → Order Management
/admin/orders/[id]              → Order Detail
/admin/content                  → Content Library
/admin/content/new              → Add Content
/admin/content/[id]/edit        → Edit Content
/admin/messages                 → Support Inbox
/admin/messages/[ticketId]      → Active Conversation
/admin/logs                     → Audit Logs
/admin/settings                 → Terminal Configuration
```

**Route guard rules:**
- All `/admin/*` routes require authenticated admin session
- 2FA must be verified before accessing any admin route
- `EDITOR` role can only access `/admin/content`
- `BOOSTER` role has no admin terminal access
- Session timeout redirects to `/admin/login`

---

### 10.16 Admin Feature Progress Tracker

```
STATUS KEY: ✅ Done | 🚧 In Progress | ⬜ Not Started | 🔴 Blocked
```

| Feature | Status | Notes |
|---|---|---|
| **ADMIN** | | |
| Admin Login Page | ⬜ | Design ref: Admin_Dashboard_-_Login.png |
| Admin Order Management List | ⬜ | See §10.9 — filter tabs, sort by date |
| Admin Order Detail | ⬜ | See §10.9 — status update, refund panel, chat link |
| Admin Dashboard Overview | ⬜ | Design ref: Admin_Dashboard_-_Overview.png |
| Admin Users List | ⬜ | Design ref: Admin_Dashboard_-_Users.png |
| Admin Games List | ⬜ | Design ref: Admin_Games_List.png — GENRE/TYPE column, not price |
| Admin Services List | ⬜ | Design ref: Admin_Services_List.png |
| Admin Service CMS (Create/Edit) | ⬜ | Design ref: Admin_Services_List_CMS.png — JSON options_schema |
| Admin Service Detail Preview | ⬜ | /admin/services/[id]/preview — full storefront render in draft mode |
| Admin Transactions | ⬜ | Design ref: Admin_Transactions_List.png |
| Admin Content Library | ⬜ | Design ref: Admin_Contents_List.png |
| Admin Messages / Support Chat | ⬜ | Design ref: Admin_Messages_List.png |
| Admin Audit Logs | ⬜ | Design ref: Admin_Dashboard_-_Audit_Logs.png |
| Admin Settings | ⬜ | Design ref: Admin_Settings_Page.png |
| Admin Auth Guard (route protection) | ⬜ | All /admin/* routes |
| 2FA enforcement | ⬜ | Required for all admin logins |
| Admin sidebar component | ⬜ | Shared across all admin pages |
| Admin top bar component | ⬜ | Shared across all admin pages |
| System Pulse indicator | ⬜ | Live status in admin footer |
| Maintenance Mode toggle | ⬜ | Disables public storefront |
| CSV export (dashboard + logs + transactions) | ⬜ | |
| Real-time support chat | ⬜ | WebSocket or polling TBD |
| Audit log write (on every admin action) | ⬜ | Backend middleware |
| **SYSTEM** | | |
| Order state machine | ⬜ | See §11 — no escrow, direct refund via payment gateway |
| Rate limiting | ⬜ | See §12 — depends on framework chosen |
| TrustPilot API integration | ⬜ | Real API — not manual reviews |
| Stripe integration (card + PayPal) | ⬜ | Checkout + auto-routed refund API |
| NowPayments integration (crypto) | ⬜ | Checkout + auto-routed refund API — wallet address collected at refund request |
| Refund router (backend) | ⬜ | Reads `paymentProvider` → routes to Stripe or NowPayments automatically |
| Crypto wallet address collection | ⬜ | Storefront prompt when crypto order hits `refund_requested` status |
| Issue Refund button (context-aware) | ⬜ | Disabled + tooltip when crypto wallet address pending; active otherwise |

---

---

## 11. Order State Machine

> ✅ **Escrow system removed.** Since admin = booster and MoonStrike controls both the
> platform and service delivery, escrow is unnecessary. MoonStrike is a direct service
> business, not a third-party marketplace. Refunds are issued manually by admin directly
> through the payment gateway (Stripe/PayPal have built-in refund APIs).
> The Refund Policy page content remains the same from the customer's perspective.

### Order State Diagram

```
[Customer pays]
      │
      ▼
┌──────────────────┐
│  pending_payment │  Order created, awaiting payment confirmation
└────────┬─────────┘
         │ payment gateway webhook confirms charge
         ▼
┌──────────────────┐
│   confirmed      │  Payment cleared. Admin notified. Service begins.
└────────┬─────────┘
         │ admin marks service as delivered
         ▼
┌──────────────────┐
│   delivered      │  Customer notified. Order considered complete.
└────────┬─────────┘
         │
    ┌────┴────────────────────┐
    │                         │
customer satisfied     customer requests refund
    ▼                         ▼
┌───────────┐          ┌──────────────┐
│ completed │          │ refund_       │  Admin reviews and issues
└───────────┘          │ requested    │  refund via payment gateway
                       └──────┬───────┘
                              │
                   ┌──────────┴──────────┐
                   │                     │
             refund approved       refund denied
                   ▼                     ▼
            ┌──────────┐          ┌──────────┐
            │ refunded │          │ completed│
            └──────────┘          └──────────┘
```

### Transition Rules
| From | To | Trigger | Who |
|---|---|---|---|
| `pending_payment` | `confirmed` | Payment gateway webhook | System |
| `confirmed` | `delivered` | Admin marks as delivered | Admin |
| `delivered` | `completed` | Customer confirms or no dispute raised | Customer / Admin |
| `delivered` | `refund_requested` | Customer requests refund | Customer |
| `refund_requested` | `refunded` | Admin approves and issues via payment gateway | Admin |
| `refund_requested` | `completed` | Admin denies refund request | Admin |

### Rules
- `completed` and `refunded` are terminal states — no further transitions.
- All state transitions must be written to the Audit Log.
- `serviceFee` refundability on approved refunds — ⚠️ TBD.
- No automated cron jobs or time-based auto-transitions needed (simpler than escrow).

### Refund API Behaviour by Provider

**Stripe (card + PayPal):**
```
stripe.refunds.create({ payment_intent: order.stripePaymentIntentId })
```
- Money returns to original card or PayPal automatically.
- Customer does nothing — fully passive.
- Refund amount calculated at original purchase rate.

**NowPayments (crypto):**
```
POST /v1/refunds { payment_id: order.nowpaymentsPaymentId, address: order.cryptoRefundAddress }
```
- ⚠️ Requires customer wallet address — crypto cannot be reversed automatically.
- `cryptoRefundAddress` must be collected from customer when they submit the refund request.
- Refund amount converted at rate **at the time of refund** (not purchase time) — NowPayments handles conversion.
- The Refund Policy page must inform crypto customers of this wallet address requirement.

### Refund Flow Difference (Stripe vs Crypto)

```
STRIPE (card / PayPal)              NOWPAYMENTS (crypto)
──────────────────────              ────────────────────
Customer requests refund            Customer requests refund
        ↓                                   ↓
order.status → refund_requested     order.status → refund_requested
        ↓                                   ↓
Admin reviews in dashboard          System prompts customer:
        ↓                           "Please provide your wallet address"
Admin clicks Issue Refund                   ↓
        ↓                           Customer submits wallet address
Backend reads paymentProvider               ↓
= "stripe"                          order.cryptoRefundAddress saved
        ↓                                   ↓
Stripe API called automatically     Admin reviews in dashboard
        ↓                                   ↓
order.status → refunded             Issue Refund button becomes active
                                            ↓
                                    Admin clicks Issue Refund
                                            ↓
                                    Backend reads paymentProvider
                                    = "nowpayments"
                                            ↓
                                    NowPayments API called with
                                    paymentId + walletAddress
                                            ↓
                                    order.status → refunded
```

### Backend Routing Logic (pseudocode)
```ts
async function issueRefund(orderId: string) {
  const order = await db.orders.findById(orderId)

  if (order.paymentProvider === "stripe") {
    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId
    })
  }

  if (order.paymentProvider === "nowpayments") {
    if (!order.cryptoRefundAddress) {
      throw new Error("AWAITING_WALLET_ADDRESS")
      // → button stays disabled in admin UI
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

> Rate limiting caps how many requests one IP or user can make in a time window.
> Prevents brute force attacks, scraping, fraud, and server overload.
> **Anonymous and non-admin users get the strictest limits** — they are the highest risk.

### User Tiers

```
Anonymous (no session)   →  Strictest limits — unknown, untrusted
Authenticated customer   →  Moderate limits — known but untrusted for payments
Admin                    →  Relaxed limits — trusted, but still protected
```

### Protected Endpoints & Limits

| Endpoint | Anonymous | Customer | Admin | Reason |
|---|---|---|---|---|
| `POST /admin/login` | 5 / 15 min / IP | — | 10 / 15 min / IP | Brute force prevention |
| `GET /api/search` | 15 / 1 min / IP | 40 / 1 min / user | unlimited | Scraping prevention |
| `GET /api/games` | 20 / 1 min / IP | 60 / 1 min / user | unlimited | Scraping prevention |
| `GET /api/services` | 20 / 1 min / IP | 60 / 1 min / user | unlimited | Scraping prevention |
| `POST /api/checkout` | blocked entirely | 5 / 1 min / user | unlimited | Must be logged in to buy |
| `POST /api/orders` | blocked entirely | 3 / 1 min / user | unlimited | Duplicate order prevention |
| `POST /api/refunds` | blocked entirely | 2 / 1 hour / user | unlimited | Abuse prevention |
| Payment webhooks | signature check only | — | — | Replay attack prevention |

### Rules
- Anonymous users cannot access any `/api/orders`, `/api/checkout`, or `/api/refunds` — these require authentication.
- Rate limit violations → HTTP 429 response + entry written to Audit Logs with status `BLOCKED`.
- IP bans (repeated violations) visible in Admin Dashboard Audit Logs.
- Payment webhook endpoints validate provider signature (Stripe/PayPal) — IP-based limiting does not apply here.

### Implementation
- ⚠️ TBD — specific library depends on framework chosen.
- Options: Supabase built-in API gateway limits, Upstash Redis rate limiting, or framework middleware.
- Exact limits above are starting estimates — tune after launch with real traffic data.

---

---

## 13. Issues & Open Problems Summary

> Items here are known gaps that must be resolved before the relevant feature can be built.
> Status: 🔴 Blocks build | 🟠 Causes confusion during build | 🟡 Decide before scaling

---

### 🔴 Blocks Build

| # | Issue | Affected Area | Status |
|---|---|---|---|
| 1 | **Cart data model undefined** — `Cart` + `CartItem` models defined. Each CartItem = one Order. Same service = new CartItem. Account details via chat. | Cart, Checkout, Order | ✅ Resolved — see §6 |
| 2 | **Cart + scalar overlap** — Scalar = repeat actions within one service (e.g. dungeon runs). Duplicate CartItem = same service for a different account. Distinct use cases, no overlap. | Cart, Service Options | ✅ Resolved |
| 3 | **Search spec incomplete** — Service titles only. Card view (image + title). On-submit (not real-time). Zero state: "No services found for [query]". No games in results. | Search | ✅ Resolved |
| 4 | **No "orders to fulfill" queue** — Admin Order Management page designed. See §10.9. Filter tabs + date sort + status update actions per order. | Admin Dashboard | ✅ Resolved — see §10.9 |
| 5 | **Customer auth & profiles not designed** — Login, Register, Profile pages designed. See §3.5–3.6. Email + Google OAuth via Supabase Auth. | Auth, Storefront | ✅ Resolved — see §3.5, 3.6 |
| 6 | **Order tracking page not designed** — Tracked via Order History in Profile (§3.6). Order detail has timeline, status, refund button, and wallet address prompt for crypto. | Storefront | ✅ Resolved — see §3.6 |

---

### 🟠 Causes Confusion During Build

| # | Issue | Affected Area | Status |
|---|---|---|---|
| 7 | **`options_schema` snapshot at purchase time** — If admin edits a service's options after orders exist, historical orders display incorrectly. Decide: snapshot full schema at purchase, or just selections. | Order, Service CMS | ⚠️ TBD |
| 8 | **Service fee amount undefined** — Checkout shows `$2.50` fee but calculation never defined. Flat? Percentage? Per item or per checkout? Admin-configurable or hardcoded? | Checkout, Order | ⚠️ TBD |
| 9 | **TrustPilot API is read-only** — Reviews fetched from TrustPilot at runtime, not stored in DB. No Review model or table needed. Post-order prompt redirects customer to TrustPilot externally. | Reviews, Post-order flow | ✅ Confirmed — no DB storage |
| 10 | **Notifications undefined** — Order state machine has multiple points requiring customer notification (confirmed, delivered, crypto wallet prompt). Without this, crypto refund flow breaks silently. | Notifications, Refund flow | ⚠️ TBD |
| 11 | **Google Sheets API trigger undefined** — Confirmed integration but what data gets written, when, and by what event is not specified. | Google Sheets integration | ⚠️ TBD |

---

### 🟡 Decide Before Scaling

| # | Issue | Affected Area | Status |
|---|---|---|---|
| 12 | **Order cancellation missing** — No `cancelled` state. Can customer cancel after `confirmed` but before `delivered`? If yes, is refund automatic? | Order state machine | ⚠️ TBD |
| 13 | **Service fee per item vs. per checkout** — Multi-item cart: is fee charged once or per item? | Checkout, Cart | ⚠️ TBD |
| 14 | **Admin Messages scope** — Is it support-only or does it also handle order status updates? Two different inbox designs if combined. | Admin Messages | ⚠️ TBD |
| 15 | **NowPayments webhook verification** — Needs signature validation middleware same as Stripe. Not yet documented in implementation plan. | Backend, Security | ⬜ Not started |
| 16 | **Image hosting provider** — Cloudflare Images recommended (CDN + optimization). Decision pending. | Infrastructure | ⚠️ TBD |
| 17 | **Mobile / responsive layouts** — All designs are desktop only. Breakpoints and mobile layouts undefined. | All pages | ⚠️ TBD |
| 19 | **Light mode hero layout differs from dark mode** — Light mode hero is a featured game carousel, not a promo banner. These are two different components, not just a color swap. Both need to be built. | Landing Page | ⬜ Noted |
| 18 | **Privacy Policy page** — Linked in footer on every page. Content and design pending. | Legal | ⚠️ TBD |

---

*Last updated: [DATE] — Update PROGRESS.md when any feature status changes.*
*Design references: all screenshots stored in /design-refs/ folder.*
