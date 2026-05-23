import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Send, Users, User, ChevronLeft, X, Check, Search, Phone, MoreVertical, Smile, Paperclip, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  useMyPersonalId,
  useProfile,
  useConversation,
  useSendMessage,
  useMarkConversationRead,
  useUnreadCount,
  useMessages,
} from '../../hooks/useMessages';
import { useMyFriends, type FriendProfile } from '../../hooks/useFriends';
import { useMyGroups, useGroupMessages, useSendGroupMessage, useCreateGroup } from '../../hooks/useGroups';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ConvoType = 'personal' | 'academia' | 'friend' | 'group';
type FilterTab = 'all' | 'unread' | 'favorites';

interface ActiveConvo {
  type: ConvoType;
  id: string;
  name: string;
  label?: string;
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AVATAR_PALETTE = [
  'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-sky-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatConvoTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'][date.getDay()];
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function getDayLabel(dateStr: string): string {
  const today = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  if (isSameDay(dateStr, today)) {
    return 'Hoje, ' + new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  }
  if (isSameDay(dateStr, yesterday)) return 'Ontem';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

// â”€â”€ Sidebar conversation item (WhatsApp-style) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ConvoListItemProps {
  active: boolean;
  onClick: () => void;
  name: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  isGroup?: boolean;
  avatarColor?: string;
}

function ConvoListItem({ active, onClick, name, lastMessage, time, unread, isGroup, avatarColor }: ConvoListItemProps) {
  const color = avatarColor ?? getAvatarColor(name);
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group ${
        active ? 'bg-[#7c5cfc]/20 border border-[#7c5cfc]/40' : 'hover:bg-white/[0.05] border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}>
          {isGroup ? <Users size={18} className="text-white" /> : getInitials(name)}
        </div>
        {!isGroup && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#131722]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-slate-100'}`}>{name}</p>
          {time && <span className={`text-[11px] shrink-0 ${unread ? 'text-[#7c5cfc] font-medium' : 'text-slate-500'}`}>{time}</span>}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${unread ? 'text-slate-300' : 'text-slate-500'}`}>
            {lastMessage ?? 'Iniciar conversa...'}
          </p>
          {!!unread && unread > 0 && (
            <span className="shrink-0 min-w-[20px] h-5 rounded-full bg-[#7c5cfc] text-white text-[10px] font-bold flex items-center justify-center px-1.5">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// â”€â”€ Personal convo sidebar item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PersonalSidebarItem({ personalId, active, onClick }: { personalId: string; active: boolean; onClick: () => void }) {
  const { data: profile } = useProfile(personalId);
  const unread = useUnreadCount(personalId);
  const { data: allMessages = [] } = useMessages();
  const { user } = useAuth();

  const lastMsg = useMemo(() => {
    const msgs = allMessages.filter(
      (m) => (m.fromId === personalId || m.toId === personalId) && (m.fromId === user?.id || m.toId === user?.id),
    );
    return msgs[msgs.length - 1] ?? null;
  }, [allMessages, personalId, user?.id]);

  const name = profile?.name ?? 'Personal Trainer';
  return (
    <ConvoListItem
      active={active}
      onClick={onClick}
      name={name}
      lastMessage={lastMsg?.content}
      time={lastMsg ? formatConvoTime(lastMsg.sentAt) : undefined}
      unread={unread}
      avatarColor="bg-emerald-500"
    />
  );
}

// â”€â”€ Friend convo sidebar item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FriendSidebarItem({ friend, active, onClick }: { friend: FriendProfile; active: boolean; onClick: () => void }) {
  const unread = useUnreadCount(friend.id);
  const { data: allMessages = [] } = useMessages();
  const { user } = useAuth();

  const lastMsg = useMemo(() => {
    const msgs = allMessages.filter(
      (m) => (m.fromId === friend.id && m.toId === user?.id) || (m.fromId === user?.id && m.toId === friend.id),
    );
    return msgs[msgs.length - 1] ?? null;
  }, [allMessages, friend.id, user?.id]);

  return (
    <ConvoListItem
      active={active}
      onClick={onClick}
      name={friend.name}
      lastMessage={lastMsg?.content}
      time={lastMsg ? formatConvoTime(lastMsg.sentAt) : undefined}
      unread={unread}
    />
  );
}

// â”€â”€ Direct message chat view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DirectChat({ otherId }: { otherId: string }) {
  const { user } = useAuth();
  const conversation = useConversation(otherId);
  const sendMsg = useSendMessage();
  const markRead = useMarkConversationRead(otherId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { markRead.mutate(); }, [otherId, conversation.length]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    sendMsg.mutate({ toId: otherId, content: text.trim() });
    setText('');
  }

  // Group messages by day
  const grouped = useMemo(() => {
    const groups: { date: string; msgs: typeof conversation }[] = [];
    for (const msg of conversation) {
      const d = new Date(msg.sentAt).toDateString();
      const last = groups[groups.length - 1];
      if (!last || last.date !== d) groups.push({ date: d, msgs: [msg] });
      else last.msgs.push(msg);
    }
    return groups;
  }, [conversation]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {conversation.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Nenhuma mensagem ainda. Diga olÃ¡! ðŸ‘‹
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-slate-500 bg-[#131722] px-2 shrink-0">
                {getDayLabel(msgs[0].sentAt)}
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="flex flex-col gap-1.5">
              {msgs.map((msg) => {
                const mine = msg.fromId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[68%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        mine
                          ? 'bg-[#7c5cfc] text-white rounded-br-sm'
                          : 'bg-[#1e2433] text-slate-200 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${mine ? 'text-[#c4b5fd]' : 'text-slate-600'}`}>
                        <span className="text-[10px]">
                          {new Date(msg.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {mine && (
                          msg.read
                            ? <span className="text-[11px] text-[#c4b5fd]">âœ“âœ“</span>
                            : <span className="text-[11px] opacity-60">âœ“</span>
                        )}
                      </div>
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
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]">
        <button
          type="button"
          className="p-2 rounded-full hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition shrink-0"
        >
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-[#1e2433] border border-white/[0.08] text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]/40 transition"
        />
        <button
          type="button"
          className="p-2 rounded-full hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition shrink-0"
        >
          <Smile size={18} />
        </button>
        <button
          type="submit"
          disabled={!text.trim() || sendMsg.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c5cfc] hover:bg-[#9b7fff] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition shrink-0"
        >
          <Send size={14} />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
}

// â”€â”€ Group chat view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function GroupChat({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const { data: messages = [] } = useGroupMessages(groupId);
  const sendMsg = useSendGroupMessage(groupId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMsg.mutate(text.trim());
    setText('');
  }

  const grouped = useMemo(() => {
    const groups: { date: string; msgs: typeof messages }[] = [];
    for (const msg of messages) {
      const d = new Date(msg.created_at).toDateString();
      const last = groups[groups.length - 1];
      if (!last || last.date !== d) groups.push({ date: d, msgs: [msg] });
      else last.msgs.push(msg);
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Nenhuma mensagem ainda neste grupo.
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-slate-500 bg-[#131722] px-2 shrink-0">
                {getDayLabel(msgs[0].created_at)}
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="flex flex-col gap-1.5">
              {msgs.map((msg) => {
                const mine = msg.from_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[68%]">
                      {!mine && (
                        <p className="text-[10px] text-[#7c5cfc] mb-1 ml-1 font-medium">{msg.from_name}</p>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          mine
                            ? 'bg-[#7c5cfc] text-white rounded-br-sm'
                            : 'bg-[#1e2433] text-slate-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                        <div className={`text-[10px] mt-1 text-right ${mine ? 'text-[#c4b5fd]' : 'text-slate-600'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]">
        <button type="button" className="p-2 rounded-full hover:bg-white/[0.06] text-slate-400 transition shrink-0">
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mensagem no grupo..."
          className="flex-1 bg-[#1e2433] border border-white/[0.08] text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]/40 transition"
        />
        <button type="button" className="p-2 rounded-full hover:bg-white/[0.06] text-slate-400 transition shrink-0">
          <Smile size={18} />
        </button>
        <button
          type="submit"
          disabled={!text.trim() || sendMsg.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c5cfc] hover:bg-[#9b7fff] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition shrink-0"
        >
          <Send size={14} />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
}

// â”€â”€ Create Group Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CreateGroupModal({ friends, onClose }: { friends: FriendProfile[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const createGroup = useCreateGroup();

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createGroup.mutateAsync({ name: name.trim(), memberIds: selected });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-[#131722] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Novo Grupo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X size={18} /></button>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do grupo"
            required
            className="w-full bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5cfc] transition"
          />
          <div>
            <p className="text-xs text-slate-400 mb-2">Adicionar amigos ao grupo</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {friends.length === 0 && (
                <p className="text-xs text-slate-500">VocÃª ainda nÃ£o tem amigos adicionados.</p>
              )}
              {friends.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition ${
                    selected.includes(f.id)
                      ? 'border-[#7c5cfc] bg-[#7c5cfc]/10'
                      : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(f.name)} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                    {getInitials(f.name)}
                  </div>
                  <span className="text-sm text-white flex-1 text-left">{f.name}</span>
                  {selected.includes(f.id) && <Check size={14} className="text-[#7c5cfc]" />}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!name.trim() || createGroup.isPending}
            className="w-full py-2.5 bg-[#7c5cfc] hover:bg-[#9b7fff] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
          >
            {createGroup.isPending ? 'Criando...' : 'Criar Grupo'}
          </button>
        </form>
      </div>
    </div>
  );
}

// â”€â”€ Main Chat Hub â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AlunoChatPage() {
  const { data: personalId } = useMyPersonalId();
  const { data: friends = [] } = useMyFriends();
  const { data: groups = [] } = useMyGroups();
  const { data: personalProfile } = useProfile(personalId ?? '');

  const [active, setActive] = useState<ActiveConvo | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const { data: allMessages = [] } = useMessages();
  const { user } = useAuth();

  function selectConvo(convo: ActiveConvo) {
    setActive(convo);
    setSidebarOpen(false);
  }

  const showSidebar = sidebarOpen || !active;

  // Unread counts per contact
  const unreadByContact = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of allMessages) {
      if (m.toId === user?.id && !m.read) map[m.fromId] = (map[m.fromId] ?? 0) + 1;
    }
    return map;
  }, [allMessages, user?.id]);

  // Build unified conversation list for filtering/search
  const allConvos: { id: string; name: string; type: ConvoType; label?: string }[] = useMemo(() => {
    const list: { id: string; name: string; type: ConvoType; label?: string }[] = [];
    if (personalId) list.push({ id: personalId, name: personalProfile?.name ?? 'Personal Trainer', type: 'personal', label: 'Seu personal' });
    for (const f of friends) list.push({ id: f.id, name: f.name, type: 'friend', label: f.role });
    for (const g of groups) list.push({ id: g.id, name: g.name, type: 'group', label: 'Grupo' });
    return list;
  }, [personalId, personalProfile, friends, groups]);

  const filteredConvos = useMemo(() => {
    let list = allConvos;
    if (search.trim()) list = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    if (tab === 'unread') list = list.filter((c) => (unreadByContact[c.id] ?? 0) > 0);
    return list;
  }, [allConvos, search, tab, unreadByContact]);

  const totalUnread = useMemo(() => Object.values(unreadByContact).reduce((a, b) => a + b, 0), [unreadByContact]);

  return (
    <div className="bg-[#080B18] text-white flex flex-col h-[calc(100dvh-4rem)] md:h-screen overflow-hidden">
      {showCreateGroup && (
        <CreateGroupModal friends={friends} onClose={() => setShowCreateGroup(false)} />
      )}

      {/* -- Chat card fills full height -- */}
      <div className="flex-1 bg-[#131722] overflow-hidden flex min-h-0">

          {/* â”€â”€ Left sidebar (Conversas) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div
            className={`${showSidebar ? 'flex' : 'hidden md:flex'} w-full md:w-[280px] flex-col border-r border-white/[0.06] shrink-0 bg-[#131722]`}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
              <h2 className="text-base font-bold text-white">Conversas</h2>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition"
                title="Nova conversa"
              >
                <Edit size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pt-3 pb-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar conversas..."
                  className="w-full bg-[#1e2433] border border-white/[0.06] text-slate-200 placeholder:text-slate-600 text-sm rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/40 transition"
                />
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 px-3 pb-2">
              {(['all', 'unread', 'favorites'] as FilterTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                    tab === t
                      ? 'bg-[#7c5cfc] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {t === 'all' ? 'Todas' : t === 'unread' ? 'NÃ£o lidas' : 'Favoritas'}
                  {t === 'unread' && totalUnread > 0 && tab !== 'unread' && (
                    <span className="ml-1 text-[10px] text-[#7c5cfc]">({totalUnread})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              {filteredConvos.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <p className="text-sm text-slate-500">Nenhuma conversa encontrada.</p>
                </div>
              )}

              {filteredConvos.map((convo) => {
                if (convo.type === 'personal' && personalId) {
                  return (
                    <PersonalSidebarItem
                      key={convo.id}
                      personalId={personalId}
                      active={active?.id === personalId}
                      onClick={() => selectConvo({ type: 'personal', id: personalId, name: convo.name, label: 'Seu personal' })}
                    />
                  );
                }
                if (convo.type === 'friend') {
                  const friend = friends.find((f) => f.id === convo.id);
                  if (!friend) return null;
                  return (
                    <FriendSidebarItem
                      key={convo.id}
                      friend={friend}
                      active={active?.id === convo.id}
                      onClick={() => selectConvo({ type: 'friend', id: convo.id, name: convo.name, label: convo.label })}
                    />
                  );
                }
                if (convo.type === 'group') {
                  return (
                    <ConvoListItem
                      key={convo.id}
                      active={active?.id === convo.id}
                      onClick={() => selectConvo({ type: 'group', id: convo.id, name: convo.name, label: 'Grupo' })}
                      name={convo.name}
                      lastMessage="Mensagem no grupo"
                      isGroup
                    />
                  );
                }
                return null;
              })}

              {/* Create group shortcut */}
              {groups.length === 0 && friends.length > 0 && tab === 'all' && !search && (
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-dashed border-white/10 hover:border-[#7c5cfc]/40 hover:bg-[#7c5cfc]/5 text-slate-500 hover:text-slate-300 transition-all text-left mt-1"
                >
                  <div className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                    <Plus size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Criar grupo</p>
                    <p className="text-xs text-slate-600">Adicione amigos a um grupo</p>
                  </div>
                </button>
              )}
            </div>

            {/* "Ver todas" link if many conversations */}
            {allConvos.length > 5 && (
              <div className="px-4 py-2 border-t border-white/[0.06]">
                <button className="text-xs text-[#7c5cfc] hover:text-[#9b7fff] transition">
                  Ver todas as conversas
                </button>
              </div>
            )}
          </div>

          {/* â”€â”€ Right: Chat area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className={`flex-1 flex flex-col min-h-0 bg-[#0f1219] ${!showSidebar ? 'flex' : 'hidden md:flex'}`}>
            {active ? (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#131722] shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="md:hidden p-1.5 text-slate-400 hover:text-white transition mr-1"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                          active.type === 'personal' ? 'bg-emerald-500' :
                          active.type === 'group' ? 'bg-rose-500' :
                          getAvatarColor(active.name)
                        }`}
                      >
                        {active.type === 'group' ? <Users size={18} /> : getInitials(active.name)}
                      </div>
                      {active.type !== 'group' && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#131722]" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm leading-tight">{active.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {active.type !== 'group' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            <span className="text-[11px] text-emerald-400">Online â€¢ Responde rÃ¡pido</span>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500 capitalize">{active.label}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition">
                      <Search size={16} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition">
                      <Phone size={16} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Chat body */}
                <div className="flex-1 overflow-hidden">
                  {active.type === 'group' ? (
                    <GroupChat groupId={active.id} />
                  ) : (
                    <DirectChat otherId={active.id} />
                  )}
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 rounded-2xl bg-[#7c5cfc]/10 border border-[#7c5cfc]/20 flex items-center justify-center mb-5">
                  <Send size={28} className="text-[#7c5cfc]" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">Suas mensagens</p>
                <p className="text-sm text-slate-500 max-w-xs">
                  Selecione uma conversa ao lado para visualizar e enviar mensagens.
                </p>
              </div>
            )}
          </div>

      </div>
    </div>
  );
}

