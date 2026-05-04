import { useState, useEffect, useRef } from 'react';
import { Plus, Send, Users, User, Building2, ChevronLeft, X, Check, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  useMyPersonalId,
  useProfile,
  useConversation,
  useSendMessage,
  useMarkConversationRead,
  useUnreadCount,
} from '../../hooks/useMessages';
import { useMyFriends, type FriendProfile } from '../../hooks/useFriends';
import { useMyGroups, useGroupMessages, useSendGroupMessage, useCreateGroup } from '../../hooks/useGroups';

// ── Types ──────────────────────────────────────────────────────────────────────

type ConvoType = 'personal' | 'academia' | 'friend' | 'group';

interface ActiveConvo {
  type: ConvoType;
  id: string;
  name: string;
  label?: string;
}

// ── Direct message conversation view ─────────────────────────────────────────

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversation.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Nenhuma mensagem ainda. Diga olá!
          </div>
        )}
        {conversation.map((msg) => {
          const mine = msg.fromId === user?.id;
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  mine
                    ? 'bg-[#7c5cfc] text-white rounded-br-sm'
                    : 'bg-white/[0.07] text-slate-200 rounded-bl-sm'
                }`}
              >
                {msg.content}
                <div className={`text-[10px] mt-1 ${mine ? 'text-[#c4b5fd]' : 'text-slate-500'} text-right`}>
                  {new Date(msg.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {mine && (
                    <span className="ml-1">
                      {msg.read ? <span className="text-[#c4b5fd]">✓✓</span> : <span className="opacity-60">✓</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mensagem..."
          className="flex-1 bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5cfc] focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={!text.trim() || sendMsg.isPending}
          className="p-2.5 bg-[#7c5cfc] hover:bg-[#9b7fff] disabled:opacity-50 text-white rounded-xl transition"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// ── Group chat view ────────────────────────────────────────────────────────────

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Nenhuma mensagem ainda neste grupo.
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.from_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[70%]">
                {!mine && (
                  <p className="text-[10px] text-[#7c5cfc] mb-1 ml-1">{msg.from_name}</p>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    mine
                      ? 'bg-[#7c5cfc] text-white rounded-br-sm'
                      : 'bg-white/[0.07] text-slate-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                  <div className={`text-[10px] mt-1 ${mine ? 'text-[#c4b5fd]' : 'text-slate-500'} text-right`}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mensagem no grupo..."
          className="flex-1 bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5cfc] focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={!text.trim() || sendMsg.isPending}
          className="p-2.5 bg-[#7c5cfc] hover:bg-[#9b7fff] disabled:opacity-50 text-white rounded-xl transition"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// ── Create Group Modal ─────────────────────────────────────────────────────────

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
                <p className="text-xs text-slate-500">Você ainda não tem amigos adicionados.</p>
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
                  <div className="w-8 h-8 rounded-full bg-[#7c5cfc]/20 text-[#7c5cfc] text-xs font-bold flex items-center justify-center shrink-0">
                    {f.name.charAt(0).toUpperCase()}
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

// ── Conversation list item ────────────────────────────────────────────────────

function ConvoItem({
  active, onClick, name, label, icon: Icon, unread, iconColor = 'text-[#7c5cfc]', iconBg = 'bg-[#7c5cfc]/15',
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  label?: string;
  icon: React.ElementType;
  unread?: number;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
        active ? 'bg-[#7c5cfc]/15 border border-[#7c5cfc]/30' : 'hover:bg-white/[0.04]'
      }`}
    >
      <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        {label && <p className="text-[11px] text-slate-500 truncate capitalize">{label}</p>}
      </div>
      {!!unread && unread > 0 && (
        <span className="w-5 h-5 rounded-full bg-[#7c5cfc] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

// ── Personal convo item ───────────────────────────────────────────────────────

function PersonalConvoItem({ personalId, active, onClick }: { personalId: string; active: boolean; onClick: () => void }) {
  const { data: profile } = useProfile(personalId);
  const unread = useUnreadCount(personalId);
  return (
    <ConvoItem
      active={active}
      onClick={onClick}
      name={profile?.name ?? 'Personal Trainer'}
      label="Seu personal"
      icon={User}
      unread={unread}
      iconColor="text-emerald-400"
      iconBg="bg-emerald-400/20"
    />
  );
}

// ── Main Chat Hub ─────────────────────────────────────────────────────────────

export default function AlunoChatPage() {
  const { data: personalId } = useMyPersonalId();
  const { data: friends = [] } = useMyFriends();
  const { data: groups = [] } = useMyGroups();

  const [active, setActive] = useState<ActiveConvo | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function selectConvo(convo: ActiveConvo) {
    setActive(convo);
    setSidebarOpen(false);
  }

  const showSidebar = sidebarOpen || !active;

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      {showCreateGroup && (
        <CreateGroupModal friends={friends} onClose={() => setShowCreateGroup(false)} />
      )}

      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>

        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#7c5cfc]/15 flex items-center justify-center">
            <MessageCircle size={18} className="text-[#7c5cfc]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">Chat</h1>
            <p className="text-xs text-slate-500 mt-0.5">Mensagens com seu personal, amigos e grupos</p>
          </div>
        </div>

        {/* ── Chat card ── */}
        <div className="flex-1 rounded-2xl bg-[#131722] border border-white/5 overflow-hidden flex min-h-0">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <div
        className={`${
          showSidebar ? 'flex' : 'hidden md:flex'
        } w-full md:w-72 flex-col border-r border-white/5 shrink-0`}
      >
        <div className="px-4 py-3.5 border-b border-white/5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Conversas</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Personal */}
          {personalId && (
            <>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest px-2 pt-2 pb-1">Personal</p>
              <PersonalConvoItem
                personalId={personalId}
                active={active?.id === personalId}
                onClick={() => selectConvo({ type: 'personal', id: personalId, name: 'Personal Trainer', label: 'Seu personal' })}
              />
            </>
          )}

          {/* Friends */}
          {friends.length > 0 && (
            <>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest px-2 pt-3 pb-1">Amigos</p>
              {friends.map((f) => (
                <ConvoItem
                  key={f.id}
                  active={active?.id === f.id}
                  onClick={() => selectConvo({ type: 'friend', id: f.id, name: f.name, label: f.role })}
                  name={f.name}
                  label={f.role}
                  icon={User}
                  iconColor="text-[#7c5cfc]"
                  iconBg="bg-[#7c5cfc]/15"
                />
              ))}
            </>
          )}

          {/* Groups */}
          <div className="flex items-center justify-between px-2 pt-3 pb-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Grupos</p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-1 text-[10px] text-[#7c5cfc] hover:text-[#9b7fff] transition"
            >
              <Plus size={11} /> Novo
            </button>
          </div>
          {groups.map((g) => (
            <ConvoItem
              key={g.id}
              active={active?.id === g.id}
              onClick={() => selectConvo({ type: 'group', id: g.id, name: g.name, label: 'Grupo' })}
              name={g.name}
              label="Grupo"
              icon={Users}
              iconColor="text-rose-400"
              iconBg="bg-rose-500/20"
            />
          ))}
          {groups.length === 0 && (
            <p className="text-xs text-slate-600 px-3 py-1">Nenhum grupo ainda.</p>
          )}

          {/* Empty state */}
          {!personalId && friends.length === 0 && groups.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <Building2 size={28} className="text-slate-600 mb-2" />
              <p className="text-sm text-slate-500">Nenhuma conversa ainda.</p>
              <p className="text-xs text-slate-600 mt-1">Adicione amigos ou crie um grupo.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat area ───────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-0 ${!showSidebar ? 'flex' : 'hidden md:flex'}`}>
        {active ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1 text-slate-400 hover:text-white transition"
              >
                <ChevronLeft size={20} />
              </button>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  active.type === 'personal' ? 'bg-emerald-400/20' :
                  active.type === 'group' ? 'bg-rose-500/20' : 'bg-[#7c5cfc]/15'
                }`}
              >
                {active.type === 'group' ? (
                  <Users size={16} className="text-rose-400" />
                ) : active.type === 'personal' ? (
                  <User size={16} className="text-emerald-400" />
                ) : (
                  <User size={16} className="text-[#7c5cfc]" />
                )}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{active.name}</p>
                {active.label && <p className="text-xs text-slate-400 capitalize">{active.label}</p>}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {active.type === 'group' ? (
                <GroupChat groupId={active.id} />
              ) : (
                <DirectChat otherId={active.id} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#7c5cfc]/10 flex items-center justify-center mb-4">
              <MessageCircle size={24} className="text-[#7c5cfc]" />
            </div>
            <p className="text-white font-semibold mb-1">Selecione uma conversa</p>
            <p className="text-sm text-slate-500">Escolha um contato ou grupo no painel ao lado.</p>
          </div>
        )}
      </div>

        </div>{/* end chat card */}
      </div>{/* end container */}
    </div>
  );
}
