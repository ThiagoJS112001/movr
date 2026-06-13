/**
 * Validated environment variables.
 * Any missing required variable throws at startup, before anything renders.
 */

function required(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    const msg = `[env] Missing required environment variable: ${key}
    
Available keys: ${Object.keys(import.meta.env)
      .filter((k) => k.startsWith('VITE_'))
      .join(', ') || '(none)'}

Make sure .env or .env.production is present and loaded.`;
    throw new Error(msg);
  }
  return value;
}

function optional(key: string): string | undefined {
  return (import.meta.env[key] as string | undefined) || undefined;
}

export const env = {
  supabase: {
    url: required('VITE_SUPABASE_URL'),
    anonKey: required('VITE_SUPABASE_ANON_KEY'),
  },
  sentry: {
    dsn: optional('VITE_SENTRY_DSN'),
  },
  stripe: {
    publishableKey: optional('VITE_STRIPE_PUBLISHABLE_KEY'),
  },
  app: {
    url: (import.meta.env.VITE_APP_URL as string | undefined) || window.location.origin,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },
} as const;
