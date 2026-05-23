import { useNotifications } from '../hooks/useNotifications';

/**
 * Mounts inside AuthProvider so it has access to the current user.
 * Requests browser notification permission and wires up Supabase Realtime.
 * Renders nothing â€” purely a side-effect component.
 */
export default function NotificationsBootstrap() {
  useNotifications();
  return null;
}
