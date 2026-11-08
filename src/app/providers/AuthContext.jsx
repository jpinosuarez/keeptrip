/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';

import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, db, googleProvider, isEmulator } from '@shared/firebase';
import { normalizeCountryCode } from '@shared/lib/utils/countryUtils';
import {
  normalizeWishlistItem,
  wishlistKey,
  isInWishlist,
} from '@shared/lib/wishlist/wishlistUtils';

const defaultAuthContext = {
  user: null,
  usuario: null,
  userProfile: null,
  loadingProfile: false,
  cargando: false,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
  updateUserProfile: async () => {},
  actualizarPerfilUsuario: async () => {},
  // Block 2.5 wishlist API (no-op defaults so consumers never crash).
  agregarAWishlist: async () => false,
  eliminarDeWishlist: async () => false,
  estaEnWishlist: () => false,
};

const AuthContext = createContext(defaultAuthContext);

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const isAdmin = useMemo(() => {
    if (!usuario?.email) return false;
    return ADMIN_EMAILS.includes(usuario.email.toLowerCase());
  }, [usuario]);

  const login = useCallback(async () => {
    const testEmail = import.meta.env.VITE_EMULATOR_TEST_EMAIL;
    const testPassword = import.meta.env.VITE_EMULATOR_TEST_PASSWORD;

    try {
      if (isEmulator && testEmail && testPassword) {
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
        return;
      }

      if (isEmulator) {
        console.warn('[Auth] modo emulador activo: signInWithPopup puede no funcionar. Usa VITE_EMULATOR_TEST_EMAIL/PASSWORD.');
      }

      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al autenticar:", error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('keeptrip_has_session');
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    setUserProfile(null);
    setLoadingProfile(false);
    return signOut(auth);
  }, []);

  const updateUserProfile = useCallback(async (partialDataOrName, photoArg) => {
    const partialData = typeof partialDataOrName === 'string'
      ? { displayName: partialDataOrName, photoURL: photoArg }
      : (partialDataOrName || {});

    // Optimistic update of local userProfile
    setUserProfile((prev) => ({
      ...(prev || {}),
      ...partialData,
    }));

    if (auth.currentUser) {
      if (partialData.hasCompletedOnboarding && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`keeptrip_onboarded_${auth.currentUser.uid}`, 'true');
        } catch {
          // Ignore storage errors in restricted contexts
        }
      }

      if (partialData.displayName !== undefined || partialData.photoURL !== undefined) {
        try {
          await updateProfile(auth.currentUser, {
            ...(partialData.displayName !== undefined ? { displayName: partialData.displayName } : {}),
            ...(partialData.photoURL !== undefined ? { photoURL: partialData.photoURL } : {}),
          });
          setUsuario({ ...auth.currentUser });
        } catch (err) {
          console.warn('Error updating Firebase Auth profile:', err?.message || err);
        }
      }

      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const perfilRef = doc(db, 'usuarios', auth.currentUser.uid);
        await setDoc(perfilRef, {
          ...partialData,
          updatedAt: new Date(),
        }, { merge: true });
        return true;
      } catch (error) {
        console.error('Error actualizando perfil en Firestore:', error);
        return false;
      }
    }
    return true;
  }, []);

  const actualizarPerfilUsuario = useCallback(async (nombre, fotoURL) => {
    return updateUserProfile(nombre, fotoURL);
  }, [updateUserProfile]);

  // ── Wishlist (Block 2.5): stored on usuarios/{uid}.wishlist ──────────────
  // A ref mirrors the latest array so rapid successive taps compute from the
  // freshest value (no stale closures, no extra Firestore reads).
  const wishlistRef = useRef([]);

  useEffect(() => {
    wishlistRef.current = Array.isArray(userProfile?.wishlist) ? userProfile.wishlist : [];
  }, [userProfile]);

  const persistWishlist = useCallback(async (nextItems) => {
    const safeNext = Array.isArray(nextItems) ? nextItems : [];
    wishlistRef.current = safeNext;
    setUserProfile((prev) => ({ ...(prev || {}), wishlist: safeNext }));

    if (!auth.currentUser) return true;
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const perfilRef = doc(db, 'usuarios', auth.currentUser.uid);
      await setDoc(perfilRef, { wishlist: safeNext, updatedAt: new Date() }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error persisting wishlist:', error);
      return false;
    }
  }, []);

  const agregarAWishlist = useCallback(async (item) => {
    const normalized = normalizeWishlistItem(item);
    if (!normalized) return false;
    const current = wishlistRef.current;
    const key = wishlistKey(normalized);
    // Idempotent: adding an existing destination is a no-op.
    if (current.some((existing) => wishlistKey(existing) === key)) return true;
    return persistWishlist([...current, normalized]);
  }, [persistWishlist]);

  const eliminarDeWishlist = useCallback(async (idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const idSet = new Set(ids.filter(Boolean));
    if (idSet.size === 0) return false;
    const current = wishlistRef.current;
    const next = current.filter((item) => !idSet.has(item.id));
    if (next.length === current.length) return false;
    return persistWishlist(next);
  }, [persistWishlist]);

  const estaEnWishlist = useCallback((codeOrCity) => {
    const current = wishlistRef.current;
    if (!codeOrCity) return false;
    if (typeof codeOrCity === 'string') {
      const value = codeOrCity.trim().toLowerCase();
      if (!value) return false;
      const norm = normalizeCountryCode(codeOrCity);
      return current.some(
        (item) =>
          (norm && normalizeCountryCode(item.paisCodigo) === norm) ||
          String(item.nombre || '').trim().toLowerCase() === value
      );
    }
    return isInWishlist(current, codeOrCity);
  }, []);

  // Tracks whether the first auth resolution has fully settled. Used to grant a
  // short grace window to cold-start transient `null` events so `AuthGuard`
  // never bounces an authenticated user to `/` while the token rehydrates.
  const hasSettledAuthRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;

      // Cold-start transient-null guard: Firebase can emit a momentary `null`
      // while rehydrating a persisted token on reload. If we previously had a
      // session hint, hold the loading gate through a short settle window
      // instead of committing `usuario = null` and redirecting to `/`.
      if (!currentUser) {
        let hasSessionHint = false;
        try {
          hasSessionHint =
            typeof window !== 'undefined' &&
            window.localStorage.getItem('keeptrip_has_session') === 'true';
        } catch {
          hasSessionHint = false;
        }

        if (hasSessionHint && !hasSettledAuthRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          if (!mounted) return;
          if (auth.currentUser) {
            currentUser = auth.currentUser; // eslint-disable-line no-param-reassign
          }
        }
      }

      hasSettledAuthRef.current = true;
      setUsuario(currentUser);
      setCargando(false);
      try {
        if (typeof window !== 'undefined') {
          // Persist the session hint ONLY when a real user resolves. It is
          // intentionally NOT cleared on a transient `null` callback (Firebase
          // can emit a momentary null while rehydrating the persisted token on
          // a cold F5). Removal happens exclusively inside the explicit logout().
          if (currentUser) {
            localStorage.setItem('keeptrip_has_session', 'true');
          }
        }
      } catch {
        // Ignore storage errors in restricted contexts
      }

      // Garantizar que exista un documento de perfil utilizable para búsquedas/autocomplete
      // (usuarios/{uid}) — se crea/actualiza al iniciar sesión
      if (currentUser && currentUser.uid) {
        setLoadingProfile(true);
        try {
          const { doc, getDoc, setDoc } = await import('firebase/firestore');
          const perfilRef = doc(db, 'usuarios', currentUser.uid);

          let snapData = null;
          try {
            const snap = await getDoc(perfilRef);
            if (snap.exists()) {
              snapData = snap.data();
            }
          } catch (e) {
            console.warn('Error reading user profile:', e?.message || e);
          }

          if (mounted) {
            const hasCompletedOnboarding = Boolean(snapData?.hasCompletedOnboarding);
            if (hasCompletedOnboarding && typeof window !== 'undefined') {
              try {
                localStorage.setItem(`keeptrip_onboarded_${currentUser.uid}`, 'true');
              } catch {
                // Ignore storage errors in restricted contexts
              }
            }

            const profileData = {
              displayName: snapData?.displayName || currentUser.displayName || '',
              email: currentUser.email || '',
              photoURL: snapData?.photoURL || currentUser.photoURL || '',
              birthCountry: snapData?.birthCountry || null,
              birthCity: snapData?.birthCity || null,
              residenceCountry: snapData?.residenceCountry || null,
              baseCity: snapData?.baseCity || null,
              wishlist: Array.isArray(snapData?.wishlist) ? snapData.wishlist : [],
              hasCompletedOnboarding,
            };
            setUserProfile(profileData);
            setLoadingProfile(false);
          }

          await setDoc(perfilRef, {
            displayName: snapData?.displayName || currentUser.displayName || null,
            email: currentUser.email || null,
            photoURL: snapData?.photoURL || currentUser.photoURL || null,
            updatedAt: new Date()
          }, { merge: true });
        } catch (err) {
          // No bloquear el flujo si falla (emulator / tests pueden no tener db)
          console.warn('No se pudo escribir perfil en Firestore:', err?.message || err);
          if (mounted) {
            setLoadingProfile(false);
          }
        }
      } else {
        if (mounted) {
          setUserProfile(null);
          setLoadingProfile(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);


  // Dev/test helpers (exposed in dev mode or when VITE_ENABLE_TEST_LOGIN === 'true')
  const enableTestHelpers =
    typeof window !== 'undefined' &&
    (import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_LOGIN === 'true');

  if (enableTestHelpers) {
    window.__test_signInWithEmail = async ({ email, password }) => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      } catch (err) {
        console.error('🧪 test signIn failed', err);
        return false;
      }
    };
    window.__test_signOut = async () => signOut(auth);
    window.__test_auth = auth;

    // Helper to create a Firestore document from the browser (uses current auth session)
    window.__test_createDoc = async (fullPath, documentData) => {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const ref = doc(db, fullPath);
        await setDoc(ref, documentData, { merge: true });
        return true;
      } catch (err) {
        console.error('🧪 test createDoc failed', err);
        return false;
      }
    };

    // Helper to read a Firestore document from the browser (uses current auth session)
    window.__test_readDoc = async (fullPath) => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const ref = doc(db, fullPath);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
      } catch (err) {
        console.error('🧪 test readDoc failed', err);
        return null;
      }
    };
  }

  const value = useMemo(() => ({
    usuario,
    user: usuario,
    userProfile,
    loadingProfile,
    login,
    logout,
    updateUserProfile,
    actualizarPerfilUsuario,
    agregarAWishlist,
    eliminarDeWishlist,
    estaEnWishlist,
    cargando,
    isAdmin,
  }), [usuario, userProfile, loadingProfile, login, logout, updateUserProfile, actualizarPerfilUsuario, agregarAWishlist, eliminarDeWishlist, estaEnWishlist, cargando, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};