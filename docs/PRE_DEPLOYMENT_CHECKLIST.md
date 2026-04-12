# 📋 Checklist Pre-Despliegue — Keeptrip

**Última actualización:** 11 de abril de 2026  
**Audiencia:** Equipo de desarrollo & Agentes de IA  
**Objetivo:** Validar calidad, seguridad y estabilidad antes de llevar cambios a producción

---

## 🎯 Resumen Ejecutivo

| Paso | Comando | Tiempo | Criticidad |
|------|---------|--------|-----------|
| 1. Limpieza de código | `npm run lint` | <1min | 🔴 CRÍTICO |
| 2. Tests unitarios | `npm run test:unit` | 1-2min | 🔴 CRÍTICO |
| 3. Tests de seguridad (Firestore) | `npm run test:rules` | 1min | 🔴 CRÍTICO |
| 4. Tests E2E | `npm run test:e2e` | 3-5min | 🔴 CRÍTICO |
| 5. Build local | `npm run build` (prod) o `npm run build:staging` | 1-2min | 🔴 CRÍTICO |
| 6. Verificación de dependencias | Revisión manual | 1min | 🟡 IMPORTANTE |
| 7. Variables de entorno | Validación de `.env` | 2min | 🔴 CRÍTICO |
| 8. Deploy a staging | `npm run deploy:staging` | 2-3min | 🔴 CRÍTICO |
| 9. QA manual en celular | Manual en navegador real | 5-10min | 🔴 CRÍTICO |
| 10. Verificación de performance | Audit Lighthouse/DevTools | 3-5min | 🟡 IMPORTANTE |
| 11. Deploy a producción | `npm run deploy:prod` | 2-3min | 🔴 PUNTO DE NO RETORNO |

**⏱️ Tiempo total esperado:** 20–35 minutos

---

## 1️⃣ Paso 1: Análisis Estático (Limpieza de Código)

### 🎯 Objetivo
Detectar errores de sintaxis, importaciones rotas, variables sin usar, y violaciones de las reglas de linting antes de compilar.

### 📋 Checklist

- [ ] Ejecuta el linter:
  ```bash
  npm run lint
  ```

- [ ] Revisa **todas** las advertencias (warnings) y errores:
  - ❌ Importaciones sin usar
  - ❌ Variables no declaradas
  - ❌ Funciones con parámetros sin usar
  - ❌ `react-hooks/preserve-manual-memoization` violations
  - ❌ Imports de rutas relativas incorrectas (usa aliases `@app`, `@shared`, etc.)

- [ ] Corrige **TODOS** los errores antes de continuar.

- [ ] Si hay warnings en `react-hooks`, verifica:
  - ¿Usaste `useMemo` con dependencias parciales de objetos? ❌ **No permitido**
  - ¿Usaste `useCallback` con propiedades opcionales? → Incluye el objeto completo en dependencias
  - Revisa tu memoria de debugging

- [ ] Ejecuta nuevamente `npm run lint` para confirmar que no hay errores.

### ✅ Criterio de Éxito
```bash
✓ found 0 errors
```

---

## 2️⃣ Paso 2: Tests Unitarios (Lógica de Aplicación)

### 🎯 Objetivo
Validar que la lógica del negocio, hooks, utilidades y componentes funcionan correctamente en aislamiento.

### 📋 Checklist

- [ ] Ejecuta los tests unitarios:
  ```bash
  npm run test:unit
  ```
  *(Excluye automáticamente e2e y tests de reglas de Firestore)*

- [ ] Verifica que **TODOS** los tests pasen ✅

- [ ] Si algún test falla:
  - ❌ Lee el mensaje de error
  - ❌ Identifica el componente/hook fallido
  - ❌ **NO continúes** hasta repararlo

- [ ] Revisa la cobertura (si está disponible):
  - Funciones críticas (autenticación, guardado de viajes): **>80% cobertura**
  - Lógica de paradas/mapeo: **>75% cobertura**

- [ ] Si modificaste:
  - Custom hooks (ej. `useLogStats`) → ¿Hay nuevos tests?
  - Modales de edición → ¿Los tests de hooks pasan?
  - Rutas o guardias → ¿Los tests de router pasan?

### 🔍 Problemas Comunes
- **"Cannot access X before initialization"** → Usado `vi.hoisted()` en mocks factory que usan variables externas
- **Snapshot mismatch** → Actualiza snapshots solo si el cambio es intencional: `npm run test:unit -- -u`

### ✅ Criterio de Éxito
```bash
✓ Test Files  12 passed (12)
✓ Tests      47 passed (47)
```

---

## 3️⃣ Paso 3: Tests de Seguridad (Firestore & Storage Rules)

### 🎯 Objetivo
Validar que las reglas de seguridad de Firestore y Storage protegen correctamente los datos. **Este es el paso más crítico para evitar brechas de seguridad.**

### 📋 Checklist

- [ ] Ejecuta los tests de reglas:
  ```bash
  npm run test:rules
  ```

- [ ] Verifica que **TODAS** las pruebas pasen ✅

- [ ] Revisa específicamente:
  - ✅ Documentos `owner-protected` solo accesibles al propietario
  - ✅ Invitados (invitees) tienen permisos limitados (lectura sí, escritura no)
  - ✅ Campos sensibles (`auth.uid`, `owner`) no pueden ser modificados por usuarios
  - ✅ Storage: Solo imágenes de viajes del usuario pueden ser descargadas/eliminadas

- [ ] **Atención Especial**: Tests E2E + Firestore rules
  - Si testas con el propietario: los permisos deben pasar ✅
  - Si testas con un invitado: debe obtener permisos de lectura (sin falsos negativos)
  - Recuerda: Algunos flujos E2E pueden fallar si las reglas son muy restrictivas. Valida con la sesión correcta.

- [ ] Si modificaste reglas de seguridad:
  ```javascript
  // Ejemplo: Regla correcta para viajes
  match /trips/{tripId} {
    allow read: if request.auth.uid == resource.data.owner || 
                   request.auth.uid in resource.data.invitees;
    allow create: if request.auth.uid == request.resource.data.owner;
    allow update, delete: if request.auth.uid == resource.data.owner;
  }
  ```

### ⚠️ Nota de Seguridad
Si falla cualquier test de reglas, **NO DESPLIEGUES**. Las brechas de seguridad en Firestore son críticas.

### ✅ Criterio de Éxito
```bash
✓ Test Files  1 passed (1)
✓ Tests      15 passed (15)
```

---

## 4️⃣ Paso 4: Tests End-to-End (Flujos Reales)

### 🎯 Objetivo
Simular el comportamiento real del usuario en navegador: crear viaje, agregar paradas, editar, mapas, imágenes, invitaciones, etc.

### 📋 Checklist

- [ ] Los emuladores de Firebase deben estar disponibles (el comando levanta automáticamente):
  ```bash
  npm run test:e2e
  ```
  *(Esto ejecuta Playwright contra emuladores de Auth, Firestore y Storage)*

- [ ] Verifica que **TODAS** las pruebas E2E pasen ✅

- [ ] Revisa los tests específicos:
  - ✅ `create-trip.spec.ts` — Crear un viaje desde cero
  - ✅ `editor-flow.spec.ts` — Editar paradas, cambiar datos
  - ✅ `delete-last-stop.spec.ts` — Eliminar paradas sin corrupción
  - ✅ `invitations.spec.ts` — Invitar usuarios, validar permisos

- [ ] Si algún test falla:
  - ❌ Lee los logs de Playwright
  - ❌ Revisa si hay videos grabados en `test-results/` (mode: `'retain-on-failure'`)
  - ❌ Reproduce manualmente en el navegador dev (`npm run dev`)

- [ ] **Importante**: Los E2E pueden tardar 3–5 minutos (emuladores + navegador real)

### 🔍 Problemas Comunes (E2E + Emulators)
- **Timeout en parada de mapeo** → El servicio de geocodificación puede ser lento en emuladores
- **Invitaciones con falsos negativos** → Valida con la sesión del invitee correcto (paras de 11 abril: usuario B puede ahora leer invitaciones)
- **Firestore rules restrictos en E2E** → Si pasó `test:rules` pero falla E2E, revisa qué usuario está en sesión

### ✅ Criterio de Éxito
```bash
✓ 4 passed (4)
```

---

## 5️⃣ Paso 5: Build Local (Compilación y Minificación)

### 🎯 Objetivo
Asegurar que la aplicación puede ser **compilada, minificada y empaquetada** correctamente para producción. Este es el paso donde fallan muchos devs principiantes.

### 📋 Checklist — Para PRODUCCIÓN

- [ ] Ejecuta el build de producción:
  ```bash
  npm run build
  ```

- [ ] Verifica que:
  - ✅ No hay errores durante la compilación (Vite + Rolldown)
  - ✅ Se genera la carpeta `dist/` exitosamente
  - ✅ El archivo `dist/index.html` existe
  - ✅ Los assets estáticos están en `dist/assets/`
  - ✅ El PWA manifest está en `dist/manifest.webmanifest`

- [ ] Revisa el tamaño de los bundles generados:
  ```bash
  ls -lh dist/assets/
  ```
  - ✅ `index-*.js` < 500KB (gzip esperado)
  - ✅ Archivos CSS minificados
  - ✅ Sin duplicate bundles

- [ ] **Punto crítico**: Variables de entorno
  - ✅ En `.env.production`, verificar que usa los valores reales de **producción**:
    - `VITE_FIREBASE_PROJECT_ID=keeptrip-app-b06b3`
    - `VITE_USE_EMULATORS=false` ← **DEBE SER FALSE**
    - `VITE_MAPBOX_TOKEN=pk.eyJ1...` ← Token real de Mapbox

### 📋 Checklist — Para STAGING

- [ ] Ejecuta el build de staging:
  ```bash
  npm run build:staging
  ```

- [ ] Verifica que:
  - ✅ No hay errores
  - ✅ Se genera `dist/`
  - ✅ En `.env.staging`:
    - `VITE_FIREBASE_PROJECT_ID=keeptrip-app-staging`
    - `VITE_USE_EMULATORS=false` ← También debe ser false en staging
    - `VITE_MAPBOX_TOKEN=pk.eyJ1...`

### 🔍 Problemas Comunes
- **"cannot find module X"** → Falta una dependencia en `package.json`
- **ESM/CJS mismatch** → Revisa importaciones de librerías; algunos módulos requieren configuración especial en Vite
- **PWA manifest error** → Si falta el PWA plugin, revisa `vite.config.js` (NO debe usarse en tests)

### ✅ Criterio de Éxito
```bash
✓ 42 modules transformed.
✓ built in 1.23s
```

---

## 6️⃣ Paso 6: Verificación de Dependencias

### 🎯 Objetivo
Asegurar que todas las librerías están correctamente instaladas y actualizadas, sin versiones conflictivas.

### 📋 Checklist

- [ ] Revisa que `package-lock.json` está sincronizado:
  ```bash
  npm ci  # Clean install (no modifica package.json)
  ```
  *(Útil si trabajas en equipo; asegura que todos tengan las mismas versiones)*

- [ ] Verifica versiones críticas:
  ```bash
  npm list react react-dom firebase vite vitest
  ```
  - ✅ React: `^19.2.0`
  - ✅ Firebase: `^12.8.0`
  - ✅ Vite: `npm:rolldown-vite@7.2.5`

- [ ] Revisa si hay vulnerabilidades:
  ```bash
  npm audit
  ```
  - ✅ 0 vulnerabilities críticas
  - ✅ Si hay warnings low/moderate, evalúa si son relevantes

- [ ] **Atención**: Si agregaste una nueva dependencia:
  - ✅ ¿Está en `package.json`?
  - ✅ ¿`package-lock.json` fue actualizado?
  - ✅ ¿Vuelve a ejecutar `npm run build` sin errores?

### ✅ Criterio de Éxito
```bash
✓ up to date (sin changes necesarios)
✓ 0 vulnerabilities
```

---

## 7️⃣ Paso 7: Validación de Variables de Entorno

### 🎯 Objetivo
Asegurar que las credenciales de Firebase, Mapbox y otros servicios estén correctamente configuradas para cada entorno (local, staging, prod).

### 📋 Checklist

- [ ] **Para DESARROLLO** (`.env.local`):
  ```env
  VITE_USE_EMULATORS=true          # ✅ Desarrollo local
  VITE_ENABLE_TEST_LOGIN=true      # ✅ Login sin credenciales reales
  ```

- [ ] **Para STAGING** (`.env.staging`):
  ```env
  VITE_FIREBASE_PROJECT_ID=keeptrip-app-staging
  VITE_FIREBASE_AUTH_DOMAIN=keeptrip-app-staging.firebaseapp.com
  VITE_FIREBASE_STORAGE_BUCKET=keeptrip-app-staging.firebasestorage.app
  VITE_USE_EMULATORS=false         # ✅ Conecta a Firebase real
  VITE_MAPBOX_TOKEN=pk.eyJ1...
  ```

- [ ] **Para PRODUCCIÓN** (`.env.production`):
  ```env
  VITE_FIREBASE_PROJECT_ID=keeptrip-app-b06b3
  VITE_FIREBASE_AUTH_DOMAIN=keeptrip-app-b06b3.firebaseapp.com
  VITE_FIREBASE_STORAGE_BUCKET=keeptrip-app-b06b3.firebasestorage.app
  VITE_USE_EMULATORS=false         # ✅ CRÍTICO: DEBE SER FALSE
  VITE_MAPBOX_TOKEN=pk.eyJ1...
  ```

- [ ] **Validación final**:
  - ✅ `VITE_USE_EMULATORS=false` en staging Y producción
  - ✅ Los `FIREBASE_PROJECT_ID` son correctos (staging ≠ prod)
  - ✅ Los tokens de Mapbox están presentes en ambos
  - ✅ No hay valores de desarrollo (`your_key_here`, etc.)

- [ ] **Secretos seguros**:
  - ✅ `.env.production` y `.env.staging` están en `.gitignore`
  - ✅ Los tokens están en tu gestor de secretos (ej. Firebase Console)
  - ✅ NO commitear credenciales en el código

### ⚠️ Crítico
Si despliegas con `VITE_USE_EMULATORS=true`, la app intentará conectar a emuladores locales de Firebase y fallará en producción.

### ✅ Criterio de Éxito
```bash
✓ .env.production válido para producción
✓ .env.staging válido para staging
✓ .gitignore protege archivos .env
```

---

## 8️⃣ Paso 8: Despliegue a Staging

### 🎯 Objetivo
Subir los cambios a un clon de producción donde puedes hacer QA sin afectar usuarios reales.

### 📋 Checklist

- [ ] Verifica que estás en la rama correcta:
  ```bash
  git branch -v  # Debe ser 'main' o tu rama de staging
  ```

- [ ] Ejecuta el despliegue a staging:
  ```bash
  npm run deploy:staging
  ```
  *(Esto corre `build:staging` + `firebase deploy --only hosting --project staging`)*

- [ ] Verifica el despliegue:
  - ✅ Output muestra "Deploy complete!"
  - ✅ Obtuviste URL de staging (ej. `https://keeptrip-app-staging.web.app`)

- [ ] **Espera 30–60 segundos** para que se propague la CDN

- [ ] Abre la URL de staging en tu navegador:
  ```
  https://keeptrip-app-staging.web.app
  ```

- [ ] Verifica que la app carga sin errores (abre DevTools: F12)

### 🔍 Problemas Comunes
- **"firebase command not found"** → Instala Firebase CLI: `npm install -g firebase-tools`
- **"Hosting URL not found"** → Espera más tiempo o revisa que el proyecto staging existe

### ✅ Criterio de Éxito
```bash
✓ Deploy complete!
✓ Hosting URL: https://keeptrip-app-staging.web.app
```

---

## 9️⃣ Paso 9: QA Manual en Celular (Smoke Test)

### 🎯 Objetivo
Validar que la experiencia de usuario es **correcta, rápida y delightful** en un dispositivo móvil real. Este es el test humano más importante.

### 📋 Checklist — Flujo Principal

**Usa tu celular real (NO emulador de escritorio).**

- [ ] **Autenticación**
  - ✅ Entra a la app
  - ✅ ¿Es rápido el login?
  - ✅ ¿Aparecen errores en consola?

- [ ] **Dashboard / Home**
  - ✅ ¿Se cargan los viajes? (1–3 segundos máx)
  - ✅ Las tarjetas (BentoGrid) se ven **premium** y alineadas
  - ✅ No hay scroll horizontal ← **CRÍTICO: Bug si lo hay**
  - ✅ El fondo es Slate 50 (#F8FAFC), no blanco puro

- [ ] **Crear Viaje**
  - ✅ Presiona FAB (botón flotante) o CTA
  - ✅ Llena el formulario: título, descripción, países
  - ✅ ¿Aparecen los países correctamente en el mapa?
  - ✅ Verifica que `normalizeCountryCode` funcionó (sin errores de país faltante)
  - ✅ Guarda el viaje

- [ ] **Editor de Paradas**
  - ✅ Abre el viaje recién creado
  - ✅ Agreg una parada (busca ciudad en el mapa)
  - ✅ ¿El mapa es responsivo? ¿Se ve el marcador?
  - ✅ Agreg una foto a la parada
  - ✅ Modifica el orden de paradas (drag & drop si existe)
  - ✅ Borra una parada ← Verifica que no haya key collisions
  - ✅ ¿El editor se siente rápido?

- [ ] **Touch Targets & Ergonomía**
  - ✅ Todos los botones son clickeables con el pulgar (44x44px mínimo)
  - ✅ Los botones CTA tienen suficiente espacio (240px min-width)
  - ✅ Al presionar un botón, se reduce sutilmente (scale 0.98)

- [ ] **Tipografía & Colores**
  - ✅ Títulos: Plus Jakarta Sans, Bold/ExtraBold
  - ✅ Cuerpo: Inter, legible
  - ✅ Botones CTA: Naranja Atómico (#FF6B35)
  - ✅ Acentos secundarios: Verde Muted Teal (#45B0A8)
  - ✅ Texto primario: Slate 800 (#1E293B)
  - ✅ NO hay fuentes Serif

- [ ] **Sombras & Bordes**
  - ✅ Tarjetas tienen sombra suave: `0 4px 20px rgba(0, 0, 0, 0.07)`
  - ✅ Bordes redondeados: Botones (9999px), tarjetas (24px), items (12–16px)
  - ✅ NO hay bordes agudos

- [ ] **Performance**
  - ✅ Las transiciones son suaves (no choppy)
  - ✅ El scroll no se congela
  - ✅ Las imágenes se cargan rápido
  - ✅ La app no usa scroll horizontal

- [ ] **Errores en Consola**
  - ✅ Abre DevTools (F12 → Console)
  - ✅ ¿Hay errores rojos? ❌ **No debería haberlos**
  - ✅ ¿Hay warnings amarillos relacionados con React? Revisa y documenta

### 📋 Checklist — Flujos Secundarios

- [ ] **Invitaciones**
  - ✅ Invita a otro usuario a un viaje
  - ✅ El invitado recibe la invitación
  - ✅ El invitado puede ver el viaje (lectura)
  - ✅ El invitado NO puede editar ni borrar paradas [Firestore rules]

- [ ] **Gamificación** (si está habilitada)
  - ✅ Los insignias se muestran correctamente
  - ✅ Son ilustraciones vectoriales, no texto plano

- [ ] **Búsqueda**
  - ✅ Busca un viaje por nombre
  - ✅ ¿El icono de búsqueda es lucide-react?
  - ✅ Si no hay resultados, ¿aparece el Telescope (empty state)?

- [ ] **Ajustes / Perfil**
  - ✅ Abre tu perfil
  - ✅ Cambia nombre, email, foto
  - ✅ Los cambios se guardan correctamente
  - ✅ El logout funciona

### ✅ Criterio de Éxito
- ✅ Ningún error en consola
- ✅ La app se siente **premium**, rápida y fácil de usar
- ✅ NO hay scroll horizontal
- ✅ Las transiciones son suaves
- ✅ El celular calienta menos (buen rendimiento)

---

## 🔟 Paso 10: Verificación de Performance

### 🎯 Objetivo
Asegurar que la app carga rápido y es eficiente en términos de bundling, rendering y transferencia de datos.

### 📋 Checklist

- [ ] **Lighthouse Audit** (Chrome DevTools)
  - Abre la app en Chrome
  - DevTools → Lighthouse
  - Genera reporte (Mobile)
  - Targets:
    - ✅ Performance: >85
    - ✅ Accessibility: >90
    - ✅ Best Practices: >85
    - ✅ SEO: >85

- [ ] **Network Tab** (DevTools → Network)
  - ✅ Total bundle < 1MB (para primer load)
  - ✅ Gzip enabled en respuestas
  - ✅ CSS, JS minificados
  - ✅ Imágenes optimizadas (WebP/AVIF si es posible)

- [ ] **Memory Leaks** (DevTools → Memory)
  - ✅ Abre/cierra modales varias veces
  - ✅ Navega entre viajes
  - ✅ El consumo de memoria no crece indefinidamente

- [ ] **Rendering Performance** (DevTools → Performance)
  - ✅ Scroll no causa jank (60 fps)
  - ✅ Las transiciones corren a 60 fps

- [ ] **Bundle Analysis** (opcional pero recomendado)
  ```bash
  npm run build
  # Inspecciona dist/assets/ para tamaños
  ```

### 🔍 Red Flags
- ❌ Performance < 75 → Optimiza imágenes, reduce JS
- ❌ Accessibility < 80 → Revisa contraste, labels, ARIA
- ❌ Memory constantly growing → Posible memory leak

### ✅ Criterio de Éxito
```bash
✓ Lighthouse scores: >85 (todos los rubros)
✓ Bundle size < 1MB
✓ No memory leaks detectados
```

---

## 🚀 Paso 11: Despliegue a Producción (PUNTO DE NO RETORNO)

### 🎯 Objetivo
Llevar los cambios verificados a usuarios reales.

### ⚠️ CHECKLIST FINAL ANTES DE DEPLOYAR

- [ ] ✅ Linting: 0 errors (`npm run lint`)
- [ ] ✅ Tests unitarios: ALL PASS (`npm run test:unit`)
- [ ] ✅ Tests Firestore: ALL PASS (`npm run test:rules`)
- [ ] ✅ Tests E2E: ALL PASS (`npm run test:e2e`)
- [ ] ✅ Build local: SUCCESS (`npm run build`)
- [ ] ✅ Staging QA: ✅ Premium experience en celular
- [ ] ✅ Lighthouse: >85 en todos los rubros
- [ ] ✅ `.env.production` correcto (EMULATORS=false)
- [ ] ✅ No hay errores en consola
- [ ] ✅ Firestore rules están actualizadas y testeadas
- [ ] ✅ Has informado al equipo que vas a deployar

### 📋 Deploy a Producción

- [ ] Ejecuta el despliegue:
  ```bash
  npm run deploy:prod
  ```
  *(Esto corre `build` + `firebase deploy --only hosting --project default`)*

- [ ] Espera a que termine (2–3 minutos)

- [ ] Verifica el output:
  ```bash
  ✓ Deploy complete!
  ✓ Hosting URL: https://keeptrip.app
  ```

- [ ] Abre la app en producción:
  ```
  https://keeptrip.app
  ```

- [ ] **Post-Deploy Smoke Test** (5 minutos):
  - ✅ La app carga en `keeptrip.app`
  - ✅ Puedes loguearte
  - ✅ Puedes ver tus viajes
  - ✅ Crea una parada rápida (no necesita ser perfecta, solo validar flujo)
  - ✅ Verifica que los usuarios recién llegan no ven errores

- [ ] **Monitorea los primeros 30 minutos**:
  - ✅ Observa Firebase Console → Analytics
  - ✅ Revisa Cloud Logging si hay errores
  - ✅ Pide a otro usuario que pruebe la app

### 🚨 Si algo sale mal

- [ ] **Rollback inmediato** (vuelve a la versión anterior):
  ```bash
  # Vuelve a tu último commit seguro
  git revert <commit-id>
  npm run deploy:prod
  ```

- [ ] **Notifica al equipo**
- [ ] **Investiga qué salió mal** (revisa logs, errores)
- [ ] **Crea un issue** para documentar el problema
- [ ] **No lo hagas solo**: siempre coordina con tu equipo antes de rollback

### ✅ Criterio de Éxito
```bash
✓ Deploy complete!
✓ App loads in https://keeptrip.app without errors
✓ Real users can log in and use the app
✓ No critical errors in Console or Logs
```

---

## 📊 Resumen de Entornos

| Entorno | URL | Firebase Project | EMULATORS | Build Command |
|---------|-----|------------------|-----------|-----------------|
| **Local** | `http://localhost:5173` | keeptrip (emulado) | `true` | `npm run dev` |
| **Staging** | `https://keeptrip-app-staging.web.app` | `keeptrip-app-staging` | `false` | `npm run build:staging` |
| **Producción** | `https://keeptrip.app` | `keeptrip-app-b06b3` | `false` | `npm run build` |

---

## 🛡️ Reglas de Seguridad

### Antes de cada Deploy

- [ ] Firestore rules validadas (`npm run test:rules`)
  - ✅ Owner-protected: solo el owner puede modificar
  - ✅ Invitees: solo lectura
  - ✅ Públicos (si los hay): validados explícitamente

- [ ] Storage rules validadas
  - ✅ Solo el owner puede subir/descargar fotos

- [ ] Variables de entorno no contienen secretos en repo
  - ✅ `.env.production` en `.gitignore`

- [ ] CORS configurado correctamente (`cors.json`)
  - ✅ Solo dominios permitidos

---

## 📝 Notas Finales

### Tiempo esperado por paso
- Linting + Tests: **~10 minutos**
- Build + Deploy staging: **~5 minutos**
- QA manual + Performance: **~10 minutos**
- Deploy producción + Smoke test: **~5 minutos**
- **Total: 20–35 minutos**

### Checklist de Equipo
Si trabajas en equipo:
1. Crea una rama (`feat/nueva-feature`)
2. Pasa TODOS los pasos de este checklist
3. Abre un Pull Request
4. Pide revisión de otro dev
5. Mezcla a `main`
6. Deploy automático O manual según tu CI/CD

### Errores Comunes (No cometerlos otra vez)
- ❌ Deployar sin pasar tests
- ❌ Dejar `VITE_USE_EMULATORS=true` en producción
- ❌ Saltarse QA en celular
- ❌ Commitear `.env.production`
- ❌ No revisar Firestore rules
- ❌ No testear con el usuario invitado/correcto
- ❌ Asumir que "funciona en dev, funciona en prod" (falso)

---

## 📞 Escalación y Soporte

Si encuentras problemas:

1. **Error en lint** → Revisa eslint rules en `eslint.config.js`
2. **Test falla** → Revisa logs de Vitest/Playwright en terminal
3. **Build falla** → Revisa dependencies, imports relativos, versiones de Vite
4. **Deploy falla** → Verifica Firebase CLI está actualizado (`firebase --version`)
5. **Firestore rules error** → Revisa `firestore.rules` y tests
6. **Mapbox issue** → Token correcto en `.env` para el entorno

---

**Documento generado:** 11 de abril de 2026  
**Válido para:** Keeptrip v2.0 (Extreme Polish)  
**Próxima revisión:** Tras cambios mayores de infraestructura  
**Dominio de Producción:** https://keeptrip.app
