import { useState } from 'react';
import { Users, Search, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export default function AcademiaGruposPage() {
  const { user } = useAuth();
  const studentGroups: never[] = [];
  const students: never[] = [];
  function sendGroupMessage(_data: unknown) { return; }

  const [search, setSearch] = useState('');
  const [offerModal, setOfferModal] = useState<{ groupId: string; groupName: string } | null>(null);
  const [offerText, setOfferText] = useState('');
  const [sending, setSending] = useState(false);

  const filtered = studentGroups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  function getMemberNames(memberIds: string[]): string {
    return memberIds
      .map((id) => students.find((s) => s.id === id)?.name ?? 'Aluno')
      .slice(0, 3)
      .join(', ') + (memberIds.length > 3 ? ` +${memberIds.length - 3}` : '');
  }

  function handleSendOffer() {
    if (!user || !offerModal || !offerText.trim()) return;
    setSending(true);
    sendGroupMessage({
      groupId: offerModal.groupId,
      fromId: user.id,
      fromName: user.name,
      content: offerText.trim(),
      type: 'offer',
      offerGymId: user.id,
      offerGymName: user.name,
    });
    toast.success(`Oferta enviada para "${offerModal.groupName}"!`);
    setOfferModal(null);
    setOfferText('');
    setSending(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-violet-600/20 border border-violet-500/30 p-2 rounded-xl">
          <Users size={22} className="text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold dark:text-white">Grupos & Ofertas</h1>
      </div>

      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
        Envie promoções e ofertas diretamente para os grupos de alunos do aplicativo.
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
          placeholder="Buscar grupos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-10 text-center">
          <Users size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-semibold dark:text-white">Nenhum grupo encontrado</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {search ? 'Tente outro termo de busca.' : 'Ainda não há grupos de alunos no app.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold dark:text-white">{group.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {group.memberIds.length} {group.memberIds.length === 1 ? 'membro' : 'membros'} · {getMemberNames(group.memberIds)}
                </p>
              </div>
              <button
                onClick={() => { setOfferModal({ groupId: group.id, groupName: group.name }); setOfferText(''); }}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
              >
                <Send size={14} />
                Enviar oferta
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Offer modal */}
      {offerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg dark:text-white">Enviar oferta</h2>
              <button onClick={() => setOfferModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Enviando para: <strong className="dark:text-white">{offerModal.groupName}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Texto da oferta
              </label>
              <textarea
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
                rows={4}
                value={offerText}
                onChange={(e) => setOfferText(e.target.value)}
                placeholder="Ex: Matrícula com 30% de desconto neste mês! Venha conhecer nossa academia..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOfferModal(null)}
                className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendOffer}
                disabled={sending || !offerText.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                <Send size={14} />
                {sending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
