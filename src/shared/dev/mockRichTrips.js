// src/shared/dev/mockRichTrips.js
/**
 * "Rich" DEV persona dataset (Block 2.3 analytics stress fixture).
 *
 * 10 trips spread across 2023-2026 touching all 5 classical continents and the
 * four cardinal extremes, so the analytics engine can render real polar,
 * odometer and seasonality values:
 *   - North  ~ 69.65°N  (Tromsø, NO)
 *   - South  ~ -54.80°S (Ushuaia, AR)
 *   - East   ~ 179.88°E (Taveuni, FJ — antimeridian)
 *   - West   ~ -155.99°W (Kailua-Kona, US)
 *
 * Coordinates are `[lng, lat]` (canonical Keeptrip city record order).
 */
export const MOCK_TRIPS_RICH = [
  {
    id: 'trip-arctic-norway',
    titulo: 'Auroras en el Ártico',
    destino: 'Tromsø',
    fechaInicio: '2023-02-10',
    fechaFin: '2023-02-18',
    paisCodigo: 'NO',
    banderas: ['https://flagcdn.com/w40/no.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1200&auto=format&fit=crop&q=80',
    texto: 'Noches de aurora boreal sobre los fiordos y trineos por la tundra.',
    highlights: {
      topFood: 'Salmón a la parrilla del fiordo',
      topView: 'Aurora boreal desde Telegrafbukta',
      topTip: 'Reservar el avistamiento después de las 22:00'
    },
    companions: [{ name: 'Valeria', status: 'accepted' }],
    vibe: ['Aventura', 'Naturaleza'],
    paradas: [
      {
        id: 'stop-tromso',
        nombre: 'Tromsø',
        ciudad: 'Tromsø',
        paisCodigo: 'NO',
        coordenadas: [18.9553, 69.6492],
        fechaLlegada: '2023-02-10',
        fechaSalida: '2023-02-18',
        nota: 'Fiordo de Kvaløya y teleférico de Storsteinen.',
        orden: 1
      }
    ]
  },
  {
    id: 'trip-cape-town',
    titulo: 'Cabo de Buena Esperanza',
    destino: 'Ciudad del Cabo',
    fechaInicio: '2023-11-05',
    fechaFin: '2023-11-16',
    paisCodigo: 'ZA',
    banderas: ['https://flagcdn.com/w40/za.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&auto=format&fit=crop&q=80',
    texto: 'Table Mountain, pingüinos de Boulders Beach y viñedos de Stellenbosch.',
    highlights: {
      topFood: 'Braai en Bo-Kaap',
      topView: 'Atardecer desde Signal Hill',
      topTip: 'Subir a Table Mountain temprano para evitar el viento'
    },
    companions: [{ name: 'Valeria', status: 'accepted' }],
    vibe: ['Cultural', 'Naturaleza'],
    paradas: [
      {
        id: 'stop-cape-town',
        nombre: 'Ciudad del Cabo',
        ciudad: 'Ciudad del Cabo',
        paisCodigo: 'ZA',
        coordenadas: [18.4241, -33.9249],
        fechaLlegada: '2023-11-05',
        fechaSalida: '2023-11-12',
        nota: 'Table Mountain y Boulders Beach.',
        orden: 1
      },
      {
        id: 'stop-stellenbosch',
        nombre: 'Stellenbosch',
        ciudad: 'Stellenbosch',
        paisCodigo: 'ZA',
        coordenadas: [18.8602, -33.9321],
        fechaLlegada: '2023-11-12',
        fechaSalida: '2023-11-16',
        nota: 'Ruta del vino por las Cape Winelands.',
        orden: 2
      }
    ]
  },
  {
    id: 'trip-ushuaia',
    titulo: 'Fin del Mundo',
    destino: 'Ushuaia',
    fechaInicio: '2024-01-08',
    fechaFin: '2024-01-19',
    paisCodigo: 'AR',
    banderas: ['https://flagcdn.com/w40/ar.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1200&auto=format&fit=crop&q=80',
    texto: 'Glaciares patagónicos y navegación por el Canal Beagle.',
    highlights: {
      topFood: 'Cordero fueguino al asador',
      topView: 'Glaciar Perito Moreno',
      topTip: 'Reservar el catamarán del Beagle con 48h de antelación'
    },
    companions: [{ name: 'Familia', status: 'accepted' }],
    vibe: ['Aventura', 'Naturaleza'],
    paradas: [
      {
        id: 'stop-el-calafate',
        nombre: 'El Calafate',
        ciudad: 'El Calafate',
        paisCodigo: 'AR',
        coordenadas: [-72.2648, -50.3379],
        fechaLlegada: '2024-01-08',
        fechaSalida: '2024-01-12',
        nota: 'Glaciar Perito Moreno.',
        orden: 1
      },
      {
        id: 'stop-ushuaia',
        nombre: 'Ushuaia',
        ciudad: 'Ushuaia',
        paisCodigo: 'AR',
        coordenadas: [-68.303, -54.8019],
        fechaLlegada: '2024-01-12',
        fechaSalida: '2024-01-19',
        nota: 'Faro Les Éclaireurs y Parque Nacional Tierra del Fuego.',
        orden: 2
      }
    ]
  },
  {
    id: 'trip-japan-spring',
    titulo: 'Sakura entre neones',
    destino: 'Tokio & Kioto',
    fechaInicio: '2024-04-02',
    fechaFin: '2024-04-14',
    paisCodigo: 'JP',
    banderas: ['https://flagcdn.com/w40/jp.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    texto: 'Cerezos en flor, templos de Kioto y el pulso nocturno de Shibuya.',
    highlights: {
      topFood: 'Ramen tonkotsu en Ichiran',
      topView: 'Fushimi Inari al amanecer',
      topTip: 'Comprar el JR Pass antes de viajar'
    },
    companions: [{ name: 'Valeria', status: 'accepted' }],
    vibe: ['Cultural', 'Fotografía'],
    paradas: [
      {
        id: 'stop-tokyo',
        nombre: 'Tokio',
        ciudad: 'Tokio',
        paisCodigo: 'JP',
        coordenadas: [139.6917, 35.6895],
        fechaLlegada: '2024-04-02',
        fechaSalida: '2024-04-08',
        nota: 'Shibuya, Shinjuku Gyoen y teamLab.',
        orden: 1
      },
      {
        id: 'stop-kyoto',
        nombre: 'Kioto',
        ciudad: 'Kioto',
        paisCodigo: 'JP',
        coordenadas: [135.7681, 35.0116],
        fechaLlegada: '2024-04-08',
        fechaSalida: '2024-04-14',
        nota: 'Fushimi Inari, Arashiyama y Gion.',
        orden: 2
      }
    ]
  },
  {
    id: 'trip-iceland-ring-road',
    titulo: 'Anillo de Fuego y Hielo',
    destino: 'Islandia',
    fechaInicio: '2024-09-12',
    fechaFin: '2024-09-24',
    paisCodigo: 'IS',
    banderas: ['https://flagcdn.com/w40/is.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1200&auto=format&fit=crop&q=80',
    texto: 'Círculo Dorado, glaciares y ballenas en el norte de la isla.',
    highlights: {
      topFood: 'Sopa de cordero islandés',
      topView: 'Gullfoss y Geysir en el Círculo Dorado',
      topTip: 'Alquilar 4x4 para el interior (F-roads)'
    },
    companions: [{ name: 'Valeria', status: 'accepted' }],
    vibe: ['Naturaleza', 'Aventura'],
    paradas: [
      {
        id: 'stop-reykjavik',
        nombre: 'Reikiavik',
        ciudad: 'Reikiavik',
        paisCodigo: 'IS',
        coordenadas: [-21.9426, 64.1466],
        fechaLlegada: '2024-09-12',
        fechaSalida: '2024-09-18',
        nota: 'Hallgrímskirkja, Blue Lagoon y Círculo Dorado.',
        orden: 1
      },
      {
        id: 'stop-akureyri',
        nombre: 'Akureyri',
        ciudad: 'Akureyri',
        paisCodigo: 'IS',
        coordenadas: [-18.0878, 65.6835],
        fechaLlegada: '2024-09-18',
        fechaSalida: '2024-09-24',
        nota: 'Avistamiento de ballenas en Húsavík.',
        orden: 2
      }
    ]
  },
  {
    id: 'trip-fiji-antimeridian',
    titulo: 'Lagunas del Antimeridiano',
    destino: 'Taveuni',
    fechaInicio: '2025-03-03',
    fechaFin: '2025-03-14',
    paisCodigo: 'FJ',
    banderas: ['https://flagcdn.com/w40/fj.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&auto=format&fit=crop&q=80',
    texto: 'Arrecifes de coral, cascadas y el salto de fecha del meridiano 180.',
    highlights: {
      topFood: 'Kokoda de pescado con coco',
      topView: 'Bouma Falls y el jardín de corales',
      topTip: 'Llevar calzado de arrecife para las mareas'
    },
    companions: [{ name: 'Valeria', status: 'accepted' }],
    vibe: ['Relax', 'Naturaleza'],
    paradas: [
      {
        id: 'stop-taveuni',
        nombre: 'Taveuni',
        ciudad: 'Taveuni',
        paisCodigo: 'FJ',
        coordenadas: [179.8833, -16.7833],
        fechaLlegada: '2025-03-03',
        fechaSalida: '2025-03-14',
        nota: 'Parque Marino Rainbow Reef y línea internacional de cambio de fecha.',
        orden: 1
      }
    ]
  },
  {
    id: 'trip-hawaii-volcanoes',
    titulo: 'Volcanes de Hawái',
    destino: 'Isla Grande',
    fechaInicio: '2025-07-15',
    fechaFin: '2025-07-27',
    paisCodigo: 'US',
    banderas: ['https://flagcdn.com/w40/us.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1542259009477-d625272157b7?w=1200&auto=format&fit=crop&q=80',
    texto: 'Lava del Kilauea, playas negras y snorkel con mantas nocturnas.',
    highlights: {
      topFood: 'Poke de atún fresco en Kona',
      topView: 'Crateres del Parque Nacional de los Volcanes',
      topTip: 'Alquilar coche: la isla es enorme y sin transporte público'
    },
    companions: [{ name: 'Familia', status: 'accepted' }],
    vibe: ['Aventura', 'Relax'],
    paradas: [
      {
        id: 'stop-kailua-kona',
        nombre: 'Kailua-Kona',
        ciudad: 'Kailua-Kona',
        paisCodigo: 'US',
        coordenadas: [-155.9969, 19.64],
        fechaLlegada: '2025-07-15',
        fechaSalida: '2025-07-21',
        nota: 'Snorkel con mantarrayas y café de Kona.',
        orden: 1
      },
      {
        id: 'stop-hilo',
        nombre: 'Hilo',
        ciudad: 'Hilo',
        paisCodigo: 'US',
        coordenadas: [-155.09, 19.7241],
        fechaLlegada: '2025-07-21',
        fechaSalida: '2025-07-27',
        nota: 'Volcanoes National Park y Akaka Falls.',
        orden: 2
      }
    ]
  },
  {
    id: 'trip-bali-year-end',
    titulo: 'Arrozales y templos de Bali',
    destino: 'Bali',
    fechaInicio: '2025-12-20',
    fechaFin: '2026-01-04',
    paisCodigo: 'ID',
    banderas: ['https://flagcdn.com/w40/id.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=80',
    texto: 'Fin de año entre terrazas de arroz, templos y olas del Índico.',
    highlights: {
      topFood: 'Nasi campur en un warung de Ubud',
      topView: 'Tegallalang al amanecer',
      topTip: 'Evitar diciembre si buscas calma: es temporada alta'
    },
    companions: [{ name: 'Valeria', status: 'accepted' }],
    vibe: ['Relax', 'Cultural'],
    paradas: [
      {
        id: 'stop-denpasar',
        nombre: 'Denpasar',
        ciudad: 'Denpasar',
        paisCodigo: 'ID',
        coordenadas: [115.1889, -8.4095],
        fechaLlegada: '2025-12-20',
        fechaSalida: '2025-12-28',
        nota: 'Canggu, Uluwatu y playas del sur.',
        orden: 1
      },
      {
        id: 'stop-ubud',
        nombre: 'Ubud',
        ciudad: 'Ubud',
        paisCodigo: 'ID',
        coordenadas: [115.2625, -8.5069],
        fechaLlegada: '2025-12-28',
        fechaSalida: '2026-01-04',
        nota: 'Terrazas de Tegallalang y Monkey Forest.',
        orden: 2
      }
    ]
  },
  {
    id: 'trip-marrakech',
    titulo: 'Zocos y desierto',
    destino: 'Marrakech',
    fechaInicio: '2026-02-11',
    fechaFin: '2026-02-20',
    paisCodigo: 'MA',
    banderas: ['https://flagcdn.com/w40/ma.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1489493585363-d69421e0edd3?w=1200&auto=format&fit=crop&q=80',
    texto: 'Medina, riads y una noche en las dunas de Merzouga.',
    highlights: {
      topFood: 'Tanja de cordero en Jemaa el-Fna',
      topView: 'Amanecer sobre las dunas de Merzouga',
      topTip: 'Regatear siempre con una sonrisa y en dirhams'
    },
    companions: [{ name: 'Familia', status: 'accepted' }],
    vibe: ['Cultural', 'Fotografía'],
    paradas: [
      {
        id: 'stop-marrakech',
        nombre: 'Marrakech',
        ciudad: 'Marrakech',
        paisCodigo: 'MA',
        coordenadas: [-7.9811, 31.6295],
        fechaLlegada: '2026-02-11',
        fechaSalida: '2026-02-20',
        nota: 'Jemaa el-Fna, Bahía Palace y escape a las dunas.',
        orden: 1
      }
    ]
  },
  {
    id: 'trip-san-francisco',
    titulo: 'Bahía de San Francisco',
    destino: 'San Francisco',
    fechaInicio: '2026-05-06',
    fechaFin: '2026-05-15',
    paisCodigo: 'US',
    banderas: ['https://flagcdn.com/w40/us.png'],
    portadaUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&auto=format&fit=crop&q=80',
    texto: 'Golden Gate, cable cars y niebla sobre el Pacífico.',
    highlights: {
      topFood: 'Clam chowder en Fisherman\u2019s Wharf',
      topView: 'Golden Gate desde Battery Spencer',
      topTip: 'Comprar el Muni Passport para moverte sin coche'
    },
    companions: [{ name: 'Valeria', status: 'accepted' }],
    vibe: ['Cultural', 'Fotografía'],
    paradas: [
      {
        id: 'stop-san-francisco',
        nombre: 'San Francisco',
        ciudad: 'San Francisco',
        paisCodigo: 'US',
        coordenadas: [-122.4194, 37.7749],
        fechaLlegada: '2026-05-06',
        fechaSalida: '2026-05-15',
        nota: 'Golden Gate, Alcatraz y el barrio de Mission.',
        orden: 1
      }
    ]
  }
];
