import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send } from 'lucide-react';
import { MOCK_USERS } from '../../data/mockData';

export default function AlunoChatPage() {
  const { user } = useAuth();
  const { getConversation, sendMessage, markMessagesRead } = useApp();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Aluno only chats with their personal
  const personal = MOCK_USERS.find((u) => u.role === 'personal');
  const conversation = personal && user ? getConversation(user.id, personal.id) : [];

  // Capture the first unread message index once on mount, before mark-as-read runs
  const firstUnreadIdxRef = useRef<number>(-2);
  if (firstUnreadIdxRef.current === -2 && personal && user) {
    firstUnreadIdxRef.current = conversation.findIndex(
      (m) => m.fromId === personal.id && !m.read
    );
  }
  const firstUnreadIdx = firstUnreadIdxRef.current;

  useEffect(() => {
    if (personal && user) {
      markMessagesRead(personal.id, user.id);
    }
  }, [conversation.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user || !personal) return;
    sendMessage({
      fromId: user.id,
      fromName: user.name,
      toId: personal.id,
      content: text.trim(),
    });
    setText('');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
          {personal?.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{personal?.name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Seu personal trainer</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {conversation.length === 0 && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-8">
            Nenhuma mensagem ainda. Diga olá!
          </p>
        )}
        {conversation.map((msg, idx) => {
          const isMe = msg.fromId === user?.id;
          const showDivider = idx === firstUnreadIdx && firstUnreadIdx > 0;
          return (
            <div key={msg.id}>
              {showDivider && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-emerald-200 dark:bg-emerald-800/60" />
                  <span className="text-xs text-emerald-500 dark:text-emerald-500 font-medium px-1">
                    novas mensagens
                  </span>
                  <div className="flex-1 h-px bg-emerald-200 dark:bg-emerald-800/60" />
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {new Date(msg.sentAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
