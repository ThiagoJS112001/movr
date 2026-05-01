import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FriendProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export interface FriendRequest {
  id: string;
  from_id: string;
  to_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  from_profile?: FriendProfile;
  to_profile?: FriendProfile;
}

// ── Search user by email ───────────────────────────────────────────────────────

export function useSearchByEmail(email: string) {
  const { user } = useAuth();
  return useQuery<FriendProfile | null>({
    queryKey: ['search-email', email],
    enabled: email.length > 3 && email.includes('@'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, role')
        .eq('email', email.toLowerCase().trim())
        .neq('id', user?.id ?? '')
        .maybeSingle();
      if (error) throw error;
      return data as FriendProfile | null;
    },
    staleTime: 10_000,
  });
}

// ── My friend requests (received, pending) ────────────────────────────────────

export function useMyFriendRequests() {
  const { user } = useAuth();
  return useQuery<FriendRequest[]>({
    queryKey: ['friend-requests', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id, from_id, to_id, status, created_at,
          from_profile:profiles!friend_requests_from_id_fkey(id, name, email, avatar_url, role)
        `)
        .eq('to_id', user!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FriendRequest[];
    },
    refetchInterval: 15_000,
  });
}

// ── My friends (accepted requests both directions) ────────────────────────────

export function useMyFriends() {
  const { user } = useAuth();
  return useQuery<FriendProfile[]>({
    queryKey: ['friends', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Requests where I sent and was accepted
      const { data: sent, error: e1 } = await supabase
        .from('friend_requests')
        .select('to_profile:profiles!friend_requests_to_id_fkey(id, name, email, avatar_url, role)')
        .eq('from_id', user!.id)
        .eq('status', 'accepted');
      if (e1) throw e1;

      // Requests where I received and accepted
      const { data: received, error: e2 } = await supabase
        .from('friend_requests')
        .select('from_profile:profiles!friend_requests_from_id_fkey(id, name, email, avatar_url, role)')
        .eq('to_id', user!.id)
        .eq('status', 'accepted');
      if (e2) throw e2;

      const sentFriends = (sent ?? []).map((r: any) => r.to_profile).filter(Boolean);
      const receivedFriends = (received ?? []).map((r: any) => r.from_profile).filter(Boolean);

      return [...sentFriends, ...receivedFriends] as FriendProfile[];
    },
    staleTime: 30_000,
  });
}

// ── Check existing request between me and another user ────────────────────────

export function useRequestStatus(otherId: string | null) {
  const { user } = useAuth();
  return useQuery<{ id: string; status: string; direction: 'sent' | 'received' } | null>({
    queryKey: ['request-status', user?.id, otherId],
    enabled: !!user?.id && !!otherId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id, status, from_id, to_id')
        .or(
          `and(from_id.eq.${user!.id},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${user!.id})`
        )
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        status: data.status,
        direction: data.from_id === user!.id ? 'sent' : 'received',
      };
    },
    staleTime: 5_000,
  });
}

// ── Send friend request ────────────────────────────────────────────────────────

export function useSendFriendRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (toId: string) => {
      const { error } = await supabase
        .from('friend_requests')
        .insert({ from_id: user!.id, to_id: toId });
      if (error) throw error;
    },
    onSuccess: (_d, toId) => {
      qc.invalidateQueries({ queryKey: ['request-status', user?.id, toId] });
      qc.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
  });
}

// ── Respond to friend request ──────────────────────────────────────────────────

export function useRespondFriendRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friend-requests', user?.id] });
      qc.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
  });
}
