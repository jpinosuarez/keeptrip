/**
 * Achievement definitions for Keeptrip gamification.
 *
 * Each achievement has a unique id, emoji icon, tier (for visual treatment),
 * and criteria that the engine evaluates against user stats.
 *
 * Tiers: bronze → silver → gold → platinum → diamond
 */

export const TIER_COLORS = {
  bronze:   '#CD7F32',
  silver:   '#94A3B8',
  gold:     '#FBBF24',
  platinum: '#8B5CF6',
  diamond:  '#22D3EE',
};

export const ACHIEVEMENTS = [
  {
    id: 'first_stamp',
    icon: '🎫',
    tier: 'bronze',
    criteria: { type: 'trips', threshold: 1 },
  },
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
