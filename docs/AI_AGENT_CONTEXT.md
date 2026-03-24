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