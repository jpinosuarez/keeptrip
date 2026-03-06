# Plan: Arquitectura Soft Launch — Keeptrip

**TL;DR**: Plan de 6 áreas para preparar Keeptrip (React 19/Vite/Firebase) para soft launch: Motor de Gamificación con Traveler Hub Bento UI, i18n bilingüe, PWA, optimización de imágenes, onboarding con tooltips, y seguridad + offline. Ejecución en **4 fases secuenciales**.

---

## Diagnóstico del Estado Actual

| Aspecto | Estado |
|---------|--------|
| Gamificación | 6 niveles por países en `travelerLevel.js`, `LevelUpModal` con confetti. **No hay achievements/badges** |
| Bento UI | `BentoGrid` + `BentoCard` funcionales. Glassmorphism tokenizado en `theme.js` |
| Compresión imágenes | **YA EXISTE** en `imageUtils.js`: adaptativa, Canvas API, target ≤500KB |
| i18n | **Nada implementado**. Strings hardcodeados en español |
| PWA | **Nada implementado**. Sin manifest, sin service worker |
| Seguridad tokens | Mapbox y Pexels expuestos en bundle cliente via `VITE_*` |
| Offline | Sin manejo. Firestore persistence no habilitada |
| 195 países | `MAPA_SELLOS` ya tiene `nombreEspanol` + `name` (EN) — base para i18n de países |

---

## Área 1: Motor de Gamificación y Traveler Hub

### Arquitectura propuesta

**Nuevo engine**: `src/engines/achievementsEngine.js` — función pura `evaluateAchievements(userData)` que evalúa el historial completo del usuario contra definiciones de logros.

- **Definiciones** en `src/engines/achievementDefinitions.js`: cada logro = `{ id, name_key, icon, category, condition(userData) → { unlocked, progress } }`
- **Evaluación en cliente**: Compara definiciones vs datos de `useViajes` + `MAPA_SELLOS`
- **Persistencia**: `usuarios/{userId}/achievements/{id}` en Firestore (solo logros desbloqueados + timestamp)
- **Hook**: `useAchievements.js` orquesta engine + Firestore + dispara celebración (reutiliza `LevelUpModal`)

### Brainstorming: 7 Logros

| ID | Nombre | Condición | Icono | Categoría |
|----|--------|-----------|-------|-----------|
| `first_stamp` | Primer Sello | 1 viaje registrado | 🎫 | Hitos |
| `continent_collector` | Coleccionista de Continentes | 5 continentes visitados | 🌍 | Geografía |
| `storyteller` | Narrador Nato | Relato escrito en 5+ paradas | ✍️ | Narrativa |
| `road_warrior` | Guerrero del Camino | 3+ medios de transporte distintos | 🚂 | Transporte |
| `city_hopper` | Saltaciudades | 20+ ciudades únicas | 🏙️ | Geografía |
| `photographer` | Fotógrafo Viajero | 50+ fotos subidas | 📸 | Contenido |
| `globe_trotter_10` | Decápolis | 10 países visitados | 🗺️ | Hitos |

### Traveler Hub — Bento UI

Nuevo componente `TravelerHub.jsx` que reemplaza el concepto de pasaporte-libro por un dashboard estilo **Apple Fitness / Duolingo**:

- **Card Nivel** — Nivel actual + barra progreso + próximo (adaptar `PerfilBiometrico`)
- **Card Mapa** — Mini mapa con países pintados (adaptar `HomeMap`)
- **Card Stats** — Estadísticas clave (reutilizar lógica de `StatsMapa` + `StatsBitacora`)
- **Card Logros** — Grid de badges: desbloqueados brillantes con color, bloqueados con glassmorphism difuminado + lock icon
- **Card Actividad** — Timeline de actividad reciente

Layout: Bento Grid responsivo reutilizando tokens `GLASS`, `SHADOWS`, `RADIUS` de `theme.js`. Animaciones con Framer Motion `layoutId`.

---

## Área 2: Internacionalización (i18n)

### Arquitectura

Librería: `react-i18next` + `i18next`. Namespaces por área funcional:

```
src/i18n/
  index.js                    ← Config i18next
  locales/
    es/ { common, dashboard, hub, editor, visor, settings, achievements }.json
    en/ { common, dashboard, hub, editor, visor, settings, achievements }.json
```

### Principio UGC intacto

- **Se traduce**: Labels, botones, placeholders, tooltips, nombres de sección, nombres de logros
- **NO se traduce**: `titulo`, `texto`, `relato`, `highlights.*`, `notaCorta` — contenido del usuario se renderiza tal cual desde Firestore
- **Países**: `MAPA_SELLOS` ya tiene `nombreEspanol` + `name` — un helper resuelve según locale activo

### Detección de idioma

- Default: `navigator.language`
- Override: selector en Settings → persiste en `localStorage` + perfil Firestore
- Lazy loading por namespace (solo carga el JSON del componente activo)

---

## Área 3: Transformación a PWA

### Configuración

Plugin: `vite-plugin-pwa` (Workbox). `registerType: 'prompt'` (no fuerza recarga).

**Estrategia de caché runtime:**

| Recurso | Estrategia | TTL |
|---------|------------|-----|
| Mapbox tiles | CacheFirst | 30 días |
| Firebase Auth | NetworkFirst | — |
| Firestore | SDK offline nativo (IndexedDB) | — |
| Imágenes gallery (Storage) | CacheFirst | 7 días, max 100 |
| Flags CDN | CacheFirst | 30 días |
| App shell (JS/CSS) | Precache | — |

**Manifest**: `theme_color: #FF6B35` (atomicTangerine), `background_color: #F4EDE4` (linen), `display: standalone`, iconos 192/512/maskable.

**Firestore Offline**: Habilitar `enableMultiTabIndexedDbPersistence()` en `firebase.js` — las queries de `useViajes` funcionan offline automáticamente; escrituras se encolan y sincronizan al reconectar.

---

## Área 4: Rendimiento — Compresión de Imágenes

### Diagnóstico: ya existe pipeline funcional

`imageUtils.js` ya implementa compresión adaptativa (Canvas API, max 1920px, target ≤500KB). **No requiere reescritura**, solo mejoras:

1. **Web Worker**: Evaluar `browser-image-compression` para mover compresión fuera del hilo principal (mejora UX en archivos >5MB)
2. **UI de progreso**: Mostrar tamaño original vs comprimido durante la subida
3. **Validación pre-subida**: Rechazar archivos >15MB antes de comprimir (prevenir crashes en móviles gama baja)

Interfaz pública `comprimirImagen(file) → Blob` se mantiene idéntica.

---

## Área 5: UX / Onboarding — InfoTooltip

### Componente `<InfoTooltip />`

- Ícono `HelpCircle` de Lucide (16px, `mutedTeal`)
- Popover con glassmorphism (`GLASS.light`) al hover (desktop) / tap (mobile)
- Posicionamiento: `@floating-ui/react-dom` (~5KB) o cálculo manual de viewport
- Animación: Framer Motion fadeIn + scale
- Textos i18n-ready via `t('editor.vibe_help')`

### Campos que lo necesitan en `EdicionModal`

| Campo | Tooltip |
|-------|---------|
| Vibe | "Etiquetas que capturan la esencia de tu viaje. ¿Fue relajante, aventurero, cultural?" |
| Highlights | "Los momentos que no quieres olvidar: mejor comida, mejor vista, mejor consejo" |
| Relato Fragmentado | "Escribe la historia de cada parada por separado. Tu viaje se narra paso a paso" |
| Presupuesto | "Una referencia del nivel de gasto para este viaje" |

---

## Área 6: Seguridad y Offline Fallback

### Token Mapbox

- **Acción**: Crear token de producción **restringido por URL** en el dashboard de Mapbox (`https://tu-dominio.com`). Token de dev sin restricción para localhost.
- NO requiere proxy — Mapbox está diseñado para tokens públicos con restricción por dominio.

### Token Pexels

- **Actualmente**: expuesto en cliente (`VITE_PEXELS_ACCESS_KEY`)
- **Ideal**: Firebase Cloud Function como proxy (`functions/pexelsProxy.js`) que valida Auth token
- **Marcado como opcional** en Fase 4 — riesgo bajo porque Pexels tiene rate limiting propio

### Offline Fallback UI

- Nuevo `<OfflineBanner />`: listener `online`/`offline`, banner glassmorphism fijo con "Sin conexión — Los cambios se guardarán al reconectar"
- Auto-dismiss al reconectar + toast "Conexión restaurada"
- Mapbox: placeholder estático si no hay tiles en caché
- Imágenes: placeholder blur si no están en cache del Service Worker

---

## Roadmap de Ejecución — 4 Fases

### Fase 1: Cimientos (Sprint 1) — *Sin dependencias entre sí, paralelizables*

| # | Tarea | Archivos clave |
|---|-------|---------------|
| 1 | **i18n Setup** — Instalar `react-i18next`, crear config + diccionarios `common.json` ES/EN | `src/i18n/index.js`, `src/main.jsx` |
| 2 | **PWA Setup** — Instalar `vite-plugin-pwa`, manifest, iconos, SW básico | `vite.config.js`, `public/icons/` |
| 3 | **Firestore Offline** — Habilitar persistencia IndexedDB | `src/firebase.js` |
| 4 | **InfoTooltip** — Crear componente reutilizable | `src/components/Shared/InfoTooltip.jsx` |

**Verificación**: Build sin errores, PWA instalable, `t()` funciona, tooltip renderiza, datos persisten offline.

### Fase 2: Gamificación (Sprint 2-3) — *Depende de Fase 1 (i18n para logros)*

| # | Tarea | Archivos clave |
|---|-------|---------------|
| 5 | **Achievement Engine** + definiciones de 7 logros | `src/engines/achievementsEngine.js`, `achievementDefinitions.js` |
| 6 | **useAchievements Hook** + Firestore rules | `src/hooks/useAchievements.js`, `firestore.rules` |
| 7 | **Traveler Hub UI** — Layout Bento con 5 cards | `src/components/TravelerHub/` |
| 8 | **Navegación** — Vista 'hub' + Sidebar link + celebración | `UIContext.jsx`, `Sidebar.jsx`, `App.jsx` |

**Verificación**: Tests unitarios del engine, Hub renderiza con datos reales, logros se desbloquean y persisten, responsive mobile/desktop.

### Fase 3: i18n Completa + UX (Sprint 4) — *Depende de Fase 1 + 2*

| # | Tarea |
|---|-------|
| 9 | **Migrar strings** de todos los componentes a JSONs por namespace |
| 10 | **Selector de idioma** en Settings con persistencia |
| 11 | **InfoTooltip** en EdicionModal (Vibe, Highlights, Relato, Presupuesto) |
| 12 | **Nombres de países bilingües** — helper con locale activo |

**Verificación**: UI completa en EN/ES, UGC intacto, tooltips en formularios, sin strings hardcodeados.

### Fase 4: Seguridad, Rendimiento y Polish (Sprint 5-6) — *Depende de Fase 3*

| # | Tarea |
|---|-------|
| 13 | **Mapbox token restriction** por dominio + documentar |
| 14 | **OfflineBanner** + PWA Update Prompt |
| 15 | **Compresión mejorada** — evaluar `browser-image-compression`, UI progreso, validación >15MB |
| 16 | **Proxy Pexels** (opcional) — Cloud Function |
| 17 | **Lighthouse audit** — PWA ≥90, Performance ≥80 |

**Verificación**: Token restringido en prod, banner offline funcional, Lighthouse targets alcanzados.

---

### Decisiones clave

- Se mantiene routing por `vistaActiva` (no React Router) — se agrega vista `'hub'`
- El pasaporte-libro queda descartado → **Traveler Hub Bento UI**
- UGC nunca pasa por `t()` — solo labels de interfaz
- La compresión de imágenes existente no se reescribe, solo se mejora
- Firestore offline usa SDK nativo, no caché manual
- El proxy de Pexels es deseable pero opcional (Fase 4)
