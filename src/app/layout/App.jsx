import React from 'react';
import AppRouter from '../router/AppRouter';

/**
 * App — Punto de entrada. Delega toda la lógica al router declarativo.
 * La orquestación del shell autenticado vive en AppShell.jsx.
 */
function App() {
  return <AppRouter />;
}

export default App;
