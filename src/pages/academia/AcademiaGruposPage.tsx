import { useState } from 'react';
import { Users, Search, Send, X, Plus, Edit2, Trash2, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import {
  useGymGroups,
  useCreateGymGroup,
  useUpdateGymGroup,
  useDeleteGymGroup,
  useGymGroupMembers,
  useAddGymGroupMember,
  useRemoveGymGroupMember,
  useSearchStudents,
  useSendGymGroupMessage,
  useGymGroupMessages,
} from '../../hooks/useGymGroups';
import type { GymGroup } from '../../services/academia';

// ── Group Form Modal ───────────────────────────────────────────────────────────

function GroupFormModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial?: { name: string; description: string };
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const input = 'w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg dark:text-white">
            {initial ? 'Editar grupo' : 'Novo grupo'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nome do grupo
            </label>
            <input
              className={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Turma Manha, CrossFit Avancado..."
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descricao (opcional)
            </label>
            <textarea
              className={`${input} resize-none`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre este grupo..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(name.trim(), description.trim())}
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Manage Members Modal ───────────────────────────────────────────────────────

function MembersModal({
  group,
  onClose,
}: {
  group: GymGroup;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: members = [], isLoading: loadingMembers } = useGymGroupMembers(group.id);
  const { data: searchResults = [], isLoading: searching } = useSearchStudents(searchQuery);
  const addMember = useAddGymGroupMember(group.id);
  const removeMember = useRemoveGymGroupMember(group.id);

  const memberIds = new Set(members.map((m) => m.studentId));

  async function handleAdd(studentId: string, studentName: string) {
    try {
      await addMember.mutateAsync(studentId);
      toast.success(`${studentName} adicionado ao grupo.`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao adicionar membro.');
    }
  }

  async function handleRemove(studentId: string, studentName: string) {
    try {
      await removeMember.mutateAsync(studentId);
      toast.success(`${studentName} removido do grupo.`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao remover membro.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg dark:text-white">{group.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Search to add */}
        <div className="flex-shrink-0 mb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-[#0D1025] dark:text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              placeholder="Buscar aluno por nome ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery.trim().length >= 2 && (
            <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {searching ? (
                <div className="p-3 text-center">
                  <Loader2 size={16} className="animate-spin mx-auto text-slate-400" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhum aluno encontrado.
                </div>
              ) : (
                searchResults.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-slate-700 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {s.avatarUrl ? (
                        <img src={s.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-violet-500">
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm dark:text-white truncate">{s.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.email}</p>
                      </div>
                    </div>
                    {memberIds.has(s.id) ? (
                      <span className="text-xs text-emerald-500 font-medium ml-2 flex-shrink-0">Ja membro</span>
                    ) : (
                      <button
                        onClick={() => handleAdd(s.id, s.name)}
                        disabled={addMember.isPending}
                        className="ml-2 flex-shrink-0 p-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-60"
                      >
                        <UserPlus size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Current members */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center">
              <Users size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum membro ainda.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Busque alunos acima para adicionar.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {members.map((m) => (
                <div
                  key={m.studentId}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {m.studentAvatar ? (
                      <img src={m.studentAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-violet-500">
                          {m.studentName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <p className="text-sm dark:text-white truncate">{m.studentName}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(m.studentId, m.studentName)}
                    disabled={removeMember.isPending}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-60"
                    title="Remover membro"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Offer Modal ────────────────────────────────────────────────────────────────

function OfferModal({
  group,
  onClose,
}: {
  group: GymGroup;
  onClose: () => void;
}) {
  const [offerText, setOfferText] = useState('');
  const sendOffer = useSendGymGroupMessage();
  const { data: messages = [] } = useGymGroupMessages(group.id);

  async function handleSend() {
    if (!offerText.trim()) return;
    try {
      await sendOffer.mutateAsync({ groupId: group.id, content: offerText.trim() });
      toast.success('Oferta enviada!');
      setOfferText('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao enviar oferta.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg dark:text-white">Enviar oferta</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Para: <strong className="dark:text-white">{group.name}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex-shrink-0">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Texto da oferta
          </label>
          <textarea
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
            rows={4}
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
            placeholder="Ex: Matricula com 30% de desconto neste mes!..."
            autoFocus
          />
        </div>

        <div className="flex gap-3 mb-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sendOffer.isPending || !offerText.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            {sendOffer.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sendOffer.isPending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>

        {/* History */}
        {messages.length > 0 && (
          <div className="overflow-y-auto flex-1 min-h-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-2">
              Historico de ofertas
            </p>
            <div className="space-y-2">
              {messages.slice(0, 10).map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/40 rounded-xl"
                >
                  <p className="text-sm dark:text-white">{m.content}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(m.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AcademiaGruposPage() {
  const { user } = useAuth();
  const { data: groups = [], isLoading } = useGymGroups();
  const createGroup = useCreateGymGroup();
  const updateGroup = useUpdateGymGroup();
  const deleteGroup = useDeleteGymGroup();

  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<GymGroup | null>(null);
  const [membersModal, setMembersModal] = useState<GymGroup | null>(null);
  const [offerModal, setOfferModal] = useState<GymGroup | null>(null);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate(name: string, description: string) {
    if (!user) return;
    try {
      await createGroup.mutateAsync({ name, description: description || undefined });
      toast.success('Grupo criado!');
      setCreateModal(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao criar grupo.');
    }
  }

  async function handleEdit(name: string, description: string) {
    if (!editModal) return;
    try {
      await updateGroup.mutateAsync({ groupId: editModal.id, name, description: description || undefined });
      toast.success('Grupo atualizado!');
      setEditModal(null);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao atualizar grupo.');
    }
  }

  async function handleDelete(group: GymGroup) {
    if (!confirm(`Excluir o grupo "${group.name}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      toast.success('Grupo excluido.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao excluir grupo.');
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-violet-600/20 border border-violet-500/30 p-2 rounded-xl">
            <Users size={22} className="text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold dark:text-white">Grupos & Ofertas</h1>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Novo grupo
        </button>
      </div>

      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
        Crie grupos, gerencie membros e envie promocoes diretamente para os alunos.
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-[#0D1025] dark:text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
          placeholder="Buscar grupos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-10 text-center">
          <Users size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-semibold dark:text-white">
            {search ? 'Nenhum grupo encontrado' : 'Nenhum grupo criado ainda'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {search
              ? 'Tente outro termo de busca.'
              : 'Clique em "Novo grupo" para comecar.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold dark:text-white">{group.name}</p>
                  {group.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {group.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membros'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setMembersModal(group)}
                    className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-violet-500 dark:hover:text-violet-400 border border-slate-300 dark:border-slate-600 hover:border-violet-400 px-3 py-1.5 rounded-xl transition-colors"
                    title="Gerenciar membros"
                  >
                    <UserPlus size={14} />
                    <span className="hidden sm:inline">Membros</span>
                  </button>

                  <button
                    onClick={() => setOfferModal(group)}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition-colors"
                    title="Enviar oferta"
                  >
                    <Send size={14} />
                    <span className="hidden sm:inline">Oferta</span>
                  </button>

                  <button
                    onClick={() => setEditModal(group)}
                    className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors"
                    title="Editar grupo"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(group)}
                    disabled={deleteGroup.isPending}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-60"
                    title="Excluir grupo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {createModal && (
        <GroupFormModal
          onClose={() => setCreateModal(false)}
          onSave={handleCreate}
          saving={createGroup.isPending}
        />
      )}

      {editModal && (
        <GroupFormModal
          initial={{ name: editModal.name, description: editModal.description ?? '' }}
          onClose={() => setEditModal(null)}
          onSave={handleEdit}
          saving={updateGroup.isPending}
        />
      )}

      {membersModal && (
        <MembersModal group={membersModal} onClose={() => setMembersModal(null)} />
      )}

      {offerModal && (
        <OfferModal group={offerModal} onClose={() => setOfferModal(null)} />
      )}
    </div>
  );
}