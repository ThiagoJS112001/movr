import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchMyMessages,
  fetchMyPersonalId,
  fetchProfileById,
  sendMessage,
  markConversationRead,
  type Message,
} from '../services/messages';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const messagesKey = (userId: string) => ['messages', userId] as const;
export const myPersonalIdKey = () => ['my_personal_id'] as const;
export const profileKey = (id: string) => ['profile', id] as const;

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all messages where the current user is sender or recipient.
 * Also subscribes to Realtime INSERT events and appends them to the cache.
 */
export function useMessages() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: messagesKey(user?.id ?? ''),
    queryFn: () => fetchMyMessages(user!.id),
    enabled: !!user,
  });

  // Realtime subscription — guarded so only one channel per user is ever active.
  // Multiple components call useMessages() simultaneously (e.g. sidebar + dashboard),
  // and Supabase throws if .on() is called on an already-subscribed channel.
  useEffect(() => {
    if (!user) return;

    const channelName = `messages:${user.id}`;

    // If a channel with this name is already subscribed (created by another hook
    // instance in the same render tree), skip — that instance owns it.
    const alreadyExists = supabase
      .getChannels()
      .some((ch) => ch.topic === `realtime:${channelName}`);
    if (alreadyExists) return;

    let channel: ReturnType<typeof supabase.channel>;
    try {
      channel = supabase
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
            const newMsg: Message = {
              id:      payload.new.id,
              fromId:  payload.new.from_id,
              toId:    payload.new.to_id,
              content: payload.new.content,
              read:    payload.new.read,
              sentAt:  payload.new.sent_at,
            };
            qc.setQueryData<Message[]>(messagesKey(user.id), (old = []) => [...old, newMsg]);
          },
        )
        .subscribe();
    } catch {
      // Channel was subscribed between the check above and here — safe to ignore.
      return;
    }

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  return query;
}

/** Derives the conversation between current user and another user from the shared messages cache. */
export function useConversation(otherUserId: string | null) {
  const { user } = useAuth();
  const { data: allMessages = [] } = useMessages();

  return useMemo(() => {
    if (!user || !otherUserId) return [];
    return allMessages.filter(
      (m) =>
        (m.fromId === user.id && m.toId === otherUserId) ||
        (m.fromId === otherUserId && m.toId === user.id),
    );
  }, [allMessages, user?.id, otherUserId]);
}

/** Returns unread count from a specific sender to current user. */
export function useUnreadCount(fromId: string) {
  const { user } = useAuth();
  const { data: allMessages = [] } = useMessages();
  return useMemo(
    () => allMessages.filter((m) => m.fromId === fromId && m.toId === user?.id && !m.read).length,
    [allMessages, fromId, user?.id],
  );
}

/** Total unread across all senders — used for dashboard badge. */
export function useTotalUnread() {
  const { user } = useAuth();
  const { data: allMessages = [] } = useMessages();
  return useMemo(
    () => allMessages.filter((m) => m.toId === user?.id && !m.read).length,
    [allMessages, user?.id],
  );
}

export function useSendMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ toId, content }: { toId: string; content: string }) =>
      sendMessage(user!.id, toId, content),
    onMutate: async ({ toId, content }) => {
      // Optimistic insert
      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        fromId: user!.id,
        toId,
        content,
        read: false,
        sentAt: new Date().toISOString(),
      };
      qc.setQueryData<Message[]>(messagesKey(user!.id), (old = []) => [...old, optimistic]);
      return { optimistic };
    },
    onError: (_err, _vars, ctx) => {
      // Remove the optimistic message on failure
      qc.setQueryData<Message[]>(messagesKey(user!.id), (old = []) =>
        old.filter((m) => m.id !== ctx?.optimistic.id),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagesKey(user?.id ?? '') });
    },
  });
}

export function useMarkConversationRead(fromId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markConversationRead(fromId, user!.id),
    onSuccess: () => {
      // Optimistically mark as read in cache
      qc.setQueryData<Message[]>(messagesKey(user?.id ?? ''), (old = []) =>
        old.map((m) =>
          m.fromId === fromId && m.toId === user?.id && !m.read ? { ...m, read: true } : m,
        ),
      );
    },
  });
}

/** Aluno: fetch and cache the personal trainer's profile ID. */
export function useMyPersonalId() {
  return useQuery({
    queryKey: myPersonalIdKey(),
    queryFn: fetchMyPersonalId,
    staleTime: Infinity,
  });
}

export function useProfile(id: string | null) {
  return useQuery({
    queryKey: profileKey(id ?? ''),
    queryFn: () => fetchProfileById(id!),
    enabled: !!id,
    staleTime: Infinity,
  });
}
