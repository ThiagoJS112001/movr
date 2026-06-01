import * as Sentry from '@sentry/react';
import { env } from './env';

/**
 * Initialise Sentry.
 * Only activates in production when VITE_SENTRY_DSN is set.
 * In development it is silently skipped to avoid noise.
 */
export function initSentry() {
  if (!env.sentry.dsn || env.app.isDev) return;

  Sentry.init({
    dsn: env.sentry.dsn,
    environment: 'production',
    // Capture 10% of sessions as performance traces — adjust as needed.
    tracesSampleRate: 0.1,
    // Capture 100% of replays on error, 0% otherwise.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: false }),
    ],
  });
}

/** Call this when the authenticated user's identity is known. */
export function identifySentryUser(user: { id: string; email: string; role: string } | null) {
  if (!env.sentry.dsn) return;
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email, role: user.role });
  } else {
    Sentry.setUser(null);
  }
}

export { Sentry };
