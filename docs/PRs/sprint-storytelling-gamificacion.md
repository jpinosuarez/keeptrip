# Sprint de Producto: Storytelling, Gamificación y Viralidad

## Documento de Análisis y Plan de Acción — Lead Product Designer Review

**Fecha:** 5 de marzo de 2026  
**Reviewer:** Lead Product Designer / Senior Frontend Architect  
**Estado:** Pendiente de aprobación del equipo

---

## 1. Crítica y Mejora del Borrador

### 1.1 Bug: `fitMapToBounds` no centra en modal móvil

**Diagnóstico tras auditoría del código:**

El borrador menciona que `fitBounds` no se ejecuta por una restricción `!isModal`, pero tras revisar `RouteMap.jsx` línea a línea, esa restricción **no existe en el código actual**. El `useEffect` de `fitBounds` (líneas 68-82) depende únicamente de `[mapLoaded, paradas]` y se ejecuta sin condición de `isModal`.

**El bug real es otro:** Cuando el mapa se abre como modal fullscreen en móvil (`showMapModal`), el componente `<RouteMap>` se monta dentro de un `<div style={styles.mapModal}>` con `position: fixed; inset: 0`. El problema es una **race condition**: `mapLoaded` se dispara antes de que el contenedor del modal haya alcanzado sus dimensiones finales (la animación de apertura). `mapbox-gl` calcula los bounds contra un contenedor de `0x0px`, y el `fitBounds` se ejecuta sobre una geometría inválida.

**Solución propuesta:**
- Añadir un `setTimeout` de ~300ms (o mejor: un `ResizeObserver`) antes de ejecutar `fitBounds` cuando `isModal === true`.
- Alternativa: disparar un `map.resize()` seguido de `fitBounds` dentro del `onLoad` del `Map` cuando el modal está montado.

**Severidad:** Alta. Es la feature principal de navegación en mobile route-mode.

---

### 1.2 Bug: Iniciales de avatar rotas con emails

**Diagnóstico:**

En `VisorViaje.jsx` líneas 386-388 (hero companion dots) y línea 389 (context section), la lógica de iniciales es:

```js
{(c.name || 'U').split(' ').map(s => s[0]).slice(0, 2).join('')}
```

Cuando `c.name` es un email (ej: `usuario@gmail.com`), `split(' ')` devuelve `["usuario@gmail.com"]`, y `s[0]` produce `"u"` — una sola inicial en minúscula. No se rompe completamente pero es **visualmente pobre**.

**Mejora propuesta:**
- Crear una utility `getInitials(nameOrEmail)` en `utils/viajeUtils.js`:
  - Si contiene `@`, tomar la primera letra del local-part en uppercase.
  - Si es un nombre, tomar las primeras letras de cada palabra (máx 2).
  - Fallback: `"?"`.
- Reutilizar en ambos puntos del VisorViaje y en `InvitationsList.jsx`.

**Severidad:** Baja-media. Cosmético pero afecta la percepción de calidad.

---

### 1.3 contextGrid → Carrusel Horizontal en Mobile

**Acuerdo total con la propuesta.** El `contextGrid` actual usa:

```js
gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'
```

En pantallas <400px, las cards se apilan a 1 columna y empujan todo el contenido debajo. Polarsteps y Airbnb resuelven esto exactamente con un **swipeable horizontal carousel**.

**Recomendación técnica:**
- **NO instalar una librería de carrusel** (bloat innecesario). Usar CSS nativo:
  ```css
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  ```
- Cada `ContextCard` recibe `scroll-snap-align: start` y un `min-width: 200px`.
- Añadir **dot indicators** debajo para indicar la cantidad de cards (no arrows, es mobile-first).
- El comportamiento desktop se mantiene igual con el grid actual.

**Plus UX que propongo:** Añadir un **sutil gradient-fade** en el borde derecho del carrusel para indicar que hay más contenido ("peek" pattern, usado por Netflix, Spotify, Apple Music).

---

### 1.4 Estilos "fantasma" en VisorViaje.styles.js

**Hallazgos tras auditoría:**

El archivo tiene 666 líneas. Se identificaron estas claves exportadas que **no se referencian** en `VisorViaje.jsx`:

| Clave | Estado | Nota |
|-------|--------|------|
| `bodyContent` | ⚠️ MUERTA | Era del layout original pre-split. Reemplazada por `routeLayout`/`destinoBody`. |
| `mainColumn` | ⚠️ MUERTA | Idem. |
| `textArea` | ⚠️ MUERTA | Input de edición de texto movido a `EdicionModal`. |
| `sideColumn` | ⚠️ RECUPERADA | Tiene un comment "FIX: estaba referenciado pero no definido". Ya está definida pero aún no se usa. |
| `transportBadge` | ⚠️ MUERTA | El transporte se muestra como emoji en `transportIconOnLine`, no como badge. |
| `dateRange` | ⚠️ MUERTA | Reemplazada por `stopCardDate`. |

**Acción:** Eliminar las 6 claves muertas en un commit atómico de limpieza. Son ~40 líneas.

---

### 1.5 Bucle de Viralidad — Share to IG Stories

**Acuerdo con la visión. Cuestionamientos técnicos importantes:**

#### ❌ Cuello de botella: CORS con `html-to-image`

`html-to-image` (y su base `html2canvas`) necesitan renderizar imágenes del DOM a Canvas. Si la foto de portada del viaje viene de **Pexels** (dominio externo) o de **Firebase Storage** (dominio `firebasestorage.googleapis.com`), el Canvas se "contamina" (tainted) y `toBlob()`/`toDataURL()` lanza un `SecurityError`.

**Soluciones:**

1. **Firebase Storage:** Configurar CORS headers en el bucket de Storage. Agregar `keeptrip.web.app` (o el dominio de producción) a la lista de orígenes permitidos. Esto se hace con `gsutil cors set cors.json gs://your-bucket`.
2. **Pexels:** Las imágenes de Pexels **sí envían `Access-Control-Allow-Origin: *`**, así que con `crossOrigin="anonymous"` en el `<img>` debería funcionar. Pero hay que verificar que `html-to-image` respete ese atributo — **`dom-to-image-more`** maneja esto mejor.
3. **Fallback robusto:** Si la captura falla, ofrecer descarga directa del template como PNG. El usuario lo sube manualmente a IG.

#### ✅ Web Share API — matices

- `navigator.share()` con archivos (`File`) solo funciona en **Safari iOS 15+** y **Chrome Android 93+**. Cubren ~85% del público móvil.
- En **desktop** la Web Share API rara vez incluye IG como target. Propongo: en desktop, mostrar un botón "Descargar para Stories" que guarde el PNG, y un deeplink `instagram://story-camera` si existe.
- Validar con `navigator.canShare({ files: [file] })` antes de mostrar el botón.

#### 📐 Template 1080x1920 — diseño

Propongo un template con 3 variantes de layout para máxima viralidad:
1. **Classic:** Foto de portada full-bleed + título + banderas + logo Keeptrip.
2. **Stats:** Mini-mapa con la ruta + estadísticas (N paradas, N días) + highlights.
3. **Passport Stamp:** Un sello visual de pasaporte con la bandera del país (reutilizando la estética de `PaginaSellos`).

El usuario elige la variante antes de exportar. Esto es lo que hace Polarsteps y les funciona como loop viral.

---

### 1.6 Gamificación — Niveles de Viajero

**Acuerdo parcial. Hay que ir más allá para que funcione como retención.**

El `PerfilBiometrico.jsx` actual es **completamente estático y hardcodeado** (líneas 28-31: "ARGENTINA", "BERLÍN", "MKT - SIGLO 21"). Esto hay que refactorizarlo primero.

#### Sistema de Niveles propuesto (ampliado):

| Países | Nivel | Icono | Color |
|--------|-------|-------|-------|
| 0 | Soñador | 💭 | `textSecondary` |
| 1-3 | Turista Local | 🧳 | `mutedTeal` |
| 4-10 | Explorador | 🧭 | `atomicTangerine` |
| 11-25 | Trotamundos | 🌍 | `charcoalBlue` |
| 26-50 | Nómada Global | ✈️ | Gold gradient |
| 51+ | Leyenda | 👑 | Animated gold |

**Mejoras que propongo sobre el borrador:**

1. **Barra de progreso al siguiente nivel:** "Te faltan 2 países para ser Explorador" — esto es el trigger de acción que genera retención (Duolingo pattern).
2. **Medalla desbloqueable por continente:** Si el usuario visitó todos los continentes, otorgar un badge especial. Los continentes ya están en `PaginaSellos` con colores por región.
3. **Animación de level-up:** Cuando el usuario registra un viaje que le sube de nivel, mostrar un **confetti burst + modal celebratorio**. Usar `canvas-confetti` (3KB gzip).

---

### 1.7 Empty State del Dashboard

**Acuerdo, pero el copy actual no es malo — es genérico.**

Copy actual (DashboardHome.jsx líneas 129-133):
> "Empieza tu aventura — Registra tu primera parada para activar tu bitacora..."

**Propuesta de mejora con storytelling:**

```
Título: "Tu pasaporte está en blanco"
Subtítulo: "Cada gran viajero empezó con un primer sello. 
            ¿Cuál será el tuyo?"
CTA: "Estampar mi primer destino ✈️"
```

**Plus:** Añadir una **animación de pasaporte vacío** con un sello fantasma que hace un efecto de "stamping" con la bandera del país del usuario (derivable del locale del browser). Esto eleva el empty state a un momento de onboarding memorable.

---

## 2. Visión Experta: Lo que le falta a Keeptrip

Tras auditar las ~6,200 líneas del repositorio, estas son las oportunidades de UX/Storytelling que no están en el borrador:

### 2.1 🎬 Narrativa Temporal — "Story Mode"

**El problema:** El Visor de Viajes es una vista estática. El usuario ve todas las paradas de golpe. No hay sensación de **progresión temporal** — que es la esencia de un viaje.

**Propuesta: "Replay" del viaje.**
- Un botón "▶ Revivir viaje" en el hero que activa un modo donde:
  - El mapa hace `flyTo` animado de parada en parada (2s por transición).
  - El timeline hace auto-scroll sincronizado.
  - Las ContextCards aparecen con staggered animations.
- Inspiración directa: **Polarsteps "Relive"** y **Google Photos "Memories"**.
- Técnicamente viable: ya existe `mapRef`, `activeIndex`, y Framer Motion. Solo necesitamos un `setInterval` + state machine.

### 2.2 📊 Stats Dashboard mejorado — "Year in Review"

**El problema:** `StatsBitacora` y `StatsMapa` existen pero son básicos. No hay una vista que diga "En 2025 visitaste 5 países, 12 ciudades, y tu mes favorito fue octubre".

**Propuesta:**
- Un "card carousel" en el Dashboard tipo **Spotify Wrapped** que muestre:
  - País más visitado.
  - Racha más larga de viaje (días consecutivos).
  - Distancia total aprox. (calculable con Haversine entre coordenadas de paradas).
  - Continente dominante.
- Se activa solo si `bitacora.length >= 3` para evitar datos triviales.

### 2.3 🔔 Micro-interacciones ausentes

| Momento | Estado actual | Propuesta |
|---------|--------------|-----------|
| Registrar viaje nuevo | Redirect silencioso | Confetti + toast celebratorio + haptic feedback (`navigator.vibrate`) |
| Abrir Pasaporte | Fade-in genérico | Animación de "abrir libro" con page-turn 3D (CSS `perspective` + `rotateY`) |
| Hover en sello de país | `whileHover: scale(1.05)` | Añadir efecto de **rubber stamp press** (scale(0.95) → scale(1.08) con ease-back) |
| Scroll por timeline | Sin efecto | Staggered entrance con `IntersectionObserver` (ya tienen el hook) |
| Empty gallery | Texto plano | Ilustración SVG de cámara + CTA animado |

### 2.4 🗺️ Mapa del Dashboard — "Heat Map" o "Connection Map"

**El problema:** `HomeMap` pinta países sólidos de un solo color. No hay sensación de densidad o story.

**Propuesta de connection map:**
- Dibujar líneas curvadas (ya tienen `generateCurvedRoute` en RouteMap) entre los países visitados **en orden cronológico del primer viaje**.
- Esto transforma el mapa estático en una **visual de la vida viajera** del usuario.
- Incrementar la opacidad del fill según la cantidad de viajes a ese país.

### 2.5 🎨 Micro-UX: "Cover Curation" al registrar

El `CuratedCoverPicker` ya existe pero parece centrarse en la selección de portada con fotos de Pexels. Propongo:

- Al crear un viaje, en lugar de asignar una foto de Pexels automáticamente, mostrar un **mini-carousel de 3-5 opciones** (como Notion cover picker) para que el usuario sienta ownership de la portada.
- Si el usuario sube fotos propias a la galería, sugerir automáticamente la foto con mejor composición como portada (usando aspect ratio y luminosidad promedio como heurísticas simples).

### 2.6 ✍️ Tipografía y Jerarquía Visual

**Observación:** El `theme.js` define `FONTS.heading: "Plus Jakarta Sans"` y `FONTS.body: "Inter"`, pero en muchos componentes se usan strings hardcodeados (`fontFamily: 'serif'`, `fontFamily: 'monospace'` en PerfilBiometrico). Esto rompe la consistencia visual.

**Acción:** Normalizar todas las `fontFamily` hacia los tokens del theme. El Pasaporte puede usar `FONTS.mono` para mantener su estética de documento oficial.

### 2.7 🌙 Preparar para Dark Mode

No es prioritario ahora, pero la arquitectura de tokens en `theme.js` está lista para soportar un dark mode. Propongo añadir la estructura `COLORS_DARK` en un commit preparatorio sin implementar el toggle todavía.

---

## 3. Plan de Ejecución — Orden de Commits

### Fase A: Deuda Técnica y Foundation (3-4 commits)

| # | Commit | Archivos | Prioridad |
|---|--------|----------|-----------|
| A1 | `fix: RouteMap fitBounds en modal mobile` | `RouteMap.jsx` | 🔴 Crítica |
| A2 | `fix: avatar initials fallback para emails` | `utils/viajeUtils.js`, `VisorViaje.jsx` | 🟡 Media |
| A3 | `chore: eliminar estilos muertos en VisorViaje.styles` | `VisorViaje.styles.js` | 🟢 Baja |
| A4 | `refactor: normalizar fontFamily a tokens del theme` | `PerfilBiometrico.jsx`, otros | 🟡 Media |

### Fase B: Mobile UX (2-3 commits)

| # | Commit | Archivos | Prioridad |
|---|--------|----------|-----------|
| B1 | `feat: contextGrid → carrusel horizontal en mobile` | `VisorViaje.jsx`, `VisorViaje.styles.js` | 🔴 Alta |
| B2 | `feat: scroll-snap dots + peek gradient en carrusel` | `VisorViaje.styles.js` | 🟡 Media |
| B3 | `feat: staggered entrance animations en timeline` | `VisorViaje.jsx` | 🟡 Media |

### Fase C: Gamificación y Retención (4-5 commits)

| # | Commit | Archivos | Prioridad |
|---|--------|----------|-----------|
| C1 | `refactor: PerfilBiometrico dinámico (datos reales del usuario)` | `PerfilBiometrico.jsx` | 🔴 Alta |
| C2 | `feat: sistema de niveles de viajero` | `utils/travelerLevel.js`, `PerfilBiometrico.jsx` | 🔴 Alta |
| C3 | `feat: barra de progreso al siguiente nivel` | `PerfilBiometrico.jsx` | 🟡 Media |
| C4 | `feat: empty state storytelling en Dashboard` | `DashboardHome.jsx`, `DashboardHome.styles.js` | 🟡 Media |
| C5 | `feat: confetti + level-up celebration modal` | `components/Shared/LevelUpModal.jsx` | 🟢 Nice-to-have |

### Fase D: Viralidad — IG Stories (3-4 commits)

| # | Commit | Archivos | Prioridad |
|---|--------|----------|-----------|
| D1 | `feat: StoryExportTemplate (3 variantes de layout)` | `components/Share/StoryExportTemplate.jsx` | 🔴 Alta |
| D2 | `feat: CORS config para Firebase Storage` | `cors.json`, scripts de deploy | 🔴 Blocker |
| D3 | `feat: botón Share en Visor + html-to-image export` | `VisorViaje.jsx`, `utils/shareUtils.js` | 🔴 Alta |
| D4 | `feat: Web Share API con fallback descarga PNG` | `utils/shareUtils.js` | 🟡 Media |

### Fase E: Storytelling Avanzado (2-3 commits, post-MVP)

| # | Commit | Archivos | Prioridad |
|---|--------|----------|-----------|
| E1 | `feat: "Revivir viaje" — replay mode en RouteMap` | `RouteMap.jsx`, `VisorViaje.jsx` | 🟡 Media |
| E2 | `feat: connection map en HomeMap` | `HomeMap.jsx` | 🟡 Media |
| E3 | `feat: Year-in-Review stats cards` | `components/Dashboard/YearReview.jsx` | 🟢 Nice-to-have |

---

## 4. Resumen de Dependencias y Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| CORS en `html-to-image` con fotos externas | Bloquea feature de Share | D2 debe completarse ANTES de D3. Testear en staging. |
| `navigator.share()` no disponible en desktop | Feature degradada | Fallback a descarga PNG (D4). |
| PerfilBiometrico hardcodeado | Bloquea gamificación | C1 es prerequisito de C2-C5. |
| `canvas-confetti` bundle size | +3KB gzip | Aceptable. Import dinámico con `import()`. |
| Race condition de fitBounds en modal | Bug persistente | A1 es el primer commit del sprint. |

---

## 5. Paquetes nuevos requeridos

| Paquete | Uso | Tamaño |
|---------|-----|--------|
| `dom-to-image-more` | Captura de template para IG Stories | ~15KB min |
| `canvas-confetti` | Celebration de level-up | ~3KB gzip |
| *(ningún paquete de carrusel)* | Carrusel mobile con CSS nativo | 0KB |

---

## 6. Lo que NO recomiendo hacer (aún)

1. **Sonidos/Audio:** Añadir efectos de sonido (ej: stamp sound al registrar país) es tentador pero genera rechazo en la mayoría de usuarios web. Reservar para una versión PWA/nativa.
2. **Dark Mode completo:** La estructura de tokens lo permite, pero implementarlo ahora dispersa el foco del sprint. Preparar las variables (commit prep) y ejecutar en el próximo sprint.
3. **Real-time collaboration:** El sistema de invitaciones es read-only. No invertir en edición colaborativa en este sprint.

---

**Próximo paso:** Revisión con el equipo → aprobación → ejecución comenzando por Fase A (deuda técnica).

---

## 7. Estado de implementación

### ✅ Fase A — Deuda técnica (4/4 commits)
- A1: Fix fitBounds race condition en RouteMap (resize + setTimeout modal)
- A2: Utility getInitials + aplicado en VisorViaje
- A3: Limpieza de 6 estilos muertos en VisorViaje.styles
- A4: Normalización fontFamily a tokens FONTS en 5 archivos

### ✅ Fase B — UX Mobile (3/3 commits)
- B1+B2: Carrusel horizontal CSS scroll-snap + peek gradient + dot indicators
- B3: Animaciones staggered en timeline cards con motion.div whileInView

### ✅ Fase C — Gamificación y Retención (5/5 commits)
- C1: PerfilBiometrico refactorizado a datos dinámicos (props: displayName, email, photoURL, countriesCount, tripsCount)
- C2: Sistema de niveles de viajero (`utils/travelerLevel.js`) — 6 niveles, 22 tests unitarios
- C3: Barra de progreso al siguiente nivel integrada en PerfilBiometrico (Duolingo-style)
- C4: Empty state storytelling en Dashboard ("Tu pasaporte está en blanco")
- C5: LevelUpModal con canvas-confetti + detección automática de level-up en App.jsx

### ✅ Fase D — Viralidad / IG Stories (4/4 commits)
- D1: StoryExportTemplate con 3 variantes (Classic, Stats, Stamp) — 1080×1920
- D2: CORS config para Firebase Storage (`cors.json`)
- D3: ShareStoryButton con selector de variante + export via dom-to-image-more
- D4: Web Share API con fallback a descarga PNG en desktop

### Archivos nuevos creados
- `src/utils/travelerLevel.js` — Lógica de niveles
- `src/utils/travelerLevel.test.js` — 22 tests unitarios
- `src/utils/shareUtils.js` — Captura DOM + Web Share + download
- `src/components/Shared/LevelUpModal.jsx` — Modal confetti celebración
- `src/components/Share/StoryExportTemplate.jsx` — Templates IG Stories
- `src/components/Share/ShareStoryButton.jsx` — Botón + panel compartir
- `cors.json` — CORS config Firebase Storage

### Dependencias añadidas
- `canvas-confetti` (~3KB gzip) — Celebraciones level-up
- `dom-to-image-more` (~15KB min) — Captura DOM a imagen

### Tests: 64/64 pasando ✅

