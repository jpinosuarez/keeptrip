/**
 * Achievement definitions — Keeptrip Gamification (Polish Slice 2)
 *
 * Dual architecture:
 *  - type: 'milestone' → one-off lifetime Hito Especial (★ HITO)
 *  - type: 'tiered'    → 4-step progressive mastery [T1, T2, T3, T4]
 *
 * `criteria.type` is a resolver key in achievementsEngine.js.
 * All legacy badge IDs are preserved for backwards compatibility.
 */

export const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#94A3B8',
  gold: '#F59E0B',
  legend: '#FF6B35',
  platinum: '#8B5CF6',
  diamond: '#22D3EE',
};

export const TIER_GLOW = {
  bronze: 'rgba(205, 127, 50, 0.45)',
  silver: 'rgba(148, 163, 184, 0.45)',
  gold: 'rgba(245, 158, 11, 0.55)',
  legend: 'rgba(255, 107, 53, 0.55)',
  platinum: 'rgba(139, 92, 246, 0.55)',
  diamond: 'rgba(34, 211, 238, 0.65)',
};

export const ACHIEVEMENTS = [
  // ═══ exploration — Fronteras y Geografía ═══
  { id: 'first_stamp', icon: '🎫', tier: 'bronze', category: 'exploration', type: 'milestone', criteria: { type: 'trips', threshold: 1 }, target: 1, unitLabel: 'viajes', xpReward: 100, defaultTitle: 'Primera Historia', defaultDescription: 'Registrá tu primer viaje' },
  { id: 'first_step', icon: '🎒', tier: 'bronze', category: 'exploration', type: 'milestone', criteria: { type: 'trips', threshold: 1 }, target: 1, unitLabel: 'viajes', xpReward: 100, defaultTitle: 'Primer Paso', defaultDescription: 'Registrá tu primer viaje' },
  { id: 'globe_trotter', icon: '🌍', tier: 'silver', category: 'exploration', type: 'tiered', criteria: { type: 'countries', threshold: 3 }, tiers: [3, 10, 25, 50], target: 3, unitLabel: 'países', xpReward: 250, defaultTitle: 'Trotamundos', defaultDescription: 'Países distintos descubiertos' },
  { id: 'continental_conqueror', icon: '🌎', tier: 'gold', category: 'exploration', type: 'tiered', criteria: { type: 'continents', threshold: 2 }, tiers: [2, 3, 4, 5], target: 2, unitLabel: 'continentes', xpReward: 300, defaultTitle: 'Conquistador Continental', defaultDescription: 'Continentes explorados' },
  { id: 'equator_crosser', icon: '📐', tier: 'gold', category: 'exploration', type: 'milestone', criteria: { type: 'equator', threshold: 1 }, target: 1, unitLabel: '', xpReward: 200, defaultTitle: 'Cruce del Ecuador', defaultDescription: 'Paradas en ambos hemisferios' },
  { id: 'four_hemispheres', icon: '🧭', tier: 'platinum', category: 'exploration', type: 'milestone', criteria: { type: 'hemispheres', threshold: 4 }, target: 4, unitLabel: 'hemisferios', xpReward: 250, defaultTitle: 'Cuatro Hemisferios', defaultDescription: 'Paradas en N, S, E y O' },
  { id: 'polar_spirit', icon: '🧊', tier: 'platinum', category: 'exploration', type: 'milestone', criteria: { type: 'polar', threshold: 1 }, target: 1, unitLabel: '', xpReward: 250, defaultTitle: 'Espíritu Polar', defaultDescription: 'Llegá a una latitud extrema' },
  { id: 'far_from_home', icon: '🏡', tier: 'gold', category: 'exploration', type: 'milestone', criteria: { type: 'far_home_km', threshold: 10000 }, target: 10000, unitLabel: 'km', xpReward: 250, defaultTitle: 'Lejos de Casa', defaultDescription: 'Una parada a 10.000+ km de tu base' },
  { id: 'local_explorer', icon: '🧭', tier: 'bronze', category: 'exploration', type: 'milestone', criteria: { type: 'local_explorer', threshold: 3 }, target: 3, unitLabel: '', xpReward: 200, defaultTitle: 'Profeta en su Tierra', defaultDescription: 'Viajes o paradas en tu país natal/base' },
  { id: 'archipelago_explorer', icon: '🏝️', tier: 'silver', category: 'exploration', type: 'tiered', criteria: { type: 'island_countries', threshold: 1 }, tiers: [1, 3, 6, 10], target: 1, unitLabel: 'países', xpReward: 200, defaultTitle: 'Explorador de Archipiélagos', defaultDescription: 'Países insulares visitados' },
  { id: 'microstate_hunter', icon: '🔬', tier: 'platinum', category: 'exploration', type: 'tiered', criteria: { type: 'microstates', threshold: 1 }, tiers: [1, 2, 4, 6], target: 1, unitLabel: 'países', xpReward: 250, defaultTitle: 'Cazador de Microestados', defaultDescription: 'Microestados visitados' },
  { id: 'capital_collector', icon: '🏙️', tier: 'gold', category: 'exploration', type: 'tiered', criteria: { type: 'unique_cities', threshold: 5 }, tiers: [5, 15, 30, 60], target: 5, unitLabel: 'ciudades', xpReward: 200, defaultTitle: 'Coleccionista de Capitales', defaultDescription: 'Ciudades distintas exploradas' },
  { id: 'five_flags', icon: '🏁', tier: 'bronze', category: 'exploration', type: 'milestone', criteria: { type: 'countries', threshold: 5 }, target: 5, unitLabel: 'países', xpReward: 100, defaultTitle: 'Cinco Banderas', defaultDescription: 'Visitá 5 países' },
  { id: 'continent3', icon: '🌎', tier: 'silver', category: 'exploration', type: 'milestone', criteria: { type: 'continents', threshold: 3 }, target: 3, unitLabel: 'continentes', xpReward: 150, defaultTitle: 'Tres Continentes', defaultDescription: 'Pisá 3 continentes' },
  { id: 'wanderlust', icon: '🧭', tier: 'gold', category: 'exploration', type: 'milestone', criteria: { type: 'countries', threshold: 10 }, target: 10, unitLabel: 'países', xpReward: 150, defaultTitle: 'Alma Nómada', defaultDescription: 'Visitá 10 países' },
  { id: 'continent5', icon: '🌍', tier: 'gold', category: 'exploration', type: 'milestone', criteria: { type: 'continents', threshold: 5 }, target: 5, unitLabel: 'continentes', xpReward: 150, defaultTitle: 'Ciudadano del Mundo', defaultDescription: 'Pisá 5 continentes' },
  { id: 'cartographer', icon: '🗺️', tier: 'platinum', category: 'exploration', type: 'milestone', criteria: { type: 'countries', threshold: 25 }, target: 25, unitLabel: 'países', xpReward: 200, defaultTitle: 'Cartógrafo', defaultDescription: 'Visitá 25 países' },
  { id: 'world_adventurer', icon: '🧭', tier: 'diamond', category: 'exploration', type: 'milestone', criteria: { type: 'countries', threshold: 100 }, target: 100, unitLabel: 'países', xpReward: 300, defaultTitle: 'Aventurero Global', defaultDescription: 'Visitá 100 países' },
  { id: 'legend', icon: '👑', tier: 'diamond', category: 'exploration', type: 'milestone', criteria: { type: 'countries', threshold: 50 }, target: 50, unitLabel: 'países', xpReward: 300, defaultTitle: 'Leyenda Viviente', defaultDescription: 'Visitá 50 países' },
  // ═══ movement — Odómetro, Tiempo y Movimiento ═══
  { id: 'three_trips', icon: '✈️', tier: 'bronze', category: 'movement', type: 'milestone', criteria: { type: 'trips', threshold: 3 }, target: 3, unitLabel: 'viajes', xpReward: 100, defaultTitle: 'Viajero Recurrente', defaultDescription: 'Registrá 3 viajes' },
  { id: 'road_warrior', icon: '🛣️', tier: 'silver', category: 'movement', type: 'milestone', criteria: { type: 'trips', threshold: 10 }, target: 10, unitLabel: 'viajes', xpReward: 150, defaultTitle: 'Viajero Incansable', defaultDescription: 'Registrá 10 viajes' },
  { id: 'centurion', icon: '💎', tier: 'platinum', category: 'movement', type: 'milestone', criteria: { type: 'trips', threshold: 25 }, target: 25, unitLabel: 'viajes', xpReward: 200, defaultTitle: 'Centenario', defaultDescription: 'Registrá 25 viajes' },
  { id: 'marathoner', icon: '🏃', tier: 'platinum', category: 'movement', type: 'milestone', criteria: { type: 'trips', threshold: 50 }, target: 50, unitLabel: 'viajes', xpReward: 250, defaultTitle: 'Maratonista', defaultDescription: 'Registrá 50 viajes' },
  { id: 'odometer_rolling', icon: '🛞', tier: 'silver', category: 'movement', type: 'tiered', criteria: { type: 'total_km', threshold: 2500 }, tiers: [2500, 10000, 40075, 100000], target: 2500, unitLabel: 'km', xpReward: 250, defaultTitle: 'Odómetro en Marcha', defaultDescription: 'Kilómetros recorridos' },
  { id: 'around_the_world', icon: '🌐', tier: 'legend', category: 'movement', type: 'milestone', criteria: { type: 'total_km', threshold: 40075 }, target: 40075, unitLabel: 'km', xpReward: 300, defaultTitle: 'Vuelta al Mundo', defaultDescription: '40.075 km acumulados' },
  { id: 'iron_spirit', icon: '🚆', tier: 'silver', category: 'movement', type: 'tiered', criteria: { type: 'train_legs', threshold: 2 }, tiers: [2, 5, 12, 25], target: 2, unitLabel: 'tramos', xpReward: 200, defaultTitle: 'Espíritu Ferroviario', defaultDescription: 'Tramos en tren' },
  { id: 'road_king', icon: '🚗', tier: 'silver', category: 'movement', type: 'tiered', criteria: { type: 'car_legs', threshold: 2 }, tiers: [2, 5, 12, 25], target: 2, unitLabel: 'tramos', xpReward: 200, defaultTitle: 'Rey de la Ruta', defaultDescription: 'Tramos en auto / roadtrip' },
  { id: 'sea_wolf', icon: '⛴️', tier: 'bronze', category: 'movement', type: 'milestone', criteria: { type: 'ship_legs', threshold: 1 }, target: 1, unitLabel: 'tramos', xpReward: 150, defaultTitle: 'Lobo de Mar', defaultDescription: 'Al menos un tramo en barco/ferry' },
  { id: 'sky_captain', icon: '✈️', tier: 'silver', category: 'movement', type: 'tiered', criteria: { type: 'plane_legs', threshold: 3 }, tiers: [3, 10, 25, 50], target: 3, unitLabel: 'tramos', xpReward: 200, defaultTitle: 'Capitán del Cielo', defaultDescription: 'Tramos en avión' },
  { id: 'route_polyglot', icon: '🚆', tier: 'silver', category: 'movement', type: 'milestone', criteria: { type: 'transport_modes', threshold: 3 }, target: 3, unitLabel: 'medios', xpReward: 200, defaultTitle: 'Políglota de Rutas', defaultDescription: 'Usá 3+ medios de transporte' },
  { id: 'day_escapist', icon: '☀️', tier: 'bronze', category: 'movement', type: 'tiered', criteria: { type: 'day_trips', threshold: 1 }, tiers: [1, 3, 8, 15], target: 1, unitLabel: 'escapadas', xpReward: 150, defaultTitle: 'Escapista de Día', defaultDescription: 'Escapadas por el día' },
  { id: 'epic_route', icon: '🗺️', tier: 'gold', category: 'movement', type: 'milestone', criteria: { type: 'max_stops', threshold: 6 }, target: 6, unitLabel: 'paradas', xpReward: 200, defaultTitle: 'Ruta Épica', defaultDescription: 'Un viaje con 6+ paradas' },
  { id: 'time_traveler', icon: '⏳', tier: 'gold', category: 'movement', type: 'tiered', criteria: { type: 'total_days', threshold: 15 }, tiers: [15, 60, 180, 365], target: 15, unitLabel: 'días', xpReward: 250, defaultTitle: 'Viajero del Tiempo', defaultDescription: 'Días totales de viaje' },
  { id: 'nomad', icon: '🧭', tier: 'gold', category: 'movement', type: 'milestone', criteria: { type: 'max_days', threshold: 21 }, target: 21, unitLabel: 'días', xpReward: 250, defaultTitle: 'Nómade', defaultDescription: 'Un viaje de 21+ días' },
  { id: 'four_seasons', icon: '🍂', tier: 'silver', category: 'movement', type: 'milestone', criteria: { type: 'quarters', threshold: 4 }, target: 4, unitLabel: 'trimestres', xpReward: 200, defaultTitle: 'Cuatro Estaciones', defaultDescription: 'Viajes en los 4 trimestres' },
  { id: 'new_year_on_road', icon: '🎆', tier: 'silver', category: 'movement', type: 'milestone', criteria: { type: 'new_year', threshold: 1 }, target: 1, unitLabel: '', xpReward: 150, defaultTitle: 'Fin de Año en Ruta', defaultDescription: 'Un viaje que cruza fin de año' },
  // ═══ narrative — Crónica, Fotografía y Cultura ═══
  { id: 'first_photo', icon: '📸', tier: 'bronze', category: 'narrative', type: 'milestone', criteria: { type: 'has_photo', threshold: 1 }, target: 1, unitLabel: 'fotos', xpReward: 100, defaultTitle: 'Ojo de Fotógrafo', defaultDescription: 'Subí tu primera foto' },
  { id: 'first_detail', icon: '📍', tier: 'bronze', category: 'narrative', type: 'milestone', criteria: { type: 'has_detail', threshold: 1 }, target: 1, unitLabel: '', xpReward: 100, defaultTitle: 'Detallista', defaultDescription: 'Agregá detalles a un destino' },
  { id: 'first_dates', icon: '📅', tier: 'bronze', category: 'narrative', type: 'milestone', criteria: { type: 'has_dates', threshold: 1 }, target: 1, unitLabel: '', xpReward: 100, defaultTitle: 'Cronometrador', defaultDescription: 'Asigná fechas a una aventura' },
  { id: 'storyteller', icon: '📖', tier: 'gold', category: 'narrative', type: 'milestone', criteria: { type: 'detailed_trips', threshold: 5 }, target: 5, unitLabel: 'viajes', xpReward: 150, defaultTitle: 'Cuenta Cuentos', defaultDescription: '5 viajes con 3+ paradas' },
  { id: 'paparazzi', icon: '📸', tier: 'gold', category: 'narrative', type: 'tiered', criteria: { type: 'photos', threshold: 10 }, tiers: [10, 50, 150, 300], target: 10, unitLabel: 'fotos', xpReward: 150, targetTab: 'gallery', defaultTitle: 'Fotógrafo de Ruta', defaultDescription: 'Fotos en galería' },
  { id: 'detailed_chronicler', icon: '✍️', tier: 'silver', category: 'narrative', type: 'tiered', criteria: { type: 'chronicle_stops', threshold: 3 }, tiers: [3, 10, 25, 50], target: 3, unitLabel: 'paradas', xpReward: 150, targetTab: 'details', defaultTitle: 'Cronista Documental', defaultDescription: 'Paradas con relato' },
  { id: 'perfect_trilogy', icon: '🍽️', tier: 'silver', category: 'narrative', type: 'tiered', criteria: { type: 'trilogy_trips', threshold: 1 }, tiers: [1, 3, 8, 15], target: 1, unitLabel: 'viajes', xpReward: 200, defaultTitle: 'Trilogía Perfecta', defaultDescription: 'Viajes con Trilogía completa' },
  { id: 'border_taster', icon: '🍜', tier: 'silver', category: 'narrative', type: 'tiered', criteria: { type: 'food_trips', threshold: 2 }, tiers: [2, 5, 12, 25], target: 2, unitLabel: 'sabores', xpReward: 150, targetTab: 'details', defaultTitle: 'Paladar Sin Fronteras', defaultDescription: 'Mejores sabores registrados' },
  { id: 'corner_collector', icon: '📍', tier: 'silver', category: 'narrative', type: 'tiered', criteria: { type: 'poi_count', threshold: 5 }, tiers: [5, 20, 50, 100], target: 5, unitLabel: 'lugares', xpReward: 200, targetTab: 'stops', defaultTitle: 'Coleccionista de Rincones', defaultDescription: 'Lugares/POIs registrados' },
  { id: 'gastronomy_lover', icon: '🍷', tier: 'silver', category: 'narrative', type: 'tiered', criteria: { type: 'gastronomy_pois', threshold: 3 }, tiers: [3, 10, 25, 50], target: 3, unitLabel: 'lugares', xpReward: 150, defaultTitle: 'Amante de la Gastronomía', defaultDescription: 'POIs gastronómicos' },
  { id: 'culture_seeker', icon: '🏛️', tier: 'silver', category: 'narrative', type: 'tiered', criteria: { type: 'culture_pois', threshold: 3 }, tiers: [3, 10, 25, 50], target: 3, unitLabel: 'lugares', xpReward: 150, defaultTitle: 'Buscador de Cultura', defaultDescription: 'POIs culturales / monumentos' },
  { id: 'heart_marker', icon: '❤️', tier: 'bronze', category: 'narrative', type: 'tiered', criteria: { type: 'favorite_stops', threshold: 1 }, tiers: [1, 5, 15, 30], target: 1, unitLabel: 'paradas', xpReward: 150, defaultTitle: 'Corazón Viajero', defaultDescription: 'Paradas favoritas' },

  // ═══ tribe_dreams — Tribu y Sueños ═══
  { id: 'solo_adventure', icon: '🧍', tier: 'bronze', category: 'tribe_dreams', type: 'milestone', criteria: { type: 'solo_trips', threshold: 1 }, target: 1, unitLabel: 'viajes', xpReward: 150, defaultTitle: 'Aventura en Solitario', defaultDescription: 'Tu primer viaje en solitario' },
  { id: 'route_duo', icon: '💑', tier: 'silver', category: 'tribe_dreams', type: 'tiered', criteria: { type: 'couple_trips', threshold: 1 }, tiers: [1, 3, 8, 15], target: 1, unitLabel: 'viajes', xpReward: 150, defaultTitle: 'Dúo de Ruta', defaultDescription: 'Viajes en pareja' },
  { id: 'tribe_traveler', icon: '👨‍👩‍👧', tier: 'silver', category: 'tribe_dreams', type: 'tiered', criteria: { type: 'group_trips', threshold: 1 }, tiers: [1, 3, 8, 15], target: 1, unitLabel: 'viajes', xpReward: 150, targetTab: 'details', defaultTitle: 'Viajero en Tribu', defaultDescription: 'Viajes en familia o con amigos' },
  { id: 'dream_architect', icon: '✨', tier: 'silver', category: 'tribe_dreams', type: 'tiered', criteria: { type: 'wishlist_count', threshold: 3 }, tiers: [3, 8, 15, 30], target: 3, unitLabel: 'destinos', xpReward: 150, targetTab: 'wishlist', defaultTitle: 'Arquitecto de Sueños', defaultDescription: 'Destinos en tu Wishlist' },
  { id: 'dream_fulfilled', icon: '🌟', tier: 'gold', category: 'tribe_dreams', type: 'milestone', criteria: { type: 'wishlist_completed', threshold: 1 }, target: 1, unitLabel: 'destinos', xpReward: 200, defaultTitle: 'Sueño Cumplido', defaultDescription: 'Un destino de tu Wishlist ya visitado' },
];
