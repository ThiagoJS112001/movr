import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMyGroups, useGroupMessages, useSendGroupMessage } from '../../hooks/useGroups';

export default function AlunoGrupoChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: groups = [], isLoading: groupsLoading } = useMyGroups();
  const { data: messages = [], isLoading: msgsLoading } = useGroupMessages(id ?? null);
  const send = useSendGroupMessage(id ?? '');

  const group = groups.find((g) => g.id === id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !id || send.isPending) return;
    send.mutate(trimmed);
    setText('');
    inputRef.current?.focus();
  }

  if (!groupsLoading && !group) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center pt-16">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#0D1025] flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-slate-400" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Grupo nÃ£o encontrado.</p>
        <button
          onClick={() => navigate('/aluno/grupos')}
          className="mt-4 flex items-center gap-2 text-[#7c5cfc] text-sm font-medium mx-auto"
        >
          <ArrowLeft size={14} /> Voltar para grupos
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] bg-[#080B18]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0">
        <button
          onClick={() => navigate('/aluno/grupos')}
          className="text-slate-400 hover:text-white transition p-1"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#7c5cfc]/20 border border-[#7c5cfc]/30 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-[#7c5cfc]">
            {group?.name[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{group?.name ?? 'â€¦'}</p>
          {group?.description && (
            <p className="text-xs text-slate-500 truncate">{group.description}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {msgsLoading && (
          <div className="space-y-3 pt-4">
            {[120, 200, 160, 90].map((w, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div
                  className="h-9 rounded-2xl bg-white/[0.06] animate-pulse"
                  style={{ width: w }}
                />
              </div>
            ))}
          </div>
        )}

        {!msgsLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-12 h-12 rounded-full bg-[#7c5cfc]/10 flex items-center justify-center mb-3">
              <Users size={20} className="text-[#7c5cfc]" />
            </div>
            <p className="text-slate-400 text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-slate-600 text-xs mt-1">Seja o primeiro a falar!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.from_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col gap-0.5 max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <p className="text-[11px] text-[#7c5cfc] font-medium px-1">{msg.from_name}</p>
                )}
                <div
                  className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isMe
                      ? 'bg-[#7c5cfc] text-white rounded-br-sm'
                      : 'bg-white/[0.08] text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <p className="text-[10px] text-slate-600 px-1">
                  {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.07] shrink-0">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Mensagem..."
          className="flex-1 bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5cfc] transition"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || send.isPending}
          className="w-10 h-10 bg-[#7c5cfc] hover:bg-[#9b7fff] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
          aria-label="Enviar"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
