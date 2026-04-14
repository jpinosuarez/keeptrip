import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@shared/firebase';

const OPERATIONAL_FLAGS_REF = doc(db, 'system', 'operational_flags');
const MIN_LEVEL = 0;
const MAX_LEVEL = 4;

const isPermissionDeniedError = (error) => {
  return (
    error?.code === 'permission-denied'
    || error?.code === 'PERMISSION_DENIED'
    || /missing or insufficient permissions/i.test(error?.message || '')
  );
};

const buildPermissionDeniedError = (error) => {
  const wrappedError = new Error(
    'Permission denied updating operational flags. Verify founder UID alignment and deploy Firestore rules.'
  );
  wrappedError.code = 'permission-denied';
  wrappedError.cause = error;
  return wrappedError;
};

const coerceLevel = (rawLevel) => {
  const parsed = Number(rawLevel);
  if (!Number.isInteger(parsed) || parsed < MIN_LEVEL || parsed > MAX_LEVEL) {
    throw new Error(`Invalid operational level: ${rawLevel}`);
  }
  return parsed;
};

export const buildOperationalFlagsPayload = ({ level, updatedByUid, reason }) => {
  const safeLevel = coerceLevel(level);

  return {
    level: safeLevel,
    app_readonly_mode: safeLevel >= 3,
    app_maintenance_mode: safeLevel >= 4,
    updated_by: updatedByUid || null,
    updated_at: serverTimestamp(),
    reason: reason || `Updated from in-app controls to level ${safeLevel}`,
  };
};

export const updateOperationalFlagsLevel = async ({ level, updatedByUid, reason }) => {
  const payload = buildOperationalFlagsPayload({ level, updatedByUid, reason });
  try {
    await setDoc(OPERATIONAL_FLAGS_REF, payload, { merge: true });
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      throw buildPermissionDeniedError(error);
    }
    throw error;
  }
  return payload;
};
