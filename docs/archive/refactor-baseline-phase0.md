# Refactor Baseline (Phase 0)

Date: 2026-03-07
Branch: refactor/global-phase0-phase1
Scope: Global refactor (no new features)

## Baseline Before Changes

- `npm run -s lint`: 88 problems total (82 errors, 6 warnings)
- Key hotspots (lines):
  - `src/App.jsx`: 445
  - `src/components/VisorViaje/VisorViaje.jsx`: 706
  - `src/components/Modals/EdicionModal.jsx`: 634
  - `src/hooks/useViajes.js`: 503

## Current Snapshot After First Phase-1 Fixes

- `npm run -s lint`: 70 problems total (65 errors, 5 warnings)
- Delta: -18 total issues in this iteration
- Focused lint on touched files:
  - `src/components/VisorViaje/VisorViaje.jsx`
  - `src/components/Invitations/InvitationsList.jsx`
  - `src/components/VisorViaje/RouteMap.jsx`
  - `src/components/Shared/MiniMapaRuta.jsx`
  - `src/utils/mapRoutes.js`
  - Result: clean in focused scope

## Current Snapshot After Second Phase-1 Fixes

- `npm run -s lint`: 67 problems total (62 errors, 5 warnings)
- Delta for second batch: -3 total issues
- Files validated clean in focused scope:
  - `src/components/Header/Header.jsx`
  - `src/components/Shared/PWAUpdatePrompt.jsx`
  - `src/hooks/useActiveParada.js`
  - `src/components/VisorViaje/VisorViaje.jsx`

## Current Snapshot After Ongoing Phase-1 Hygiene Batches

- `npm run -s lint`: 0 problems
- Delta desde baseline inicial: 88 -> 0
- Cobertura de limpieza aplicada:
  - Hooks condicionales y setState-in-effect críticos
  - Limpieza masiva de imports/variables sin uso
  - Unificación de utilidades duplicadas (`generateCurvedRoute`)
  - Correcciones mecánicas en tests y utilidades

## Definition of Done (Global Refactor)

1. Stability
- No regressions in critical flows: login, bitacora CRUD, viewer/editor modal flow, invitations flow.
- Unit tests for touched logic pass.

2. Code Health
- `npm run -s lint` at 0 errors (warnings only if documented and accepted).
- No rules-of-hooks violations.
- No duplicated critical utility logic in active paths.

3. Architecture
- `App.jsx` reduced to composition/shell responsibilities.
- Complex logic extracted from large UI components to dedicated hooks/services.
- Data access paths for same domain are consistent (single source of truth per flow).

4. Refactor Discipline
- No feature changes introduced.
- Changes delivered in small, reversible batches with scope-focused verification.
