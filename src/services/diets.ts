import { supabase } from '../lib/supabase';
import type { Diet, DietAssignment, Meal, FoodItem } from '../types';

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapFoodItem(row: Record<string, unknown>): FoodItem {
  return {
    id: row.id as string,
    name: row.name as string,
    quantity: row.quantity as string,
    calories: (row.calories as number | null) ?? undefined,
    protein: (row.protein as number | null) ?? undefined,
    carbs: (row.carbs as number | null) ?? undefined,
    fat: (row.fat as number | null) ?? undefined,
  };
}

function mapMeal(row: Record<string, unknown>, foods: FoodItem[] = []): Meal {
  return {
    id: row.id as string,
    name: row.name as string,
    time: row.time as string,
    notes: (row.notes as string | null) ?? undefined,
    targetCalories: (row.target_calories as number | null) ?? undefined,
    foods,
  };
}

function mapDiet(row: Record<string, unknown>, meals: Meal[] = []): Diet {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? undefined,
    goal: (row.goal as string | null) ?? undefined,
    status: (row.status as Diet['status']) ?? 'ativa',
    personalId: row.personal_id as string,
    targetCalories: (row.target_calories as number | null) ?? undefined,
    targetProtein: (row.target_protein as number | null) ?? undefined,
    targetCarbs: (row.target_carbs as number | null) ?? undefined,
    targetFat: (row.target_fat as number | null) ?? undefined,
    durationDays: (row.duration_days as number | null) ?? undefined,
    restrictionLevel: (row.restriction_level as string | null) ?? undefined,
    preferences: (row.preferences as string[] | null) ?? [],
    favoriteFoods: (row.favorite_foods as string[] | null) ?? [],
    createdAt: row.created_at as string,
    meals,
  };
}

// ── Shared nested fetch ────────────────────────────────────────────────────────

async function fetchMealsWithFoods(dietIds: string[]): Promise<Map<string, Meal[]>> {
  if (dietIds.length === 0) return new Map();

  const { data: mealRows, error: mErr } = await supabase
    .from('meals')
    .select('*')
    .in('diet_id', dietIds)
    .order('order_index', { ascending: true });

  if (mErr) throw mErr;
  if (!mealRows || mealRows.length === 0) return new Map();

  // Forçado g: any caso m.id reclame em algum contexto paralelo
  const mealIds = mealRows.map((m: any) => m.id);

  const { data: foodRows, error: fErr } = await supabase
    .from('food_items')
    .select('*')
    .in('meal_id', mealIds);

  if (fErr) throw fErr;

  const foodsByMeal = new Map<string, FoodItem[]>();
  for (const f of (foodRows ?? []) as any[]) {
    const arr = foodsByMeal.get(f.meal_id) ?? [];
    arr.push(mapFoodItem(f as Record<string, unknown>));
    foodsByMeal.set(f.meal_id, arr);
  }

  const mealsByDiet = new Map<string, Meal[]>();
  for (const m of mealRows as any[]) {
    const meals = mealsByDiet.get(m.diet_id) ?? [];
    meals.push(mapMeal(m as Record<string, unknown>, foodsByMeal.get(m.id) ?? []));
    mealsByDiet.set(m.diet_id, meals);
  }

  return mealsByDiet;
}

// ── Diets ──────────────────────────────────────────────────────────────────────

export async function fetchDiets(personalId: string): Promise<Diet[]> {
  const { data: dietRows, error } = await supabase
    .from('diets')
    .select('*')
    .eq('personal_id', personalId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!dietRows || dietRows.length === 0) return [];

  const mealsByDiet = await fetchMealsWithFoods(dietRows.map((d: any) => d.id));
  return dietRows.map((d) => mapDiet(d as Record<string, unknown>, mealsByDiet.get((d as any).id) ?? []));
}

export async function fetchDietById(id: string): Promise<Diet | null> {
  const { data: d, error } = await supabase
    .from('diets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  const mealsByDiet = await fetchMealsWithFoods([id]);
  return mapDiet(d as Record<string, unknown>, mealsByDiet.get(id) ?? []);
}

export async function createDiet(data: Omit<Diet, 'id' | 'createdAt' | 'meals'>): Promise<Diet> {
  const { data: row, error } = await supabase
    .from('diets')
    .insert({
      name: data.name,
      description: data.description ?? null,
      goal: data.goal ?? null,
      status: data.status ?? 'ativa',
      personal_id: data.personalId,
      target_calories: data.targetCalories ?? null,
      target_protein: data.targetProtein ?? null,
      target_carbs: data.targetCarbs ?? null,
      target_fat: data.targetFat ?? null,
      duration_days: data.durationDays ?? null,
      restriction_level: data.restrictionLevel ?? null,
      preferences: data.preferences ?? [],
      favorite_foods: data.favoriteFoods ?? [],
    } as any)
    .select()
    .single();

  if (error) throw error;
  return mapDiet(row as Record<string, unknown>, []);
}

export async function updateDiet(id: string, data: Partial<Diet>): Promise<void> {
  const { error } = await supabase
    .from('diets')
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.goal !== undefined && { goal: data.goal ?? null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.targetCalories !== undefined && { target_calories: data.targetCalories ?? null }),
      ...(data.targetProtein !== undefined && { target_protein: data.targetProtein ?? null }),
      ...(data.targetCarbs !== undefined && { target_carbs: data.targetCarbs ?? null }),
      ...(data.targetFat !== undefined && { target_fat: data.targetFat ?? null }),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteDiet(id: string): Promise<void> {
  const { error } = await supabase.from('diets').delete().eq('id', id);
  if (error) throw error;
}

// ── Meals ──────────────────────────────────────────────────────────────────────

export async function addMealToDiet(dietId: string, meal: Omit<Meal, 'id'>): Promise<Meal> {
  const { count } = await supabase
    .from('meals')
    .select('*', { count: 'exact', head: true })
    .eq('diet_id', dietId);

  const { data, error } = await supabase
    .from('meals')
    .insert({
      diet_id: dietId,
      name: meal.name,
      time: meal.time,
      notes: meal.notes ?? null,
      target_calories: meal.targetCalories ?? null,
      order_index: count ?? 0,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return mapMeal(data as Record<string, unknown>, []);
}

export async function removeMealFromDiet(_dietId: string, mealId: string): Promise<void> {
  const { error } = await supabase.from('meals').delete().eq('id', mealId);
  if (error) throw error;
}

export async function updateMealInDiet(
  _dietId: string,
  mealId: string,
  data: Partial<Meal>
): Promise<void> {
  const { error } = await supabase
    .from('meals')
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.time !== undefined && { time: data.time }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
    })
    .eq('id', mealId);

  if (error) throw error;
}

// ── Food Items ─────────────────────────────────────────────────────────────────

export async function addFoodToMeal(
  _dietId: string,
  mealId: string,
  food: Omit<FoodItem, 'id'>
): Promise<FoodItem> {
  const { data, error } = await supabase
    .from('food_items')
    .insert({
      meal_id: mealId,
      name: food.name,
      quantity: food.quantity,
      calories: food.calories ?? null,
      protein: food.protein ?? null,
      carbs: food.carbs ?? null,
      fat: food.fat ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapFoodItem(data as Record<string, unknown>);
}

export async function removeFoodFromMeal(
  _dietId: string,
  _mealId: string,
  foodId: string
): Promise<void> {
  const { error } = await supabase.from('food_items').delete().eq('id', foodId);
  if (error) throw error;
}

export async function updateFoodInMeal(
  _dietId: string,
  _mealId: string,
  foodId: string,
  data: Partial<FoodItem>
): Promise<void> {
  const { error } = await supabase
    .from('food_items')
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.calories !== undefined && { calories: data.calories ?? null }),
      ...(data.protein !== undefined && { protein: data.protein ?? null }),
      ...(data.carbs !== undefined && { carbs: data.carbs ?? null }),
      ...(data.fat !== undefined && { fat: data.fat ?? null }),
    })
    .eq('id', foodId);

  if (error) throw error;
}

// ── Diet Assignments ───────────────────────────────────────────────────────────

export async function fetchDietAssignments(personalId: string): Promise<DietAssignment[]> {
  const { data, error } = await supabase
    .from('diet_assignments')
    .select('*')
    .eq('personal_id', personalId);

  if (error) throw error;
  // Corrigido: adicionado (r: any) para evitar o erro de propriedade inexistente em type 'never'
  return (data ?? []).map((r: any) => ({
    id: r.id,
    dietId: r.diet_id,
    dietName: r.diet_name,
    studentId: r.student_id,
    personalId: r.personal_id,
    assignedAt: r.assigned_at,
  }));
}

export async function fetchStudentDiet(studentId: string): Promise<{ assignment: DietAssignment; diet: Diet } | null> {
  const { data: aRow, error: aErr } = await supabase
    .from('diet_assignments')
    .select('*')
    .eq('student_id', studentId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (aErr || !aRow) return null;

  // Corrigido: Castado "aRow as any" para o TypeScript conseguir ler os campos da tabela sem reclamar
  const currentAssignment = aRow as any;

  const assignment: DietAssignment = {
    id: currentAssignment.id,
    dietId: currentAssignment.diet_id,
    dietName: currentAssignment.diet_name,
    studentId: currentAssignment.student_id,
    personalId: currentAssignment.personal_id,
    assignedAt: currentAssignment.assigned_at,
  };

  const diet = await fetchDietById(currentAssignment.diet_id);
  if (!diet) return null;

  return { assignment, diet };
}

export async function assignDiet(data: Omit<DietAssignment, 'id' | 'assignedAt'>): Promise<DietAssignment> {
  const { data: row, error } = await supabase
    .from('diet_assignments')
    .insert({
      diet_id: data.dietId,
      diet_name: data.dietName,
      student_id: data.studentId,
      personal_id: data.personalId,
    })
    .select()
    .single();

  if (error) throw error;

  // Corrigido: Castado "row as any" para permitir a leitura das propriedades vindas do banco
  const createdRow = row as any;

  return {
    id: createdRow.id,
    dietId: createdRow.diet_id,
    dietName: createdRow.diet_name,
    studentId: createdRow.student_id,
    personalId: createdRow.personal_id,
    assignedAt: createdRow.assigned_at,
  };
}

export async function removeDietAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('diet_assignments').delete().eq('id', id);
  if (error) throw error;
}