import { useState } from 'react';
import { Users, UserPlus, Plus, Check, X, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

type Tab = 'grupos' | 'amigos';

export default function AlunoGruposPage() {
  const { user } = useAuth();
  const {
    students,
    studentGroups,
    createGroup,
    getUserGroups,
    friendRequests,
    sendFriendRequest,
    respondFriendRequest,
    getFriends,
  } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('grupos');
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState('');

  if (!user) return null;

  const myGroups = getUserGroups(user.id);
  const myFriendIds = getFriends(user.id);
  const myFriends = students.filter((s) => myFriendIds.includes(s.id));

  // Pending requests received by me
  const pendingReceived = friendRequests.filter(
    (r) => r.toId === user.id && r.status === 'pending'
  );

  // Students I can add (not me, not already friends, no pending request)
  const canAdd = students.filter((s) => {
    if (s.id === user.id) return false;
    if (myFriendIds.includes(s.id)) return false;
    const pending = friendRequests.find(
      (r) => r.status === 'pending' &&
        ((r.fromId === user.id && r.toId === s.id) || (r.fromId === s.id && r.toId === user.id))
    );
    return !pending;
  }).filter((s) =>
    !friendSearch || s.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(friendSearch.toLowerCase())
  );

  function toggleFriendSelection(id: string) {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    const group = createGroup(newGroupName.trim(), user.id, [user.id, ...selectedFriends]);
    toast.success(`Grupo "${group.name}" criado!`);
    setCreateOpen(false);
    setNewGroupName('');
    setSelectedFriends([]);
    navigate(`/aluno/grupos/${group.id}`);
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
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6 w-fit">
        {(['grupos', 'amigos'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t === 'grupos' ? 'Meus Grupos' : 'Amigos'}
          </button>
        ))}
      </div>

      {/* GRUPOS TAB */}
      {tab === 'grupos' && (
        <div>
          {myGroups.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-10 text-center">
              <Users size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="font-semibold dark:text-white">Você ainda não está em nenhum grupo</p>
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
          ) : (
            <div className="grid gap-4">
              {myGroups.map((group) => {
                const memberNames = group.memberIds
                  .filter((id) => id !== user.id)
                  .map((id) => students.find((s) => s.id === id)?.name ?? 'Aluno')
                  .slice(0, 3);
                return (
                  <div
                    key={group.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold dark:text-white">{group.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {group.memberIds.length} {group.memberIds.length === 1 ? 'membro' : 'membros'}
                        {memberNames.length > 0 && ` · ${memberNames.join(', ')}${group.memberIds.length > 4 ? '…' : ''}`}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/aluno/grupos/${group.id}`)}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
                    >
                      <MessageCircle size={14} />
                      Abrir chat
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AMIGOS TAB */}
      {tab === 'amigos' && (
        <div className="space-y-6">
          {/* Pending requests */}
          {pendingReceived.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-5">
              <h2 className="font-semibold dark:text-white mb-3">
                Solicitações pendentes ({pendingReceived.length})
              </h2>
              <div className="space-y-3">
                {pendingReceived.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium dark:text-white">{req.fromName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Quer ser seu amigo</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { respondFriendRequest(req.id, 'accepted'); toast.success(`Você e ${req.fromName} agora são amigos!`); }}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <Check size={13} />
                        Aceitar
                      </button>
                      <button
                        onClick={() => respondFriendRequest(req.id, 'rejected')}
                        className="flex items-center gap-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X size={13} />
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My friends */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-5">
            <h2 className="font-semibold dark:text-white mb-3">
              Meus amigos ({myFriends.length})
            </h2>
            {myFriends.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Você ainda não tem amigos. Adicione abaixo!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {friend.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-white">{friend.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{friend.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Find students */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-5">
            <h2 className="font-semibold dark:text-white mb-3">Encontrar alunos</h2>
            <input
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition mb-4"
              placeholder="Buscar por nome ou e-mail..."
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
            />
            {canAdd.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                {friendSearch ? 'Nenhum aluno encontrado.' : 'Todos os alunos já são seus amigos!'}
              </p>
            ) : (
              <div className="space-y-3">
                {canAdd.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium dark:text-white">{s.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{s.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        sendFriendRequest(user.id, user.name, s.id, s.name);
                        toast.success(`Solicitação enviada para ${s.name}!`);
                      }}
                      className="flex items-center gap-1 border border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex-shrink-0"
                    >
                      <UserPlus size={13} />
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create group modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg dark:text-white">Criar grupo</h2>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
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
                placeholder="Ex: Turma da Noite 🌙"
                autoFocus
              />
            </div>

            {myFriends.length > 0 && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Convidar amigos
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {myFriends.map((friend) => (
                    <label key={friend.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriendSelection(friend.id)}
                        className="w-4 h-4 accent-emerald-500"
                      />
                      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {friend.name[0]}
                      </div>
                      <span className="text-sm dark:text-white">{friend.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {myFriends.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Adicione amigos na aba <strong>Amigos</strong> para poder convidá-los.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCreateOpen(false)}
                className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
