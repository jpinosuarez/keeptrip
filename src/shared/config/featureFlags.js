const isE2EInvitationsEnabled = import.meta.env.VITE_E2E_ENABLE_INVITATIONS === 'true';
const isE2EImmersiveViewerEnabled = import.meta.env.VITE_E2E_ENABLE_IMMERSIVE_VIEWER === 'true';

export const ENABLE_IMMERSIVE_VIEWER = isE2EImmersiveViewerEnabled;
// Canonical Documentary/Editorial Trip Viewer (Block 2.1). Always ON: the
// modern editorial experience is the single viewer for /trips/:id.
export const ENABLE_DOCUMENTARY_VIEWER = true;
export const ENABLE_INVITATIONS = isE2EInvitationsEnabled;
export const ENABLE_GAMIFICATION = false;
export const ENABLE_WEATHER_API = false;
export const ENABLE_ONBOARDING = true;
// Block 2.2: Dual-view Digital Travel Archive (Grid + List) with 5D filters.
export const ENABLE_TRIPS_LIST_VIEW = true;
// Block 2.3: Deep Travel Statistics Page ("Estadísticas de Viaje") at /hub.
export const ENABLE_TRAVEL_STATS = true;

export const FEATURE_FLAGS = {
  ENABLE_IMMERSIVE_VIEWER,
  ENABLE_DOCUMENTARY_VIEWER,
  ENABLE_INVITATIONS,
  ENABLE_GAMIFICATION,
  ENABLE_WEATHER_API,
  ENABLE_ONBOARDING,
  ENABLE_TRIPS_LIST_VIEW,
  ENABLE_TRAVEL_STATS,
};

