# Draft PR: feat(invitations): accept/decline flow (shared trips)

Resumen
- Implementa el flujo de invitaciones para compartir viajes: creación, escucha, aceptar y rechazar.
- Añade UI para ver/gestionar invitaciones y actualiza la suscripción de `useViajes` para incluir viajes compartidos.
- Asegura acceso de lectura mediante `sharedWith` y reglas Firestore que permiten al invitado añadir sólo su UID.

Cambios principales
- `src/services/invitationsService.js` — create / listen / accept / decline
- `src/hooks/useInvitations.js` — hook de suscripción + acciones
- `src/components/Invitations/InvitationsList.jsx` — UI Aceptar / Rechazar
- `src/hooks/useViajes.js` — subscription to shared trips (collectionGroup)
- `src/components/Header/Header.jsx` — notificación / acceso a la vista de invitaciones
- `firestore.rules` — reglas para `sharedWith`
- Tests: unit/component tests para hook y componente

Motivación
Permitir que un usuario comparta acceso de sólo lectura a sus viajes con compañeros (companions). Los invitados reciben una invitación que deben aceptar; al aceptar se agrega su UID a `viaje.sharedWith` y pasan a ver el viaje.

Cómo probar localmente
1. git checkout feature/invitations-acceptance
2. npm test (tests nuevos: useInvitations, InvitationsList)
3. npm run dev + usar dos cuentas en el emulator / Firebase para crear invitaciones y probar accept/decline

Seguridad
- Firestore rules restrictivas: solo el owner puede escribir en el viaje; un invitee puede solamente añadir su UID a `sharedWith`.

Checklist (PR draft)
- [x] Servicio: crear / escuchar invitaciones
- [x] Hook: `useInvitations` (suscripción, accept/decline)
- [x] UI: `InvitationsList` + badge en `Header`
- [x] Integración: `useViajes` incluye viajes compartidos (collectionGroup)
- [x] Reglas Firestore: permitir que invitee agregue sólo su UID a `sharedWith`
- [x] Tests unitarios / componentes básicos añadidos
- [ ] Tests de reglas en Firebase Emulator (integration)
- [ ] UX: abrir `Visor` automáticamente al aceptar invitación
- [ ] E2E / notificaciones por email (Cloud Function) — futura iteración

Notas para reviewers
- Revisa la regla `allow update` en `firestore.rules` (escenario security-sensitive).
- Probar aceptación de invitación con emulador para validar `sharedWith`.

Resumen de archivos (rápido)
- src/services/invitationsService.js
- src/hooks/useInvitations.js
- src/components/Invitations/InvitationsList.jsx
- src/hooks/useViajes.js (ajuste)
- src/components/Header/Header.jsx (badge + acceso)
- firestore.rules (ajuste)
- src/hooks/__tests__/useInvitations.test.jsx
- src/components/Invitations/__tests__/InvitationsList.test.jsx

---

Si quieres, creo el PR draft en GitHub (necesito token/CLI en tu entorno). Si no, puedes crear el PR desde el enlace que te dejo a continuación (ya he empujado la rama y el cuerpo está en este archivo).
