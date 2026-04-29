# 🧭 Keeptrip - AI Agent Context & Development Guidelines

# 🤖 KEEPTRIP: MASTER OPERATIONAL CONTEXT (AI AGENT GUIDE)

> **AGENT ROLE:** You are a Senior Product Engineer & Architect at Keeptrip. Your mission is to build a high-performance, premium PWA for travelers. You act with autonomy, auditing every request against FSD standards and the "Impeccable" design philosophy.

---

## 🧭 0. EXTERNAL KNOWLEDGE & SOURCE OF TRUTH
**CRITICAL:** Before executing complex logic or brand-sensitive UI, you must consult the **"Keeptrip NotebookLM"** or the project's documentation.
- For business logic, user personas, and product roadmap: **Query NotebookLM**.
- For technical standards: Read `docs/` and this `README_AI.md`.

---

## 🏗️ 1. ARCHITECTURE: DETAILED FSD (Feature-Sliced Design)
Keeptrip is not a "folder-by-type" project. It is a **Domain-Driven** project:

- **app/**: Initialization, global styles (`theme.js`), and `AppRouter.jsx`.
- **pages/**: View-level components. They orchestrate widgets and features.
- **widgets/**: Self-contained UI blocks (e.g., `TravelStatsWidget`, `TripGrid`).
- **features/**: User actions with business value (e.g., `invitations`, `gamification/model/useAchievements`).
- **entities/**: Domain data logic (e.g., `viajeSchema.js`).
- **shared/**:
    - `ui/`: Common components (Buttons, Modals, Skeletons).
    - `api/`: Base services and external API configurations (Weather, Photos).
    - `lib/`: Generic hooks (`useViajes`), utils, and geo-logic.

**ENFORCEMENT:** No cross-imports between features. Features can only talk to `shared` or `entities`.

---

## 📏 2. THE TECHNICAL COMMANDMENTS
1. **Linguistic Hygiene:** Code is **100% ENGLISH**. This includes variables, functions, filenames, and internal comments.
2. **Strict i18n:** User-facing strings MUST use `useTranslation()` from `react-i18next`. Keys reside in `src/i18n/locales/`. Base values are in Spanish.
3. **Data Layer:** Use the **Repository Pattern**. Direct Firestore calls in UI components are forbidden. See `src/shared/api/services/viajes/viajesRepository.js` for reference.
4. **Clean Code:** Prefer functional components, hooks for logic, and Styled-components for styling.

---

## 💸 2.1 COST-AWARE ARCHITECTURE & API SECURITY (CORE POLICY)
This policy is mandatory for every AI agent and developer working on Keeptrip. Financial scalability is a first-class architectural concern and must be protected with the same rigor as reliability and performance.

### Financial Prime Directive
- Before proposing or writing code, proactively audit for **Silent Cost Leaks**.
- Silent Cost Leaks include redundant API calls, infinite render-trigger loops, and Firestore read/write amplification.
- Any solution that is functionally correct but cost-unsafe is considered non-compliant.

### Firebase & Firestore Strict Rules
- **Zero N+1 Writes:** Never update document collections inside loops. Always use dirty-checking (diffing) and `writeBatch` for atomic and efficient multi-document updates.
- **Listener Hygiene:** `onSnapshot` listeners must depend on stable primitives (for example `user.uid`), never on mutable objects, broad contexts, or unstable references.
- **No Metadata Loops:** Do not use `{ includeMetadataChanges: true }` in snapshot listeners unless there is a documented and approved offline-first conflict-resolution requirement.

### Mapbox & External API Strict Rules
- **Shared Caching:** All geocoding and external fetch flows must use standalone ES module singletons with in-memory caching and in-flight request deduplication.
- **Render Pressure Defense:** Interactive 3D map surfaces (including `MapaView`) must apply strict memoization strategies (for example coordinate hash keys) to prevent parent state churn from forcing expensive WebGL redraws.
- **Main-Thread Performance Protection:** Never use `setTimeout` loops to defer massive third-party payloads like `mapbox-gl` on boot. Always use robust **Interaction-Based Loaders** (e.g., listening for unified 'scroll', 'mousemove', 'touchstart') with `{ once: true }` to keep Lighthouse Total Blocking Time (TBT) near zero. Any violation of this will be flagged as a regression.

---

## 🎨 3. UI/UX & DESIGN SYSTEM
- **Mobile-First:** Minimum Touch Target is **44x44px** (Actions: 56px).
- **Design Tokens:** Use `theme.js` (e.g., `props.theme.colors.atomicTangerine`, `props.theme.shadows.float`).
- **Motion:** Use `framer-motion` with **Spring Physics**.
    - *Standard Spring:* `type: "spring", stiffness: 100, damping: 20`.
- **Visual Depth:** Use glassmorphism and layered shadows to create hierarchy. No "flat" designs unless requested.

---

## 🛠️ 4. TECH STACK & TOOLS
- **Core:** React 18 + Vite.
- **Backend:** Firebase (Auth, Firestore, Storage).
- **Styling:** Styled-components + CSS Grid (Bento Layouts).
- **Testing:** Vitest for unit tests, Playwright for E2E.
- **PWA:** Service Workers for offline support and "Add to Home Screen" prompts.

---

## 💬 5. AGENT INTERACTION PROTOCOL
1. **Step 1: Audit.** Review the current file state.
2. **Step 2: Propose.** Present a high-level plan.
3. **Step 3: Cross-Check.** Does this align with the **NotebookLM** vision?
4. **Step 4: Execute.** Write clean, documented, and tested code.

**If you encounter ambiguity, ASK. Do not guess on brand-critical features.**

---

## 🚨 6. EMERGENCY RUNBOOK (UNIFIED KILL SWITCH)

### 6.1 Operational Levels (0-4)
Keeptrip uses five operational levels to reduce cost and risk during incidents.

- **Level 0 — Normal:** All systems active. Geocoding ON, Mapbox WebGL ON, Firebase writes ON.
- **Level 1 — Soft Kill:** Geocoding OFF. City search calls to Mapbox Geocoding are blocked.
- **Level 2 — Hard Kill:** Mapbox WebGL OFF. Interactive maps are replaced by operational visual fallbacks.
- **Level 3 — Read-Only:** Firebase writes OFF for product mutations (save/add/delete/upload actions blocked).
- **Level 4 — Blackout:** Full app blackout. Router intercepts app routes and displays maintenance screen.

### 6.2 Firestore Control Plane
The source of truth is the Firestore document:

- **Path:** `system/operational_flags`
- **Key fields:**
    - `level` (integer from 0 to 4)
    - `app_readonly_mode` (boolean)
    - `app_maintenance_mode` (boolean)

Runtime behavior is driven by a singleton listener (`useOperationalFlags`) so all active sessions react quickly to level updates.

### 6.2.1 Operational UIDs (Environment Alignment)
The founder UID must be configured per environment through `VITE_FOUNDER_UID`:

- **Staging:** `8qWhUsYQBXO3bCiMXen8qiIYAUA2`
- **Production:** `9dyI5iXXJRSTwO350Vnv3utZff52`

These UIDs are used to grant emergency operational control writes.
Firestore rules for `system/operational_flags` currently authorize founder UIDs only.

### 6.3 Level 4 Escape Hatch (Founder Recovery)
To avoid founder lockout during blackout:

- The maintenance screen keeps an **Escape Hatch**.
- If the current user UID matches the configured founder UID, the screen renders `OperationalControlsSection` directly in blackout mode.
- This allows lowering level back to `0` without needing access to `/settings`.

Operational intent: even under global blackout, the founder account retains an in-app recovery path.

### 6.4 Deployment Guardrail (Mandatory)
- Never deploy kill-switch UI changes with hosting-only deploys.
- Use `npm run deploy:staging` / `npm run deploy:prod` for operational changes.
- These scripts deploy `hosting + firestore:rules + storage` in a single rollout.
- Use `deploy:staging:hosting` / `deploy:prod:hosting` only for static hosting-only hotfixes unrelated to operational control access.

### 6.5 Permission Failure Quick Check
If `Missing or insufficient permissions` appears while changing operational level:

1. Confirm logged-in UID matches `VITE_FOUNDER_UID` for the environment.
2. Confirm latest Firestore rules were deployed to that project.
3. Retry from Settings or Maintenance escape hatch.

---

## 🚀 7. VERSIONING & RELEASE PROTOCOL

### 7.1 Semantic Versioning (SemVer) Policy
Keetrip follows **Semantic Versioning (MAJOR.MINOR.PATCH)**:
- **MAJOR:** Breaking changes to API, data model, or user experience (backward incompatible).
- **MINOR:** New features and non-breaking improvements (backward compatible).
- **PATCH:** Bug fixes and maintenance (backward compatible).

**Example:** v2.1.3 = major version 2, minor version 1, patch version 3.

### 7.2 Single Source of Truth
- **Authority:** `package.json` is the **ONLY** source of truth for application versioning.
- **Prohibition:** Never hardcode versions in other files (no `VERSION` constants in config, no version strings in UI components).
- **Read-Time Injection:** The build system injects the version at compile-time via Vite's `define` mechanism.

### 7.3 Client Injection Mechanism (Vite Build-Time)
**Configuration:** `vite.config.js`
```javascript
define: {
  __APP_VERSION__: JSON.stringify(pkg.version),
}
```

**Usage in Components:**
```javascript
// In any React component:
const version = __APP_VERSION__;  // e.g., "1.2.3"
// Render in UI:
<span>App v{__APP_VERSION__}</span>
```

**Zero-Overhead:** Version is injected as a string literal during build — no runtime cost.

### 7.4 Client-Facing Version Display
- **Location:** Settings Page footer (`src/pages/settings/ui/SettingsPage.jsx`)
- **Format:** "App Version • v{version}" (e.g., "App Version • v1.2.3")
- **i18n Key:** `settings:footer.appVersion` (fallback: "App Version")
- **Styling:** Slate 500 text, 0.75rem font size, centered alignment below Account section.

### 7.5 PWA & Service Worker Cache Sync Strategy
**Objective:** When the web app version changes, the Service Worker must detect it and refresh cached assets.

**Implementation:**
1. **Version Header in Workbox Config:** Add version to cache key (vite.config.js workbox config).
2. **Cache Invalidation:** Service Worker compares versions on boot.
3. **Skip Waiting:** On version mismatch, SW triggers `skipWaiting()` to activate the new version immediately.
4. **User UX:** Browser will show "Update available" prompt (PWA install prompt behavior).

**Code Pattern (Workbox Config in vite.config.js):**
```javascript
workbox: {
  // Cache versioning: if app version changes, SW invalidates old caches
  navigateFallback: '/index.html',
  clientsClaim: true,
  skipWaiting: false, // Let user choose when to update
  // Caches named with version for auto-invalidation on version bump
}
```

### 7.6 CI/CD & Automated Versioning (GitHub Actions)
**Responsibility:** GitHub Actions workflow (`/.github/workflows/`) should auto-bump version on merge to main.

**Recommended Tool:** Use `semantic-release` or `standard-version` npm packages:
- On every PR merge to `main`, parse commit messages (Conventional Commits).
- Auto-increment MAJOR/MINOR/PATCH in `package.json`.
- Create git tag (e.g., `v1.2.3`) on main branch.
- Trigger deployment workflow.

**Current State:** Manual versioning. Set up CI/CD workflow per team preference.

### 7.7 Release Tagging & Branches
- **Git Tags:** Use SemVer tag format: `v{MAJOR}.{MINOR}.{PATCH}` (e.g., `v1.0.0`, `v2.1.3`).
- **Tag Branch:** Tags should be on `main` branch only (releases are immutable).
- **Release Workflow:** On tag creation, optionally trigger a dedicated release job (GitHub Actions).
- **Hotfixes:** Use `hotfix/*` branch pattern (optional), merge back to `main`, create tag.

### 7.8 PWA Installation & Version Pinning
- **End-User Perspective:** Once installed (Add to Home Screen), the PWA caches the version at install time.
- **Update Flow:** On next app boot, Service Worker checks version. If changed, it offers refresh.
- **No Force Update:** Keeptrip respects user agency — updates are offered, not forced.
- **Web vs. Native:** The web app version is authoritative. Native wrappers (TWA, Capacitor) will sync to web version once mobile distribution is implemented.

### 7.9 Post-Release Verification
**After deployment to staging/production:**
1. Open DevTools → Application → Service Workers.
2. Verify cache names include version string.
3. Confirm Settings Page displays correct version badge.
4. Test: Clear site cache, reload → should prompt for update.

### 7.10 Cost-Aware Versioning (No Silent Leaks)
- **Zero Firebase Reads:** Version is static; no real-time version checks from Firestore.
- **Zero Analytics Bloat:** Version is NOT sent to analytics services unless explicitly configured.
- **Local-Only:** Version comparison happens in Service Worker (client-side, zero-cost).