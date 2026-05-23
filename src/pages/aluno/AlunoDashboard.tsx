import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ArrowRight, CheckCircle2, Moon, Star, MessageCircle, TrendingUp, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useConfirmConnection, useRejectConnection } from '../../hooks/useStudents';

// âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ Mock types âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬

interface WeekDay {
  key: string;
  abbr: string;
  date: number;
  workoutLabel: string | null;
  status: 'done' | 'today' | 'upcoming' | 'rest';
}

interface ExercisePreview {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
}

interface TodayWorkout {
  name: string;
  letter: string;
  exerciseCount: number;
  durationMin: number;
  exercises: ExercisePreview[];
}

interface PersonalTrainer {
  name: string;
  avatarInitial: string;
  specialties: string[];
  rating: number;
  weeksTogether: number;
}

interface Meal {
  name: string;
  time: string;
  kcal: number;
  done: boolean;
  items: string;
}

interface DietToday {
  meals: Meal[];
  totalKcal: number;
}

// âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ Mock data âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬

const MOCK_WEEK: WeekDay[] = [
  { key: 'seg', abbr: 'SEG', date: 28, workoutLabel: 'Peito',  status: 'done'     },
  { key: 'ter', abbr: 'TER', date: 29, workoutLabel: 'Costas', status: 'done'     },
  { key: 'qua', abbr: 'QUA', date: 30, workoutLabel: null,     status: 'rest'     },
  { key: 'qui', abbr: 'QUI', date:  1, workoutLabel: 'Pernas', status: 'today'    },
  { key: 'sex', abbr: 'SEX', date:  2, workoutLabel: 'Ombro',  status: 'upcoming' },
  { key: 'sab', abbr: 'SÁB', date:  3, workoutLabel: null,     status: 'rest'     },
  { key: 'dom', abbr: 'DOM', date:  4, workoutLabel: null,     status: 'rest'     },
];

const MOCK_WORKOUT: TodayWorkout = {
  name: 'Treino D âââ€šÂ¬ââ‚¬Â Pernas',
  letter: 'D',
  exerciseCount: 8,
  durationMin: 55,
  exercises: [
    { id: '1', name: 'Agachamento livre',   sets: 4, reps: '10', weight: '80kg'     },
    { id: '2', name: 'Leg press 45°',       sets: 3, reps: '12', weight: '120kg'    },
    { id: '3', name: 'Cadeira extensora',   sets: 3, reps: '15', weight: '45kg'     },
    { id: '4', name: 'Mesa flexora',        sets: 3, reps: '12', weight: '40kg'     },
    { id: '5', name: 'Panturrilha em pé',   sets: 4, reps: '20', weight: '60kg'     },
    { id: '6', name: 'Afundo alternado',    sets: 3, reps: '12', weight: 'corporal' },
    { id: '7', name: 'Stiff',               sets: 3, reps: '12', weight: '50kg'     },
    { id: '8', name: 'Abdução de quadril',  sets: 3, reps: '15', weight: '30kg'     },
  ],
};

const MOCK_STATS = {
  workoutsThisWeek: 3,
  workoutsDiff: 1,
  daysThisMonth: 12,
  totalMinutes: 247,
};

const MOCK_PERSONAL: PersonalTrainer = {
  name: 'Rafael Costa',
  avatarInitial: 'R',
  specialties: ['Hipertrofia', 'Funcional', 'Emagrecimento'],
  rating: 4.9,
  weeksTogether: 12,
};

const MOCK_DIET: DietToday = {
  totalKcal: 2450,
  meals: [
    { name: 'Café da manhã', time: '07:00', kcal: 520, done: true,  items: 'Ovos mexidos, pão integral, iogurte'     },
    { name: 'Lanche',        time: '10:00', kcal: 280, done: true,  items: 'Banana, pasta de amendoim'              },
    { name: 'Almoço',        time: '13:00', kcal: 780, done: false, items: 'Frango grelhado, arroz, feijão, salada' },
    { name: 'Lanche tarde',  time: '16:00', kcal: 300, done: false, items: 'Whey, aveia, leite'                     },
    { name: 'Jantar',        time: '20:00', kcal: 570, done: false, items: 'Salmão, batata doce, brócolis'          },
  ],
};

// computed dynamically âââ€šÂ¬ââ‚¬Â see useEffect below

// âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ Sub-components âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬

function DayChip({ day }: { day: WeekDay }) {
  const isToday = day.status === 'today';
  const isDone  = day.status === 'done';
  const isRest  = day.status === 'rest';

  let chipCls  = 'flex flex-col items-center px-3 py-2.5 rounded-xl border min-w-[52px] transition-colors ';
  let abbrCls  = 'text-[10px] font-semibold tracking-widest mb-1 ';
  let dateCls  = 'text-xl font-bold leading-none mb-1 ';
  let labelCls = 'text-[9px] font-medium tracking-wide uppercase ';

  if (isToday) {
    chipCls  += 'border-[#7c5cfc] bg-[#7c5cfc]/10';
    abbrCls  += 'text-[#7c5cfc]';
    dateCls  += 'text-white';
    labelCls += 'text-[#7c5cfc]';
  } else if (isDone) {
    chipCls  += 'border-[#22c55e]/25 bg-[#22c55e]/8';
    abbrCls  += 'text-[#22c55e]';
    dateCls  += 'text-[#22c55e]';
    labelCls += 'text-[#22c55e]/70';
  } else if (isRest) {
    chipCls  += 'border-white/5 bg-transparent';
    abbrCls  += 'text-slate-600';
    dateCls  += 'text-slate-500';
    labelCls += 'text-slate-600';
  } else {
    chipCls  += 'border-white/10 bg-transparent';
    abbrCls  += 'text-slate-400';
    dateCls  += 'text-slate-200';
    labelCls += 'text-slate-500';
  }

  return (
    <div className={chipCls}>
      <span className={abbrCls}>{day.abbr}</span>
      <span className={dateCls}>{day.date}</span>
      <span className={labelCls}>{day.workoutLabel ?? 'Desc.'}</span>
      {isToday && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#7c5cfc]" />}
    </div>
  );
}

function PersonalCard({ personal, onChat }: { personal: PersonalTrainer; onChat: () => void }) {
  return (
    <div className="rounded-2xl bg-[#0D1025] border border-white/[0.07] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#7c5cfc]/20 flex items-center justify-center text-[#7c5cfc] font-bold text-lg shrink-0">
          {personal.avatarInitial}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{personal.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} fill="#f59e0b" className="text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">{personal.rating}</span>
            <span className="text-xs text-slate-500 ml-1">· {personal.weeksTogether} sem. juntos</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {personal.specialties.map((s) => (
          <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7c5cfc]/15 text-[#7c5cfc]">
            {s}
          </span>
        ))}
      </div>

      <button
        onClick={onChat}
        className="w-full flex items-center justify-center gap-2 bg-[#7c5cfc]/15 hover:bg-[#7c5cfc]/25 text-[#7c5cfc] text-sm font-semibold py-2.5 rounded-xl transition-colors"
      >
        <MessageCircle size={15} />
        Enviar mensagem
      </button>
    </div>
  );
}

function DietCard({ diet }: { diet: DietToday }) {
  const consumed = diet.meals.filter((m) => m.done).reduce((s, m) => s + m.kcal, 0);
  const pct = Math.round((consumed / diet.totalKcal) * 100);

  return (
    <div className="rounded-2xl bg-[#0D1025] border border-white/[0.07] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">Dieta de hoje</h3>
        <span className="text-xs text-slate-400">{consumed} / {diet.totalKcal} kcal</span>
      </div>

      <div className="h-1.5 bg-white/5 rounded-full mb-4 overflow-hidden">
        <div className="h-full rounded-full bg-[#22c55e] transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-3">
        {diet.meals.map((meal) => (
          <div key={meal.name} className="flex items-start gap-3">
            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              meal.done ? 'bg-[#22c55e] border-[#22c55e]' : 'border-white/15 bg-transparent'
            }`}>
              {meal.done && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${meal.done ? 'text-white' : 'text-slate-400'}`}>
                  {meal.name}
                </span>
                <span className="text-[10px] text-slate-500 ml-2 shrink-0">{meal.kcal} kcal</span>
              </div>
              <p className="text-[10px] text-slate-600 truncate mt-0.5">{meal.items}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ Main component âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬

function calcCompletion(data: { phone?: string | null; city?: string | null; state?: string | null; bio?: string | null; birth_date?: string | null }) {
  const fields = [data.phone, data.city, data.state, data.bio, data.birth_date];
  const filled = fields.filter(Boolean).length;
  // name is always filled (required at signup) âââ‚¬Â ââ‚¬â„¢ base 1 of 6 = ~17%
  return Math.round(((1 + filled) / 6) * 100);
}

export default function AlunoDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [pendingDismissed, setPendingDismissed] = useState(false);
  const { mutateAsync: confirmConnection, isPending: confirming } = useConfirmConnection();
  const { mutateAsync: rejectConnection, isPending: rejecting } = useRejectConnection();

  const showPendingBanner = !pendingDismissed && user?.connectionStatus === 'pending';

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('phone, city, state, bio, birth_date')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfileCompletion(calcCompletion(data));
      });
  }, [user]); // re-fetch on mount (e.g. after returning from /completar-perfil)

  const firstName = user?.name?.split(' ')[0] ?? 'Atleta';

  const today = new Date();
  const dateLabel = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const dateFormatted = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  const PREVIEW_COUNT = 3;
  const previewExercises = MOCK_WORKOUT.exercises.slice(0, PREVIEW_COUNT);
  const remaining = MOCK_WORKOUT.exerciseCount - PREVIEW_COUNT;

  return (
    <div className="min-h-screen bg-[#080B18] text-white">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6 space-y-5">

        {/* âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ Pending connection banner âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ */}
        {showPendingBanner && (
          <div className="w-full rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">
                {user.personalName ?? 'Um personal'} te adicionou como aluno.
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">Deseja confirmar o vínculo?</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => rejectConnection().then(() => setPendingDismissed(true))}
                disabled={rejecting || confirming}
                className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
              >
                Recusar
              </button>
              <button
                onClick={() => confirmConnection().then(() => setPendingDismissed(true))}
                disabled={confirming || rejecting}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {confirming ? '...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setPendingDismissed(true)}
                className="p-1 rounded-lg text-amber-500/60 hover:text-amber-400 transition-colors"
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ Profile completion banner âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ */}
        {profileCompletion < 100 && (
        <button
          onClick={() => navigate('/completar-perfil')}
          className="w-full rounded-2xl bg-[#0D1025] border border-white/[0.07] px-4 py-3 flex items-center gap-3 hover:border-[#7c5cfc]/30 hover:bg-[#0D1025]/80 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300 mb-1.5">
              Perfil{' '}
              <span className="font-semibold text-[#7c5cfc]">{profileCompletion}% completo</span>
              {' '}âââ€šÂ¬ââ‚¬Â complete seu perfil para ver personais perto de você
            </p>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#7c5cfc] transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
          <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#7c5cfc] hover:text-[#9b7fff] transition-colors whitespace-nowrap">
            Completar <ArrowRight size={13} />
          </span>
        </button>
        )}

        {/* âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ Header: date + greeting + icons âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">{dateFormatted}</p>
            <h1 className="text-2xl font-bold text-white">Olá, {firstName} 👋</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button className="relative w-10 h-10 rounded-xl bg-[#0D1025] border border-white/[0.07] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#7c5cfc]" />
            </button>
            <button
              onClick={() => navigate('/completar-perfil')}
              className="w-10 h-10 rounded-xl bg-[#0D1025] border border-white/[0.07] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <User size={18} />
            </button>
          </div>
        </div>

        {/* âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ Stats row âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ */}
        <div className="flex gap-3">
          <div className="flex-1 min-w-0 rounded-2xl p-4 bg-[#0a1f14] border border-[#22c55e]/15">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[11px] text-slate-400">Treinos esta semana</span>
            </div>
            <div className="text-3xl font-bold text-white leading-none mb-1">{MOCK_STATS.workoutsThisWeek}</div>
            <p className="text-[11px] text-[#22c55e] flex items-center gap-1">
              <TrendingUp size={10} />
              +{MOCK_STATS.workoutsDiff} vs semana passada
            </p>
          </div>

          <div className="flex-1 min-w-0 rounded-2xl p-4 bg-[#0a1f14] border border-[#22c55e]/15">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[11px] text-slate-400">Dias com treino</span>
            </div>
            <div className="text-3xl font-bold text-white leading-none mb-1">{MOCK_STATS.daysThisMonth}</div>
            <p className="text-[11px] text-slate-500">este mês</p>
          </div>

          <div className="flex-1 min-w-0 rounded-2xl p-4 bg-[#0c0e1f] border border-[#7c5cfc]/15">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7c5cfc]" />
              <span className="text-[11px] text-slate-400">Min. totais</span>
            </div>
            <div className="text-3xl font-bold text-white leading-none mb-1">{MOCK_STATS.totalMinutes}</div>
            <p className="text-[11px] text-slate-500">essa semana</p>
          </div>
        </div>

        {/* âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ Main grid: content + right column âââ‚¬Âââ€šÂ¬âââ‚¬Âââ€šÂ¬ */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-5 space-y-4 lg:space-y-0">

          {/* Left column */}
          <div className="space-y-4">

            {/* Plano da semana */}
            <div className="rounded-2xl bg-[#0D1025] border border-white/[0.07] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white text-base">Plano da semana</h2>
                <button
                  onClick={() => navigate('/aluno/treino')}
                  className="text-xs text-[#7c5cfc] hover:text-[#9b7fff] font-medium transition-colors"
                >
                  Ver todos
                </button>
              </div>

              {/* Day chips âââ€šÂ¬ââ‚¬Â horizontal scroll */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
                style={{ scrollbarWidth: 'none' }}>
                {MOCK_WEEK.map((day) => <DayChip key={day.key} day={day} />)}
              </div>

              {/* Today's workout card */}
              <div className="mt-4 rounded-xl bg-[#1a1f2e] border border-[#7c5cfc]/20 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#7c5cfc]/20 flex items-center justify-center text-[#7c5cfc] font-bold text-lg shrink-0">
                  {MOCK_WORKOUT.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{MOCK_WORKOUT.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hoje · {MOCK_WORKOUT.exerciseCount} exercícios · ~{MOCK_WORKOUT.durationMin} min
                  </p>
                </div>
                <button
                  onClick={() => navigate('/aluno/treino')}
                  className="shrink-0 flex items-center gap-1.5 bg-white text-[#0d0f14] text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Iniciar <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Exercise preview list */}
            <div className="rounded-2xl bg-[#0D1025] border border-white/[0.07] divide-y divide-white/[0.05]">
              {previewExercises.map((ex, i) => (
                <div key={ex.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="text-sm font-bold text-slate-600 w-4 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ex.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ex.sets} series &middot; {ex.reps} reps &middot; {ex.weight}
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded border border-white/10 shrink-0" />
                </div>
              ))}

              {remaining > 0 && (
                <button
                  onClick={() => navigate('/aluno/treino')}
                  className="w-full flex items-center gap-2 px-5 py-3.5 text-xs text-slate-500 hover:text-[#7c5cfc] transition-colors"
                >
                  <span className="font-semibold text-slate-400">+{remaining}</span>
                  Ver todos os exercícios
                </button>
              )}
            </div>
          </div>

          {/* Right column âââ€šÂ¬ââ‚¬Â desktop */}
          <div className="hidden lg:flex flex-col gap-4">
            <PersonalCard personal={MOCK_PERSONAL} onChat={() => navigate('/aluno/chat')} />
            <DietCard diet={MOCK_DIET} />
          </div>

          {/* Diet card âââ€šÂ¬ââ‚¬Â mobile (below exercises) */}
          <div className="lg:hidden">
            <DietCard diet={MOCK_DIET} />
          </div>
        </div>

      </div>
    </div>
  );
}
