# 🚀 Keeptrip: Estado de Funcionalidades (Feature Inventory)
*Última actualización: Marzo 2026*

## 🟢 FASE 1: MVP CORE (Completado y Sólido)
*Estas funcionalidades están listas para Producción.*

| Funcionalidad | Estado | Componentes / Módulos Clave | Notas de Arquitectura |
| :--- | :---: | :--- | :--- |
| **Autenticación** | ✅ Sólido | `AuthContext`, Firebase Auth | Login/Logout funcionando. |
| **Creación de Viajes** | ✅ Sólido | `EdicionModal`, `useAutoSaveEditor` | Formularios auto-guardables, robustos. |
| **Subida de Imágenes** | ✅ Sólido | `GalleryUploader`, Firebase Storage | Integrado con reglas de seguridad estrictas. |
| **Visor Inmersivo** | ✅ Sólido | `VisorViaje`, `DocumentaryHero` | Renderizado condicional según datos del viaje. |
| **Dashboard y Stats** | ✅ Sólido | `DashboardPage`, `WelcomeBento`, `LogStats` | UX refinada (Patrón Bento Box). |
| **Mapa Global** | ✅ Sólido | `HomeMap` (Mapbox), `TripSlideOver` | Previene "Efecto Matrix" (renderWorldCopies=false). |
| **Gamificación (Logros)** | 🟡 Postponed | `TravelerHub`, `AchievementsEngine` | Lógica validada pero **ocultada del MVP** (level badges, XP). Se reactiva post-lanzamiento. |
| **Búsqueda Global** | ✅ Sólido | `SearchPalette`, Búsqueda difusa | Búsqueda por 3+ letras, optimizada. |
| **Ajustes de Perfil** | ✅ Sólido | `SettingsPage`, `ProfileModal` | Subida de Avatar funcional y segura. |
| **Internacionalización** | ✅ Sólido | `i18n`, locales (es/en) | Soporte multi-idioma estructural. |

---

## 🟡 FASE 2: FAST-FOLLOWS (A estabilizar post-lanzamiento)
*Funcionalidades desarrolladas parcialmente. Se ocultarán en el MVP mediante Feature Flags o badges de "Próximamente".*

| Funcionalidad | Estado de Desarrollo | Qué falta para lanzarlo | Estrategia Actual |
| :--- | :--- | :--- | :--- |
| **Sistema de Invitaciones** | 🚧 80% (Backend Complejo) | Estabilizar el test E2E de concurrencia; manejo de errores de UI si Firebase tarda en propagar la regla de seguridad. | **Ocultar (Feature Flag)** botones de Compartir/Invitar. |
| **Vista Timeline (Visor)** | 🚧 50% (UI en progreso) | Terminar el componente visual de línea de tiempo con diseño vertical responsivo. | **Ocultar (Feature Flag)** tab de Timeline en el visor. |
| **Vista de Lista (Mis Viajes)** | 🚧 20% (Solo estructura) | Construir la tabla/lista literal que reemplace a la grilla de tarjetas. | **Deshabilitar (Toast "Próximamente")** al hacer clic. |
| **Estilos de Mapa Personalizados**| 🚧 10% (Solo UI placeholder) | Integrar tokens de estilos adicionales de Mapbox en el hook del mapa. | **Deshabilitar (Badge "Próximamente")** en Settings. |
| **Exportar Story (Instagram)** | 🚧 60% (Plantilla existe) | Conectar la generación del canvas a una exportación real de imagen (ej. html2canvas). | **Ocultar (Feature Flag)** botón de exportar. |

---

## 🔴 FASE 3: BACKLOG FUTURO
*Ideas discutidas pero no iniciadas.*

* Soporte Offline total (PWA Caching de datos de Firestore, no solo assets).
* Viajes colaborativos en tiempo real (Edición concurrente tipo Google Docs).
* Integración con APIs externas completas (ej. clima en tiempo real por parada).