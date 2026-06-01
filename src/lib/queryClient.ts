import { QueryClient } from '@tanstack/react-query';
import { Sentry } from './sentry';

function onQueryError(error: unknown) {
  // Report unexpected errors to Sentry, but skip expected 4xx-like Supabase errors.
  const msg = error instanceof Error ? error.message : String(error);
  const isExpected = /not found|permission denied|row-level security|jwt expired/i.test(msg);
  if (!isExpected) {
    Sentry.captureException(error);
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min — serve cache, refetch in background
      gcTime: 1000 * 60 * 60,         // 60 min — keep inactive queries for offline fallback
      retry: (failureCount, error) => {
        const msg = error instanceof Error ? error.message.toLowerCase() : '';
        // Don't retry permission/not-found errors
        if (msg.includes('permission') || msg.includes('not found') || msg.includes('rls')) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,        // Refetch when coming back online
      meta: { onError: onQueryError },
    },
    mutations: {
      retry: 0,
      meta: { onError: onQueryError },
    },
  },
});

