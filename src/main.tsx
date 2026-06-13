import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { SettingsProvider } from './contexts/SettingsContext.tsx'
import { queryClient } from './lib/queryClient.ts'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import NotificationsBootstrap from './components/NotificationsBootstrap.tsx'
import { initSentry } from './lib/sentry.ts'

console.log('[MAIN] App starting...');

try {
  initSentry();
  console.log('[MAIN] Sentry initialized');
} catch (e) {
  console.error('[MAIN] Sentry error:', e);
}

const root = document.getElementById('root');
if (!root) {
  console.error('[MAIN] Root element not found');
  throw new Error('Root element not found');
}

console.log('[MAIN] Creating React root...');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SettingsProvider>
            <BrowserRouter>
              <AuthProvider>
                <NotificationsBootstrap />
                <App />
              </AuthProvider>
            </BrowserRouter>
          </SettingsProvider>
        </ThemeProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

console.log('[MAIN] App rendered');
