import { useState } from 'react';
import { Building2, Star, Search, MapPin, Phone, Clock, User, Salad, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import type { Gym } from '../../types';

const DAYS_PT: Record<string, string> = {
  segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom',
};

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'}
        />
      ))}
    </div>
  );
}

function ClickableStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star
            size={28}
            className={(hover || value) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'}
          />
        </button>
      ))}
    </div>
  );
}

export default function AlunoAcademiasPage() {
  const { user } = useAuth();
  const { gyms, gymRatings, getGymAvgRating, addGymRating } = useApp();

  const [search, setSearch] = useState('');
  const [filterPersonal, setFilterPersonal] = useState(false);
  const [filterNutrition, setFilterNutrition] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratingModal, setRatingModal] = useState<Gym | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  const sorted = [...gyms]
    .filter((g) => {
      const q = search.toLowerCase();
      const match = g.name.toLowerCase().includes(q) || (g.city ?? '').toLowerCase().includes(q);
      if (!match) return false;
      if (filterPersonal && !g.hasPersonal) return false;
      if (filterNutrition && !g.hasNutrition) return false;
      return true;
    })
    .sort((a, b) => getGymAvgRating(b.id) - getGymAvgRating(a.id));

  function openRatingModal(gym: Gym) {
    const existing = user ? gymRatings.find((r) => r.gymId === gym.id && r.userId === user.id) : undefined;
    setRatingModal(gym);
    setMyRating(existing?.rating ?? 0);
    setRatingComment(existing?.comment ?? '');
  }

  function handleSubmitRating() {
    if (!user || !ratingModal || myRating === 0) return;
    addGymRating({
      gymId: ratingModal.id,
      userId: user.id,
      userName: user.name,
      rating: myRating,
      comment: ratingComment.trim() || undefined,
    });
    toast.success('Avaliação enviada!');
    setRatingModal(null);
    setMyRating(0);
    setRatingComment('');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-violet-600/20 border border-violet-500/30 p-2 rounded-xl">
          <Building2 size={22} className="text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold dark:text-white">Academias</h1>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Descubra academias parceiras ordenadas por avaliação dos alunos.
      </p>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            placeholder="Buscar por nome ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterPersonal((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              filterPersonal
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-500'
            }`}
          >
            <User size={14} />
            Personal
          </button>
          <button
            onClick={() => setFilterNutrition((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              filterNutrition
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
            }`}
          >
            <Salad size={14} />
            Nutrição
          </button>
        </div>
      </div>

      {/* Gym list */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-10 text-center">
          <Building2 size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-semibold dark:text-white">Nenhuma academia encontrada</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tente outros filtros.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((gym, idx) => {
            const avg = getGymAvgRating(gym.id);
            const ratingsCount = gymRatings.filter((r) => r.gymId === gym.id).length;
            const isExpanded = expandedId === gym.id;
            const myExistingRating = user ? gymRatings.find((r) => r.gymId === gym.id && r.userId === user.id) : undefined;

            return (
              <div
                key={gym.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Rank badge */}
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">#{idx + 1}</span>
                      </div>
                      <div>
                        <h2 className="font-semibold dark:text-white">{gym.name}</h2>
                        {(gym.city || gym.state) && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <MapPin size={11} />
                            {gym.city}{gym.state ? `, ${gym.state}` : ''}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <StarRow rating={avg} size={14} />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {avg > 0 ? `${avg.toFixed(1)} (${ratingsCount})` : 'Sem avaliações'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openRatingModal(gym)}
                        className="text-xs font-medium text-yellow-600 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-600/50 px-3 py-1.5 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                      >
                        {myExistingRating ? 'Editar nota' : 'Avaliar'}
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : gym.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {gym.hasPersonal && (
                      <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-xl">
                        <User size={11} />
                        Personal
                      </span>
                    )}
                    {gym.hasNutrition && (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-xl">
                        <Salad size={11} />
                        Nutricionista
                      </span>
                    )}
                    {gym.amenities.slice(0, 3).map((a) => (
                      <span key={a} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                        {a}
                      </span>
                    ))}
                    {gym.amenities.length > 3 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 px-2.5 py-1">
                        +{gym.amenities.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700/50 p-5 space-y-4 bg-slate-50 dark:bg-slate-900/30">
                    {gym.bio && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">{gym.bio}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {gym.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="dark:text-slate-300">{gym.address}{gym.city ? `, ${gym.city}` : ''}</span>
                        </div>
                      )}
                      {gym.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="dark:text-slate-300">{gym.phone}</span>
                        </div>
                      )}
                    </div>

                    {gym.openingHours && (
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium dark:text-white mb-2">
                          <Clock size={14} />
                          Horários
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                          {Object.entries(gym.openingHours).map(([day, time]) => (
                            <div key={day} className="bg-white dark:bg-slate-800 rounded-lg px-2 py-1.5 border border-slate-200 dark:border-slate-700/50">
                              <span className="font-medium text-slate-500 dark:text-slate-400">{DAYS_PT[day] ?? day}</span>
                              <br />
                              <span className="dark:text-white">{time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {gym.amenities.length > 0 && (
                      <div>
                        <p className="text-sm font-medium dark:text-white mb-2">Comodidades</p>
                        <div className="flex flex-wrap gap-2">
                          {gym.amenities.map((a) => (
                            <span key={a} className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg dark:text-white">Avaliar {ratingModal.name}</h2>
              <button onClick={() => setRatingModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Sua nota:</p>
              <ClickableStars value={myRating} onChange={setMyRating} />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Comentário (opcional)
              </label>
              <textarea
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition resize-none"
                rows={3}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Conte sua experiência..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRatingModal(null)}
                className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={myRating === 0}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                Enviar avaliação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
