import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const isAdmin = useMemo(() => {
    if (!usuario?.email) return false;
    return ADMIN_EMAILS.includes(usuario.email.toLowerCase());
  }, [usuario]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al autenticar:", error);
    }
  };

  const logout = () => signOut(auth);

  // NUEVO: Función para actualizar perfil
  const actualizarPerfilUsuario = async (nombre, fotoURL) => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, {
        displayName: nombre,
        photoURL: fotoURL
      });
      // Forzamos actualización del estado local
      setUsuario({ ...auth.currentUser });
      return true;
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      return false;
    }
  };

  useEffect(() => {
    let timeoutId;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUsuario(currentUser);
      setCargando(false);

      // Garantizar que exista un documento de perfil utilizable para búsquedas/autocomplete
      // (usuarios/{uid}) — se crea/actualiza al iniciar sesión
      if (currentUser && currentUser.uid) {
        try {
          // Import dinámico para evitar side-effects en tests donde firebase está mockeado
          const { db } = await import('../firebase');
          const { doc, setDoc } = await import('firebase/firestore');
          const perfilRef = doc(db, 'usuarios', currentUser.uid);
          await setDoc(perfilRef, {
            displayName: currentUser.displayName || null,
            email: currentUser.email || null,
            photoURL: currentUser.photoURL || null,
            updatedAt: new Date()
          }, { merge: true });
        } catch (err) {
          // No bloquear el flujo si falla (emulator / tests pueden no tener db)
          console.warn('No se pudo escribir perfil en Firestore:', err?.message || err);
        }
      }

      if (timeoutId) clearTimeout(timeoutId);
    });
    // Timeout de seguridad: si Firebase no responde en 5s, forzar cargando a false
    timeoutId = setTimeout(() => {
      setCargando(false);
      unsubscribe();
      console.warn('⏰ Timeout de autenticación: Firebase no respondió en 5s. Se fuerza cargando = false.');
    }, 5000);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Dev/test helpers (exposed only when VITE_ENABLE_TEST_LOGIN === 'true')
  if (typeof window !== 'undefined' && import.meta.env.VITE_ENABLE_TEST_LOGIN === 'true') {
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

    // Helper to create a Firestore document from the browser (uses current auth session)
    window.__test_createDoc = async (fullPath, documentData) => {
      try {
        const { db } = await import('../firebase');
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
        const { db } = await import('../firebase');
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

  const value = { usuario, login, logout, actualizarPerfilUsuario, cargando, isAdmin };

  return (
    <AuthContext.Provider value={value}>
      {cargando ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          color: '#334155',
          fontSize: 22,
          fontWeight: 500
        }}>
          <LoaderCircle size={48} className="spin" style={{ marginBottom: 16, color: '#f59e42' }} />
          Iniciando...
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};