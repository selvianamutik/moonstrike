/**
 * Reference catalog from docs/data_joki_game-v3.md
 * Cover images live under public/cover-game/
 */

export const COVER_BASE = '/cover-game'

/** Shared multiplier presets from section A of the v3 doc (approximated as additive option deltas). */
export const SPEED_TIER_OPTIONS = (baseUsd, baseEur) => [
  { label: 'Standard (Normal)', priceUSD: 0, priceEUR: 0 },
  { label: 'Express', priceUSD: round(baseUsd * 0.4), priceEUR: round(baseEur * 0.4) },
  { label: 'Super Express', priceUSD: round(baseUsd * 0.85), priceEUR: round(baseEur * 0.85) },
]

export const MODE_OPTIONS = (baseUsd, baseEur, modes = ['piloted', 'self-play', 'afk']) => {
  const all = {
    piloted: { label: 'Piloted (Account Share)', priceUSD: 0, priceEUR: 0 },
    'self-play': {
      label: 'Self-Play / Duo Queue',
      priceUSD: round(baseUsd * 0.3),
      priceEUR: round(baseEur * 0.3),
    },
    afk: {
      label: 'Offline / AFK Leveling',
      priceUSD: 0,
      priceEUR: 0,
    },
    hourly: {
      label: 'Hourly Pilot',
      priceUSD: round(baseUsd * 0.15),
      priceEUR: round(baseEur * 0.15),
    },
  }

  return modes.map((mode) => all[mode]).filter(Boolean)
}

export const COMMON_ADDON_OPTIONS = [
  {
    label: 'Live Stream',
    priceUSD: 5,
    priceEUR: 4.6,
  },
  {
    label: 'Insurance / Safekeeping (+15%)',
    priceUSD: 0,
    priceEUR: 0,
  },
  {
    label: 'Custom Build / Class Request',
    priceUSD: 10,
    priceEUR: 9.2,
  },
  {
    label: 'Priority Booster Assignment (+15%)',
    priceUSD: 0,
    priceEUR: 0,
  },
]

function round(value) {
  return Math.round(value * 100) / 100
}

function parsePriceRange(usdText, eurText) {
  const parse = (text) => {
    const cleaned = String(text)
      .replace(/[~+]/g, '')
      .replace(/[^\d.,–-]/g, ' ')
      .trim()
    const parts = cleaned
      .split(/[–-]/)
      .map((part) => Number(part.replace(',', '.').trim()))
      .filter((value) => Number.isFinite(value))

    if (parts.length === 0) return { min: 0, max: 0 }
    if (parts.length === 1) return { min: parts[0], max: parts[0] }
    return { min: parts[0], max: parts[1] }
  }

  const usd = parse(usdText)
  const eur = parse(eurText)

  return {
    base_price_usd: usd.min,
    base_price_usd_max: usd.max,
    base_price_eur: eur.min,
    base_price_eur_max: eur.max,
  }
}

function service(
  slug,
  title,
  category,
  usdRange,
  eurRange,
  {
    hot = false,
    badges = [],
    builder = 'standard',
    sliderLabel = 'Progress Tier',
    sliderMin = 1,
    sliderMax = 10,
    unitLabel = null,
    unitMax = 10,
    modes = ['piloted', 'self-play'],
    addons = [],
    description = '',
  } = {}
) {
  return {
    slug,
    title,
    category,
    ...parsePriceRange(usdRange, eurRange),
    hot,
    badges,
    builder,
    sliderLabel,
    sliderMin,
    sliderMax,
    unitLabel,
    unitMax,
    modes,
    addons,
    description,
  }
}

export const jokiGames = [
  {
    slug: 'guild-wars-2',
    name: 'Guild Wars 2',
    genre: 'MMORPG',
    platforms: ['PC'],
    image: `${COVER_BASE}/guild-wars-2.jpg`,
    description:
      'MMORPG fantasi tanpa subscription bulanan, fokus eksplorasi dinamis dan horizontal progression.',
    releaseDate: '2012-08-28',
    services: [
      service('powerleveling-1-80', 'Powerleveling (1–80)', 'Powerleveling', '$30.00 – $45.00', '€27.50 – €41.50', {
        hot: true,
        badges: ['Leveling', '1–80', 'Express Available'],
        builder: 'detailed',
        sliderLabel: 'Target Level Tier',
        modes: ['piloted', 'self-play'],
        addons: [{ label: 'Legendary Precursor Priority Sourcing', priceUSD: 35, priceEUR: 32.2 }],
      }),
      service(
        'living-world-story',
        'Living World / Story Progression',
        'Stories',
        '$36.00 – $40.00',
        '€33.00 – €36.80',
        { badges: ['Story', 'Living World', 'Seasonal'] }
      ),
      service('mastery-hero-points', 'Mastery / Hero Points', 'Powerleveling', '$3.00 – $5.00', '€2.75 – €4.60', {
        builder: 'per-unit',
        unitLabel: 'Points',
        unitMax: 50,
        badges: ['Mastery', 'Hero Points'],
      }),
      service('fractals-raid-clears', 'Fractals & Raid Clears', 'Raid', '$15.00 – $35.00', '€13.80 – €32.20', {
        builder: 'per-run',
        unitLabel: 'Runs',
        unitMax: 10,
        badges: ['Fractals', 'Raid', 'Per Run'],
      }),
      service(
        'legendary-crafting',
        'Legendary Crafting Assistance',
        'Item Farm',
        '$150.00 – $500.00',
        '€138.00 – €460.00',
        {
          hot: true,
          badges: ['Legendary', 'Crafting', 'Endgame'],
          builder: 'premium',
        }
      ),
    ],
  },
  {
    slug: 'black-desert',
    name: 'Black Desert Online',
    genre: 'MMORPG',
    platforms: ['Cross-play'],
    image: `${COVER_BASE}/black-desert.jpg`,
    description:
      'MMORPG sandbox dengan real-time action combat dan sistem RNG enhancement gear.',
    releaseDate: '2015-07-14',
    services: [
      service('leveling-1-60', 'Leveling 1–60', 'Powerleveling', '~$25.00', '~€23.00', {
        badges: ['Leveling', 'Starter'],
      }),
      service('leveling-60-62', 'Leveling 60–62', 'Powerleveling', '$60.00 – $120.00', '€55.20 – €110.50', {
        hot: true,
        badges: ['AP/DP', 'Endgame Prep'],
        builder: 'detailed',
        sliderLabel: 'Gear Tier Target',
        modes: ['piloted'],
      }),
      service('silver-farming', 'Silver Farming (per 1B)', 'Item Farm', '$10.00 – $18.00', '€9.20 – €16.50', {
        builder: 'per-unit',
        unitLabel: 'Billion Silver',
        unitMax: 20,
        badges: ['Silver', 'Farm'],
      }),
      service(
        'gear-enhancement-safekeeping',
        'Gear Enhancement Safekeeping',
        'Item Farm',
        '$40.00 – $150.00',
        '€36.80 – €138.00',
        {
          hot: true,
          badges: ['Enhancement', 'PEN/TET', 'Safekeeping'],
          builder: 'detailed',
          sliderLabel: 'Enhancement Tier (PRI → PEN)',
          modes: ['piloted'],
          addons: [{ label: 'Insurance / Safekeeping (+20%)', priceUSD: 0, priceEUR: 0 }],
        }
      ),
      service('lifeskill-leveling', 'Lifeskill Leveling', 'Leveling', '$30.00 – $90.00', '€27.50 – €82.80', {
        badges: ['Lifeskill', 'Progression'],
      }),
      service('boss-gear-farming', 'Boss Gear Farming', 'Item Farm', '$80.00 – $250.00', '€73.60 – €230.00', {
        badges: ['Boss', 'Gear'],
        builder: 'premium',
      }),
      service('hourly-grind', 'Hourly Grind', 'Coaching', '$4.00 – $7.00', '€3.70 – €6.40', {
        builder: 'per-unit',
        unitLabel: 'Hours',
        unitMax: 24,
        modes: ['piloted', 'hourly'],
        badges: ['Hourly', 'Grind'],
      }),
    ],
  },
  {
    slug: 'crimson-desert',
    name: 'Crimson Desert',
    genre: 'ACTION RPG',
    platforms: ['Cross-play'],
    image: `${COVER_BASE}/crimson-desert.jpg`,
    description:
      'Aksi-petualangan dunia terbuka dari Pearl Abyss, fokus single-player campaign dipadukan multiplayer/co-op pasca-cerita.',
    releaseDate: '2025-01-01',
    services: [
      service(
        'full-campaign-progression',
        'Full Campaign Progression',
        'Stories',
        '$60.00 – $100.00',
        '€55.20 – €92.00',
        {
          hot: true,
          badges: ['Campaign', 'Story', 'Co-op'],
          builder: 'detailed',
          sliderLabel: 'Story Progress (Prolog → Post-game)',
          modes: ['piloted', 'hourly'],
          addons: [
            { label: '100% Side-Quest Completion', priceUSD: 18, priceEUR: 16.5 },
            { label: 'Skip Cutscene Option', priceUSD: 0, priceEUR: 0 },
          ],
        }
      ),
      service('boss-clears', 'Boss Clears / Mythical Encounter', 'Raid', '$15.00 – $30.00', '€13.80 – €27.60', {
        builder: 'per-run',
        unitLabel: 'Boss Clears',
        unitMax: 10,
        badges: ['Boss', 'Mythical'],
      }),
      service('endgame-gear-runs', 'Endgame Gear Runs', 'Dungeon', '$8.00 – $12.00', '€7.40 – €11.00', {
        builder: 'per-unit',
        unitLabel: 'Hours',
        unitMax: 12,
        badges: ['Endgame', 'Gear Runs'],
      }),
    ],
  },
  {
    slug: 'maplestory',
    name: 'MapleStory',
    genre: 'MMORPG',
    platforms: ['Cross-play'],
    image: `${COVER_BASE}/maplestory.jpg`,
    description:
      'MMORPG side-scrolling 2D dengan mekanik progression kompleks (Star Force, Cubing, Legion).',
    releaseDate: '2003-04-29',
    services: [
      service('class-leveling-1-200', 'Class Leveling (1–200)', 'Powerleveling', '$15.00 – $25.00', '€13.80 – €23.00', {
        badges: ['Leveling', '1–200'],
      }),
      service('hyper-leveling-200-260', 'Hyper Leveling (200–260+)', 'Powerleveling', '$100.00 – $400.00', '€92.00 – €368.00', {
        hot: true,
        badges: ['Hyper', '260+', 'EXP Curve'],
        builder: 'detailed',
        sliderLabel: 'Target Level Tier (200 → 260+)',
        modes: ['piloted', 'self-play'],
        addons: [{ label: 'Boss Carry Bundling', priceUSD: 25, priceEUR: 23 }],
      }),
      service('meso-farming', 'Meso Farming (per 1B)', 'Item Farm', '$12.00 – $20.00', '€11.00 – €18.40', {
        builder: 'per-unit',
        unitLabel: 'Billion Meso',
        unitMax: 20,
        badges: ['Meso', 'Farm'],
      }),
      service('boss-carries', 'Boss Carries', 'Raid', '$5.00 – $50.00', '€4.60 – €46.00', {
        builder: 'per-run',
        unitLabel: 'Runs',
        unitMax: 15,
        badges: ['Boss', 'Carry'],
      }),
    ],
  },
  {
    slug: 'lost-ark',
    name: 'Lost Ark',
    genre: 'MMORPG',
    platforms: ['PC'],
    image: `${COVER_BASE}/lost-ark.jpg`,
    description:
      'MMORPG isometrik hack-and-slash 2.5D, fokus Legion Raids dengan koordinasi mekanik tinggi.',
    releaseDate: '2022-02-11',
    services: [
      service('daily-checklist', 'Daily Checklist', 'Dungeon', '$4.00 – $7.00', '€3.70 – €6.40', {
        builder: 'per-unit',
        unitLabel: 'Days',
        unitMax: 14,
        badges: ['Daily', 'Checklist'],
      }),
      service('weekly-daily-package', 'Weekly Daily Checklist Package', 'Dungeon', '$30.00 – $45.00', '€27.50 – €41.50', {
        badges: ['Weekly', 'Package'],
      }),
      service('legion-raid-standard', 'Legion Raid (Low/Mid Tier)', 'Raid', '$5.00 – $12.00', '€4.60 – €11.00', {
        badges: ['Legion Raid', 'Normal'],
      }),
      service('legion-raid-endgame', 'Legion Raid Endgame', 'Raid', '$15.00 – $60.00', '€13.80 – €55.20', {
        hot: true,
        badges: ['Thaemine', 'Kazeros', 'Hard Mode'],
        builder: 'detailed',
        sliderLabel: 'Raid Difficulty Tier',
        modes: ['piloted', 'self-play'],
        addons: [{ label: 'Multi-Character Bundling', priceUSD: 12, priceEUR: 11 }],
      }),
      service('honing-gold-package', 'Honing Gold / iLvl Progression', 'Powerleveling', '$30.00 – $100.00', '€27.50 – €92.00', {
        badges: ['Honing', 'iLvl', 'Gold'],
        builder: 'premium',
      }),
    ],
  },
  {
    slug: 'throne-and-liberty',
    name: 'Throne and Liberty',
    genre: 'MMORPG',
    platforms: ['Cross-play'],
    image: `${COVER_BASE}/throne-and-liberty.jpg`,
    description:
      'MMORPG NCSoft dengan PvP kastil skala masif dan PvE dinamis berbasis cuaca. Punya fitur resmi Character Boost bawaan dev.',
    releaseDate: '2024-10-01',
    services: [
      service('leveling-boost-1-50', 'Leveling Boost (1–50)', 'Powerleveling', '$25.00 – $40.00', '€23.00 – €36.80', {
        hot: true,
        badges: ['Leveling', '1–50'],
        builder: 'detailed',
        sliderLabel: 'Target Level Tier',
        modes: ['piloted', 'self-play'],
        addons: [{ label: 'Weapon Mastery Bundling', priceUSD: 15, priceEUR: 13.8 }],
      }),
      service('co-op-dungeon-runs', 'Co-Op Dungeon Runs', 'Dungeon', '$8.00 – $15.00', '€7.40 – €13.80', {
        builder: 'per-run',
        unitLabel: 'Runs',
        unitMax: 10,
        badges: ['Dungeon', 'Co-op'],
      }),
      service('gear-weapon-mastery', 'Gear Progression & Weapon Mastery', 'Powerleveling', '$40.00 – $120.00', '€36.80 – €110.50', {
        badges: ['Gear', 'Weapon Mastery'],
      }),
      service('solfant-contract-farming', 'Solfant / Contract Coins Farming', 'Item Farm', '$10.00 – $25.00', '€9.20 – €23.00', {
        builder: 'per-unit',
        unitLabel: 'Quota Units',
        unitMax: 10,
        badges: ['Solfant', 'Contract Coins'],
      }),
    ],
  },
  {
    slug: 'albion-online',
    name: 'Albion Online',
    genre: 'MMORPG',
    platforms: ['Cross-play'],
    image: `${COVER_BASE}/albion-online.jpg`,
    description:
      'MMORPG sandbox full-loot PvP, ekonomi sepenuhnya digerakkan pemain, tanpa sistem kelas kaku.',
    releaseDate: '2017-07-17',
    services: [
      service('silver-farming-10m', 'Silver Farming (per 10M)', 'Item Farm', '$4.00 – $7.00', '€3.70 – €6.40', {
        builder: 'per-unit',
        unitLabel: '10M Silver',
        unitMax: 50,
        badges: ['Silver', 'Farm'],
      }),
      service('combat-fame-grinding', 'Combat Fame Grinding', 'Powerleveling', '$15.00 – $30.00', '€13.80 – €27.50', {
        builder: 'per-unit',
        unitLabel: '10M Fame',
        unitMax: 20,
        badges: ['Fame', 'Combat'],
      }),
      service('gathering-crafting-leveling', 'Gathering / Crafting Leveling', 'Leveling', '$50.00 – $200.00', '€46.00 – €184.00', {
        hot: true,
        badges: ['Gathering', 'Crafting', 'Tier 8'],
        builder: 'detailed',
        sliderLabel: 'Profession Tier',
        modes: ['piloted', 'self-play'],
        addons: [
          { label: 'Zone Risk Premium (Black Zone)', priceUSD: 20, priceEUR: 18.4 },
          { label: 'Gear Replacement Insurance', priceUSD: 12, priceEUR: 11 },
        ],
      }),
      service('hellgates-corrupted-wins', 'Hellgates & Corrupted Dungeons Wins', 'Raid', '$20.00 – $50.00', '€18.40 – €46.00', {
        builder: 'per-run',
        unitLabel: 'Wins',
        unitMax: 10,
        badges: ['Hellgates', 'Corrupted'],
      }),
    ],
  },
  {
    slug: 'aion-2',
    name: 'AION 2',
    genre: 'MMORPG',
    platforms: ['Cross-play'],
    image: `${COVER_BASE}/AION-2.jpg`,
    description:
      'Sekuel MMORPG legendaris AION berbasis Unreal Engine 5, dengan pertempuran udara masif skala global (RvR).',
    releaseDate: '2026-06-01',
    services: [
      service(
        'day-1-leveling-sprint',
        'Initial Day-1 Leveling Sprint',
        'Powerleveling',
        '$50.00 – $90.00',
        '€46.00 – €82.80',
        {
          hot: true,
          badges: ['Day-1', 'Launch', 'Sprint'],
          builder: 'detailed',
          sliderLabel: 'Launch Progress Tier',
          modes: ['piloted'],
          addons: [
            { label: 'Server-Region Priority Selection', priceUSD: 8, priceEUR: 7.4 },
            { label: 'Faction Rank Bundling', priceUSD: 18, priceEUR: 16.5 },
          ],
        }
      ),
      service(
        'dungeon-starter-gear',
        'Dungeon Clears / Starter Gear Sets',
        'Dungeon',
        '$20.00 – $40.00',
        '€18.40 – €36.80',
        {
          builder: 'per-run',
          unitLabel: 'Weekly Cycles',
          unitMax: 8,
          badges: ['Dungeon', 'Starter Gear'],
        }
      ),
      service('faction-pvp-farming', 'Faction Rank / PvP Points Farming', 'Rank Boost', '$15.00 – $35.00', '€13.80 – €32.20', {
        badges: ['Faction', 'PvP'],
        builder: 'standard',
      }),
    ],
  },
]

function unitStepPricing(serviceDef) {
  const minUsd = serviceDef.base_price_usd
  const minEur = serviceDef.base_price_eur
  const maxUsd = serviceDef.base_price_usd_max || minUsd
  const maxEur = serviceDef.base_price_eur_max || minEur
  const unitMax = serviceDef.unitMax || 10
  const stepUsd = unitMax > 1 ? round((maxUsd - minUsd) / (unitMax - 1)) : 0
  const stepEur = unitMax > 1 ? round((maxEur - minEur) / (unitMax - 1)) : 0

  return {
    baseUsd: round(minUsd - stepUsd),
    baseEur: round(minEur - stepEur),
    stepUsd,
    stepEur,
    unitMax,
  }
}

export function resolveServicePricing(serviceDef) {
  if (serviceDef.builder === 'per-unit' || serviceDef.builder === 'per-run') {
    const pricing = unitStepPricing(serviceDef)
    return {
      base_price_usd: pricing.baseUsd,
      base_price_eur: pricing.baseEur,
      unitStepUsd: pricing.stepUsd,
      unitStepEur: pricing.stepEur,
      unitMax: pricing.unitMax,
    }
  }

  return {
    base_price_usd: serviceDef.base_price_usd,
    base_price_eur: serviceDef.base_price_eur,
    unitStepUsd: 0,
    unitStepEur: 0,
    unitMax: serviceDef.unitMax || 10,
  }
}

export function buildOptionsSchema(serviceDef, pricing = resolveServicePricing(serviceDef)) {
  const baseUsd = pricing.base_price_usd
  const baseEur = pricing.base_price_eur
  const tierStepUsd = round(((serviceDef.base_price_usd_max || serviceDef.base_price_usd) - serviceDef.base_price_usd) / 10)
  const tierStepEur = round(((serviceDef.base_price_eur_max || serviceDef.base_price_eur) - serviceDef.base_price_eur) / 10)

  const quantityOption = {
    label: 'Quantity',
    type: 'quantity',
    required: true,
    min: 1,
    max: 10,
  }

  const speedOption = {
    label: 'Delivery Speed',
    type: 'radio',
    required: true,
    options: SPEED_TIER_OPTIONS(baseUsd, baseEur),
  }

  const notesOption = {
    label: 'Special Instructions',
    type: 'textarea',
    required: false,
    placeholder: 'Account notes, schedule, or build preferences.',
  }

  if (serviceDef.builder === 'per-unit') {
    return [
      quantityOption,
      {
        label: serviceDef.unitLabel || 'Units',
        type: 'number_stepper',
        required: true,
        min: 1,
        max: pricing.unitMax,
        pricePerUnitUSD: pricing.unitStepUsd,
        pricePerUnitEUR: pricing.unitStepEur,
      },
      speedOption,
      notesOption,
    ]
  }

  if (serviceDef.builder === 'per-run') {
    return [
      quantityOption,
      {
        label: serviceDef.unitLabel || 'Runs',
        type: 'number_stepper',
        required: true,
        min: 1,
        max: pricing.unitMax,
        pricePerUnitUSD: pricing.unitStepUsd,
        pricePerUnitEUR: pricing.unitStepEur,
      },
      {
        label: 'Difficulty',
        type: 'radio',
        required: true,
        options: [
          { label: 'Normal', priceUSD: 0, priceEUR: 0 },
          { label: 'Hard', priceUSD: round(baseUsd * 0.35), priceEUR: round(baseEur * 0.35) },
          { label: 'Extreme', priceUSD: round(baseUsd * 0.75), priceEUR: round(baseEur * 0.75) },
        ],
      },
      speedOption,
      notesOption,
    ]
  }

  if (serviceDef.builder === 'detailed' || serviceDef.builder === 'premium') {
    const addonOptions = [...(serviceDef.addons || []), ...COMMON_ADDON_OPTIONS.slice(0, 2)]

    return [
      quantityOption,
      {
        label: serviceDef.sliderLabel || 'Progress Tier',
        type: 'range',
        required: true,
        min: serviceDef.sliderMin || 1,
        max: serviceDef.sliderMax || 10,
        pricePerUnitUSD: tierStepUsd || round(baseUsd * 0.05),
        pricePerUnitEUR: tierStepEur || round(baseEur * 0.05),
      },
      speedOption,
      {
        label: 'Work Mode',
        type: 'radio',
        required: true,
        options: MODE_OPTIONS(baseUsd, baseEur, serviceDef.modes),
      },
      {
        label: 'Add-ons',
        type: 'checkbox_group',
        required: false,
        options: addonOptions,
      },
      notesOption,
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
        {
          label: 'Standard',
          priceUSD: round(((serviceDef.base_price_usd_max || baseUsd) - baseUsd) / 2),
          priceEUR: round(((serviceDef.base_price_eur_max || baseEur) - baseEur) / 2),
        },
        {
          label: 'Premium',
          priceUSD: round((serviceDef.base_price_usd_max || baseUsd) - baseUsd),
          priceEUR: round((serviceDef.base_price_eur_max || baseEur) - baseEur),
        },
      ],
    },
    speedOption,
    notesOption,
  ]
}

export const DEFAULT_WHAT_YOU_GET = [
  {
    icon: 'tabler-bolt',
    title: 'Fast Start',
    description: 'Verified booster team ready shortly after checkout.',
  },
  {
    icon: 'tabler-shield-check',
    title: 'Safe Delivery',
    description: 'Handled with clear instructions and account-safety practices.',
  },
  {
    icon: 'tabler-message-circle',
    title: 'Progress Updates',
    description: 'Support keeps you informed as milestones are completed.',
  },
  {
    icon: 'tabler-trophy',
    title: 'Targeted Result',
    description: 'Focused on the goal, reward, or progression tier you selected.',
  },
]

export const DEFAULT_REQUIREMENTS = [
  'Active game account with access to selected content.',
  'Correct service options selected before checkout.',
  'Account-specific details shared through support chat after purchase.',
]
