
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n'; // i18n debe inicializarse antes que cualquier componente
import '@shared/config/styles/index.css';
import '@shared/config/styles/mobile-polish.css';
import { App } from '@app/layout';
import { AuthProvider, ToastProvider, UploadProvider, UIProvider, SearchProvider } from '@app/providers';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';

// Inyectar estilos para desactivar animaciones en E2E
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  const style = document.createElement('style');
  style.innerHTML = `
    *, *::before, *::after {
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      animation-duration: 0s !important;
      animation-delay: 0s !important;
    }
  `;
  document.head.appendChild(style);
  console.log('🔧 E2E Mode: Animations disabled');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <UploadProvider>
              <UIProvider>
                <SearchProvider>
                  <App />
                </SearchProvider>
              </UIProvider>
            </UploadProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);
