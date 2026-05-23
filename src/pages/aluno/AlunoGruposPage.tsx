import { useState } from 'react';
import { Users, Plus, MessageCircle, X, Check, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import {
  useMyGroups,
  useCreateGroup,
} from '../../hooks/useGroups';
import {
  useMyFriends,
  useMyFriendRequests,
  useRespondFriendRequest,
} from '../../hooks/useFriends';

type Tab = 'grupos' | 'amigos';

export default function AlunoGruposPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: myGroups = [], isLoading: groupsLoading } = useMyGroups();
  const { data: friends = [] } = useMyFriends();
  const { data: pendingRequests = [] } = useMyFriendRequests();
  const createGroup = useCreateGroup();
  const respond = useRespondFriendRequest();

  const [tab, setTab] = useState<Tab>('grupos');
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  if (!user) return null;

  function toggleFriendSelection(id: string) {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    try {
      const groupId = await createGroup.mutateAsync({
        name: newGroupName.trim(),
        memberIds: selectedFriends,
      });
      toast.success(`Grupo "${newGroupName.trim()}" criado!`);
      setCreateOpen(false);
      setNewGroupName('');
      setSelectedFriends([]);
      navigate(`/aluno/grupos/${groupId}`);
    } catch {
      toast.error('NÃ£o foi possÃ­vel criar o grupo. Tente novamente.');
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/20 border border-emerald-500/30 p-2 rounded-xl">
            <Users size={22} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold dark:text-white">Grupos</h1>
        </div>
        {tab === 'grupos' && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Novo grupo
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-[#0D1025] rounded-xl p-1 mb-6 w-fit">
        {(['grupos', 'amigos'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t === 'grupos' ? 'Meus Grupos' : 'Amigos'}
            {t === 'amigos' && pendingRequests.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-rose-500 text-white rounded-full px-1.5 py-0.5">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* GRUPOS TAB */}
      {tab === 'grupos' && (
        <div>
          {groupsLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-[#0D1025] animate-pulse" />
              ))}
            </div>
          )}
          {!groupsLoading && myGroups.length === 0 && (
            <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-10 text-center">
              <Users size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="font-semibold dark:text-white">VocÃª ainda nÃ£o estÃ¡ em nenhum grupo</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Crie um grupo com seus amigos para treinar junto!
              </p>
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Plus size={15} />
                Criar primeiro grupo
              </button>
            </div>
          )}
          {!groupsLoading && myGroups.length > 0 && (
            <div className="grid gap-4">
              {myGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-emerald-400">
                        {group.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold dark:text-white">{group.name}</p>
                      {group.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/aluno/grupos/${group.id}`)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
                  >
                    <MessageCircle size={14} />
                    Abrir chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AMIGOS TAB */}
      {tab === 'amigos' && (
        <div className="space-y-6">
          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
              <h2 className="font-semibold dark:text-white mb-3">
                SolicitaÃ§Ãµes pendentes ({pendingRequests.length})
              </h2>
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const p = req.from_profile!;
                  return (
                    <div key={req.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#7c5cfc]/15 text-[#7c5cfc] font-bold text-sm flex items-center justify-center shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium dark:text-white">{p.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{p.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            respond.mutate({ id: req.id, status: 'accepted' });
                            toast.success(`VocÃª e ${p.name} agora sÃ£o amigos!`);
                          }}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <Check size={13} />
                          Aceitar
                        </button>
                        <button
                          onClick={() => respond.mutate({ id: req.id, status: 'rejected' })}
                          className="flex items-center gap-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <X size={13} />
                          Recusar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* My friends */}
          <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
            <h2 className="font-semibold dark:text-white mb-3">
              Meus amigos ({friends.length})
            </h2>
            {friends.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  VocÃª ainda nÃ£o tem amigos aqui.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Adicione amigos pela pÃ¡gina{' '}
                  <button
                    onClick={() => navigate('/aluno/amigos')}
                    className="text-emerald-500 underline"
                  >
                    Amigos
                  </button>
                  .
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded-xl"
                  >
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {friend.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium dark:text-white truncate">{friend.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{friend.email}</p>
                    </div>
                    <UserCheck size={14} className="text-emerald-500 shrink-0 ml-auto" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="bg-slate-50 dark:bg-[#0D1025]/50 rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.07] p-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Para adicionar novos amigos, acesse a pÃ¡gina{' '}
              <button
                onClick={() => navigate('/aluno/amigos')}
                className="text-emerald-500 font-medium underline"
              >
                Amigos
              </button>{' '}
              e busque por e-mail.
            </p>
          </div>
        </div>
      )}

      {/* Create group modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg dark:text-white">Criar grupo</h2>
              <button
                onClick={() => { setCreateOpen(false); setNewGroupName(''); setSelectedFriends([]); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome do grupo
              </label>
              <input
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ex: Turma da Noite ðŸŒ™"
                autoFocus
              />
            </div>

            {friends.length > 0 && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Convidar amigos
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {friends.map((friend) => (
                    <label key={friend.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriendSelection(friend.id)}
                        className="w-4 h-4 accent-emerald-500"
                      />
                      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {friend.name[0]}
                      </div>
                      <span className="text-sm dark:text-white">{friend.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {friends.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Adicione amigos na aba <strong>Amigos</strong> para poder convidÃ¡-los.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setCreateOpen(false); setNewGroupName(''); setSelectedFriends([]); }}
                className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || createGroup.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                {createGroup.isPending ? 'Criandoâ€¦' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

