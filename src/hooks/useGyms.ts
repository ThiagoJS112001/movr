import { useQuery } from '@tanstack/react-query';
import { listGyms, getGymById, getGymPlans } from '../services/gyms';
import type { GymFilters } from '../services/gyms';

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const gymsKey = (filters: GymFilters) => ['gyms', filters] as const;
export const gymKey = (id: string) => ['gym', id] as const;
export const gymPlansKey = (gymId: string) => ['gym-plans', gymId] as const;

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useGyms(filters: GymFilters = {}) {
  return useQuery({
    queryKey: gymsKey(filters),
    queryFn: () => listGyms(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useGymById(id: string | undefined) {
  return useQuery({
    queryKey: gymKey(id ?? ''),
    queryFn: () => getGymById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGymPlans(gymId: string | undefined) {
  return useQuery({
    queryKey: gymPlansKey(gymId ?? ''),
    queryFn: () => getGymPlans(gymId!),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });
}
