# Protocolo Lighthouse (Keeptrip)

## Objetivo
Estandarizar las mediciones de Lighthouse para evitar resultados contaminados y poder comparar cambios de performance entre commits.

Este protocolo prioriza la ruta critica autenticada `/dashboard` en mobile.

## Estado actual
Este material queda como infraestructura de soporte para cuando retomes performance benchmarking.

- No forma parte del flujo activo de Epic 7.
- No mezclar cambios de este protocolo con ajustes funcionales de la app.
- Mantener los scripts y notas para uso posterior, pero tratarlos como backlog.

## Alcance
- Ruta principal: `/dashboard` (auth requerida)
- Rutas secundarias recomendadas: `/trips`, `/map`, `/`
- Categoria minima obligatoria: `Performance`
- Categorias opcionales: `Accessibility`, `Best Practices`, `SEO`

## Entornos soportados
- Produccion: `https://keeptrip.app`
- Staging: `https://keeptrip-app-staging.web.app`

## Reglas de consistencia
1. Misma version de Chrome para todas las corridas de una misma tanda.
2. Sin extensiones de navegador.
3. Sin otras pestanas pesadas abiertas durante la medicion.
4. Misma URL de entorno durante toda la tanda (staging o prod, no mezclar).
5. Misma configuracion de Lighthouse entre corridas.
6. Reportar mediana de 5 corridas (no usar una sola corrida).

## Preparacion previa
### 1) Verificar entorno y feature flags
- Confirmar URL objetivo (staging o prod).
- Confirmar `operational_flags` en nivel `0` (sin readonly y sin maintenance).
- Confirmar que backend y reglas desplegadas coinciden con el entorno.

### 2) Definir perfil de datos
Usar siempre un usuario de prueba estable para que el volumen de datos sea comparable.

- Perfil `LIGHT`: pocas paradas, pocas fotos.
- Perfil `HEAVY`: mas viajes/paradas/fotos (representativo de uso real).

Para regressions, correr al menos `LIGHT`. Para validacion final, correr `LIGHT` + `HEAVY`.

## Metodo recomendado (DevTools)
### A. Lanzar Chrome limpio
En Windows, abrir una terminal nueva y ejecutar (ajusta la ruta de Chrome si hace falta):

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="%TEMP%\keeptrip-lh" --disable-extensions
```

### B. Login y ruta objetivo
1. Abrir la app en la URL del entorno.
2. Iniciar sesion con el usuario de prueba definido.
3. Navegar a `/dashboard`.
4. Esperar que la UI quede estable (sin loaders activos).

### C. Ejecutar Lighthouse
En DevTools -> `Lighthouse`:
- Device: `Mobile`
- Mode: `Navigation`
- Categories: `Performance` (y opcionales si aplica)
- Throttling: default de Lighthouse (simulated)
- `Clear storage`: **OFF** para rutas autenticadas

Ejecutar 5 corridas consecutivas y guardar cada reporte JSON + HTML.

## Metodo automatizado (script)
Si quieres evitar la ejecucion manual corrida por corrida, usa el runner por lotes:

`scripts/lighthouse/run-batch.mjs`

### 1) Ver ayuda rapida
```bash
npm run lh:help
```

### 1.1) Flujo recomendado (mas automatico)
Staging:

```bash
# 1) Abrir Chrome con el perfil correcto y la URL de dashboard
npm run lh:open:staging-profile

# 2) Iniciar sesion y verificar manualmente que quedas en /dashboard
# 3) Cerrar Chrome

# 4) Correr batch robusto
npm run lh:staging:dashboard:light:robust
```

Produccion:

```bash
npm run lh:open:prod-profile
npm run lh:prod:dashboard:light:robust
```

### 2) Preparar sesion autenticada (solo rutas privadas)
El script valida que la corrida termine en la ruta esperada (por ejemplo `/dashboard`).
Para eso, usa un perfil persistente de Chrome por entorno e inicia sesion una vez:

Produccion:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\proyecto-viajes\.lighthouse-profile-prod" --disable-extensions
```

Staging:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\proyecto-viajes\.lighthouse-profile-staging" --disable-extensions
```

Luego:
1. Inicia sesion en Keeptrip con el usuario de prueba del perfil (`LIGHT` o `HEAVY`).
2. Cierra Chrome.
3. Ejecuta el batch.

### 3) Ejecutar batch LIGHT (mobile, 5 corridas)
Produccion (comando completo):

```bash
npm run lh:run -- --baseUrl=https://keeptrip.app --route=/dashboard --env=prod --profile=light --runs=5 --device=mobile --userDataDir=.lighthouse-profile-prod
```

Staging (comando completo):

```bash
npm run lh:run -- --baseUrl=https://keeptrip-app-staging.web.app --route=/dashboard --env=staging --profile=light --runs=5 --device=mobile --userDataDir=.lighthouse-profile-staging
```

### 4) Ejecutar batch HEAVY
Produccion (comando completo):

```bash
npm run lh:run -- --baseUrl=https://keeptrip.app --route=/dashboard --env=prod --profile=heavy --runs=5 --device=mobile --userDataDir=.lighthouse-profile-prod
```

Staging (comando completo):

```bash
npm run lh:run -- --baseUrl=https://keeptrip-app-staging.web.app --route=/dashboard --env=staging --profile=heavy --runs=5 --device=mobile --userDataDir=.lighthouse-profile-staging
```

### 4.1) Atajos npm listos (sin pasar argumentos)
Si prefieres no escribir opciones largas, usa estos scripts:

```bash
# Produccion
npm run lh:prod:dashboard:light
npm run lh:prod:dashboard:heavy
npm run lh:prod:dashboard:light:robust

# Staging
npm run lh:staging:dashboard:light
npm run lh:staging:dashboard:heavy
npm run lh:staging:dashboard:light:robust
```

Notas:
1. Los atajos usan `--runs=5`, `--device=mobile` y `/dashboard`.
2. Los perfiles de sesion quedan separados por entorno:
	- Prod: `.lighthouse-profile-prod`
	- Staging: `.lighthouse-profile-staging`

### 5) Salidas generadas
Por cada run:
- `{env}-{ruta}-{perfil}-runN.report.json`
- `{env}-{ruta}-{perfil}-runN.report.html`

Resumen automatico:
- `{env}-{ruta}-{perfil}-summary.json`
- `{env}-{ruta}-{perfil}-summary.md`

Ubicacion:
- `lighthouse/YYYY-MM-DD/`

### 6) Que calcula el resumen
La mediana de 5 corridas para:
- Performance score
- FCP
- LCP
- TBT
- Speed Index
- TTI
- Main-thread work
- JS bootup time

### 7) Flags utiles
- `--categories=performance,accessibility,best-practices,seo`
- `--device=desktop`
- `--showBrowser` (sin headless)
- `--retryPerRun=3` (sube reintentos por corrida ante fallos temporales)
- `--tempDir=.lighthouse-temp` (fuerza carpeta temporal dedicada)
- `--skipRedirectCheck` (solo para casos puntuales, no recomendado para rutas privadas)

### 8) Troubleshooting del script
Si falla con redirect inesperado a `/` o landing:
1. Reabre Chrome con el mismo `--user-data-dir`.
2. Verifica sesion activa y vuelve a cerrar.
3. Repite el comando `npm run lh:run`.

Notas sobre cuenta y login:
1. No necesitas una cuenta "especial" para autenticar, pero para mediciones comparables conviene una cuenta de QA estable (siempre el mismo dataset LIGHT/HEAVY).
2. Si el runner termina en `/` en vez de `/dashboard`, el problema es de sesion en ese perfil de navegador para ese origen (staging != produccion), no del comando.
3. Login en `https://keeptrip.app` no sirve para `https://keeptrip-app-staging.web.app`; cada origen guarda su sesion por separado.

Si falla con `EPERM` en `lighthouse.*` (Windows):
1. El runner ya reintenta automaticamente la corrida (default: 2 intentos).
2. Si el error aparece solo al limpiar temporales pero los reportes se generaron, el runner continua automaticamente con esos artefactos.
3. Si persiste, vuelve a correr con mas reintentos:

```bash
npm run lh:run -- --baseUrl=https://keeptrip-app-staging.web.app --route=/dashboard --env=staging --profile=light --runs=5 --device=mobile --userDataDir=.lighthouse-profile-staging --retryPerRun=3
```

4. Si aun falla, cambia temporalmente de carpeta temp:

```bash
npm run lh:run -- --baseUrl=https://keeptrip-app-staging.web.app --route=/dashboard --env=staging --profile=light --runs=5 --device=mobile --userDataDir=.lighthouse-profile-staging --tempDir=.lighthouse-temp-alt --retryPerRun=3
```

## Nomenclatura de artefactos
Guardar reportes en una carpeta por fecha:

`lighthouse/YYYY-MM-DD/`

Formato de archivo:

`{entorno}-{ruta}-{perfil}-run{N}.json`

Ejemplo:

- `prod-dashboard-light-run1.json`
- `prod-dashboard-light-run2.json`
- `prod-dashboard-light-run3.json`
- `prod-dashboard-light-run4.json`
- `prod-dashboard-light-run5.json`

## Metricas a registrar (minimo)
- Performance score
- FCP
- LCP
- TBT
- Speed Index
- TTI
- Largest Contentful Paint element
- Main-thread work
- JS bootup time

## Regla de agregacion
Para cada metrica, usar la **mediana** de las 5 corridas.

Si una corrida falla (timeout/error), descartarla y volver a correr hasta completar 5 validas.

## Criterios de calidad para la tanda
La tanda se considera valida si:
1. No hay errores de Lighthouse por timeout.
2. No hay warning de entorno contaminado repetido en la mayoria de corridas.
3. Las 5 corridas usan exactamente la misma configuracion.

## Troubleshooting rapido
### 1) Warning de IndexedDB / storage contaminado
- Cerrar Chrome.
- Reabrir con `--user-data-dir` limpio.
- Repetir login y corridas.

### 2) Timeout durante auditoria
- Verificar que no haya procesos pesados en paralelo.
- Cerrar otras pestanas.
- Repetir corrida en profile limpio.

### 3) Variabilidad extrema entre runs
- Confirmar que se uso el mismo usuario/perfil de datos.
- Confirmar que no hubo cambios de red/CPU del host.
- Aumentar a 7 corridas y seguir usando mediana.

## Checklist de reporte
Antes de comparar resultados entre ramas:
- [ ] Misma URL de entorno
- [ ] Mismo perfil de datos
- [ ] 5 corridas validas por ruta
- [ ] Mediana calculada por metrica
- [ ] Adjuntar JSON/HTML en carpeta de evidencia

## Nota para este repo
Despues del ajuste de chunking, el HTML inicial no debe incluir preload de Mapbox. Si vuelve a aparecer preload de mapa en `dist/index.html`, tratarlo como regression de critical path.

## Arquitectura de Performance y Excepciones Registradas (Abril 2026)
Tras exhaustivas auditorías (Score Staging: 95), se han establecido los siguientes patrones inquebrantables de rendimiento que futuros agentes de IA o humanos **nunca** deben revertir:

### 1. Interaction-Based Auto-Loading (TBT Defense)
Lighthouse castiga sumamente el Main-Thread Javascript. El renderizado y parseo de `mapbox-gl` (~1.6MB) aniquilaba el **Total Blocking Time (TBT)** durante la inicialización de la app.
- **Implementación actual:** El `HomeMap` u otros visores complejos se cargan única y exclusivamente cuando el usuario realiza la primera interacción con la CPU (`scroll`, `mousemove` o `touchstart`).
- **Limpieza (Garbage Collection):** Los listeners se atan con `{ once: true, passive: true }` y se limpian instantaneamente luego de dispararse la bandera de interacción.
- **Advertencia:** **NUNCA volver a usar `setTimeout` temporal (ej. 1000ms)** para cargar librerías pesadas en el arranque, ya que esto ocurre dentro de la ventana de perfilado de Lighthouse y destruye la métrica.

### 2. Largest Contentful Paint (LCP) Hints
El impacto visual más veloz (`keeptrip-splash > img.splash-logo` en `index.html`) ha sido priorizado agresivamente.
- **Implementación actual:** Se usa `<link rel="preload" as="image" href="/favicon.svg" fetchpriority="high" />` en el `<head>` y el flag nativo `fetchpriority="high"` directo en el target LCP. 
- **Advertencia:** Toda adición futura de fuentes o imágenes críticas (*Above-the-fold*) debe ser validada contra penalizaciones de TTI/LCP.
