import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send } from 'lucide-react';
import type { User } from '../../types';
import { MOCK_USERS } from '../../data/mockData';

export default function PersonalChatPage() {
  const { user } = useAuth();
  const { getConversation, sendMessage, markMessagesRead, messages } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const students = MOCK_USERS.filter((u) => u.role === 'aluno');

  function hasUnread(studentId: string) {
    return messages.some(
      (m) => m.fromId === studentId && m.toId === user?.id && !m.read
    );
  }

  const conversation = selectedStudent && user
    ? getConversation(user.id, selectedStudent.id)
    : [];

  useEffect(() => {
    if (selectedStudent && user) {
      markMessagesRead(selectedStudent.id, user.id);
    }
  }, [selectedStudent, conversation.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user || !selectedStudent) return;
    sendMessage({
      fromId: user.id,
      fromName: user.name,
      toId: selectedStudent.id,
      content: text.trim(),
    });
    setText('');
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen bg-white dark:bg-slate-900">
      {/* Contacts sidebar */}
      <div className="w-16 md:w-64 border-r border-slate-200 dark:border-slate-700 flex flex-col py-4 shrink-0">
        <p className="hidden md:block px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-3">
          Alunos
        </p>
        {students.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStudent(s)}
            className={`flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
              selectedStudent?.id === s.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
            }`}
          >
            <div className="relative w-9 h-9 shrink-0">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                {s.name.charAt(0)}
              </div>
              {hasUnread(s.id) && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-indigo-400 dark:bg-indigo-400 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
              {s.name}
            </span>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedStudent ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{selectedStudent.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {conversation.length === 0 && (
                <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-8">
                  Nenhuma mensagem ainda. Diga olá!
                </p>
              )}
              {conversation.map((msg) => {
                const isMe = msg.fromId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(msg.sentAt).toLocaleTimeString('pt-BR', {
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

            <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
            Selecione um aluno para conversar
          </div>
        )}
      </div>
    </div>
  );
}
