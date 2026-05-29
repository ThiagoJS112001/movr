import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import GymCard, { GymCardSkeleton } from '../../components/GymCard';
import { useGyms } from '../../hooks/useGyms';
import type { GymFilters } from '../../services/gyms';

// ── Constants ─────────────────────────────────────────────────────────────────

const MODALITY_OPTIONS = [
  'Musculação',
  'Funcional',
  'CrossFit',
  'Natação',
  'Spinning',
  'Yoga',
  'Pilates',
  'Lutas',
  'Dança',
  'Corrida',
  'Boxe',
  'Jiu-Jitsu',
];

const SORT_OPTIONS: { value: GymFilters['orderBy']; label: string }[] = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'menor_preco', label: 'Menor preço' },
  { value: 'melhor_avaliacao', label: 'Melhor avaliação' },
];

const MAX_PRICE = 600;
const PRICE_STEP = 10;
const PAGE_SIZE = 20;

// ── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── ModalidadeMultiselect ─────────────────────────────────────────────────────

interface ModalidadeSelectProps {
  selected: string[];
  onChange: (v: string[]) => void;
}

function ModalidadeMultiselect({ selected, onChange }: ModalidadeSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (mod: string) => {
      if (selected.includes(mod)) {
        onChange(selected.filter((m) => m !== mod));
      } else {
        onChange([...selected, mod]);
      }
    },
    [selected, onChange],
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
          selected.length > 0
            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
        } hover:border-violet-400 dark:hover:border-violet-500`}
      >
        Modalidade
        {selected.length > 0 && (
          <span className="bg-violet-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 min-w-[180px] max-h-64 overflow-y-auto">
            {MODALITY_OPTIONS.map((mod) => {
              const checked = selected.includes(mod);
              return (
                <label
                  key={mod}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(mod)}
                    className="w-3.5 h-3.5 accent-violet-600"
                  />
                  <span className="text-slate-700 dark:text-slate-200">{mod}</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── PriceSlider ────────────────────────────────────────────────────────────────

interface PriceSliderProps {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}

function PriceSlider({ value, onChange }: PriceSliderProps) {
  const [open, setOpen] = useState(false);
  const displayValue = value ?? MAX_PRICE;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
          value !== undefined
            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
        } hover:border-violet-400 dark:hover:border-violet-500`}
      >
        {value !== undefined ? `Até R$ ${value}` : 'Preço máximo'}
        {value !== undefined && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
            className="ml-0.5 hover:opacity-70"
          >
            <X className="w-3 h-3" />
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 w-56">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <span>R$ 0</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {displayValue < MAX_PRICE ? `R$ ${displayValue}` : 'Sem limite'}
              </span>
              <span>R$ {MAX_PRICE}+</span>
            </div>
            <input
              type="range"
              min={50}
              max={MAX_PRICE}
              step={PRICE_STEP}
              value={displayValue}
              onChange={(e) => {
                const v = Number(e.target.value);
                onChange(v >= MAX_PRICE ? undefined : v);
              }}
              className="w-full accent-violet-600 cursor-pointer"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Sort select ────────────────────────────────────────────────────────────────

interface SortSelectProps {
  value: GymFilters['orderBy'];
  onChange: (v: GymFilters['orderBy']) => void;
}

function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as GymFilters['orderBy'])}
      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm focus:outline-none focus:border-violet-400 cursor-pointer"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Active filter chips ────────────────────────────────────────────────────────

interface ActiveChipProps {
  label: string;
  onRemove: () => void;
}

function ActiveChip({ label, onRemove }: ActiveChipProps) {
  return (
    <span className="flex items-center gap-1 text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlunoAcademiasPage() {
  const [searchInput, setSearchInput] = useState('');
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [precoMax, setPrecoMax] = useState<number | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<GymFilters['orderBy']>('relevancia');
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch, modalidades, precoMax, orderBy]);

  const filters: GymFilters = {
    search: debouncedSearch || undefined,
    modalidades: modalidades.length > 0 ? modalidades : undefined,
    precoMax,
    orderBy,
    limit: PAGE_SIZE,
    offset,
  };

  const { data: gyms, isLoading, isFetching } = useGyms(filters);

  const hasActiveFilters = modalidades.length > 0 || precoMax !== undefined;

  const clearAll = () => {
    setModalidades([]);
    setPrecoMax(undefined);
    setSearchInput('');
    setOrderBy('relevancia');
  };

  const isEmpty = !isLoading && gyms?.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12">
      {/* Header */}
      <div className="pt-5 mb-5">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Academias</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Encontre a academia ideal e assine um plano
        </p>
      </div>

      {/* Search + filter toggle row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar academia por nome…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-violet-400'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-violet-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {(modalidades.length > 0 ? 1 : 0) + (precoMax !== undefined ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 mb-3 border border-slate-100 dark:border-slate-700">
          <ModalidadeMultiselect selected={modalidades} onChange={setModalidades} />
          <PriceSlider value={precoMax} onChange={setPrecoMax} />
          <div className="ml-auto flex items-center gap-2">
            <SortSelect value={orderBy} onChange={setOrderBy} />
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {modalidades.map((m) => (
            <ActiveChip
              key={m}
              label={m}
              onRemove={() => setModalidades(modalidades.filter((x) => x !== m))}
            />
          ))}
          {precoMax !== undefined && (
            <ActiveChip label={`Até R$ ${precoMax}`} onRemove={() => setPrecoMax(undefined)} />
          )}
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 underline underline-offset-2 transition-colors"
          >
            Limpar tudo
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <GymCardSkeleton key={i} />)
          : gyms?.map((gym) => <GymCard key={gym.id} gym={gym} />)}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium text-slate-600 dark:text-slate-300">
            Nenhuma academia encontrada
          </p>
          <p className="text-sm mt-1">Tente ajustar os filtros ou buscar por outro nome.</p>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="mt-4 text-violet-600 dark:text-violet-400 text-sm font-medium hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (gyms?.length ?? 0) > 0 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0 || isFetching}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {Math.floor(offset / PAGE_SIZE) + 1}
          </span>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={(gyms?.length ?? 0) < PAGE_SIZE || isFetching}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
