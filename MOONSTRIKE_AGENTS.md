# MOONSTRIKE — Spec Changes

> Append these changes to the relevant sections of `MOONSTRIKE_AGENTS.md`.
> Each section below identifies exactly which part of the SRD it replaces or extends.

---

## Change 1 — Game Services Page: URL Restructure + Category URL Segments

### What changes

| Before | After |
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
| Service Category Tabs | Scrollable pill tabs. See tab behaviour below. |
| Service Cards Grid | 2-row × 4-column initial load. Infinite scroll. Each card: HOT badge · image · title · description · price · Buy Now |
| TrustPilot Reviews | Same carousel component as landing page |
| Footer | Global |

**Category Tabs — full list and URL behaviour:**

`ALL` is always the first tab and always hardcoded. Selecting it navigates to `/[game-slug]` (no category segment).

`HOT OFFERS` is always the second tab and always hardcoded. Selecting it navigates to `/[game-slug]/hot-offers`. It filters by `isHotOffer = true`. Never query `serviceCategory = "HOT OFFERS"` — that row will never exist in the DB.

All remaining tabs are auto-populated from `ServiceCategory` records where `gameId = this game`, ordered by `sortOrder ASC`. Selecting one navigates to `/[game-slug]/[service-category.slug]`.

Tab → URL → filter mapping:

| Tab | URL | Filter logic |
|---|---|---|
| ALL | `/[game-slug]` | No filter — all active services for this game |
| HOT OFFERS | `/[game-slug]/hot-offers` | `isHotOffer = true` |
| `[Category Name]` | `/[game-slug]/[category-slug]` | `serviceCategoryId = category.id` |

**Routing rules:**

On page load, read `[service-category-slug]` from the URL:
- No segment → render ALL tab as active, no category filter
- `hot-offers` → render HOT OFFERS tab as active, filter `isHotOffer = true`
- Any other value → look up `ServiceCategory` where `slug = [service-category-slug]` AND `gameId = this game`. If found → render that tab as active, filter by `serviceCategoryId`. If not found → call `notFound()`.

If no Game record matches `[game-slug]` → call `notFound()`.

**Featured Game Banner — query logic (unchanged):**
1. Fetch active `PromoBanner` where `gameId = this game` and `region` includes the active region.
2. If none found, fall back to a banner where `gameId IS NULL` and region matches.
3. If still none found, hide the section entirely.

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
| id | string | UUID |
| gameId | string | FK → Game. Each category belongs to exactly one game. |
| name | string | Display name shown in tabs and admin UI. e.g. `"Dungeon"`, `"Raid"`, `"Powerleveling"` |
| slug | string | URL-safe version of name. e.g. `"dungeon"`, `"rank-boost"`. Must be unique per game (unique constraint on `gameId + slug`). Auto-generated from name; admin can override. |
| sortOrder | number | Controls tab display order. Lower = further left. Admin can drag-reorder. |
| createdAt | Date | |

**Slug generation rule:** lowercase, spaces → hyphens, strip non-alphanumeric except hyphens. `"Rank Boost"` → `"rank-boost"`. `"Mythic+"` → `"mythic"`.

**Reserved slugs (per game) — never usable as a ServiceCategory slug:**
- `hot-offers` (reserved for the HOT OFFERS tab)

**Canonical seed categories (apply to games during initial setup — not hardcoded globally):**
`Dungeon · Leveling · Raid · Stories · Powerleveling · Rank Boost · Item Farm · Coaching · Placement Matches`

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

Service Category dropdown is now populated from `ServiceCategory` records filtered by the selected game (or all categories across all games if no game filter is active). No hardcoded values.

**Add: "New Service Category" button**

Position: top-right of the Services list page, next to "New Service".

Clicking opens a modal: **Add Service Category**

| Field | Notes |
|---|---|
| Game | Dropdown — required. Which game this category belongs to. |
| Category Name | Text input — required. e.g. `"Dungeon"`, `"Rank Boost"`. |
| Slug | Auto-generated from name; admin can override. Validated: unique per game, no reserved slugs (`hot-offers`). |
| Sort Order | Number input. Controls tab position. Defaults to last (max existing `sortOrder + 1`). |

Actions: **Save Category** (purple) · **Cancel**.

On save: `POST /api/v1/admin/service-categories` → inserts into `service_categories`. Toast: "Category created." Tab list on the matching game's storefront page updates immediately.

**Edit / Delete category:** Each `ServiceCategory` row in the filter dropdown has inline Edit (pencil) and Delete (trash) icons.

- **Edit:** Opens the same modal pre-filled. `PATCH /api/v1/admin/service-categories/[id]`. Changing the `name` auto-updates the slug unless admin has manually edited it.
- **Delete:** Confirmation dialog: "Delete [name]? Services assigned to this category will have their category cleared." On confirm: `DELETE /api/v1/admin/service-categories/[id]`. Sets `service_category_id = null` on all affected services (via `ON DELETE SET NULL`). Those services appear uncategorised in the admin table and are filtered out of storefront tabs (but remain accessible on their detail pages).

**Slug conflict guard:** If a slug already exists for that game, show inline error: "A category with this slug already exists for [Game Name]."

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
