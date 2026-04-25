import { useState } from 'react';
import {
  X, ArrowLeft, Dumbbell, Clock, Activity, ListChecks,
  GripVertical, Copy, Video,
} from 'lucide-react';
import type { Workout, Exercise } from '../types';
import VideoModal from './VideoModal';

type Tab = 'visao-geral' | 'exercicios' | 'observacoes';

const MUSCLE_BADGE: Record<string, string> = {
  'Peito':       'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Costas':      'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Pernas':      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Glúteos':     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Ombros':      'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Bíceps':      'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Tríceps':     'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Abdômen':     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Panturrilha': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

function muscleBadge(g: string) {
  return MUSCLE_BADGE[g] ?? 'bg-slate-600/50 text-slate-300 border-slate-500/30';
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'visao-geral', label: 'Visão geral' },
  { key: 'exercicios',  label: 'Exercícios' },
  { key: 'observacoes', label: 'Observações' },
];

interface Props {
  workout: Workout;
  exercises: Exercise[];
  onClose: () => void;
}

export default function WorkoutViewModal({ workout, exercises, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('visao-geral');
  const [videoOpen, setVideoOpen] = useState('');

  const muscleGroups = [
    ...new Set(
      workout.exercises
        .map((we) => exercises.find((e) => e.id === we.exerciseId)?.muscleGroup)
        .filter(Boolean) as string[],
    ),
  ];

  const isRascunho = workout.status === 'rascunho';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-slate-950/90 z-50 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-5">

          {/* Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-5 transition-colors"
          >
            <ArrowLeft size={15} />
            Voltar para treinos
          </button>

          {/* ── Header card ────────────────────────────────────────────────── */}
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl px-6 py-5 mb-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-white">{workout.name}</h1>
                <span
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                    isRascunho
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isRascunho ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  {isRascunho ? 'Rascunho' : 'Ativo'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Criado em{' '}
                {new Date(workout.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <div className="flex gap-1 border-b border-slate-700/60 mb-5">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                  activeTab === key
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Visão geral ─────────────────────────────────────────── */}
          {activeTab === 'visao-geral' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-4">

              {/* Left column */}
              <div className="flex flex-col gap-4">

                {/* Stats strip */}
                <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
                  <p className="font-semibold text-white mb-0.5">Visão geral do treino</p>
                  <p className="text-xs text-slate-400 mb-4">Resumo das principais informações do treino.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        Icon: Dumbbell,
                        color: 'bg-purple-500/15 text-purple-400',
                        label: 'Grupo muscular principal',
                        value: muscleGroups[0] ?? '—',
                      },
                      {
                        Icon: Clock,
                        color: 'bg-blue-500/15 text-blue-400',
                        label: 'Duração média',
                        value: workout.durationMinutes ? `${workout.durationMinutes} min` : '—',
                      },
                      {
                        Icon: Activity,
                        color: 'bg-emerald-500/15 text-emerald-400',
                        label: 'Grupos musculares',
                        value: muscleGroups.length > 0 ? `${muscleGroups.length}` : '—',
                      },
                      {
                        Icon: ListChecks,
                        color: 'bg-indigo-500/15 text-indigo-400',
                        label: 'Exercícios',
                        value: `${workout.exercises.length} exercício${workout.exercises.length !== 1 ? 's' : ''}`,
                      },
                    ].map(({ Icon, color, label, value }) => (
                      <div key={label} className="bg-slate-700/40 rounded-xl p-3 flex flex-col gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 leading-tight">{label}</p>
                          <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercise list */}
                <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-700/60">
                    <p className="font-semibold text-white text-sm">Exercícios do treino</p>
                    <p className="text-xs text-slate-400 mt-0.5">Lista de exercícios na ordem definida.</p>
                  </div>
                  {workout.exercises.length === 0 ? (
                    <div className="py-14 text-center">
                      <Dumbbell size={28} className="mx-auto mb-2 text-slate-600" />
                      <p className="text-sm text-slate-500">Nenhum exercício adicionado.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700/40">
                      {workout.exercises.map((ex, i) => {
                        const exData = exercises.find((e) => e.id === ex.exerciseId);
                        const videoUrl = ex.videoUrl ?? exData?.videoUrl;
                        return (
                          <div
                            key={ex.id}
                            className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-700/20 transition-colors"
                          >
                            <GripVertical size={13} className="text-slate-600 shrink-0" />
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </div>
                            {ex.imageUrl ? (
                              <img
                                src={ex.imageUrl}
                                alt={ex.exerciseName}
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                                <Dumbbell size={15} className="text-slate-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{ex.exerciseName}</p>
                              <p className="text-xs text-slate-400">{exData?.muscleGroup ?? '—'}</p>
                            </div>
                            <div className="flex items-center gap-6 text-right shrink-0">
                              <div>
                                <p className="text-xs font-medium text-slate-200">{ex.sets} séries</p>
                                <p className="text-xs text-slate-400">{ex.reps} reps</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400">Carga</p>
                                <p className="text-xs text-slate-200">{ex.weight ?? '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400">Descanso</p>
                                <p className="text-xs text-slate-200">{ex.restSeconds} seg</p>
                              </div>
                              {videoUrl && (
                                <button
                                  onClick={() => setVideoOpen(videoUrl)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                  title="Ver vídeo"
                                >
                                  <Video size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="flex flex-col gap-4">

                {/* Info card */}
                <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
                  <p className="font-semibold text-white text-sm mb-4">Informações do treino</p>
                  <div className="space-y-3.5">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Nome do treino</p>
                      <p className="text-sm font-medium text-white">{workout.name}</p>
                    </div>
                    {muscleGroups.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1.5">Grupo muscular principal</p>
                        <div className="flex flex-wrap gap-1">
                          {muscleGroups.slice(0, 3).map((g) => (
                            <span
                              key={g}
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${muscleBadge(g)}`}
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <p className="text-xs text-slate-400">Duração média</p>
                      <p className="text-xs font-medium text-white">
                        {workout.durationMinutes ? `${workout.durationMinutes} minutos` : '—'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <p className="text-xs text-slate-400">Status</p>
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${
                          isRascunho ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isRascunho ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {isRascunho ? 'Rascunho' : 'Ativo'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <p className="text-xs text-slate-400">Criado em</p>
                      <p className="text-xs text-white">
                        {new Date(workout.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <p className="text-xs text-slate-400">Exercícios</p>
                      <p className="text-xs text-white">{workout.exercises.length}</p>
                    </div>
                  </div>
                </div>

                {/* Notes card */}
                {workout.description && (
                  <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
                    <p className="font-semibold text-white text-sm mb-2">Observações do treino</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{workout.description}</p>
                  </div>
                )}

                {/* Muscle groups card */}
                {muscleGroups.length > 0 && (
                  <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-5">
                    <p className="font-semibold text-white text-sm mb-3">Grupos musculares trabalhados</p>
                    <div className="flex flex-wrap gap-2">
                      {muscleGroups.map((g) => (
                        <span
                          key={g}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${muscleBadge(g)}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicate */}
                <button className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600/60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                  <Copy size={14} />
                  Duplicar treino
                </button>
              </div>
            </div>
          )}

          {/* ── Tab: Exercícios ──────────────────────────────────────────── */}
          {activeTab === 'exercicios' && (
            <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/60">
                <p className="font-semibold text-white text-sm">Lista de exercícios</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {workout.exercises.length} exercício{workout.exercises.length !== 1 ? 's' : ''} neste treino
                </p>
              </div>
              {workout.exercises.length === 0 ? (
                <div className="py-16 text-center">
                  <Dumbbell size={32} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-500">Nenhum exercício adicionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/60">
                        <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 uppercase tracking-wide">#</th>
                        <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 uppercase tracking-wide">Exercício</th>
                        <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 uppercase tracking-wide">Séries</th>
                        <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 uppercase tracking-wide">Reps</th>
                        <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 uppercase tracking-wide">Carga</th>
                        <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 uppercase tracking-wide">Descanso</th>
                        <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 uppercase tracking-wide">Vídeo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                      {workout.exercises.map((ex, i) => {
                        const exData = exercises.find((e) => e.id === ex.exerciseId);
                        const videoUrl = ex.videoUrl ?? exData?.videoUrl;
                        return (
                          <tr key={ex.id} className="hover:bg-slate-700/20 transition-colors">
                            <td className="px-5 py-3.5 text-slate-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                {ex.imageUrl ? (
                                  <img
                                    src={ex.imageUrl}
                                    alt={ex.exerciseName}
                                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                                    <Dumbbell size={14} className="text-slate-500" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-white">{ex.exerciseName}</p>
                                  <p className="text-xs text-slate-400">{exData?.muscleGroup ?? '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-200">{ex.sets}</td>
                            <td className="px-4 py-3.5 text-slate-200">{ex.reps}</td>
                            <td className="px-4 py-3.5 text-slate-400">{ex.weight ?? '—'}</td>
                            <td className="px-4 py-3.5 text-slate-200">{ex.restSeconds}s</td>
                            <td className="px-4 py-3.5">
                              {videoUrl ? (
                                <button
                                  onClick={() => setVideoOpen(videoUrl)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                  title="Ver vídeo"
                                >
                                  <Video size={14} />
                                </button>
                              ) : (
                                <span className="text-slate-600 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Observações ─────────────────────────────────────────── */}
          {activeTab === 'observacoes' && (
            <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6">
              <p className="font-semibold text-white mb-3">Observações</p>
              {workout.description ? (
                <p className="text-sm text-slate-300 leading-relaxed">{workout.description}</p>
              ) : (
                <p className="text-sm text-slate-500">Nenhuma observação registrada para este treino.</p>
              )}
            </div>
          )}

        </div>
      </div>

      {videoOpen && <VideoModal url={videoOpen} onClose={() => setVideoOpen('')} />}
    </>
  );
}
