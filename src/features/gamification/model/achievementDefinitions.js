/**
 * Achievement definitions — Keeptrip Gamification
 *
 * Tiers: bronze → silver → gold → platinum → diamond
 *
 * criteria.type must match a resolver key in achievementsEngine.js.
 * New micro-milestone types: has_photo, has_detail, has_dates, three_trips, shared
 */

export const TIER_COLORS = {
  bronze:   '#CD7F32',
  silver:   '#94A3B8',
  gold:     '#FBBF24',
  platinum: '#8B5CF6',
  diamond:  '#22D3EE',
};

// Glow intensities per tier for the Prestige Token
export const TIER_GLOW = {
  bronze:   'rgba(205, 127, 50, 0.45)',
  silver:   'rgba(148, 163, 184, 0.45)',
  gold:     'rgba(251, 191, 36, 0.55)',
  platinum: 'rgba(139, 92, 246, 0.55)',
  diamond:  'rgba(34, 211, 238, 0.65)',
};

export const ACHIEVEMENTS = [
  // ── Micro-milestones (new): fix the "motivation cliff" for 0–3 trip users ──
  {
    id: 'first_stamp',
    icon: '🎫',
    tier: 'bronze',
    criteria: { type: 'trips', threshold: 1 },
  },
  {
    id: 'first_photo',
    icon: '📸',
    tier: 'bronze',
    criteria: { type: 'has_photo', threshold: 1 },
  },
  {
    id: 'three_trips',
    icon: '✈️',
    tier: 'bronze',
    criteria: { type: 'trips', threshold: 3 },
  },
  {
    id: 'first_detail',
    icon: '📍',
    tier: 'bronze',
    criteria: { type: 'has_detail', threshold: 1 },
  },
  {
    id: 'first_dates',
    icon: '📅',
    tier: 'bronze',
    criteria: { type: 'has_dates', threshold: 1 },
  },
  {
    id: 'local_explorer',
    icon: '🧭',
    tier: 'bronze',
    category: 'exploration',
    criteria: { type: 'local_explorer', threshold: 3 },
    target: 3,
    xpReward: 200,
    actionHint: 'hub:achievements.local_explorer_desc',
  },

  // ── Original achievements ──
  {
    id: 'five_flags',
    icon: '🏁',
    tier: 'bronze',
    criteria: { type: 'countries', threshold: 5 },
  },
  {
    id: 'road_warrior',
    icon: '🛣️',
    tier: 'silver',
    criteria: { type: 'trips', threshold: 10 },
  },
  {
    id: 'continent3',
    icon: '🌎',
    tier: 'silver',
    criteria: { type: 'continents', threshold: 3 },
  },
  {
    id: 'wanderlust',
    icon: '🧭',
    tier: 'gold',
    criteria: { type: 'countries', threshold: 10 },
  },
  {
    id: 'storyteller',
    icon: '📖',
    tier: 'gold',
    criteria: { type: 'detailed_trips', threshold: 5 },
  },
  {
    id: 'continent5',
    icon: '🌍',
    tier: 'gold',
    criteria: { type: 'continents', threshold: 5 },
  },
  {
    id: 'cartographer',
    icon: '🗺️',
    tier: 'platinum',
    criteria: { type: 'countries', threshold: 25 },
  },
  {
    id: 'centurion',
    icon: '💎',
    tier: 'platinum',
    criteria: { type: 'trips', threshold: 25 },
  },
  {
    id: 'marathoner',
    icon: '🏃‍♂️',
    tier: 'platinum',
    criteria: { type: 'trips', threshold: 50 },
  },
  {
    id: 'world_adventurer',
    icon: '🧭',
    tier: 'diamond',
    criteria: { type: 'countries', threshold: 100 },
  },
  {
    id: 'legend',
    icon: '👑',
    tier: 'diamond',
    criteria: { type: 'countries', threshold: 50 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Block 3.1 — Tiered Mastery Catalog (4 categories)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── exploration (Exploración Global) ──
  {
    id: 'first_step',
    icon: '🎒',
    tier: 'bronze',
    category: 'exploration',
    criteria: { type: 'trips', threshold: 1 },
    target: 1,
    xpReward: 100,
    actionHint: 'hub:achievements.first_step_desc',
  },
  {
    id: 'globe_trotter',
    icon: '🌍',
    tier: 'silver',
    category: 'exploration',
    criteria: { type: 'countries', threshold: 5 },
    target: 5,
    tiers: [3, 10, 25],
    xpReward: 250,
    actionHint: 'hub:achievements.globe_trotter_desc',
  },
  {
    id: 'continental_conqueror',
    icon: '🌎',
    tier: 'gold',
    category: 'exploration',
    criteria: { type: 'continents', threshold: 3 },
    target: 3,
    tiers: [2, 3, 5],
    xpReward: 300,
    actionHint: 'hub:achievements.continental_conqueror_desc',
  },

  // ── narrative (Profundidad Documental — GAMIF-INPUTS-01) ──
  {
    id: 'detailed_chronicler',
    icon: '✍️',
    tier: 'silver',
    category: 'narrative',
    criteria: { type: 'detailed_chronicler', threshold: 3 },
    target: 3,
    tiers: [1, 3, 10],
    xpReward: 150,
    targetTab: 'details',
    actionHint: 'hub:achievements.detailed_chronicler_desc',
  },
  {
    id: 'border_taster',
    icon: '🍜',
    tier: 'silver',
    category: 'narrative',
    criteria: { type: 'border_taster', threshold: 3 },
    target: 3,
    tiers: [1, 3, 8],
    xpReward: 150,
    targetTab: 'details',
    actionHint: 'hub:achievements.border_taster_desc',
  },
  {
    id: 'paparazzi',
    icon: '📸',
    tier: 'gold',
    category: 'narrative',
    criteria: { type: 'photos', threshold: 20 },
    target: 20,
    tiers: [10, 50, 200],
    xpReward: 150,
    targetTab: 'gallery',
    actionHint: 'hub:achievements.paparazzi_desc',
  },
  {
    id: 'corner_collector',
    icon: '📍',
    tier: 'silver',
    category: 'narrative',
    criteria: { type: 'places', threshold: 5 },
    target: 5,
    tiers: [5, 20, 50],
    xpReward: 200,
    targetTab: 'stops',
    actionHint: 'hub:achievements.corner_collector_desc',
  },

  // ── movement (Estilo y Movimiento — GAMIF-INPUTS-01) ──
  {
    id: 'route_polyglot',
    icon: '🚆',
    tier: 'silver',
    category: 'movement',
    criteria: { type: 'transport_modes', threshold: 3 },
    target: 3,
    xpReward: 200,
    targetTab: 'stops',
    actionHint: 'hub:achievements.route_polyglot_desc',
  },
  {
    id: 'day_escapist',
    icon: '☀️',
    tier: 'bronze',
    category: 'movement',
    criteria: { type: 'day_trips', threshold: 1 },
    target: 1,
    xpReward: 150,
    targetTab: 'stops',
    actionHint: 'hub:achievements.day_escapist_desc',
  },
  {
    id: 'nomad',
    icon: '🧭',
    tier: 'gold',
    category: 'movement',
    criteria: { type: 'long_trip', threshold: 21 },
    target: 21,
    xpReward: 250,
    actionHint: 'hub:achievements.nomad_desc',
  },

  // ── tribe_dreams (Tribu y Sueños) ──
  {
    id: 'tribe_traveler',
    icon: '👨‍👩‍👧',
    tier: 'bronze',
    category: 'tribe_dreams',
    criteria: { type: 'group_trips', threshold: 1 },
    target: 1,
    xpReward: 150,
    targetTab: 'details',
    actionHint: 'hub:achievements.tribe_traveler_desc',
  },
  {
    id: 'dream_architect',
    icon: '✨',
    tier: 'silver',
    category: 'tribe_dreams',
    criteria: { type: 'wishlist', threshold: 3 },
    target: 3,
    xpReward: 150,
    targetTab: 'wishlist',
    actionHint: 'hub:achievements.dream_architect_desc',
  },
];
