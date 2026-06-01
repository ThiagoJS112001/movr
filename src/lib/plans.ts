/**
 * Plan definitions and limit enforcement.
 *
 * When Stripe is integrated, the active plan will come from the subscriptions
 * table. For now, defaults to 'free' so limits are enforced from day one and
 * upgrading later does not require code changes — only updating the plan stored
 * for the user.
 */

export type PlanId = 'free' | 'pro' | 'elite';

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // BRL cents per month
  limits: {
    students: number;        // Personal: max active students (-1 = unlimited)
    workouts: number;        // Personal: max workout templates (-1 = unlimited)
    diets: number;           // Personal: max diet templates (-1 = unlimited)
    exercises: number;       // Personal: max exercises in library (-1 = unlimited)
    storageGb: number;       // File storage in GB
    pdfReports: boolean;     // Can export PDF reports
    analytics: boolean;      // Advanced analytics access
  };
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Grátis',
    price: 0,
    limits: {
      students: 3,
      workouts: 5,
      diets: 2,
      exercises: 20,
      storageGb: 0.5,
      pdfReports: false,
      analytics: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 7900, // R$79,00
    limits: {
      students: 30,
      workouts: -1,
      diets: -1,
      exercises: -1,
      storageGb: 5,
      pdfReports: true,
      analytics: false,
    },
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 14900, // R$149,00
    limits: {
      students: -1,
      workouts: -1,
      diets: -1,
      exercises: -1,
      storageGb: 20,
      pdfReports: true,
      analytics: true,
    },
  },
};

/**
 * Returns true if the given count is within the plan limit.
 * A limit of -1 means unlimited.
 */
export function withinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true;
  return current < limit;
}

/**
 * Returns a human-readable upgrade message for when a limit is hit.
 */
export function limitMessage(resource: string, plan: PlanId): string {
  const next = plan === 'free' ? 'Pro' : 'Elite';
  return `Você atingiu o limite do plano ${PLANS[plan].name} para ${resource}. Faça upgrade para o plano ${next} para continuar.`;
}
