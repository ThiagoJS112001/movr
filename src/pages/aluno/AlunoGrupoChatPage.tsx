import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image, Users, Tag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AlunoGrupoChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const studentGroups: never[] = [];
  const students: never[] = [];
  function getGroupMessages(_groupId: string) { return []; }
  function sendGroupMessage(_data: unknown) { return; }
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const group = studentGroups.find((g) => g.id === id);
  const messages = id ? getGroupMessages(id) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!group || !user) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-slate-500 dark:text-slate-400">Grupo não encontrado.</p>
        <button
          onClick={() => navigate('/aluno/grupos')}
          className="mt-3 text-emerald-600 dark:text-emerald-400 text-sm hover:underline"
        >
          ← Voltar para grupos
        </button>
      </div>
    );
  }

  if (!group.memberIds.includes(user.id)) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-slate-500 dark:text-slate-400">Você não é membro deste grupo.</p>
        <button
          onClick={() => navigate('/aluno/grupos')}
          className="mt-3 text-emerald-600 dark:text-emerald-400 text-sm hover:underline"
        >
          ← Voltar para grupos
        </button>
      </div>
    );
  }

  const memberNames = group.memberIds
    .map((mid) => students.find((s) => s.id === mid)?.name ?? 'Aluno')
    .join(', ');

  function handleSend() {
    if (!text.trim() || !user) return;
    sendGroupMessage({
      groupId: group!.id,
      fromId: user.id,
      fromName: user.name,
      content: text.trim(),
      type: 'text',
    });
    setText('');
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      sendGroupMessage({
        groupId: group!.id,
        fromId: user.id,
        fromName: user.name,
        content: '📷 Foto',
        type: 'image',
        imageUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  // Group messages by date
  const grouped: { date: string; messages: typeof messages }[] = [];
  for (const msg of messages) {
    const dateKey = formatDate(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateKey) {
      last.messages.push(msg);
    } else {
      grouped.push({ date: dateKey, messages: [msg] });
    }
  }

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-0px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate('/aluno/grupos')}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold dark:text-white truncate">{group.name}</p>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Users size={11} />
            <span className="truncate">{group.memberIds.length} membros · {memberNames}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <Users size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Nenhuma mensagem ainda. Diga olá para o grupo! 👋
            </p>
          </div>
        )}

        {grouped.map(({ date, messages: dayMsgs }) => (
          <div key={date}>
            <div className="flex justify-center mb-3">
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
            <div className="space-y-3">
              {dayMsgs.map((msg) => {
                const isMe = msg.fromId === user.id;
                const isOffer = msg.type === 'offer';

                if (isOffer) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/50 rounded-2xl p-4 max-w-sm w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag size={14} className="text-violet-500" />
                          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                            Oferta de {msg.offerGymName}
                          </span>
                        </div>
                        <p className="text-sm dark:text-white">{msg.content}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{formatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isMe && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{msg.fromName}</span>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-tr-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-tl-sm'
                        }`}
                      >
                        {msg.type === 'image' && msg.imageUrl ? (
                          <img
                            src={msg.imageUrl}
                            alt="Foto"
                            className="max-w-full rounded-xl max-h-60 object-cover"
                          />
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                      <span className={`text-xs text-slate-400 dark:text-slate-500 ${isMe ? 'mr-1' : 'ml-1'}`}>
                        {formatTime(msg.createdAt)}
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

      {/* Input bar */}
      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/60 flex-shrink-0">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
          title="Enviar foto"
        >
          <Image size={20} />
        </button>
        <input
          className="flex-1 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          placeholder="Digite uma mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
