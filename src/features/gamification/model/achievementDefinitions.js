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
    id: 'legend',
    icon: '👑',
    tier: 'diamond',
    criteria: { type: 'countries', threshold: 50 },
  },
];
