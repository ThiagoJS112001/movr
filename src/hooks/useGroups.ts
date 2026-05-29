import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StudentGroup {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  from_id: string;
  from_name: string;
  content: string;
  type: 'text' | 'image' | 'offer';
  image_url: string | null;
  created_at: string;
}

// ── My groups ─────────────────────────────────────────────────────────────────

export function useMyGroups() {
  const { user } = useAuth();
  return useQuery<StudentGroup[]>({
    queryKey: ['my-groups', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('group:student_groups(id, name, description, created_by, created_at)')
        .eq('student_id', user!.id);
      if (error) throw error;
      return ((data ?? []).map((r: any) => r.group).filter(Boolean)) as StudentGroup[];
    },
    staleTime: 30_000,
  });
}

// ── Group messages ─────────────────────────────────────────────────────────────

export function useGroupMessages(groupId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<GroupMessage[]>({
    queryKey: ['group-messages', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_messages')
        .select('id, group_id, from_id, from_name, content, type, image_url, created_at')
        .eq('group_id', groupId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as GroupMessage[];
    },
    staleTime: 0,
  });

  // Realtime
  useEffect(() => {
    if (!groupId || !user) return;
    const channelName = `group-messages:${groupId}`;
    const already = supabase.getChannels().some((ch) => ch.topic === `realtime:${channelName}`);
    if (already) return;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const msg = payload.new as GroupMessage;
          qc.setQueryData<GroupMessage[]>(['group-messages', groupId], (old = []) => [...old, msg]);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, user, qc]);

  return query;
}

// ── Send group message ─────────────────────────────────────────────────────────

export function useSendGroupMessage(groupId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || trimmed.length > 2000) {
        throw new Error('Mensagem deve ter entre 1 e 2000 caracteres.');
      }
      const { error } = await supabase.from('group_messages').insert({
        group_id: groupId,
        from_id: user!.id,
        from_name: user!.name,
        content: trimmed,
        type: 'text',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-messages', groupId] });
    },
  });
}

// ── Create group ──────────────────────────────────────────────────────────────

export function useCreateGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: string[] }) => {
      // Create group
      const { data: group, error: e1 } = await supabase
        .from('student_groups')
        .insert({ name, created_by: user!.id })
        .select('id')
        .single();
      if (e1) throw e1;

      // Add creator + members
      const allMembers = Array.from(new Set([user!.id, ...memberIds]));
      const { error: e2 } = await supabase
        .from('group_members')
        .insert(allMembers.map((id) => ({ group_id: group.id, student_id: id })));
      if (e2) throw e2;

      return group.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-groups', user?.id] });
    },
  });
}
