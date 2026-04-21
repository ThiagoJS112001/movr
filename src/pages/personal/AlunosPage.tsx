import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ClipboardList, Salad, ShieldOff, ShieldCheck } from 'lucide-react';
import type { WorkoutAssignment, DietAssignment } from '../../types';

export default function AlunosPage() {
  const { user } = useAuth();
  const {
    students, assignments, workouts, assignWorkout, removeAssignment,
    diets, dietAssignments, assignDiet, removeDietAssignment,
    isStudentBlocked, blockStudent, unblockStudent,
  } = useApp();
  const navigate = useNavigate();

  // Workout assign modal
  const [assignModal, setAssignModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('');
  const [scheduledDays, setScheduledDays] = useState<string[]>([]);

  // Diet assign modal
  const [dietModal, setDietModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [selectedDietId, setSelectedDietId] = useState('');

  // Block confirm modal
  const [confirmBlock, setConfirmBlock] = useState<{ id: string; name: string } | null>(null);

  const myWorkouts = workouts.filter((w) => w.personalId === user?.id);
  const myDiets = diets.filter((d) => d.personalId === user?.id);

  const DAYS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

  function toggleDay(day: string) {
    setScheduledDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleAssignWorkout() {
    if (!selectedWorkoutId || !assignModal || !user) return;
    const workout = myWorkouts.find((w) => w.id === selectedWorkoutId);
    if (!workout) return;
    assignWorkout({
      workoutId: selectedWorkoutId,
      workoutName: workout.name,
      studentId: assignModal.studentId,
      personalId: user.id,
      scheduledDays,
    });
    setAssignModal(null);
    setSelectedWorkoutId('');
    setScheduledDays([]);
  }

  function handleAssignDiet() {
    if (!selectedDietId || !dietModal || !user) return;
    const diet = myDiets.find((d) => d.id === selectedDietId);
    if (!diet) return;
    assignDiet({
      dietId: selectedDietId,
      dietName: diet.name,
      studentId: dietModal.studentId,
      personalId: user.id,
    });
    setDietModal(null);
    setSelectedDietId('');
  }

  function getStudentAssignments(studentId: string): WorkoutAssignment[] {
    return assignments.filter((a) => a.studentId === studentId && a.personalId === user?.id);
  }

  function getStudentDietAssignments(studentId: string): DietAssignment[] {
    return dietAssignments.filter((a) => a.studentId === studentId && a.personalId === user?.id);
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Alunos</h1>
      </div>

      <div className="grid gap-4">
        {students.map((student) => {
          const studentAssignments = getStudentAssignments(student.id);
          const studentDietAssignments = getStudentDietAssignments(student.id);
          const blocked = isStudentBlocked(student.id);
          return (
            <div key={student.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 ${blocked ? 'border border-red-300 dark:border-red-700' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    blocked ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                  }`}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{student.name}</p>
                      {blocked && (
                        <span className="text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full">
                          Bloqueado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => blocked ? unblockStudent(student.id) : setConfirmBlock({ id: student.id, name: student.name })}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      blocked
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                        : 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                    }`}
                  >
                    {blocked ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                    {blocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                  <button
                    onClick={() => navigate('/personal/chat')}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Chat
                  </button>
                </div>
              </div>

              {/* Assigned workouts */}
              {studentAssignments.length > 0 && (
                <div className="mb-2 flex flex-col gap-1.5">
                  {studentAssignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <Dumbbell size={13} className="text-indigo-500" />
                        <span>{a.workoutName}</span>
                        {a.scheduledDays && a.scheduledDays.length > 0 && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">({a.scheduledDays.join(', ')})</span>
                        )}
                      </div>
                      <button onClick={() => removeAssignment(a.id)} className="text-xs text-red-400 hover:text-red-600">
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Assigned diets */}
              {studentDietAssignments.length > 0 && (
                <div className="mb-2 flex flex-col gap-1.5">
                  {studentDietAssignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <Salad size={13} className="text-emerald-500" />
                        <span>{a.dietName}</span>
                      </div>
                      <button onClick={() => removeDietAssignment(a.id)} className="text-xs text-red-400 hover:text-red-600">
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-2">
                <button
                  onClick={() => setAssignModal({ studentId: student.id, studentName: student.name })}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <ClipboardList size={15} />
                  Atribuir treino
                </button>
                <button
                  onClick={() => setDietModal({ studentId: student.id, studentName: student.name })}
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  <Salad size={15} />
                  Atribuir dieta
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Workout Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Atribuir treino</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Para: <strong>{assignModal.studentName}</strong></p>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Treino</label>
            <select
              value={selectedWorkoutId}
              onChange={(e) => setSelectedWorkoutId(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione um treino</option>
              {myWorkouts.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dias da semana</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    scheduledDays.includes(day)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAssignModal(null)} className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
                Cancelar
              </button>
              <button
                onClick={handleAssignWorkout}
                disabled={!selectedWorkoutId}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700"
              >
                Atribuir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Diet Modal */}
      {dietModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Atribuir dieta</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Para: <strong>{dietModal.studentName}</strong></p>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dieta</label>
            <select
              value={selectedDietId}
              onChange={(e) => setSelectedDietId(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Selecione uma dieta</option>
              {myDiets.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button onClick={() => setDietModal(null)} className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
                Cancelar
              </button>
              <button
                onClick={handleAssignDiet}
                disabled={!selectedDietId}
                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50 hover:bg-emerald-700"
              >
                Atribuir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Block Modal */}
      {confirmBlock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <ShieldOff size={20} className="text-red-500" />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Bloquear aluno</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Tem certeza que deseja bloquear <strong className="text-slate-700 dark:text-slate-200">{confirmBlock.name}</strong>?
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              O aluno perderá o acesso ao app até ser desbloqueado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBlock(null)}
                className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => { blockStudent(confirmBlock.id); setConfirmBlock(null); }}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-600"
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
