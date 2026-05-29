import { useQuery } from '@tanstack/react-query';
import {
  listTrainers,
  getTrainerById,
  getTrainerAvailability,
} from '../services/trainers';
import type { TrainerFilters } from '../services/trainers';

// ── Query key factories ────────────────────────────────────────────────────────

export const trainersKey = (filters: TrainerFilters) => ['trainers', filters] as const;
export const trainerKey = (id: string) => ['trainer', id] as const;
export const trainerAvailabilityKey = (id: string) => ['trainer-availability', id] as const;

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useTrainers(filters: TrainerFilters = {}) {
  return useQuery({
    queryKey: trainersKey(filters),
    queryFn: () => listTrainers(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useTrainerById(id: string | undefined) {
  return useQuery({
    queryKey: trainerKey(id ?? ''),
    queryFn: () => getTrainerById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrainerAvailability(id: string | undefined) {
  return useQuery({
    queryKey: trainerAvailabilityKey(id ?? ''),
    queryFn: () => getTrainerAvailability(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
