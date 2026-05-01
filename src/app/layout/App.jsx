import React from 'react';
import AppRouter from '../router/AppRouter';
import PWAUpdatePrompt from '@shared/ui/components/PWAUpdatePrompt';

/**
 * App — Punto de entrada. Delega toda la lógica al router declarativo.
 * La orquestación del shell autenticado vive en AppShell.jsx.
 */
function App() {
  return (
    <>
      <AppRouter />
      <PWAUpdatePrompt />
    </>
  );
}

export default App;
