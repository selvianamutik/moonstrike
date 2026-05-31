import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] ??= value
  }
}

function required(value, name) {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

loadLocalEnv()

const supabaseUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = required(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SUPABASE_SECRET_KEY'
)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const games = [
  ['world-of-warcraft', 'World of Warcraft', 'MMORPG', 'PC', 'Dungeon, raid, leveling, and rare item services for Azeroth progression.'],
  ['destiny-2', 'Destiny 2', 'LOOTER SHOOTER', 'Cross-play', 'Raid clears, pinnacle progression, exotic farming, and flawless activities.'],
  ['valorant', 'Valorant', 'TACTICAL SHOOTER', 'PC', 'Rank boost, placement support, duo queue, and competitive climb services.'],
  ['league-of-legends', 'League of Legends', 'MOBA', 'PC', 'Ranked climb support, placement matches, coaching, and seasonal progression.'],
  ['mobile-legends', 'Mobile Legends', 'MOBA', 'Mobile', 'Reliable rank progression for players who need fast queue support.'],
  ['apex-legends', 'Apex Legends', 'BATTLE ROYALE', 'Cross-play', 'Coaching, mechanics review, ranked strategy, and legend-specific guidance.'],
  ['path-of-exile', 'Path of Exile', 'ACTION RPG', 'PC', 'League start help, item farming, boss carries, and build progression.'],
  ['final-fantasy-xiv', 'Final Fantasy XIV', 'MMORPG', 'Cross-play', 'Raid progression, story clears, relic farming, and endgame unlock support.'],
  ['the-finals', 'The Finals', 'FPS', 'Cross-play', 'Competitive coaching, ranked climb support, and team strategy sessions.'],
  ['overwatch-2', 'Overwatch 2', 'FPS', 'Cross-play', 'Role coaching, competitive climb, placement support, and hero-specific improvement.'],
  ['call-of-duty-warzone', 'Call of Duty: Warzone', 'BATTLE ROYALE', 'Cross-play', 'Squad strategy, ranked support, weapon unlocks, and battle royale coaching.'],
  ['fortnite', 'Fortnite', 'BATTLE ROYALE', 'Cross-play', 'Rank progression, build mechanics coaching, quest support, and event unlocks.'],
  ['genshin-impact', 'Genshin Impact', 'ACTION RPG', 'Cross-play', 'Exploration, material farming, abyss clears, and account progression support.'],
  ['honkai-star-rail', 'Honkai: Star Rail', 'ACTION RPG', 'Cross-play', 'Trailblaze progression, relic farming, endgame clears, and build optimization.'],
  ['lost-ark', 'Lost Ark', 'MMORPG', 'PC', 'Raid carries, honing support, daily clears, and character progression services.'],
  ['elder-scrolls-online', 'The Elder Scrolls Online', 'MMORPG', 'Cross-play', 'Dungeon clears, trial progression, leveling, and item farming across Tamriel.'],
  ['rocket-league', 'Rocket League', 'SPORTS ACTION', 'Cross-play', 'Rank coaching, mechanics sessions, placement support, and tournament prep.'],
  ['dota-2', 'Dota 2', 'MOBA', 'PC', 'MMR climb, calibration matches, replay review, and role-specific coaching.'],
  ['rainbow-six-siege', 'Rainbow Six Siege', 'TACTICAL SHOOTER', 'Cross-play', 'Rank progression, operator coaching, stack strategy, and placement support.'],
  ['diablo-iv', 'Diablo IV', 'ACTION RPG', 'Cross-play', 'Seasonal leveling, dungeon clears, item farming, and build progression.'],
].map(([slug, name, genre, platform, description]) => ({
  slug,
  name,
  genre,
  platform,
  description,
}))

const serviceTemplates = [
  ['rank-boost', 'Rank Boost', 'Rank Boost', 29, true, ['Rank Boost', 'Express', 'Safe & Secure']],
  ['placement-matches', 'Placement Matches', 'Placement Matches', 25, true, ['Placements', 'Duo Option', 'Fast Start']],
  ['coaching-session', 'Coaching Session', 'Coaching', 35, false, ['Coaching', 'VOD Review', 'Mechanics']],
  ['powerleveling', 'Powerleveling', 'Powerleveling', 19, false, ['Leveling', 'Progression', 'Reliable']],
  ['raid-clear', 'Raid Clear', 'Raid', 39, true, ['Raid', 'Guided', 'Loot']],
  ['dungeon-run', 'Dungeon Run', 'Dungeon', 24, false, ['Dungeon', 'Timed', 'Completion']],
  ['story-campaign', 'Story Campaign', 'Stories', 22, false, ['Story', 'Unlocks', 'Progression']],
  ['item-farming', 'Item Farming', 'Item Farm', 45, true, ['Items', 'Farming', 'Targeted']],
  ['weekly-challenge', 'Weekly Challenge', 'Dungeon', 27, false, ['Weekly', 'Rewards', 'Reset']],
  ['season-pass-leveling', 'Season Pass Leveling', 'Leveling', 32, false, ['Seasonal', 'Levels', 'Rewards']],
  ['duo-queue', 'Duo Queue Session', 'Rank Boost', 42, true, ['Duo', 'Competitive', 'Live']],
  ['account-review', 'Account Review', 'Coaching', 18, false, ['Review', 'Build', 'Plan']],
  ['boss-carry', 'Boss Carry', 'Raid', 49, true, ['Boss', 'Carry', 'Rewards']],
  ['currency-farming', 'Currency Farming', 'Item Farm', 38, false, ['Currency', 'Farm', 'Efficient']],
  ['achievement-unlock', 'Achievement Unlock', 'Stories', 31, false, ['Achievement', 'Completion', 'Unlock']],
  ['build-optimization', 'Build Optimization', 'Coaching', 34, false, ['Build', 'Optimization', 'Meta']],
  ['event-rewards', 'Event Rewards', 'Item Farm', 44, true, ['Event', 'Rewards', 'Limited']],
  ['beginner-boost', 'Beginner Boost', 'Leveling', 16, false, ['Beginner', 'Starter', 'Guided']],
  ['endgame-prep', 'Endgame Prep', 'Powerleveling', 36, false, ['Endgame', 'Prep', 'Progression']],
  ['custom-order', 'Custom Order', 'Coaching', 50, false, ['Custom', 'Flexible', 'Support']],
].map(([slug, title, category, price, hot, tags]) => ({
  slug,
  title,
  category,
  price,
  hot,
  tags,
}))

const rankChoices = [
  { label: 'Bronze', priceUSD: 0, priceEUR: 0 },
  { label: 'Silver', priceUSD: 8, priceEUR: 8 },
  { label: 'Gold', priceUSD: 16, priceEUR: 16 },
  { label: 'Platinum', priceUSD: 28, priceEUR: 28 },
  { label: 'Diamond', priceUSD: 44, priceEUR: 44 },
]

function buildOptionsSchema(template) {
  const quantityOption = {
    label: 'Quantity',
    type: 'quantity',
    required: true,
    min: 1,
    max: 20,
  }

  if (template.category === 'Rank Boost') {
    return [
      quantityOption,
      {
        label: 'Current Rank',
        type: 'dropdown',
        required: true,
        options: rankChoices,
      },
      {
        label: 'Target Rank',
        type: 'radio',
        required: true,
        options: rankChoices.map((choice) => ({
          ...choice,
          priceUSD: choice.priceUSD + 12,
          priceEUR: choice.priceEUR + 12,
        })),
      },
      {
        label: 'Duo Queue',
        type: 'toggle',
        required: false,
        enabledLabel: 'Duo queue with booster',
        disabledLabel: 'Solo boost',
        priceUSD: 18,
        priceEUR: 18,
      },
      {
        label: 'Preferred Notes',
        type: 'textarea',
        required: false,
        placeholder: 'Tell us your preferred agents, champions, heroes, or schedule.',
      },
    ]
  }

  if (template.category === 'Coaching') {
    return [
      quantityOption,
      {
        label: 'Session Length',
        type: 'number_stepper',
        required: true,
        min: 1,
        max: 6,
        pricePerUnitUSD: template.slug === 'account-review' ? 12 : 20,
        pricePerUnitEUR: template.slug === 'account-review' ? 12 : 20,
      },
      {
        label: 'Focus Areas',
        type: 'checkbox_group',
        required: false,
        options: [
          { label: 'Mechanics', priceUSD: 0, priceEUR: 0 },
          { label: 'Strategy', priceUSD: 5, priceEUR: 5 },
          { label: 'VOD Review', priceUSD: 10, priceEUR: 10 },
          { label: 'Build Review', priceUSD: 8, priceEUR: 8 },
        ],
      },
      {
        label: 'Discord Handle',
        type: 'text',
        required: false,
        placeholder: 'username#0000',
      },
    ]
  }

  if (['Dungeon', 'Raid'].includes(template.category)) {
    return [
      quantityOption,
      {
        label: template.category === 'Raid' ? 'Clear Count' : 'Run Count',
        type: 'number_stepper',
        required: true,
        min: 1,
        max: 10,
        pricePerUnitUSD: template.category === 'Raid' ? 24 : 14,
        pricePerUnitEUR: template.category === 'Raid' ? 24 : 14,
      },
      {
        label: 'Difficulty',
        type: 'radio',
        required: true,
        options: [
          { label: 'Normal', priceUSD: 0, priceEUR: 0 },
          { label: 'Heroic', priceUSD: 18, priceEUR: 18 },
          { label: 'Mythic', priceUSD: 42, priceEUR: 42 },
        ],
      },
      {
        label: 'Loot Priority',
        type: 'checkbox_group',
        required: false,
        options: [
          { label: 'Armor', priceUSD: 6, priceEUR: 6 },
          { label: 'Weapons', priceUSD: 10, priceEUR: 10 },
          { label: 'Cosmetics', priceUSD: 8, priceEUR: 8 },
        ],
      },
    ]
  }

  if (['Powerleveling', 'Leveling'].includes(template.category)) {
    return [
      quantityOption,
      {
        label: 'Target Levels',
        type: 'range',
        required: true,
        min: 5,
        max: 80,
        pricePerUnitUSD: 2,
        pricePerUnitEUR: 2,
      },
      {
        label: 'Delivery Speed',
        type: 'dropdown',
        required: true,
        options: [
          { label: 'Standard', priceUSD: 0, priceEUR: 0 },
          { label: 'Express', priceUSD: 15, priceEUR: 15 },
          { label: 'Priority', priceUSD: 28, priceEUR: 28 },
        ],
      },
    ]
  }

  if (template.category === 'Item Farm') {
    return [
      quantityOption,
      {
        label: 'Farm Duration',
        type: 'number_stepper',
        required: true,
        min: 1,
        max: 12,
        pricePerUnitUSD: 9,
        pricePerUnitEUR: 9,
      },
      {
        label: 'Target Rewards',
        type: 'checkbox_group',
        required: true,
        options: [
          { label: 'Materials', priceUSD: 0, priceEUR: 0 },
          { label: 'Rare Drops', priceUSD: 18, priceEUR: 18 },
          { label: 'Cosmetics', priceUSD: 12, priceEUR: 12 },
        ],
      },
      {
        label: 'Stop When Target Drops',
        type: 'toggle',
        required: false,
        enabledLabel: 'Stop at target drop',
        disabledLabel: 'Use full farm duration',
        priceUSD: 0,
        priceEUR: 0,
      },
    ]
  }

  return [
    quantityOption,
    {
      label: 'Completion Tier',
      type: 'dropdown',
      required: true,
      options: [
        { label: 'Basic', priceUSD: 0, priceEUR: 0 },
        { label: 'Full Clear', priceUSD: 20, priceEUR: 20 },
        { label: 'Completionist', priceUSD: 38, priceEUR: 38 },
      ],
    },
    {
      label: 'Special Instructions',
      type: 'textarea',
      required: false,
      placeholder: 'Add account notes, availability, or specific goals.',
    },
  ]
}

async function upsert(table, rows, onConflict) {
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: false })

  if (error) throw error
}

async function main() {
  const genres = Array.from(new Set(games.map((game) => game.genre)))
  await upsert(
    'genres',
    genres.map((name) => ({ name, slug: slugify(name) })),
    'slug'
  )

  const { data: genreRows, error: genreError } = await supabase
    .from('genres')
    .select('id, name')

  if (genreError) throw genreError

  const genreByName = new Map(genreRows.map((genre) => [genre.name, genre]))
  await upsert(
    'games',
    games.map((game) => ({
      name: game.name,
      slug: game.slug,
      image: '',
      genre_id: genreByName.get(game.genre)?.id,
      platforms: [game.platform],
      description: game.description,
      status: 'active',
    })),
    'slug'
  )

  const { data: gameRows, error: gameError } = await supabase
    .from('games')
    .select('id, slug, name')
    .in('slug', games.map((game) => game.slug))

  if (gameError) throw gameError

  const categoryRows = gameRows.flatMap((game) => {
    const categories = new Map()
    categories.set('uncategorized', { name: 'Uncategorized', slug: 'uncategorized', sort_order: 999 })

    serviceTemplates.forEach((template, index) => {
      const slug = slugify(template.category)
      if (slug !== 'hot-offers' && !categories.has(slug)) {
        categories.set(slug, { name: template.category, slug, sort_order: index })
      }
    })

    return Array.from(categories.values()).map((category) => ({
      game_id: game.id,
      name: category.name,
      slug: category.slug,
      sort_order: category.sort_order,
    }))
  })

  await upsert('service_categories', categoryRows, 'game_id,slug')

  const { data: serviceCategoryRows, error: categoryError } = await supabase
    .from('service_categories')
    .select('id, game_id, slug')

  if (categoryError) throw categoryError

  const categoryByGameAndSlug = new Map(
    serviceCategoryRows.map((category) => [`${category.game_id}:${category.slug}`, category])
  )

  const serviceRows = gameRows.flatMap((game) =>
    serviceTemplates.map((template) => {
      const category =
        categoryByGameAndSlug.get(`${game.id}:${slugify(template.category)}`) ||
        categoryByGameAndSlug.get(`${game.id}:uncategorized`)

      return {
        game_id: game.id,
        title: `${game.name} ${template.title}`,
        slug: template.slug,
        image: '',
        description: `${template.title} service for ${game.name}, handled by verified boosters with clear progress updates and support from checkout to completion.`,
        service_category_id: category?.id,
        status: 'active',
        is_hot_offer: template.hot,
        region: ['USA', 'EUROPE'],
        badges: template.tags,
        requirements: [
          'Active game account with access to selected content.',
          'Correct region selected before checkout.',
          'Account-specific details shared through support chat after purchase.',
        ],
        what_you_get: [
          {
            icon: 'tabler-bolt',
            title: 'Fast Start',
            description: 'A verified booster team is ready to begin shortly after checkout.',
          },
          {
            icon: 'tabler-shield-check',
            title: 'Safe Delivery',
            description: 'The order is handled with clear instructions and account-safety practices.',
          },
          {
            icon: 'tabler-message-circle',
            title: 'Progress Updates',
            description: 'Support keeps you informed as milestones are completed.',
          },
          {
            icon: 'tabler-trophy',
            title: 'Targeted Result',
            description: 'The service is focused on the goal, reward, or rank you selected.',
          },
        ],
        base_price_usd: template.price,
        base_price_eur: template.price,
        options_schema: buildOptionsSchema(template),
      }
    })
  )

  await upsert('services', serviceRows, 'game_id,slug')

  console.log(`Seeded ${games.length} games and ${serviceRows.length} services.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
