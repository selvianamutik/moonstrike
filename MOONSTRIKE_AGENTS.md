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

### Theme
- **Mode:** Dark only
- **Background:** Deep navy / near-black (`#0d0f1a` range)
- **Primary Accent:** Purple → Cyan gradient (used on CTAs, highlights, logo)
- **Secondary Accent:** Cyan / Electric Blue (prices, highlights)
- **Danger / Badge:** Red-orange (HOT badges, sale labels)
- **Text:** White (headings), muted gray (body/descriptions)
- **Cards:** Slightly lighter dark surface (`#141626` range), rounded corners, subtle border

### Typography
- Logo / Display: Bold, gradient purple-to-cyan
- Headings: White, bold
- Body: Muted gray, small/regular weight
- Badges / Tags: Uppercase, small, colored pill shapes

### Components (Reusable)
- `<Navbar>` — Logo | Hamburger | Search bar | USD selector + flag | Services (active tab) | About | Profiles
- `<GameCard>` — Image thumbnail | Genre tags | Game name | Short description
- `<ServiceCard>` — Image | HOT badge (conditional) | Title | Description | Price | "Buy Now" button (purple gradient)
- `<CategoryTabs>` — Scrollable horizontal pill tabs with arrow nav
- `<Footer>` — Logo | Sitemap | Legal | Genres | Social Media columns + disclaimer text
- `<StarRating>` — 5-star display with username and comment (TrustPilot style)
- `<RegionSelector>` — USA / EUROPE toggle pills
- `<Badge>` — HOT, NEW, SALE — colored small corner labels on cards

---

## 3. Pages & Components

---

### 3.1 Landing Page (`/`)

**Purpose:** Main entry point. Converts visitors into buyers via offers, social proof, and trust signals.

**Sections (top to bottom):**

1. **Navbar** (global component)

2. **Hero / Promo Banner**
   - Label: `LIMITED TIME OFFER`
   - Headline: `Level Up Your Game with Seasonal Discounts`
   - Subtext: "Join the elite. Get up to 30% off all premium boosting bundles this weekend."
   - CTA Button: `Get your discount` (purple)

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

### 3.5 Secure Checkout Page (`/checkout`)

**Purpose:** Complete a purchase. Supports multiple payment methods.

**Layout:** Two-column (payment form left, order summary right)

**Left — Payment Form:**
1. **Header:** `Secure Checkout` | subtitle: "Complete your transaction to dominate the game."
2. **Payment Method selector** — 3 tab cards with icon + label:
   - `CREDIT CARD` (selected/active — purple border)
   - `PAYPAL`
   - `CRYPTO`
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

### 3.6 Refund Policy Page (`/refund-policy`)

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

### 3.7 Terms of Service Page (`/terms-of-service`)

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

### 3.8 Quick Select — Game & Service Mega Menu (Global Component)

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
  name: string          // "World of Warcraft"
  slug: string          // "world-of-warcraft"
  image: string         // thumbnail URL
  genres: string[]      // ["MMORPG", "PC"]
  description: string
  isTopTitle: boolean
}

Service {
  id: string
  gameId: string
  title: string         // "Mythic+ Dungeons Boost"
  slug: string
  image: string
  description: string
  category: string      // "Dungeons" | "Powerleveling" | "Raid" | "Stories"
  basePrice: number     // 45.00
  currency: string      // "USD"
  tags: string[]        // ["HOT", "NEW"]
  region: string[]      // ["USA", "EUROPE"]
  badges: string[]      // ["Starts in < 15 mins", "100% Completion"]
  requirements: string[]
  whatYouGet: Benefit[]
  addOns: AddOn[]
  options: ServiceOption[]  // key level choices, run count, etc.
}

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

Order {
  id: string
  serviceId: string
  userId: string
  addOns: string[]
  selectedOptions: Record<string, string>
  basePrice: number
  serviceFee: number
  taxes: number
  total: number
  status: "pending" | "in_progress" | "completed" | "disputed" | "refunded"
  region: "USA" | "EUROPE"
  startType: "immediate" | "scheduled"
  createdAt: Date
}

Review {
  id: string
  userId: string
  userName: string
  rating: number        // 1-5
  comment: string
  serviceId?: string
  source: "trustpilot" | "internal"
}
```

---

## 7. Feature Progress Tracker

```
STATUS KEY: ✅ Done | 🚧 In Progress | ⬜ Not Started | 🔴 Blocked
```

| Feature | Status | Notes |
|---|---|---|
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
| Search (global) | ⬜ | |

---

## 8. Open Questions (Fill Before Building)

- [ ] **Frontend framework?** (Next.js / Nuxt / Remix / plain React?)
- [ ] **CSS approach?** (Tailwind / CSS Modules / styled-components?)
- [ ] **Backend?** (Node/Express, Laravel, Supabase, Firebase?)
- [ ] **Database?** (PostgreSQL, MongoDB?)
- [ ] **Payment gateway?** (Stripe, PayPal, Crypto — which processor?)
- [ ] **Auth provider?** (NextAuth, Supabase Auth, Clerk?)
- [ ] **Image hosting?** (Cloudinary, S3, Supabase Storage?)
- [ ] **TrustPilot?** (Real API integration or manual reviews?)
- [ ] **Currency conversion?** (Real-time API or static rates?)
- [ ] **Booster/seller side?** (Is there a seller dashboard or only buyer-facing?)

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

*Last updated: [DATE] — Update PROGRESS.md when any feature status changes.*
*Design references: all screenshots stored in /design-refs/ folder.*
