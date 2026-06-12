import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents } from '../../hooks/useStudents';
import { useAssignments, usePersonalWorkoutLogs } from '../../hooks/useWorkouts';
import {
  useMessages,
  useConversation,
  useSendMessage,
  useMarkConversationRead,
} from '../../hooks/useMessages';
import { Send, Search, Clock, MoreHorizontal, Paperclip, Dumbbell, Target } from 'lucide-react';
import type { User } from '../../types';

// â”€â”€ Static mock data per student â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const WEIGHT_GOALS: Record<string, { from: number; to: number; current: number }> = {
  'aluno-1': { from: 68, to: 62, current: 64.8 },
  'aluno-2': { from: 90, to: 80, current: 83 },
  'aluno-3': { from: 62, to: 56, current: 57.5 },
};

const SINCE_DATES: Record<string, string> = {
  'aluno-1': 'mar/2024',
  'aluno-2': 'jan/2024',
  'aluno-3': 'jun/2024',
};

const MOCK_FREQUENCY: Record<string, number> = {
  'aluno-1': 82,
  'aluno-2': 71,
  'aluno-3': 90,
};

const AVATAR_COLORS: Record<string, string> = {
  'aluno-1': 'bg-violet-500',
  'aluno-2': 'bg-emerald-500',
  'aluno-3': 'bg-amber-500',
  'personal-1': 'bg-indigo-500',
};

const MUSCLE_BADGE_COLORS: Record<string, string> = {
  Peito: 'bg-blue-500/20 text-blue-400',
  Costas: 'bg-cyan-500/20 text-cyan-400',
  Pernas: 'bg-violet-500/20 text-violet-400',
  Ombros: 'bg-amber-500/20 text-amber-400',
  'Glúteos': 'bg-pink-500/20 text-pink-400',
  'Bíceps': 'bg-rose-500/20 text-rose-400',
  'Tríceps': 'bg-orange-500/20 text-orange-400',
  'Abdômen': 'bg-green-500/20 text-green-400',
};

const QUICK_REPLIES = [
  'Vou adaptar o treino',
  'Tudo bem, descanse hoje',
  'Qual equipamento tem em casa?',
];

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getAvatarColor(id: string) {
  return AVATAR_COLORS[id] ?? 'bg-indigo-500';
}

function formatContactTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatChatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function getDayLabel(dateStr: string) {
  const today = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  if (isSameDay(dateStr, today)) return 'Hoje';
  if (isSameDay(dateStr, yesterday)) return 'Ontem';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

function parseWorkoutLabel(name: string) {
  const match = name.match(/^(Treino [A-Z])\s*[-â€“]\s*(.+)/);
  if (match) {
    return { label: match[1], muscle: match[2].split(/\s+e\s+/)[0] };
  }
  return { label: name, muscle: '' };
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PersonalChatPage() {
  const { user } = useAuth();
  const { data: studentsRaw = [] } = useStudents();
  const { data: assignments = [] } = useAssignments();
  const { data: allLogs = [] } = usePersonalWorkoutLogs();
  const { data: allMessages = [] } = useMessages();
  const sendMessageMutation = useSendMessage();

  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Map students to User shape
  const students: User[] = studentsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email ?? '',
    role: 'aluno' as const,
    rolePrefix: 'ALN' as const,
    avatarUrl: s.avatarUrl,
  }));

  const filteredStudents = useMemo(
    () => students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [students, search],
  );

  const conversation = useConversation(selectedStudent?.id ?? null);
  const markReadMutation = useMarkConversationRead(selectedStudent?.id ?? '');

  // Per-student last message and unread derived from shared cache
  const lastMessageByStudent = useMemo(() => {
    const map: Record<string, typeof allMessages[number]> = {};
    for (const m of allMessages) {
      const otherId = m.fromId === user?.id ? m.toId : m.fromId;
      if (!map[otherId] || m.sentAt > map[otherId].sentAt) map[otherId] = m;
    }
    return map;
  }, [allMessages, user?.id]);

  const unreadByStudent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of allMessages) {
      if (m.toId === user?.id && !m.read) map[m.fromId] = (map[m.fromId] ?? 0) + 1;
    }
    return map;
  }, [allMessages, user?.id]);



  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: typeof conversation }[] = [];
    for (const msg of conversation) {
      const d = new Date(msg.sentAt).toDateString();
      const last = groups[groups.length - 1];
      if (!last || last.date !== d) groups.push({ date: d, msgs: [msg] });
      else last.msgs.push(msg);
    }
    return groups;
  }, [conversation]);

  // Student info panel data
  const studentAssignments = selectedStudent
    ? assignments.filter((a) => a.studentId === selectedStudent.id)
    : [];

  const studentLogs = selectedStudent
    ? allLogs.filter((l) => l.studentId === selectedStudent.id)
    : [];

  const logsThisMonth = studentLogs.filter((l) => {
    const d = new Date(l.completedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const frequencyPct = selectedStudent ? (MOCK_FREQUENCY[selectedStudent.id] ?? 75) : 0;
  const frequencyLabel = frequencyPct >= 85 ? 'excelente' : frequencyPct >= 70 ? 'boa regularidade' : 'pode melhorar';

  const weightGoal = selectedStudent ? WEIGHT_GOALS[selectedStudent.id] : null;
  const weightProgress = weightGoal
    ? Math.round(((weightGoal.from - weightGoal.current) / (weightGoal.from - weightGoal.to)) * 100)
    : 0;

  const weekDayMap: Record<string, number> = {
    domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
  };
  const todayDow = new Date().getDay();
  const nextAssignment =
    studentAssignments.find((a) => a.scheduledDays?.some((d) => (weekDayMap[d] ?? -1) > todayDow)) ??
    studentAssignments[0];

  const genderLabel = selectedStudent?.name.split(' ')[0].endsWith('a') ? 'ALUNA' : 'ALUNO';

  useEffect(() => {
    if (selectedStudent) markReadMutation.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?.id, conversation.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length]);

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || !user || !selectedStudent) return;
    sendMessageMutation.mutate({ toId: selectedStudent.id, content: text.trim() });
    setText('');
  }

  function handleQuickReply(reply: string) {
    if (!user || !selectedStudent) return;
    sendMessageMutation.mutate({ toId: selectedStudent.id, content: reply });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden bg-slate-950 text-slate-100">

      {/* â”€â”€ Left: Contacts list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="w-72 shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 shrink-0">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Mensagens</p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno..."
              className="w-full bg-[#0D1025] text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent focus:border-indigo-500/50"
            />
          </div>
        </div>

        {/* Contact rows */}
        <div className="flex-1 overflow-y-auto">
          {filteredStudents.map((s) => {
            const lastMsg = lastMessageByStudent[s.id] ?? null;
            const unread = unreadByStudent[s.id] ?? 0;
            const isSelected = selectedStudent?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                  isSelected
                    ? 'bg-indigo-600/20 border-r-2 border-indigo-500'
                    : 'hover:bg-[#0D1025]/60 border-r-2 border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(s.id)}`}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-300' : 'text-slate-100'}`}>
                      {s.name}
                    </span>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-500 shrink-0">{formatContactTime(lastMsg.sentAt)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-xs text-slate-500 truncate">
                      {lastMsg ? lastMsg.content : 'Nenhuma mensagem'}
                    </p>
                    {unread > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* â”€â”€ Center: Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {selectedStudent ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${getAvatarColor(selectedStudent.id)}`}>
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{selectedStudent.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-xs text-emerald-400">Online agora</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-[#0D1025] text-slate-500 hover:text-slate-200 transition-colors">
                  <Clock size={16} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#0D1025] text-slate-500 hover:text-slate-200 transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Next workout banner */}
            {nextAssignment && (
              <div className="mx-4 mt-3 mb-1 rounded-xl bg-indigo-950/60 border border-indigo-800/40 px-4 py-2.5 flex items-center gap-3 shrink-0">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center">
                  <Dumbbell size={14} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 mb-0.5">
                    Próximo treino de {selectedStudent.name.split(' ')[0]}:
                  </p>
                  <p className="text-xs font-semibold text-slate-200 truncate">{nextAssignment.workoutName}</p>
                </div>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/15 rounded-full px-2.5 py-1 shrink-0 font-medium">
                  amanhã
                </span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col">
              {conversation.length === 0 && (
                <p className="text-center text-slate-600 text-sm mt-12">Nenhuma mensagem ainda. Diga olá! ðŸ‘‹</p>
              )}
              {groupedMessages.map(({ date, msgs }) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-[#0D1025]" />
                    <span className="text-[10px] text-slate-600 shrink-0">{getDayLabel(msgs[0].sentAt)}</span>
                    <div className="flex-1 h-px bg-[#0D1025]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {msgs.map((msg) => {
                      const isMe = msg.fromId === user?.id;
                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && (
                            <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(selectedStudent.id)}`}>
                              {selectedStudent.name.charAt(0)}
                            </div>
                          )}
                          <div className={`max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isMe
                                  ? 'bg-indigo-600 text-white rounded-br-sm'
                                  : 'bg-[#0D1025] text-slate-200 rounded-bl-sm'
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-slate-600 mt-1 px-1">
                              {formatChatTime(msg.sentAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div className="flex gap-2 px-4 pb-2 flex-wrap shrink-0">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  className="text-xs bg-[#0D1025] hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-full px-3 py-1.5 transition-colors border border-white/[0.07]"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <form onSubmit={handleSend} className="flex items-center gap-2 px-4 pb-4 pt-1 shrink-0">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-[#0D1025] text-slate-600 hover:text-slate-400 transition-colors shrink-0"
              >
                <Paperclip size={18} />
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-[#0D1025] text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500 border border-white/[0.07]"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
              >
                <Send size={15} className="text-white" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-700">
            <div className="w-16 h-16 rounded-2xl bg-[#0D1025]/60 flex items-center justify-center">
              <Dumbbell size={28} className="text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">Selecione um aluno para conversar</p>
          </div>
        )}
      </div>

      {/* â”€â”€ Right: Student info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {selectedStudent && (
        <div className="w-64 shrink-0 flex flex-col bg-slate-900 border-l border-slate-800 overflow-y-auto">

          {/* Student header */}
          <div className="px-4 pt-5 pb-4 border-b border-slate-800">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">{genderLabel}</p>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(selectedStudent.id)}`}>
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">{selectedStudent.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-xs text-slate-500">desde {SINCE_DATES[selectedStudent.id] ?? 'â€”'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 p-4 border-b border-slate-800">
            <div className="bg-[#0D1025]/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1">Treinos</p>
              <p className="text-xl font-bold text-slate-100">{studentLogs.length || 47}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">+{logsThisMonth.length || 3} este mês</p>
            </div>
            <div className="bg-[#0D1025]/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1">Frequência</p>
              <p className="text-xl font-bold text-slate-100">{frequencyPct}%</p>
              <p className="text-[10px] text-indigo-400 mt-0.5">{frequencyLabel}</p>
            </div>
          </div>

          {/* Weight goal */}
          {weightGoal && (
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Target size={11} className="text-slate-500" />
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Meta de Peso</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Progresso</span>
                <span className="text-xs text-slate-500">
                  {weightGoal.from} â†’ {weightGoal.to} kg
                </span>
              </div>
              <div className="w-full bg-[#0D1025] rounded-full h-1.5 mb-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, weightProgress))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600">{weightProgress}% concluído</p>
            </div>
          )}

          {/* Active workouts */}
          {studentAssignments.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={11} className="text-slate-500" />
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Treinos Ativos</p>
              </div>
              <div className="flex flex-col gap-2">
                {studentAssignments.map((a) => {
                  const { label, muscle } = parseWorkoutLabel(a.workoutName);
                  const badgeColor = MUSCLE_BADGE_COLORS[muscle] ?? 'bg-slate-700/50 text-slate-500';
                  return (
                    <div key={a.id} className="flex items-center justify-between bg-[#0D1025]/50 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-300 font-medium">{label}</span>
                      {muscle && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                          {muscle}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

