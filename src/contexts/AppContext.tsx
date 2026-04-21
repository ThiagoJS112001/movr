import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Workout, WorkoutAssignment, WorkoutLog, Message, User, WorkoutExercise, Diet, DietAssignment, Meal, FoodItem } from '../types';
import {
  MOCK_WORKOUTS,
  MOCK_ASSIGNMENTS,
  MOCK_LOGS,
  MOCK_MESSAGES,
  MOCK_USERS,
  MOCK_DIETS,
  MOCK_DIET_ASSIGNMENTS,
} from '../data/mockData';

interface AppContextType {
  // Data
  students: User[];
  workouts: Workout[];
  assignments: WorkoutAssignment[];
  logs: WorkoutLog[];
  messages: Message[];

  // Workouts
  createWorkout: (w: Omit<Workout, 'id' | 'createdAt'>) => Workout;
  updateWorkout: (id: string, w: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;

  // Exercises within workout
  addExerciseToWorkout: (workoutId: string, ex: Omit<WorkoutExercise, 'id'>) => void;
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) => void;
  updateExerciseInWorkout: (workoutId: string, exerciseId: string, data: Partial<WorkoutExercise>) => void;

  // Assignments
  assignWorkout: (a: Omit<WorkoutAssignment, 'id' | 'assignedAt'>) => void;
  removeAssignment: (id: string) => void;

  // Logs
  addLog: (log: Omit<WorkoutLog, 'id'>) => void;

  // Messages
  sendMessage: (msg: Omit<Message, 'id' | 'sentAt' | 'read'>) => void;
  markMessagesRead: (fromId: string, toId: string) => void;
  getConversation: (userId1: string, userId2: string) => Message[];
  unreadCount: (toId: string) => number;

  // Block
  blockedStudentIds: string[];
  blockStudent: (id: string) => void;
  unblockStudent: (id: string) => void;
  isStudentBlocked: (id: string) => boolean;

  // Diets
  diets: Diet[];
  dietAssignments: DietAssignment[];
  createDiet: (d: Omit<Diet, 'id' | 'createdAt'>) => Diet;
  updateDiet: (id: string, data: Partial<Diet>) => void;
  deleteDiet: (id: string) => void;
  addMealToDiet: (dietId: string, meal: Omit<Meal, 'id'>) => void;
  removeMealFromDiet: (dietId: string, mealId: string) => void;
  updateMealInDiet: (dietId: string, mealId: string, data: Partial<Meal>) => void;
  addFoodToMeal: (dietId: string, mealId: string, food: Omit<FoodItem, 'id'>) => void;
  removeFoodFromMeal: (dietId: string, mealId: string, foodId: string) => void;
  updateFoodInMeal: (dietId: string, mealId: string, foodId: string, data: Partial<FoodItem>) => void;
  assignDiet: (a: Omit<DietAssignment, 'id' | 'assignedAt'>) => void;
  removeDietAssignment: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>(MOCK_WORKOUTS);
  const [assignments, setAssignments] = useState<WorkoutAssignment[]>(MOCK_ASSIGNMENTS);
  const [logs, setLogs] = useState<WorkoutLog[]>(MOCK_LOGS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [diets, setDiets] = useState<Diet[]>(MOCK_DIETS);
  const [dietAssignments, setDietAssignments] = useState<DietAssignment[]>(MOCK_DIET_ASSIGNMENTS);
  const [blockedStudentIds, setBlockedStudentIds] = useState<string[]>([]);

  const students = MOCK_USERS.filter((u) => u.role === 'aluno');

  function blockStudent(id: string) {
    setBlockedStudentIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function unblockStudent(id: string) {
    setBlockedStudentIds((prev) => prev.filter((s) => s !== id));
  }

  function isStudentBlocked(id: string): boolean {
    return blockedStudentIds.includes(id);
  }

  // ── Workouts ────────────────────────────────────────────────────────────────
  function createWorkout(w: Omit<Workout, 'id' | 'createdAt'>): Workout {
    const newW: Workout = { ...w, id: uuidv4(), createdAt: new Date().toISOString() };
    setWorkouts((prev) => [...prev, newW]);
    return newW;
  }

  function updateWorkout(id: string, data: Partial<Workout>) {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
  }

  function deleteWorkout(id: string) {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    setAssignments((prev) => prev.filter((a) => a.workoutId !== id));
  }

  // ── Exercises ────────────────────────────────────────────────────────────────
  function addExerciseToWorkout(workoutId: string, ex: Omit<WorkoutExercise, 'id'>) {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? { ...w, exercises: [...w.exercises, { ...ex, id: uuidv4() }] }
          : w
      )
    );
  }

  function removeExerciseFromWorkout(workoutId: string, exerciseId: string) {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
          : w
      )
    );
  }

  function updateExerciseInWorkout(workoutId: string, exerciseId: string, data: Partial<WorkoutExercise>) {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map((e) => (e.id === exerciseId ? { ...e, ...data } : e)),
            }
          : w
      )
    );
  }

  // ── Assignments ──────────────────────────────────────────────────────────────
  function assignWorkout(a: Omit<WorkoutAssignment, 'id' | 'assignedAt'>) {
    const newA: WorkoutAssignment = { ...a, id: uuidv4(), assignedAt: new Date().toISOString() };
    setAssignments((prev) => [...prev, newA]);
  }

  function removeAssignment(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  // ── Logs ─────────────────────────────────────────────────────────────────────
  function addLog(log: Omit<WorkoutLog, 'id'>) {
    setLogs((prev) => [...prev, { ...log, id: uuidv4() }]);
  }
  // ── Messages ──────────────────────────────────────────────────────────────────
  function sendMessage(msg: Omit<Message, 'id' | 'sentAt' | 'read'>) {
    const newMsg: Message = {
      ...msg,
      id: uuidv4(),
      sentAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
  }

  function markMessagesRead(fromId: string, toId: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.fromId === fromId && m.toId === toId ? { ...m, read: true } : m
      )
    );
  }

  function getConversation(userId1: string, userId2: string): Message[] {
    return messages
      .filter(
        (m) =>
          (m.fromId === userId1 && m.toId === userId2) ||
          (m.fromId === userId2 && m.toId === userId1)
      )
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }

  function unreadCount(toId: string): number {
    return messages.filter((m) => m.toId === toId && !m.read).length;
  }

  // ── Diets ─────────────────────────────────────────────────────────────────────
  function createDiet(d: Omit<Diet, 'id' | 'createdAt'>): Diet {
    const newD: Diet = { ...d, id: uuidv4(), createdAt: new Date().toISOString() };
    setDiets((prev) => [...prev, newD]);
    return newD;
  }

  function updateDiet(id: string, data: Partial<Diet>) {
    setDiets((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
  }

  function deleteDiet(id: string) {
    setDiets((prev) => prev.filter((d) => d.id !== id));
    setDietAssignments((prev) => prev.filter((a) => a.dietId !== id));
  }

  function addMealToDiet(dietId: string, meal: Omit<Meal, 'id'>) {
    setDiets((prev) =>
      prev.map((d) =>
        d.id === dietId ? { ...d, meals: [...d.meals, { ...meal, id: uuidv4() }] } : d
      )
    );
  }

  function removeMealFromDiet(dietId: string, mealId: string) {
    setDiets((prev) =>
      prev.map((d) =>
        d.id === dietId ? { ...d, meals: d.meals.filter((m) => m.id !== mealId) } : d
      )
    );
  }

  function updateMealInDiet(dietId: string, mealId: string, data: Partial<Meal>) {
    setDiets((prev) =>
      prev.map((d) =>
        d.id === dietId
          ? { ...d, meals: d.meals.map((m) => (m.id === mealId ? { ...m, ...data } : m)) }
          : d
      )
    );
  }

  function addFoodToMeal(dietId: string, mealId: string, food: Omit<FoodItem, 'id'>) {
    setDiets((prev) =>
      prev.map((d) =>
        d.id === dietId
          ? {
              ...d,
              meals: d.meals.map((m) =>
                m.id === mealId ? { ...m, foods: [...m.foods, { ...food, id: uuidv4() }] } : m
              ),
            }
          : d
      )
    );
  }

  function removeFoodFromMeal(dietId: string, mealId: string, foodId: string) {
    setDiets((prev) =>
      prev.map((d) =>
        d.id === dietId
          ? {
              ...d,
              meals: d.meals.map((m) =>
                m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) } : m
              ),
            }
          : d
      )
    );
  }

  function updateFoodInMeal(dietId: string, mealId: string, foodId: string, data: Partial<FoodItem>) {
    setDiets((prev) =>
      prev.map((d) =>
        d.id === dietId
          ? {
              ...d,
              meals: d.meals.map((m) =>
                m.id === mealId
                  ? { ...m, foods: m.foods.map((f) => (f.id === foodId ? { ...f, ...data } : f)) }
                  : m
              ),
            }
          : d
      )
    );
  }

  function assignDiet(a: Omit<DietAssignment, 'id' | 'assignedAt'>) {
    setDietAssignments((prev) => [...prev, { ...a, id: uuidv4(), assignedAt: new Date().toISOString() }]);
  }

  function removeDietAssignment(id: string) {
    setDietAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <AppContext.Provider
      value={{
        students,
        workouts,
        assignments,
        logs,
        messages,
        createWorkout,
        updateWorkout,
        deleteWorkout,
        addExerciseToWorkout,
        removeExerciseFromWorkout,
        updateExerciseInWorkout,
        assignWorkout,
        removeAssignment,
        addLog,
        sendMessage,
        markMessagesRead,
        getConversation,
        unreadCount,
        diets,
        dietAssignments,
        createDiet,
        updateDiet,
        deleteDiet,
        addMealToDiet,
        removeMealFromDiet,
        updateMealInDiet,
        addFoodToMeal,
        removeFoodFromMeal,
        updateFoodInMeal,
        assignDiet,
        removeDietAssignment,
        blockedStudentIds,
        blockStudent,
        unblockStudent,
        isStudentBlocked,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
