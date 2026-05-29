import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchGymStats,
  fetchGymProfile,
  updateGymProfile,
  uploadGymLogo,
  uploadGymPhoto,
  fetchGymRatings,
} from '../services/academia';
import type { GymProfileUpdate, GymStats, GymProfileData } from '../services/academia';
import type { GymRating } from '../types';

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const academiaStatsKey = (gymId: string) =>
  ['academia-stats', gymId] as const;
export const gymProfileKey = (gymId: string) =>
  ['gym-profile', gymId] as const;
export const gymRatingsKey = (gymId: string) =>
  ['gym-ratings', gymId] as const;

// ── Stats ──────────────────────────────────────────────────────────────────────

export function useAcademiaStats() {
  const { user } = useAuth();
  return useQuery<GymStats>({
    queryKey: academiaStatsKey(user?.id ?? ''),
    queryFn: () => fetchGymStats(user!.id),
    enabled: !!user?.id && user.role === 'academia',
    staleTime: 5 * 60 * 1000,
  });
}

// ── Gym Profile ────────────────────────────────────────────────────────────────

export function useGymProfile() {
  const { user } = useAuth();
  return useQuery<GymProfileData>({
    queryKey: gymProfileKey(user?.id ?? ''),
    queryFn: () => fetchGymProfile(user!.id),
    enabled: !!user?.id && user.role === 'academia',
    staleTime: 60 * 1000,
  });
}

export function useUpdateGymProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (updates: GymProfileUpdate) => updateGymProfile(user!.id, updates),
    onMutate: async (updates) => {
      const key = gymProfileKey(user?.id ?? '');
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<GymProfileData>(key);
      if (previous) {
        qc.setQueryData<GymProfileData>(key, { ...previous, ...updates });
      }
      return { previous };
    },
    onError: (_err, _updates, context: any) => {
      if (context?.previous) {
        qc.setQueryData(gymProfileKey(user?.id ?? ''), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: gymProfileKey(user?.id ?? '') });
    },
  });
}

export function useUploadGymLogo() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (file: File) => uploadGymLogo(user!.id, file),
    onSuccess: (publicUrl) => {
      qc.setQueryData<GymProfileData>(
        gymProfileKey(user?.id ?? ''),
        (old) => old ? { ...old, avatarUrl: publicUrl } : old,
      );
    },
  });
}

export function useUploadGymPhoto() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (file: File) => uploadGymPhoto(user!.id, file),
    onSuccess: (publicUrl) => {
      qc.setQueryData<GymProfileData>(
        gymProfileKey(user?.id ?? ''),
        (old) => old ? { ...old, photos: [...(old.photos ?? []), publicUrl] } : old,
      );
    },
  });
}

// ── Ratings ────────────────────────────────────────────────────────────────────

export function useGymRatings() {
  const { user } = useAuth();
  return useQuery<GymRating[]>({
    queryKey: gymRatingsKey(user?.id ?? ''),
    queryFn: () => fetchGymRatings(user!.id),
    enabled: !!user?.id && user.role === 'academia',
    staleTime: 5 * 60 * 1000,
  });
}
