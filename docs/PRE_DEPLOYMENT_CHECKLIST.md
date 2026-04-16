# 📋 Pre-Deployment Checklist — Keeptrip

**Last Updated:** April 16, 2026  
**Audience:** Development Team & AI Agents  
**Objective:** Validate quality, security, and stability before deploying changes to production.

---

## 🎯 Executive Summary

| Phase | Responsibility | Criticality |
|-------|----------------|-------------|
| **1. Automation Suite** | 🤖 AI Autonomous | 🔴 CRITICAL |
| **2. Staging Deployment** | 🤖 AI Autonomous | 🔴 CRITICAL |
| **3. Mobile & UX Verification** | 👤 Human Mandatory | 🔴 CRITICAL |
| **4. PWA & Resilience** | 👤 Human Mandatory | 🟡 IMPORTANT |
| **5. Final Production Deploy** | 👤 Human (Hard Stop) | 🔴 POINT OF NO RETURN |

---

## 🤖 Part 1: AI Agent Autonomous Checklist

These steps are to be executed by the AI Agent independently to ensure code integrity.

### 1. Static Analysis & Linting
- [ ] Run the linter: `npm run lint`
- [ ] **Target:** 0 errors. All warnings related to unused imports or variables must be resolved.
- [ ] Verify relative path imports are replaced by `@app`, `@shared`, etc.

### 2. Unit & Logic Testing
- [ ] Run unit tests: `npm run test:unit`
- [ ] **Target:** 100% pass rate. Verify specific logic for authentication and trip management.

### 3. Security Audit (Firestore & Storage)
- [ ] Run security rules tests: `npm run test:rules`
- [ ] **Target:** Verify that `owner-protected` documents are strictly inaccessible to non-owners and that `invitees` have read-only access.

### 4. End-to-End (E2E) Verification
- [ ] Run Playwright tests: `npm run test:e2e`
- [ ] **Target:** Complete full user flows (Create Trip -> Add Stop -> Delete Stop -> Invite User).

### 5. Build & Architecture Verification
- [ ] Run production build: `npm run build`
- [ ] **Target:** Success with no Rollup/Vite errors.
- [ ] **Vite Chunk Verification:** Inspect the build output. Ensure `vendor-map` (Mapbox) is isolated into its own chunk and **not** bundled into the main `index.js` chunk. This is critical for TBT (Total Blocking Time) performance.

### 6. Dependency & Vulnerability Audit
- [ ] Run `npm audit`
- [ ] **Target:** 0 critical vulnerabilities.

### 7. Environment Variables Sync
- [ ] Validate `.env.production` and `.env.staging` structure.
- [ ] Ensure `VITE_USE_EMULATORS=false` for both environments.
- [ ] Verify `VITE_FIREBASE_PROJECT_ID` matches the intended destination.

### 8. Deployment to Staging
- [ ] Run: `npm run deploy:staging`
- [ ] Verify Hosting, Firestore rules, and Storage rules are deployed.

### 9. Automated Performance Audit (Lighthouse)
- [ ] **Tooling:** Use the Lighthouse MCP Server to audit the Staging URL: `https://keeptrip-app-staging.web.app/dashboard`
- [ ] **Targets:**
    - Performance: > 85
    - Accessibility: > 90
    - Best Practices: > 85
    - SEO: > 85

---

## 👤 Part 2: Human-Mandatory Checklist

These steps require physical interaction and human judgment. **Do not skip.**

### 1. Real Device Mobile Smoke Test
**Requirement:** Use a physical mobile device (not a desktop emulator).
- [ ] **Navigation:** Verify that the bottom navigation bar is ergonomic and reachable.
- [ ] **Gestures:** Ensure smooth scrolling. **Zero horizontal scroll allowed.**
- [ ] **Touch Targets:** Verify all buttons (CTAs) are at least 44x44px and easy to tap.
- [ ] **Visual Polish:** Confirm Bento Grid alignment and Slate 50 (#F8FAFC) background consistency.

### 2. PWA & Offline Resilience Test
- [ ] **Airplane Mode:** Enable Airplane mode on your device while the app is active.
- [ ] **Verification:** Confirm the `OfflineBanner` renders immediately.
- [ ] **Stability:** Verify the app does not crash and allowed features remain interactive (Service Worker validation).

### 3. i18n Fallback & Leak Test
- [ ] **Visual Scan:** Quickly navigate through Dashboard, Editor, and Settings.
- [ ] **Verification:** Ensure no raw translation keys (e.g., `auth.title`, `trip.placeholder`) are visible in the UI. Everything must be rendered in the user's language.

### 4. Visual/Ergonomic Sandbox
- [ ] **Animations:** Verify `framer-motion` transitions are fluid (60fps).
- [ ] **Contrast:** Check that Atomic Tangerine (#FF6B35) CTAs have enough contrast against backgrounds.

### 5. Production Deployment (🛑 THE HARD STOP)
**SECURITY POLICY:** AI Agents are strictly forbidden from executing the final production deployment.
- [ ] **Action:** The Human developer must manually type and execute the following in their terminal:
  ```bash
  npm run deploy:prod
  ```
- [ ] **Post-Deploy Smoke Test:** Verify `https://keeptrip.app` loads and user data is visible.

---

## 🛡️ Environments Summary

| Environment | URL | Firebase Project | EMULATORS |
|-------------|-----|------------------|-----------|
| **Local** | `localhost:5173` | keeptrip (mock) | `true` |
| **Staging** | `keeptrip-app-staging.web.app` | `keeptrip-app-staging` | `false` |
| **Production** | `keeptrip.app` | `keeptrip-app-b06b3` | `false` |

---
**Verified for:** Keeptrip v2.0 (Premium Immersive Experience)
