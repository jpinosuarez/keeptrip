
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n'; // i18n debe inicializarse antes que cualquier componente
import '@shared/config/styles/index.css';
import '@shared/config/styles/mobile-polish.css';
import { App } from '@app/layout';
import { AuthProvider, ToastProvider, UploadProvider, UIProvider, SearchProvider } from '@app/providers';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
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
