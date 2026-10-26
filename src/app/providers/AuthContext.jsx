/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, db, googleProvider, isEmulator } from '@shared/firebase';

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
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;

      setUsuario(currentUser);
      setCargando(false);
      try {
        if (typeof window !== 'undefined') {
          if (currentUser) {
            localStorage.setItem('keeptrip_has_session', 'true');
          } else {
            localStorage.removeItem('keeptrip_has_session');
          }
        }
      } catch {
        // Ignore storage errors in restricted contexts
      }

      // Garantizar que exista un documento de perfil utilizable para búsquedas/autocomplete
      // (usuarios/{uid}) — se crea/actualiza al iniciar sesión
      if (currentUser && currentUser.uid) {
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
            const profileData = {
              displayName: snapData?.displayName || currentUser.displayName || '',
              email: currentUser.email || '',
              photoURL: snapData?.photoURL || currentUser.photoURL || '',
              birthCountry: snapData?.birthCountry || null,
              residenceCountry: snapData?.residenceCountry || null,
              baseCity: snapData?.baseCity || null,
              hasCompletedOnboarding: Boolean(snapData?.hasCompletedOnboarding),
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
    cargando,
    isAdmin,
  }), [usuario, userProfile, loadingProfile, login, logout, updateUserProfile, actualizarPerfilUsuario, cargando, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};