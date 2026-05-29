import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchGymGroups,
  createGymGroup,
  updateGymGroup,
  deleteGymGroup,
  fetchGymGroupMembers,
  addGymGroupMember,
  removeGymGroupMember,
  searchStudentsForGroup,
  fetchGymGroupMessages,
  sendGymGroupMessage,
} from '../services/academia';
import type {
  GymGroup,
  GymGroupMember,
  GymGroupMessage,
  StudentSearchResult,
} from '../services/academia';

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const gymGroupsKey = (gymId: string) => ['gym-groups', gymId] as const;
export const gymGroupMembersKey = (groupId: string) =>
  ['gym-group-members', groupId] as const;
export const gymGroupMessagesKey = (groupId: string) =>
  ['gym-group-messages', groupId] as const;

// ── Groups ─────────────────────────────────────────────────────────────────────

export function useGymGroups() {
  const { user } = useAuth();
  return useQuery<GymGroup[]>({
    queryKey: gymGroupsKey(user?.id ?? ''),
    queryFn: () => fetchGymGroups(user!.id),
    enabled: !!user?.id && user.role === 'academia',
    staleTime: 30_000,
  });
}

export function useCreateGymGroup() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createGymGroup(user!.id, name, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gymGroupsKey(user?.id ?? '') });
    },
  });
}

export function useUpdateGymGroup() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      groupId,
      name,
      description,
    }: {
      groupId: string;
      name: string;
      description?: string;
    }) => updateGymGroup(groupId, name, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gymGroupsKey(user?.id ?? '') });
    },
  });
}

export function useDeleteGymGroup() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (groupId: string) => deleteGymGroup(groupId),
    onMutate: async (groupId) => {
      const key = gymGroupsKey(user?.id ?? '');
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<GymGroup[]>(key);
      qc.setQueryData<GymGroup[]>(
        key,
        (old) => (old ?? []).filter((g) => g.id !== groupId),
      );
      return { previous };
    },
    onError: (_err, _groupId, context: any) => {
      if (context?.previous) {
        qc.setQueryData(gymGroupsKey(user?.id ?? ''), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: gymGroupsKey(user?.id ?? '') });
    },
  });
}

// ── Members ────────────────────────────────────────────────────────────────────

export function useGymGroupMembers(groupId: string | null) {
  return useQuery<GymGroupMember[]>({
    queryKey: gymGroupMembersKey(groupId ?? ''),
    queryFn: () => fetchGymGroupMembers(groupId!),
    enabled: !!groupId,
    staleTime: 30_000,
  });
}

export function useAddGymGroupMember(groupId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (studentId: string) => addGymGroupMember(groupId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gymGroupMembersKey(groupId) });
      qc.invalidateQueries({ queryKey: gymGroupsKey(user?.id ?? '') });
    },
  });
}

export function useRemoveGymGroupMember(groupId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (studentId: string) => removeGymGroupMember(groupId, studentId),
    onMutate: async (studentId) => {
      const key = gymGroupMembersKey(groupId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<GymGroupMember[]>(key);
      qc.setQueryData<GymGroupMember[]>(
        key,
        (old) => (old ?? []).filter((m) => m.studentId !== studentId),
      );
      return { previous };
    },
    onError: (_err, _studentId, context: any) => {
      if (context?.previous) {
        qc.setQueryData(gymGroupMembersKey(groupId), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: gymGroupMembersKey(groupId) });
      qc.invalidateQueries({ queryKey: gymGroupsKey(user?.id ?? '') });
    },
  });
}

// ── Student search (for adding members) ───────────────────────────────────────

export function useSearchStudents(query: string) {
  return useQuery<StudentSearchResult[]>({
    queryKey: ['student-search', query],
    queryFn: () => searchStudentsForGroup(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

// ── Group messages / offers ────────────────────────────────────────────────────

export function useGymGroupMessages(groupId: string | null) {
  return useQuery<GymGroupMessage[]>({
    queryKey: gymGroupMessagesKey(groupId ?? ''),
    queryFn: () => fetchGymGroupMessages(groupId!),
    enabled: !!groupId,
    staleTime: 30_000,
  });
}

export function useSendGymGroupMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      groupId,
      content,
    }: {
      groupId: string;
      content: string;
    }) => sendGymGroupMessage(user!.id, groupId, content, user!.name),
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({ queryKey: gymGroupMessagesKey(groupId) });
    },
  });
}
