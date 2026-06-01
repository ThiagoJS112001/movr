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

initSentry();

createRoot(document.getElementById('root')!).render(
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
