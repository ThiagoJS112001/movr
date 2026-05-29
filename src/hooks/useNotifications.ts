import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Requests browser notification permission once the user is logged in,
 * then subscribes to new incoming messages via Supabase Realtime and shows
 * a browser notification when the tab is not focused.
 */
export function useNotifications() {
  const { user } = useAuth();

  // Ask for permission once after login, then immediately subscribe if granted
  useEffect(() => {
    if (!user || !('Notification' in window)) return;

    const subscribe = () => {
      if (Notification.permission !== 'granted') return;

      const channelName = `push-notifications:${user.id}`;
      const already = supabase
        .getChannels()
        .some((ch) => ch.topic === `realtime:${channelName}`);
      if (already) return;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `to_id=eq.${user.id}`,
          },
          (payload) => {
            if (document.hidden) {
              new Notification('Nova mensagem · Movr', {
                body: String(payload.new.content ?? ''),
                icon: '/favicon.ico',
                tag: `msg-${payload.new.id}`,
              });
            }
          },
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(subscribe);
    } else {
      subscribe();
    }
  }, [user?.id]);
}
