import { useState } from 'react';
import { Search, UserPlus, UserCheck, UserX, Clock, Users } from 'lucide-react';
import {
  useSearchByEmail,
  useMyFriends,
  useMyFriendRequests,
  useSendFriendRequest,
  useRespondFriendRequest,
  useRequestStatus,
  type FriendProfile,
} from '../../hooks/useFriends';

// ── Sub-component: Search result card ─────────────────────────────────────────

function SearchResultCard({ profile }: { profile: FriendProfile }) {
  const { data: status } = useRequestStatus(profile.id);
  const send = useSendFriendRequest();

  const avatar = profile.avatar_url
    ? <img src={profile.avatar_url} alt={profile.name} className="w-10 h-10 rounded-full object-cover" />
    : (
      <div className="w-10 h-10 rounded-full bg-[#7c5cfc]/15 text-[#7c5cfc] font-bold text-sm flex items-center justify-center">
        {profile.name.charAt(0).toUpperCase()}
      </div>
    );

  let action;
  if (status?.status === 'accepted') {
    action = (
      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
        <UserCheck size={14} /> Amigos
      </span>
    );
  } else if (status?.status === 'pending' && status.direction === 'sent') {
    action = (
      <span className="flex items-center gap-1 text-xs text-slate-400">
        <Clock size={14} /> Aguardando
      </span>
    );
  } else if (status?.status === 'pending' && status.direction === 'received') {
    action = (
      <span className="flex items-center gap-1 text-xs text-yellow-400">
        <Clock size={14} /> Pedido recebido
      </span>
    );
  } else {
    action = (
      <button
        onClick={() => send.mutate(profile.id)}
        disabled={send.isPending}
        className="flex items-center gap-1.5 text-xs bg-[#7c5cfc] hover:bg-[#9b7fff] disabled:opacity-60 text-white px-3 py-1.5 rounded-lg font-medium transition"
      >
        <UserPlus size={13} />
        {send.isPending ? 'Enviando...' : 'Adicionar'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.07] rounded-xl">
      {avatar}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{profile.name}</p>
        <p className="text-xs text-slate-400 truncate">{profile.email}</p>
        <span className="text-xs text-slate-500 capitalize">{profile.role}</span>
      </div>
      {action}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AlunoAmigosPage() {
  const [emailInput, setEmailInput] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  const { data: searchResult, isFetching } = useSearchByEmail(searchEmail);
  const { data: friends = [] } = useMyFriends();
  const { data: requests = [] } = useMyFriendRequests();
  const respond = useRespondFriendRequest();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchEmail(emailInput.trim());
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#7c5cfc]/10 flex items-center justify-center">
          <Users size={18} className="text-[#7c5cfc]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white leading-none">Amigos</h1>
          <p className="text-xs text-slate-500 mt-0.5">Busque e adicione amigos por e-mail</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="email@exemplo.com"
            className="w-full bg-white/[0.05] border border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5cfc] focus:border-transparent transition"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-[#7c5cfc] hover:bg-[#9b7fff] text-white text-sm font-medium rounded-xl transition"
        >
          Buscar
        </button>
      </form>

      {/* Search result */}
      {searchEmail && (
        <div>
          {isFetching ? (
            <p className="text-sm text-slate-400">Buscando...</p>
          ) : searchResult ? (
            <SearchResultCard profile={searchResult} />
          ) : (
            <p className="text-sm text-slate-400">Nenhum usuário encontrado com esse e-mail.</p>
          )}
        </div>
      )}

      {/* Pending requests received */}
      {requests.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
            Pedidos recebidos
          </h2>
          <div className="space-y-2">
            {requests.map((req) => {
              const p = req.from_profile!;
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.07] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#7c5cfc]/15 text-[#7c5cfc] font-bold text-sm flex items-center justify-center shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 truncate">{p.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond.mutate({ id: req.id, status: 'accepted' })}
                      className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition"
                      title="Aceitar"
                    >
                      <UserCheck size={15} />
                    </button>
                    <button
                      onClick={() => respond.mutate({ id: req.id, status: 'rejected' })}
                      className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition"
                      title="Recusar"
                    >
                      <UserX size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
          <Users size={14} /> Meus amigos ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Você ainda não tem amigos adicionados.</p>
            <p className="text-xs mt-1">Busque pelo e-mail de alguém acima.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.07] rounded-xl">
                {f.avatar_url ? (
                  <img src={f.avatar_url} alt={f.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#7c5cfc]/15 text-[#7c5cfc] font-bold text-sm flex items-center justify-center">
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{f.name}</p>
                  <p className="text-xs text-slate-400 truncate">{f.email}</p>
                </div>
                <UserCheck size={16} className="text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      </div>{/* end max-w container */}
    </div>
  );
}
