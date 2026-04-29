import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchDiets,
  fetchDietById,
  createDiet,
  updateDiet,
  deleteDiet,
  addMealToDiet,
  removeMealFromDiet,
  updateMealInDiet,
  addFoodToMeal,
  removeFoodFromMeal,
  updateFoodInMeal,
  fetchDietAssignments,
  fetchStudentDiet,
  assignDiet,
  removeDietAssignment,
} from '../services/diets';
import type { Diet, DietAssignment, Meal, FoodItem } from '../types';

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const dietsKey = (personalId: string) => ['diets', personalId] as const;
export const dietKey = (id: string) => ['diet', id] as const;
export const dietAssignmentsKey = (personalId: string) => ['diet-assignments', 'personal', personalId] as const;
export const studentDietKey = (studentId: string) => ['diet-assignments', 'student', studentId] as const;

// ── Personal Diets ─────────────────────────────────────────────────────────────

export function useDiets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: dietsKey(user?.id ?? ''),
    queryFn: () => fetchDiets(user!.id),
    enabled: !!user && user.role === 'personal',
  });
}

export function useDiet(id: string) {
  return useQuery({
    queryKey: dietKey(id),
    queryFn: () => fetchDietById(id),
    enabled: !!id,
  });
}

export function useCreateDiet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Omit<Diet, 'id' | 'createdAt' | 'meals'>) => createDiet(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietsKey(user?.id ?? '') }),
  });
}

export function useUpdateDiet(dietId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<Diet>) => updateDiet(dietId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dietKey(dietId) });
      qc.invalidateQueries({ queryKey: dietsKey(user?.id ?? '') });
    },
  });
}

export function useDeleteDiet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => deleteDiet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietsKey(user?.id ?? '') }),
  });
}

// ── Meals ──────────────────────────────────────────────────────────────────────

export function useAddMeal(dietId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meal: Omit<Meal, 'id'>) => addMealToDiet(dietId, meal),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietKey(dietId) }),
  });
}

export function useRemoveMeal(dietId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mealId: string) => removeMealFromDiet(dietId, mealId),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietKey(dietId) }),
  });
}

export function useUpdateMeal(dietId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, data }: { mealId: string; data: Partial<Meal> }) =>
      updateMealInDiet(dietId, mealId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietKey(dietId) }),
  });
}

// ── Food Items ─────────────────────────────────────────────────────────────────

export function useAddFood(dietId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, food }: { mealId: string; food: Omit<FoodItem, 'id'> }) =>
      addFoodToMeal(dietId, mealId, food),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietKey(dietId) }),
  });
}

export function useRemoveFood(dietId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, foodId }: { mealId: string; foodId: string }) =>
      removeFoodFromMeal(dietId, mealId, foodId),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietKey(dietId) }),
  });
}

export function useUpdateFood(dietId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mealId,
      foodId,
      data,
    }: {
      mealId: string;
      foodId: string;
      data: Partial<FoodItem>;
    }) => updateFoodInMeal(dietId, mealId, foodId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietKey(dietId) }),
  });
}

// ── Diet Assignments ───────────────────────────────────────────────────────────

export function useDietAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: dietAssignmentsKey(user?.id ?? ''),
    queryFn: () => fetchDietAssignments(user!.id),
    enabled: !!user && user.role === 'personal',
  });
}

export function useStudentDiet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: studentDietKey(user?.id ?? ''),
    queryFn: () => fetchStudentDiet(user!.id),
    enabled: !!user && user.role === 'aluno',
  });
}

export function useAssignDiet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Omit<DietAssignment, 'id' | 'assignedAt'>) => assignDiet(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietAssignmentsKey(user?.id ?? '') }),
  });
}

export function useRemoveDietAssignment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => removeDietAssignment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: dietAssignmentsKey(user?.id ?? '') }),
  });
}
