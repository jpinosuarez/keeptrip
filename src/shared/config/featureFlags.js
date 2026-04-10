const isE2EInvitationsEnabled = import.meta.env.VITE_E2E_ENABLE_INVITATIONS === 'true';
const isE2EImmersiveViewerEnabled = import.meta.env.VITE_E2E_ENABLE_IMMERSIVE_VIEWER === 'true';
const isE2EGamificationEnabled = import.meta.env.VITE_E2E_ENABLE_GAMIFICATION === 'true';

export const ENABLE_IMMERSIVE_VIEWER = isE2EImmersiveViewerEnabled;
export const ENABLE_INVITATIONS = isE2EInvitationsEnabled;
export const ENABLE_GAMIFICATION = isE2EGamificationEnabled;
export const ENABLE_WEATHER_API = false;
