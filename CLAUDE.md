# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Moon Strike is a game boosting marketplace (Next.js + Supabase). Customers purchase boosting services for games; admin/pro players deliver them. Dark, premium, gamer-focused design.

Comprehensive system reference: `MOONSTRIKE_AGENTS.md` — read this before touching any code. It contains data models, page specs, routing rules, auth flows, order state machine, API routes, and implementation notes.

---

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # TypeScript type check (tsc --noEmit)

# Seed scripts
npm run admin:seed       # Seed single admin account
npm run admin:reseed     # Replace/reseed admin account
npm run catalog:seed     # Seed 20 games with 20 services each + genres/categories
```

---

## Architecture

### Stack
- **Frontend**: Next.js (App Router)
- **CSS**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Image CDN**: Cloudflare Images (origin: Supabase Storage)

### Auth
- **Customers**: Supabase Auth (email/password + Google OAuth)
- **Admin**: Manual scrypt password hash + signed JWT HttpOnly cookie. Single seeded admin only.

### Key Conventions

| Type | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `service-detail.tsx` |
| Components | `PascalCase` | `ServiceCard.tsx` |
| Functions/hooks | `camelCase` | `useCartTotal` |
| CSS variables | `--ms-*` prefix | `--ms-accent` |

### Route Conventions
- Service detail: `/[game-slug]/[category-slug]/[service-slug]`
- Admin service edit: `/admin/services/[game-slug]/[service-slug]/edit`
- Admin routes use server-side JWT verification via `proxy.ts`

### Design System (Dark Mode Default)
- Primary gradient: `linear-gradient(to right, #8B5CF6, #22D3EE)` — purple-to-cyan for CTAs, logo, active states
- Prices and key numbers: cyan/electric blue
- Background: `--ms-primary` (#050816)
- Cards: `--ms-secondary` (#0F172A)
- Fonts: Montserrat (headings/body), JetBrains Mono (code/IDs)

Light mode is a **CSS variable swap only** — toggle `<html data-theme="light">`. Same components, same content.

---

## Important Rules

- **No hardcoded game/service data** — all from Supabase API/DB
- **Currency**: Single global state (USD/EUR). Prices are fixed values per service — no runtime conversion
- **Anonymous cart**: Server-side API routes only. Supabase client never used directly for anonymous reads/writes
- **Service options** stored as `optionsSchema` JSONB — price calculation runs client-side (no API call on option change)
- **Admin = booster**. No partial-access roles. One role only.

---

## File Structure Highlights

```
src/
 app/
   page.tsx                    Landing page
   [game-slug]/
     [category-slug]/
       [service-slug]/         Service detail pages
   admin/                      Admin terminal (separate login/layout/routing)
   cart/, checkout/, login/    Customer-facing pages
 components/
   common/                     Navbar (site-header.tsx), Footer, ThemeToggle
   configurator/               Dropdown, Radio, CheckboxGroup, RangeSlider, etc.
 lib/                          API clients, utils, webhook verification
 hooks/                        useCart, useCurrency
 types/                        TypeScript interfaces
```

---

## Environment Variables

Required (see `MOONSTRIKE_AGENTS.md` §15 for full list):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`
- `RESEND_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`
- `NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH`

Never commit `.env` files. Use hosting platform env vars for production.