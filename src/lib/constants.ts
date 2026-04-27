export const APP_NAME = 'FitCoach' as const;

/** localStorage key for persisting the authenticated user. */
export const LS_USER_KEY = 'fitcoach_user' as const;

/** localStorage key for dynamically created student users. */
export const LS_DYNAMIC_USERS_KEY = 'fitcoach_dynamic_users' as const;

/** localStorage key for dynamically created student passwords. */
export const LS_DYNAMIC_PASSWORDS_KEY = 'fitcoach_dynamic_passwords' as const;

/** localStorage key for dynamically registered gym profiles. */
export const LS_GYMS_KEY = 'fitcoach_dynamic_gyms' as const;

// ── UI tokens ─────────────────────────────────────────────────────────────────
/** Standard card shell — white/dark-800, rounded-2xl, shadow, border */
export const CARD = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm' as const;

/** Page wrapper for wide personal pages */
export const PAGE = 'p-5 max-w-6xl mx-auto' as const;

/** Page wrapper for narrow aluno pages */
export const PAGE_NARROW = 'p-5 max-w-2xl mx-auto' as const;

/** Page wrapper for mid-width detail pages */
export const PAGE_MID = 'p-5 max-w-3xl mx-auto' as const;

/** Standard text input — indigo focus ring */
export const INPUT = 'w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition' as const;

/** Standard text input — emerald focus ring (aluno / diet sections) */
export const INPUT_EMERALD = 'w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition' as const;

/** Standard form label */
export const LABEL = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1' as const;

/** Primary button — indigo */
export const BTN_PRIMARY = 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors' as const;

/** Secondary/cancel button */
export const BTN_SECONDARY = 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors' as const;
