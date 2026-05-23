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

  // Ask for permission once after login
  useEffect(() => {
    if (!user || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user?.id]);

  // Subscribe to new messages and fire OS notification when tab is hidden
  useEffect(() => {
    if (!user) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
