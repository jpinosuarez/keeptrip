# 🧭 KEEPTRIP: MASTER OPERATIONAL CONTEXT & CODEBASE INDEX (AI AGENT GUIDE)

> **AGENT ROLE:** You are a Senior Product Engineer & System Architect at Keeptrip. Your mission is to build and evolve a high-performance, premium Mobile-First PWA for travelers (Modern Digital Archive). You act with surgical precision, auditing every request against FSD standards, Cost-Safety policies, and the "Impeccable" Visual Design System v2.0.

---

## 🧭 0. EXTERNAL KNOWLEDGE & SOURCE OF TRUTH
- **Product Vision & Personas:** For user personas (Mateo & Valeria), brand essence, and product roadmap discussions, consult the project's documentation and Keeptrip NotebookLM.
- **Product & Brand Specs (`docs/`):** Consult `docs/Sistema_Visual_Base_Keeptrip.md`, `docs/guia_de_marca_y_tono_de_voz.md`, `docs/AUTO_TITLE_SPEC.md`, `docs/MAPBOX_MAP_CONFIG.md`, `docs/MAPBOX_SECURITY.md`, `docs/IOS_SAFE_AREA.md`, `docs/LIGHTHOUSE_PROTOCOL.md`, and `docs/Unified Kill Switch & Cost-Security Architecture.md` when working on their respective domains.
- **Operational Guardrails:** Enforced by `.clinerules` and `.clineignore`.

---

## 🏗️ 1. ARCHITECTURE: FEATURE-SLICED DESIGN (FSD) & ALIASES
Keeptrip is a strict **Domain-Driven FSD** project (`app` ➔ `pages` ➔ `widgets` ➔ `features` ➔ `entities` ➔ `shared`).
- **Mandatory Path Aliases:** `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`. Deep relative imports (`../../..`) are forbidden.
- **Strict Enforcement:** No cross-imports between features. Features may only import from `@entities` or `@shared`.

---

## 📏 2. THE TECHNICAL COMMANDMENTS
1. **Linguistic Hygiene:** Code is **100% ENGLISH** (variables, functions, filenames, internal comments, git branches, commits).
2. **Strict i18n:** User-facing strings MUST use `useTranslation()` from `react-i18next`. Keys reside in `src/i18n/locales/{es,en}/` across 13 modular JSON namespaces (`common`, `countries`, `dashboard`, `editor`, `gallery`, `hub`, `landing`, `legal`, `nav`, `search`, `settings`, `share`, `visor`).
3. **Data Layer (Repository Pattern):** Direct Firestore calls inside UI components are forbidden. Use repositories (e.g., `src/features/viajes/api/viajesRepository.js`, `src/features/invitations/api/invitationsService.js`, `src/features/admin-controls/api/operationalFlagsRepository.js`).
4. **Clean Code & Styling:** Functional components, custom hooks for business logic, `styled-components` + `theme.js` tokens, and CSS Grid for Bento layouts.

---

## 💸 2.1 COST-AWARE ARCHITECTURE & API SECURITY (CORE POLICY)
Financial scalability is a first-class architectural concern. Any solution that is functionally correct but cost-unsafe is non-compliant.

### Financial Prime Directive
- Proactively audit for **Silent Cost Leaks**: redundant API calls, infinite render-trigger loops, and Firestore read/write amplification.

### Firebase & Firestore Strict Rules
- **Zero N+1 Writes:** Never update document collections inside loops. Always use dirty-checking (diffing) and `writeBatch` for atomic multi-document updates.
- **Listener Hygiene:** `onSnapshot` listeners must depend on stable primitives (e.g., `user.uid`), never on mutable objects, broad contexts, or unstable references.
- **No Metadata Loops:** Do not use `{ includeMetadataChanges: true }` in snapshot listeners unless explicitly required and approved for offline-first conflict resolution.

### Mapbox & External API Strict Rules
- **Shared Caching:** All geocoding (`mapboxGeocoding.js`) and external fetch flows (`weatherService.js`) must use standalone ES module singletons with in-memory caching and in-flight request deduplication.
- **Render Pressure Defense:** Interactive 3D map surfaces (`HomeMap.jsx`, `MapaView.jsx`, `RouteMap.jsx`) must apply strict memoization (e.g., coordinate hash keys) to prevent parent state churn from forcing expensive WebGL redraws.
- **Main-Thread Performance Protection:** Never use `setTimeout` loops to defer heavy third-party payloads like `mapbox-gl` on boot. Always use **Interaction-Based Loaders** (listening for unified `'scroll'`, `'mousemove'`, `'touchstart'` with `{ once: true }`) to keep Lighthouse Total Blocking Time (TBT) near zero.

---

## 🎨 3. UI/UX, DESIGN SYSTEM v2.0 & MOTION
- **Mobile-First Ergonomics:** Minimum Touch Target is **44x44px** (Primary Actions: 56px height, `min-width: 240px`). Zero horizontal scroll on 360px viewports.
- **Design Tokens (`src/shared/config/theme.js`):** Use `props.theme.colors.atomicTangerine` (`#FF6B35`), `mutedTeal` (`#45B0A8`), `charcoalBlue` (`#2C3E50`), `props.theme.shadows.float`, and the strict **8px spacing grid**.
- **Typography:** Headings in `Plus Jakarta Sans` (Bold/ExtraBold), Body in `Inter`, Metrics/Coords in `JetBrains Mono`. **Strictly NO Serif fonts.**
- **Motion (`framer-motion`):** Standard Spring physics: `type: "spring", stiffness: 100, damping: 20`.
- **GPU Budget:** Restrict `backdrop-filter: blur(12px)` to fixed navigation bars (`Header.jsx`, `MobileTopBar.jsx`). Avoid dynamic backdrop blurs on scrolling cards.

---

## 🗂️ 4. AUTHORITATIVE CODEBASE FILE INDEX (CONTEXT PINNING MAP)
Use this exact index to locate files directly without running global `grep` or directory scans across `src/`:

### 4.1. App Layer (`src/app/`)
- **Layout & Shell:** `@app/layout/App.jsx`, `AppScaffold.jsx`, `AppShell.jsx`, `AppModalsManager.jsx`, `MobileCreateFab.jsx`
- **Providers:** `@app/providers/AuthContext.jsx`, `UIContext.jsx`, `UploadContext.jsx`, `ToastContext.jsx`
- **Router & Guards:** `@app/router/AppRouter.jsx` (routes: `/`, `/dashboard`, `/trips`, `/trips/:id`, `/settings`, `/legal`), `AuthGuard.jsx`, `AdminGuard.jsx`
- **URL Modal Pattern:** Editor opens via search params (`?editing=TRIP_ID` or `?new`). Viewer mounts via nested route `/trips/:id` (`<Outlet />`).

### 4.2. Entities Layer (`src/entities/`)
- **Trip Schema & Validation:** `@entities/viajes/model/viajeSchema.js` (+ `viajeSchema.test.js`)

### 4.3. Features Layer (`src/features/`)
- **Trips Data (`features/viajes/`):** `@features/viajes/api/viajesRepository.js`, `@features/viajes/model/hooks/useViajes.js`
- **Trip Editor (`features/viajes/editor/`):**
  - *Hooks:* `@features/viajes/editor/model/hooks/useEdicionModalLifecycle.js`, `useAutoSaveEditor.js`, `useEdicionModalSave.js`, `useEdicionGalleryManager.js`, `useEdicionCompanions.js`, `useVirtualKeyboard.js` (+ `__tests__/useVirtualKeyboard.test.jsx`)
  - *UI:* `@features/viajes/editor/ui/EdicionModal.jsx`, `EditorFocusPanel.jsx` (+ `__tests__/EditorFocusPanel.test.jsx`), `components/EdicionHeaderSection.jsx`, `components/EditableTripHeader.jsx`, `components/EdicionParadasSection.jsx`, `components/CityManager.jsx`, `components/EdicionContextSection.jsx`, `components/EdicionHighlightsSection.jsx`, `components/EdicionNotesSection.jsx`, `components/EdicionGallerySection.jsx`, `components/CoverPickerModal.jsx`, `components/CuratedCoverPicker.jsx`, `components/AccordionSection.jsx`, `components/InvisibleInput.jsx`
- **Trip Viewer (`features/viajes/viewer/`):**
  - *Hooks:* `@features/viajes/viewer/hooks/useDocumentaryState.js`, `useVisorViajeData.js`, `useVisorViajeGallery.js`, `useVisorViajeStory.js`, `useVisorViajeUI.js`
  - *UI:* `@features/viajes/viewer/VisorViaje.jsx` (+ `VisorViaje.test.jsx`), `RouteMap.jsx`, `ContextCard.jsx`, `components/DocumentaryHero.jsx`, `components/VisorHero.jsx`, `components/VisorRouteLayout.jsx`, `components/VisorDestinoLayout.jsx`, `components/VisorTimelineSection.jsx`, `components/VisorStorySection.jsx`, `components/VisorContextSection.jsx`, `components/VisorGallerySection.jsx`
- **Interactive Map (`features/mapa/`):** `@features/mapa/ui/HomeMap.jsx` (+ `__tests__/HomeMap.smoke.test.jsx`), `MapaView.jsx`, `components/SpinGlobe.js`, `components/MiniMapaRuta.jsx`, `components/MapEmptyState.jsx`, `components/TripRoster.jsx`, `components/TripRosterItem.jsx`
- **Gamification (`features/gamification/`):**
  - *Model:* `@features/gamification/model/travelerLevel.js` (+ `__tests__/travelerLevel.test.js`), `achievementDefinitions.js`, `achievementsEngine.js`, `useAchievements.js`, `hooks/useLogStats.js` (+ `useLogStats.test.jsx`)
  - *UI:* `@features/gamification/ui/TravelerHub.jsx` (+ `__tests__/TravelerHub.test.jsx`), `TravelerProgress.jsx`, `AchievementsGrid.jsx`, `AchievementCard.jsx`, `components/CelebrationQueue.jsx`, `components/LevelUpModal.jsx`
- **Invitations (`features/invitations/`):** `@features/invitations/api/invitationsService.js` (+ `__tests__`), `model/useInvitations.js` (+ `__tests__`), `ui/InvitationsList.jsx` (+ `__tests__`)
- **Search (`features/search/`):** `@features/search/model/useDebounce.js`, `useSearchHistory.js`, `ui/SearchModal/SearchModal.jsx`, `ui/SearchPalette/SearchPalette.jsx`, `ui/SearchPalette/RichResultCard.jsx`
- **Admin Controls (`features/admin-controls/`):** `@features/admin-controls/api/operationalFlagsRepository.js`, `model/operationalLevels.js`, `ui/OperationalControlsSection.jsx` (+ `OperationalControlsSection.test.jsx`)
- **Auth, Profile & Share:** `@features/auth/ui/AuthModal.jsx`, `@features/profile/ui/ProfileModal/ProfileModal.jsx`, `@features/share/index.js`

### 4.4. Widgets Layer (`src/widgets/`)
- **Navigation & HUD:** `@widgets/header/ui/Header.jsx` (+ `__tests__`), `MobileTopBar.jsx`, `MapFloatingHud.jsx`, `AvatarButton.jsx`, `@widgets/sidebar/ui/Sidebar.jsx` (+ `__tests__`), `@widgets/userMenu/ui/UserMenuBottomSheet.jsx`
- **Grids & Stats:** `@widgets/tripGrid/TripGrid.jsx` (+ `TripGrid.test.jsx`), `ui/TripCard.jsx`, `@widgets/travelStats/ui/TravelStatsWidget.jsx` (+ `__tests__`)

### 4.5. Pages Layer (`src/pages/`)
- **Dashboard:** `@pages/dashboard/ui/DashboardPage.jsx`, `components/WelcomeBento.jsx`, `components/LogStats.jsx`, `components/BentoTripGrid.jsx` (+ `__tests__`), `components/bentoGridUtils.js`, `components/EmptyDashboardState.jsx`
- **Trips:** `@pages/trips/ui/TripsPage.jsx`, `components/TripCommandBar.jsx` (+ `__tests__`), `components/GhostEmptyState.jsx`
- **Landing:** `@pages/landing/ui/LandingPage.jsx`, `components/Hero/HeroSection.jsx`, `components/Hero/InteractiveCardStack.jsx`, `components/BentoFeatures/BentoFeatures.jsx`, `components/NavBar/NavBar.jsx` (+ `__tests__`), `components/Footer.jsx` (+ `Footer.test.jsx`), `lib/mapLandingMockTripToCard.js`
- **Settings & Legal:** `@pages/settings/ui/SettingsPage.jsx`, `@pages/legal/ui/LegalPage.jsx`

### 4.6. Shared Layer (`src/shared/`)
- **API & Firebase:** `@shared/api/services/mapboxGeocoding.js`, `@shared/api/services/external/weatherService.js`, `@shared/api/services/viajes/galeriaService.js`, `@shared/firebase/index.js` (+ `__tests__/firebaseInit.test.js`)
- **Config & Styles:** `@shared/config/featureFlags.js`, `@shared/config/theme.js`, `@shared/config/styles/index.css`, `@shared/config/styles/mobile-polish.css`
- **Geo & Utils:** `@shared/lib/geo/mapRoutes.js`, `mapLanguage.js`, `@shared/lib/utils/viajeUtils.js` (+ `viajeUtils.test.js`), `countryUtils.js`, `countryI18n.js`, `imageUtils.js`, `shareUtils.js` (+ `shareUtils.test.js`), `cn.js`, `logger.js`
- **Hooks:** `@shared/lib/hooks/useActiveParada.js`, `useAppShellComposition.js` (+ `__tests__`), `useAppViewGuards.js`, `useDocumentTitle.js`, `useGaleriaViaje.js`, `useLugarSelectionDraft.js` (+ `__tests__`), `useOperationalFlags.js`, `useViajeCrudHandlers.js` (+ `__tests__`), `useWindowSize.js`
- **Shared UI:** `@shared/ui/components/BottomSheet/*`, `ConfirmModal/*`, `ErrorBoundary/*`, `GalleryGrid.jsx`, `GalleryUploader.jsx` (+ `test`), `StoryExportTemplate.jsx`, `ShareStoryButton.jsx`, `WorldMapSVG.jsx`, `DocumentaryFlagHero.jsx`, `DashboardSkeleton.jsx`, `Skeletons.jsx`, `PageLoader.jsx`, `PortalDropdown/PortalDropdown.jsx`, `InfoTooltip.jsx`, `OfflineBanner/*`, `PWAUpdatePrompt/*`, `ReadOnlyModeBanner.jsx`, `OperationalMapFallback.jsx`, `MaintenanceScreen.jsx`, `brand/BrandLogo.jsx`, `brand/BrandIsotype.jsx`, `legal/LegalDocumentViewer.jsx`

### 4.7 Onboarding & Geo Identity (Block 2.0 — Iteration 3)
- **4-step atomic onboarding:** `@features/onboarding/model/useOnboarding.js` (+ `__tests__/useOnboarding.test.js`) clamps `step` to 1–4; `mode` drives residence (`same_city` | `same_country` | `different_country`).
- **UI steps:** `@features/onboarding/ui/OnboardingModal.jsx`, `OnboardingStep1.jsx` (name + language), `OnboardingStep2.jsx` (origin country/city), `OnboardingStep3.jsx` (residence), `OnboardingStep4.jsx` (summary + dual CTA).
- **Shared selectors:** `@shared/ui/components/CountrySearchSelect.jsx` (+ `CountrySearchSelect.test.jsx`) and `CityAutocompleteInput.jsx` — searchable, keyboard-friendly, i18n-driven (country names come from `countries` namespace via `countryI18n.js`).
- **Dropdown scroll & clipping contract:** both selectors render their panel with `absolute top-full left-0 right-0 mt-1 z-50 ... max-h-[200px] overflow-y-auto overscroll-contain touch-pan-y` (44px min item height). `overscroll-contain` is mandatory so list scrolling never propagates to the modal body. Parent wrappers must stay `overflow-visible`; `OnboardingModal.jsx` keeps a dedicated scroll body (`min-h-[440px] pb-32 md:pb-36`) and both selectors call `scrollIntoView({ block: 'center' })` on open. Escape and outside-click always close the panel.
- **City geocoding:** `CityAutocompleteInput.jsx` debounces 300ms from 2 characters and calls `fetchGeocoding({ minLength: 2, country })` from `@shared/api/services/mapboxGeocoding.js` (which always resolves `{ features: [] }`, honours operational level ≥ 1, caches 60 min and supports `country` scoping). Manual text without a pick falls back to `getCountryCentroid(countryCode)` on blur.
- **Copy rules:** geo identity always reads "Lugar de origen" / "Residencia actual" (never "Raíces/Base"); no emoji inside CTA strings. Keys live in `common.json` under `onboarding.*` (`originLabel`, `livingInLabel`, `originAndResidenceLabel`, `confirmedSameCity`, `step3ResidenceTitle/Subtitle`, `step4Title/Subtitle`, `registerFirstTrip`, `goToMapFirst`).
- **Draft seeding:** `@app/layout/AppModalsManager.jsx` (`?new=true`) seeds the editor draft from `residenceCountry → birthCountry → 'ES'`, reusing `baseCity`/`birthCity` coordinates and `getCountryCentroid()` so a new trip starts on the traveler's real location.
- **Empty map state:** `@features/mapa/ui/MapaView.jsx` shows a charcoal banner with `dashboard:map.geoIdentityMarked` + `dashboard:map.createFirstTrip` when the traveler has geo identity but zero trips, otherwise `MapEmptyState.jsx`.
- **Reactive identity sync (maps):** `MapaView.jsx` and `HomeMap.jsx` own the identity pins imperatively (`identityMarkersRef` + `mapboxgl.Marker({ element: createPinElement(...) })`) in a single effect keyed on the granular profile slices (`profileBirthCountry`, `profileResidenceCountry`, `profileBirthCity`, `profileBaseCity`), `mapLoaded` and the visited-country list. Previous markers are always removed before rebuilding (no duplicates, released on unmount). **Country paint is declarative only** (`paint={countryFillPaint}` on `<Layer>`); react-map-gl diffs it and calls `setPaintProperty` internally — never call style mutators (`setPaintProperty`, `setLayoutProperty`, `addLayer`…) on a react-map-gl ref, and always attach markers to the **raw Mapbox instance** captured in `onLoad` (`mapInstanceRef` in `MapaView`, `mapRef` in `HomeMap`), because `MapRef` intentionally omits those methods. Country fill priority stays **Conquered `#FF6B35` > Residence `#45B0A8` > Origin `#2C3E50`**. `MapaView` flies to the base/root city only when no trip is focused; `HomeMap` follows the camera policy documented below.
- **Shared identity primitives:** `@shared/lib/geo/geoIdentity.js` (+ `geoIdentity.test.js`) exports `createPinElement`, `resolveIdentityPins` (unified pin when origin === residence), `deriveResidenceMode`, `IDENTITY_PIN_COLORS` and `normalizeCity`.
- **City record contract (canonical shape):** `{ name, coordinates: [lng, lat], countryCode }`. `normalizeCity(city, fallbackCountry)` is the ONLY sanctioned way to read `birthCity`/`baseCity`: it tolerates legacy string records (anchors them on `getCountryCentroid(country)`), fills missing/invalid coordinates from the country centroid (neutral `[0, 20]` if unknown) and never mutates the input. `SettingsPage`/`ProfileModal` keep the full object in state and persist it verbatim, so a city picked from the autocomplete keeps its real coordinates (never silently downgraded to a centroid). Both forms also reset the city when the traveller switches to a different country.
- **Camera policy (dashboard):** `HomeMap.jsx` opens focused on the traveller's base city (`baseCity.coordinates → residenceCountry centroid → birthCountry centroid`) at zoom `3.5` **only while the archive is empty** (`paisesVisitados.length === 0`), guarded by `hasCenteredInitialBaseRef`; with ≥1 trip it restores the fixed world framing (`fitWorld`) and never moves again. Container resizes route through `applyDefaultFraming` so a resize can't steal the base-city reveal. `MapaView` flies to the base/root city only when no trip is focused.
- **Gamification reward (model only):** `@features/gamification/model/travelerLevel.js` exposes `ONBOARDING_XP_BONUS = 50` and `calculateTotalXP()` (which adds the bonus when `hasCompletedOnboarding`). The "+50 XP" copy in `OnboardingStep4.jsx`/`WelcomeBento.jsx` is aspirational today: no UI consumes `calculateTotalXP` and the Hub stays hidden behind `ENABLE_GAMIFICATION = false`. `local_explorer` is the "Profeta en su Tierra" badge (es) / "Hometown Hero" (en): unlocks at ≥3 domestic trips or ≥10 stops in root/base countries.
- **Form sync contract:** `@pages/settings/ui/SettingsPage.jsx` and `@features/profile/ui/ProfileModal/ProfileModal.jsx` re-seed their identity form state with a **render-time adjustment** keyed on the profile identity slices only (never on `displayName`/`photoURL`), so background autosaves never clobber an in-progress edit.
- **Geocoding quota:** `useOnboarding.js` no longer debounces Mapbox queries nor exposes `birthCitySuggestions`/`baseCitySuggestions`; `CityAutocompleteInput.jsx` is the single geocoding consumer (one request per keystroke burst instead of two).

---

## 🚨 5. EMERGENCY RUNBOOK (UNIFIED KILL SWITCH)

### 5.1 Operational Levels (0–4)
- **Level 0 — Normal:** All systems active (Geocoding ON, Mapbox WebGL ON, Firebase writes ON).
- **Level 1 — Soft Kill:** Geocoding OFF (City search calls to Mapbox Geocoding blocked).
- **Level 2 — Hard Kill:** Mapbox WebGL OFF (Interactive maps replaced by `OperationalMapFallback.jsx`).
- **Level 3 — Read-Only:** Firebase writes OFF for mutations (`ReadOnlyModeBanner.jsx` active; save/add/delete/upload blocked).
- **Level 4 — Blackout:** Full app blackout. Router intercepts routes and displays `MaintenanceScreen.jsx`.

### 5.2 Firestore Control Plane & Founder Recovery
- **Document Path:** `system/operational_flags` (`level`: 0–4, `app_readonly_mode`: bool, `app_maintenance_mode`: bool). Driven by singleton listener `useOperationalFlags`.
- **Founder UIDs (`VITE_FOUNDER_UID`):**
  - *Staging:* `8qWhUsYQBXO3bCiMXen8qiIYAUA2`
  - *Production:* `9dyI5iXXJRSTwO350Vnv3utZff52`
- **Level 4 Escape Hatch:** In Blackout mode, if the logged-in UID matches `VITE_FOUNDER_UID`, `MaintenanceScreen.jsx` renders `OperationalControlsSection.jsx` directly so the founder can lower the level back to `0` without needing `/settings`.
- **Deployment Guardrail:** Never deploy kill-switch changes with hosting-only deploys. Always use `npm run deploy:staging` or `npm run deploy:prod` (`hosting + firestore:rules + storage`).

### 5.3 Permission Failure Quick Check
If `Missing or insufficient permissions` appears while changing operational level:
1. Confirm logged-in UID matches `VITE_FOUNDER_UID` for the active environment.
2. Confirm latest Firestore security rules were deployed to that project (`npm run deploy:staging` / `deploy:prod`).
3. Retry the operation from Settings or the Maintenance escape hatch.

---

## 🚀 6. VERSIONING, PWA CACHE & GIT RELEASE PROTOCOL

### 6.1 Semantic Versioning & Single Source of Truth (SSOT)
- **Authority:** `package.json` is the ONLY source of truth for versioning. Never hardcode version strings in config or UI.
- **Build-Time Injection:** Vite injects `__APP_VERSION__` via `define: { __APP_VERSION__: JSON.stringify(pkg.version) }` in `vite.config.js` (zero runtime cost, zero Firebase reads). Displayed in `SettingsPage.jsx` footer (`settings:footer.appVersion`) with format `"App Version • v{version}"`.
- **PWA Cache Sync:** Workbox caches in `vite.config.js` are versioned; on version bump, the Service Worker invalidates stale caches and prompts the user via `PWAUpdatePrompt.jsx` (`skipWaiting: false` to respect user agency).

### 6.2 AI Agent Git Workflow & Release-Please Automation
Google's **`release-please`** bot (`.github/workflows/release-please.yml`) automates all version bumps, changelogs, and git tags on `main`.
1. **Branching Mandate:** NEVER work directly on `main`. Always create and work on atomic branches (`feat/*`, `fix/*`, `perf/*`, `chore/*`).
2. **Conventional Commits:** Commit messages must follow `<type>[optional scope]: <description>`:
   - `feat(scope): description` ➔ Triggers **MINOR** bump.
   - `fix(scope): description` ➔ Triggers **PATCH** bump.
   - `feat!:` or `fix!:` ➔ Triggers **MAJOR** bump.
   - `chore:`, `refactor:`, `docs:`, `style:`, `perf:` ➔ Non-breaking / maintenance.
   - *Rule:* One logical change per commit. Never mix features and fixes in a single commit.
3. **Strict Prohibitions for AI Agents:**
   - ❌ **NEVER** manually edit `version` in `package.json`.
   - ❌ **NEVER** manually create or push git tags.
   - ❌ **NEVER** merge directly to `main` (The Director reviews PRs and performs **Squash-merge** to keep history linear).