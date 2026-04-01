# Keeptrip MVP Landing Page Refactor Plan

## 1. UX/UI Critique & Improvement Proposals

Following a deep review of `LandingPage.jsx` and its styling logic, here is the Principal UI/UX Architect critique to achieve an "Extreme Polish" state:

### Strengths to Preserve
- The **Slate 50 / White / Clean Shadows** palette successfully conveys the "Native App Feel".
- The **Map background** is atmospheric and aligns perfectly with the brand.
- The **Bento Grid layout** for features is a modern, high-end design pattern that organizes content well.

### UX/UI Technical Debt & Improvements
- **Mobile Touch Targets**: The Chevron controls `ChevronLeft`/`ChevronRight` inside the Hero stack have a `size={20}` with minimal padding. This violates Apple's HIG (minimum 44x44px touch targets). *Improvement: Enlarge the touch area (Glassmorphic padding).*
- **Interaction Constraints**: The Hero Cards mock stack only responds to click events on arrows. *Improvement: We must add Framer Motion `drag="x"` to allow intuitive mobile swiping between mock cards.*
- **Gamification Copy Debt**: The `landing.json` currently still talks about "Gana sellos y sube de nivel", contradicting the recent pivot away from gamification towards the premium "Digital Documentary" editorial style. *Improvement: Align the Spanish and English copy to mirror the mature tone found in the hardcoded JSX ("Rutas Vivas", "Archivo Digital Moderno").*
- **Animation Choreography**: The Bento grid uses `whileInView` with a basic stagger. We can increase visual fidelity by adding subtle `y` axis parallax effects to the Masonry gallery images or Timeline items on scroll.

---

## 2. FSD Component Refactoring Tree

`LandingPage.jsx` is currently a monolithic file (336 lines) that handles navigation, the hero section, an interactive card stack, and a complex bento grid. 

To strictly adhere to **Feature-Sliced Design (FSD)**, pages should act as "composers" rather than monolithic UI files. The page-specific UI fragments should be extracted into `pages/landing/ui/components/`.

**Proposed FSD Structure:**
```text
src/pages/landing/
├── ui/
│   ├── LandingPage.jsx                   (Composer: Layout + Hooks integration)
│   ├── LandingPage.styles.js             (Shared page styles)
│   ├── WorldMapSVG.jsx
│   └── components/
│       ├── NavBar/
│       │   └── NavBar.jsx                (Logo + Login CTA)
│       ├── Hero/
│       │   ├── HeroSection.jsx           (Hero Copy + CTA)
│       │   └── InteractiveCardStack.jsx  (The Framer Motion card deck)
│       ├── BentoFeatures/
│       │   ├── BentoSection.jsx          (Grid Container)
│       │   ├── FeatureLiveRoutes.jsx     (Card 1: 01 Map)
│       │   ├── FeatureTimeline.jsx       (Card 2: 02 Journal)
│       │   └── FeatureGallery.jsx        (Card 3: 03 Masonry)
│       └── Footer/
│           └── Footer.jsx                (Existing)
```

---

## 3. i18n Strategy & JSON Key Mapping

The component currently hardcodes almost all of its Spanish text inside the Bento grid JSX. The `landing.json` exists but does not match the mature copy.

We will map everything to structured translation keys, supporting full localization natively.

### Target `locales/es/landing.json` & `locales/en/landing.json`
```json
{
  "hero": {
    "kicker": "Para viajeros de alma",
    "titleTop": "Tus viajes merecen",
    "titleHighlight": "ser recordados.",
    "subtitle": "Deja de perder tus recuerdos en galerías infinitas. Keeptrip transforma tus rutas, fotos y fechas en un pasaporte digital vivo que cuenta tu historia.",
    "ctaButton": "Crear mi Pasaporte"
  },
  "features": {
    "liveRoutes": {
      "title": "Rutas Vivas",
      "description": "Tus viajes no son puntos estáticos. Documenta cada parada y deja que el mapa conecte tu historia en una interfaz diseñada para exploradores."
    },
    "timeline": {
      "title": "Relatos de Viaje",
      "description": "Reemplaza la galería fría por una bitácora inmersiva. Agrega anécdotas, sensaciones y conecta cada fotografía con su momento histórico."
    },
    "gallery": {
      "title": "Archivo Digital Moderno",
      "description": "Tus momentos inolvidables, curados automáticamente sin esfuerzo. Olvídate de carpetas perdidas y galerías genéricas."
    }
  },
  "mockCards": {
    "card1": { "title": "Tailandia Backpacking", "location": "Asia", "date": "Oct 2024 • 14 días" },
    "card2": { "title": "París Inolvidable", "location": "Europa", "date": "Mar 2025 • 7 días" },
    "card3": { "title": "Ruta 40", "location": "Sudamérica", "date": "Ene 2026 • 20 días" }
  }
}
```

---

## 4. Step-by-Step Execution Plan

**Step 1: i18n Foundation**
- Update `src/i18n/locales/es/landing.json` with the new schema mapping.
- Create `src/i18n/locales/en/landing.json` translating the mature copy to English.
- Wire up the language toggle in the Footer so it explicitly changes `i18n.changeLanguage(lng)`.

**Step 2: Component Extraction (FSD Refactor)**
- Create the `src/pages/landing/ui/components/` directory structure.
- Extract `NavBar`, `HeroSection`, `InteractiveCardStack`, and the `BentoFeatures` components.
- Refactor `LandingPage.jsx` to be a pure compositional layer importing these components.

**Step 3: UX/UI Polish & Framer Choreography**
- Increase touch targets (`min-height: 44px`, `min-width: 44px`) for Card stack controls and NavBar items.
- Implement Framer Motion `drag="x"` gestures on the `InteractiveCardStack` for native mobile swiping.
- Polish the Masonry Gallery rendering (ensure image spacing aligns perfectly with native iOS/Android gallery gaps).
- Clean up any redundant properties in `LandingPage.styles.js` moving them to their respective extracted component modules if needed.

**Step 4: E2E and Visual Verification**
- Start the dev server.
- Verify language switching translates 100% of the landing page.
- Test touch targets on emulated mobile viewpoint.
- Ensure the Hero stack swipe interactions feel physical (spring animations).
