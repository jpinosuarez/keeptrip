# Safe Area & Notch/Dynamic Island — Guía de implementación

> Este documento es la referencia canónica para el manejo de safe areas en Keeptrip.
> **Todo nuevo componente con `position: fixed` o `position: sticky` DEBE consultar esta guía antes de mergear.**

---

## Contexto: Por qué existe este problema

iOS con `viewport-fit=cover` (configurado en `index.html`) extiende el contenido de la app bajo las zonas del sistema:
- **Barra de estado** (reloj, batería, señal)
- **Notch clásico** (iPhone X a 13) → `safe-area-inset-top ≈ 44px`
- **Dynamic Island** (iPhone 14 Pro en adelante) → `safe-area-inset-top ≈ 59px`
- **Home indicator** (iPhone X en adelante, sin botón físico) → `safe-area-inset-bottom ≈ 34px`
- **Landscaping** (notch en lateral) → `safe-area-inset-left/right` variables

`viewport-fit=cover` + `apple-mobile-web-app-status-bar-style: black-translucent` son **intencionales** — permiten la UI inmersiva. El coste es que el desarrollador debe compensar manualmente el posicionamiento.

---

## Variables CSS globales disponibles (ya definidas en `:root`)

```css
/* src/shared/config/styles/index.css */
--safe-area-inset-top:    env(safe-area-inset-top, 0px);
--safe-area-inset-right:  env(safe-area-inset-right, 0px);
--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-inset-left:   env(safe-area-inset-left, 0px);
--safe-area-top-padding:  max(12px, var(--safe-area-inset-top));
```

> En desktop y browsers sin soporte `env()`, todos los valores resuelven a `0px` → **sin impacto en desktop**.

---

## Reglas obligatorias

### Regla 1: Ningún `position: fixed` usa coordenadas hardcodeadas que den a un borde del sistema

| Borde | ❌ Incorrecto | ✅ Correcto |
|---|---|---|
| Top (notch/status bar) | `top: 0` o `top: 10px` | `top: 'env(safe-area-inset-top, 0px)'` |
| Bottom (home indicator) | `bottom: 0` o `bottom: 16px` | `bottom: 'max(8px, env(safe-area-inset-bottom, 0px))'` |
| Right (landscape notch) | `right: 24px` | `right: 'max(24px, env(safe-area-inset-right, 0px))'` |
| Left (landscape notch) | `left: 0` | `left: 'max(0px, env(safe-area-inset-left, 0px))'` |

### Regla 2: Overlays fullscreen usan padding en lugar de coordenadas de child elements

Para modales/overlays que ocupan `inset: 0`, compensar con `padding` en el overlay padre:

```js
// ✅ Correcto: el overlay tiene padding, los hijos no necesitan saber sobre safe areas
overlay: {
  position: 'fixed',
  inset: 0,
  paddingTop:    'max(20px, env(safe-area-inset-top, 20px))',
  paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
  paddingLeft:   'max(20px, env(safe-area-inset-left, 20px))',
  paddingRight:  'max(20px, env(safe-area-inset-right, 20px))',
}
```

### Regla 3: Bottom sheets anchored al borde inferior usan `paddingBottom`

```js
// ✅ Correcto: padding separado para poder overridear solo el eje vertical
bottomSheet: {
  position: 'fixed',
  bottom: 0, left: 0, right: 0,
  padding: '24px 16px',
  paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
}
```

### Regla 4: Tabs flotantes (mobile tab bar)

La tab bar flota sobre el home indicator. La fórmula correcta:
```css
bottom: max(8px, env(safe-area-inset-bottom, 0px));
```
- En iPhone SE (sin home indicator): `max(8px, 0px)` = 8px
- En iPhone X+ (home indicator 34px): `max(8px, 34px)` = 34px → queda justo encima

### Regla 5: Contenido desplazable bajo una tab bar flotante móvil

El contenido de las páginas necesita espacio para "respirar" sobre la tab bar:
```css
/* ✅ Correcto */
padding-bottom: calc(80px + max(16px, env(safe-area-inset-bottom, 0px)));
/* = 80px (altura tab) + al menos 16px sobre el home indicator */
```

### Regla 6: Modales, Sheets y Formularios de Edición (Virtual Keyboard & visualViewport)

En iOS Safari, las unidades de viewport dinámico (`dvh`) y los contenedores `position: fixed; inset: 0` **no se reducen** cuando el teclado virtual en pantalla se despliega. Como resultado, las barras de acción inferiores (`sticky` o `flex` al fondo) quedan ocultas detrás del teclado virtual si no se gestionan interactivamente:

1. **Aislamiento de Scroll (`overscroll-contain`):**
   Todos los contenedores con scroll interno en modales/sheets deben tener `overscroll-contain` para evitar el rubber-banding que arrastra la página de fondo.
2. **Detección interactiva de teclado:**
   Utilizar `useVirtualKeyboard` para escuchar `window.visualViewport` (`resize` y `scroll` con `{ passive: true }`).
   - `keyboardOffset = Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)`.
3. **Clearance dinámico de la barra de acciones:**
   - **Teclado cerrado:** Aplicar `pb-[max(16px,env(safe-area-inset-bottom,16px))]` (para salvar el home indicator).
   - **Teclado abierto:** Elevar la barra o contraer el contenedor según `keyboardOffset` y compactar el padding a `pb-3 sm:pb-4` (el teclado sustituye al home indicator).
4. **Auto-scroll en foco:**
   Los inputs y textareas deben disparar `target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` tras un delay de ~280ms para esperar la animación de apertura del teclado virtual sin interferir con la inercia táctil.

---

## Cheatsheet de patrones

### CSS

```css
/* Top: siempre sobre la barra de estado y Dynamic Island */
padding-top: max(12px, env(safe-area-inset-top, 0px));

/* Bottom: sobre el home indicator */
padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));

/* Bottom FAB / Tab bar flotante */
bottom: max(8px, env(safe-area-inset-bottom, 0px));

/* Bottom sheet */
padding-bottom: max(24px, env(safe-area-inset-bottom, 0px));

/* Contenido bajo tab bar de 64px */
padding-bottom: calc(80px + max(16px, env(safe-area-inset-bottom, 0px)));
```

### CSS-in-JS (inline React styles)

```js
// Constantes reutilizables (sugerido en futuros componentes)
const SAFE_AREA = {
  topPadding:    'max(12px, env(safe-area-inset-top, 0px))',
  bottomPadding: 'max(16px, env(safe-area-inset-bottom, 0px))',
  tabBottom:     'max(8px, env(safe-area-inset-bottom, 0px))',
  sheetBottom:   'max(24px, env(safe-area-inset-bottom, 0px))',
  rightPadding:  'max(0px, env(safe-area-inset-right, 0px))',
  leftPadding:   'max(0px, env(safe-area-inset-left, 0px))',
};
```

---

## Inventario de componentes auditados (estado actual)

| Componente | Archivo | Estado | Detalle |
|---|---|---|---|
| Mobile Tab Bar | `Sidebar.css` | ✅ Fixed | `bottom: max(8px, env(safe-area-inset-bottom))` |
| Desktop Fluid Rail | `Sidebar.css` | ✅ OK | `padding: max(24px, env(safe-area-inset-top))` |
| Header | `Header.jsx` | ✅ OK | `padding: var(--safe-area-top-padding)` |
| Mobile Search Dropdown | `Header.jsx` | ✅ Fixed | `top: calc(64px + var(--safe-area-inset-top))` |
| Scaffold Content (mobile) | `AppScaffold.css` | ✅ Fixed | `padding-bottom: calc(80px + max(16px, env(...)))` |
| Mobile FAB | `MobileCreateFab.jsx` | ✅ Fixed | `right: max(24px, env(safe-area-inset-right))` |
| Toast Viewport | `ToastContext.jsx` | ✅ OK | `bottom/right: max(20px, env(...))` |
| OfflineBanner | `OfflineBanner.styles.js` | ✅ Fixed | `paddingBottom: max(..., env(safe-area-inset-bottom))` |
| ReadOnlyModeBanner | `ReadOnlyModeBanner.jsx` | ✅ Fixed | `top: max(10px, env(safe-area-inset-top))` |
| Camera Menu Sheet | `EditableTripHeader.styles.js` | ✅ Fixed | `paddingBottom: max(32px, env(safe-area-inset-bottom))` |
| SearchPalette (mobile) | `SearchPalette.jsx` | ✅ Fixed | `paddingTop` compensa Dynamic Island en fullscreen |
| Lightbox overlay | `GalleryGrid.jsx` | ✅ Fixed | Todos los ejes con `max(20px, env(...))` |
| BottomSheet | `BottomSheet.jsx` | ✅ OK | `paddingBottom: max(16px, env(safe-area-inset-bottom))` |
| ConfirmModal | `ConfirmModal.styles.js` | ✅ OK | `paddingBottom: max(16px, env(safe-area-inset-bottom))` |
| EdicionModal | `EdicionModal.jsx` | ✅ Compliant | Safe-area `max(16px, env(safe-area-inset-bottom, 16px))`, `overscroll-contain`, y clearance de teclado interactivo via `useVirtualKeyboard` (`visualViewport`) |
| EditorFocusPanel | `EditorFocusPanel.jsx` | ✅ Compliant | Panel adaptativo con clearance de teclado (`bottom: keyboardOffset`), barra de acciones sticky con `max(16px, env(safe-area-inset-bottom, 16px))` y `overscroll-contain` |
| VisorViaje | `VisorViaje.styles.js` | ✅ OK | `top/right/bottom: max(Xpx, env(...))` ya aplicados |
| PWAUpdatePrompt | `PWAUpdatePrompt.styles.js` | ✅ OK | `bottom: max(16px, env(safe-area-inset-bottom))` |
| ShareStoryButton | `ShareStoryButton.jsx` | ✅ OK | `padding: 0 0 env(safe-area-inset-bottom) 0` |
| ProfileModal | `ProfileModal.styles.js` | ✅ N/A | `position: fixed, inset: 0` — fullscreen, OK |
| AuthModal | `AuthModal.jsx` | ✅ N/A | `position: fixed, inset: 0` — fullscreen, OK |
| SearchModal | `SearchModal.styles.js` | ✅ N/A | `position: fixed, inset: 0` — fullscreen, OK |
| CelebrationQueue | `CelebrationQueue.jsx` | ✅ N/A | `position: fixed, inset: 0` — fullscreen, OK |
| LevelUpModal | `LevelUpModal.jsx` | ✅ N/A | `position: fixed, inset: 0` — fullscreen, OK |
| AppModalsManager | `AppModalsManager.jsx` | ✅ N/A | Contenedor de overlays, `inset: 0` |

---

## Cómo testear en desarrollo

### Chrome DevTools (simulación)
1. Abrir DevTools → **Device Toolbar** (Cmd+Shift+M)
2. Seleccionar **iPhone 14 Pro** (para Dynamic Island con `safe-area-inset-top: 59px`)
3. Seleccionar **iPhone X** (para notch clásico con `safe-area-inset-top: 44px`)
4. Los valores `env(safe-area-inset-*)` se aplican correctamente en el emulador

### Verificar valores reales en consola
```js
// Pegar en DevTools Console en el emulador de iOS
const el = document.createElement('div');
el.style.paddingTop = 'env(safe-area-inset-top)';
document.body.appendChild(el);
console.log('inset-top:', getComputedStyle(el).paddingTop);
el.remove();
```

---

## Lo que NO debe modificarse

| Setting | Archivo | Razón |
|---|---|---|
| `viewport-fit=cover` | `index.html` | Habilita el modo inmersivo. Sin esto, `env()` devuelve `0px` siempre |
| `apple-mobile-web-app-status-bar-style: black-translucent` | `index.html` | Permite ver la UI debajo de la barra de estado iOS |
| Variables `--safe-area-inset-*` en `:root` | `index.css` | Son el sistema de tokens del que dependen todos los componentes |

---

## Checklist para nuevos componentes

Antes de mergear cualquier componente con `position: fixed`:

- [ ] ¿El elemento tiene algún borde que da a una zona del sistema (top/bottom/left/right)?
- [ ] Si **top**: usar `max(Xpx, env(safe-area-inset-top, 0px))`
- [ ] Si **bottom**: usar `max(Xpx, env(safe-area-inset-bottom, 0px))`
- [ ] Si **right** (puede ser lateral en landscape): usar `max(Xpx, env(safe-area-inset-right, 0px))`
- [ ] Si es un **fullscreen overlay** (`inset: 0`): agregar `padding` en los 4 ejes con `env()`
- [ ] Si es un **bottom sheet**: `paddingBottom: max(Xpx, env(safe-area-inset-bottom, Xpx))`
- [ ] Si hay **contenido scrolleable** bajo una tab bar flotante: `padding-bottom: calc(tabHeight + max(gap, env(safe-area-inset-bottom)))`
