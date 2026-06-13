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
    if (!user || !('Notification' in window)) {
      console.log('[useNotifications] Skipping - no user or no Notification support');
      return;
    }

    console.log('[useNotifications] Setting up notifications');

    const subscribe = () => {
      try {
        if (Notification.permission !== 'granted') {
          console.log('[useNotifications] Notification permission not granted:', Notification.permission);
          return;
        }

        const channelName = `push-notifications:${user.id}`;
        const already = supabase
          .getChannels()
          .some((ch) => ch.topic === `realtime:${channelName}`);
        if (already) {
          console.log('[useNotifications] Already subscribed');
          return;
        }

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
      } catch (err) {
        console.error('[useNotifications] Subscribe error:', err);
      }
    };

    try {
      if (Notification.permission === 'default') {
        const result = Notification.requestPermission();
        if (result && typeof result.then === 'function') {
          result.then(subscribe);
        } else {
          subscribe();
        }
      } else {
        subscribe();
      }
    } catch (err) {
      console.error('[useNotifications] Error:', err);
    }
  }, [user?.id]);
}
