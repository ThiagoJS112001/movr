import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GymAddress {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface GymSchedule {
  segunda?: string;
  terca?: string;
  quarta?: string;
  quinta?: string;
  sexta?: string;
  sabado?: string;
  domingo?: string;
}

export interface GymListItem {
  id: string;
  nome: string;
  descricao?: string;
  endereco: GymAddress;
  modalidades: string[];
  fotos: string[];
  logoUrl?: string;
  telefone?: string;
  instagram?: string;
  website?: string;
  rating: number;
  ratingCount: number;
  precoMinimo?: number;
}

export interface GymPlan {
  id: string;
  gymId: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracaoDias: number;
  beneficios: string[];
  ativo: boolean;
  createdAt: string;
}

export interface GymRating {
  id: string;
  gymId: string;
  alunoId: string;
  alunoNome: string;
  alunoAvatarUrl?: string;
  rating: number;
  comentario?: string;
  createdAt: string;
}

export interface GymDetail extends GymListItem {
  horarios: GymSchedule;
  plans: GymPlan[];
  ratings: GymRating[];
}

export interface GymFilters {
  search?: string;
  modalidades?: string[];
  precoMax?: number;
  orderBy?: 'relevancia' | 'menor_preco' | 'melhor_avaliacao';
  limit?: number;
  offset?: number;
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapPlan(row: Record<string, unknown>): GymPlan {
  return {
    id: row.id as string,
    gymId: row.gym_id as string,
    nome: row.nome as string,
    descricao: (row.descricao as string | null) ?? undefined,
    preco: Number(row.preco),
    duracaoDias: row.duracao_dias as number,
    beneficios: (row.beneficios as string[]) ?? [],
    ativo: row.ativo as boolean,
    createdAt: row.created_at as string,
  };
}

function mapRating(row: Record<string, unknown>): GymRating {
  const profile = row.profiles as Record<string, unknown> | null | undefined;
  return {
    id: row.id as string,
    gymId: row.gym_id as string,
    alunoId: row.aluno_id as string,
    alunoNome: (profile?.name as string | null) ?? 'Usuário',
    alunoAvatarUrl: (profile?.avatar_url as string | null) ?? undefined,
    rating: row.rating as number,
    comentario: (row.comentario as string | null) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function mapGymRow(
  row: Record<string, unknown>,
  rating: number,
  ratingCount: number,
  precoMinimo?: number,
): GymListItem {
  return {
    id: row.id as string,
    nome: row.nome as string,
    descricao: (row.descricao as string | null) ?? undefined,
    endereco: (row.endereco as GymAddress) ?? {},
    modalidades: (row.modalidades as string[]) ?? [],
    fotos: (row.fotos as string[]) ?? [],
    logoUrl: (row.logo_url as string | null) ?? undefined,
    telefone: (row.telefone as string | null) ?? undefined,
    instagram: (row.instagram as string | null) ?? undefined,
    website: (row.website as string | null) ?? undefined,
    rating,
    ratingCount,
    precoMinimo,
  };
}

// ── Service functions ──────────────────────────────────────────────────────────

export async function listGyms(filters: GymFilters = {}): Promise<GymListItem[]> {
  const { search, modalidades, precoMax, orderBy = 'relevancia', limit = 20, offset = 0 } =
    filters;

  let query = supabase
    .from('gyms')
    .select('id, nome, descricao, endereco, modalidades, fotos, logo_url, telefone, instagram, website')
    .eq('ativo', true)
    .range(offset, offset + limit - 1);

  if (search && search.trim()) {
    query = query.ilike('nome', `%${search.trim()}%`);
  }

  if (modalidades && modalidades.length > 0) {
    query = query.overlaps('modalidades', modalidades);
  }

  const { data: gymRows, error } = await query;
  if (error) throw new Error(error.message);
  if (!gymRows || gymRows.length === 0) return [];

  // Corrigido aqui: Definindo explicitamente "g: any" para evitar conflito com o tipo inferido pelo Supabase
  const gymIds = gymRows.map((g: any) => g.id);

  // Fetch ratings and min prices in parallel
  const [{ data: ratingData }, { data: planData }] = await Promise.all([
    supabase
      .from('gym_ratings')
      .select('gym_id, rating')
      .in('gym_id', gymIds),
    supabase
      .from('gym_plans')
      .select('gym_id, preco')
      .in('gym_id', gymIds)
      .eq('ativo', true),
  ]);

  // Aggregate ratings per gym
  const ratingMap: Record<string, { sum: number; count: number }> = {};
  // Corrigido aqui: Inserido "r: any" no loop do ratingData
  for (const r of (ratingData ?? []) as any[]) {
    if (!ratingMap[r.gym_id]) ratingMap[r.gym_id] = { sum: 0, count: 0 };
    ratingMap[r.gym_id].sum += r.rating;
    ratingMap[r.gym_id].count += 1;
  }

  // Min price per gym
  const priceMap: Record<string, number> = {};
  if (precoMax !== undefined) {
    // Will filter after aggregation
  }
  // Corrigido aqui: Inserido "p: any" no loop do planData
  for (const p of (planData ?? []) as any[]) {
    const current = priceMap[p.gym_id];
    if (current === undefined || p.preco < current) priceMap[p.gym_id] = p.preco;
  }

  let results = gymRows
    .filter((g: any) => { // Corrigido aqui: Inserido "g: any" no filter
      if (precoMax !== undefined) {
        const minP = priceMap[g.id];
        if (minP !== undefined && minP > precoMax) return false;
      }
      return true;
    })
    .map((g: any) => { // Corrigido aqui: Inserido "g: any" no map
      const agg = ratingMap[g.id];
      const rating = agg ? Math.round((agg.sum / agg.count) * 10) / 10 : 0;
      return mapGymRow(
        g as Record<string, unknown>,
        rating,
        agg?.count ?? 0,
        priceMap[g.id],
      );
    });

  // Sort
  if (orderBy === 'menor_preco') {
    results.sort((a, b) => (a.precoMinimo ?? Infinity) - (b.precoMinimo ?? Infinity));
  } else if (orderBy === 'melhor_avaliacao') {
    results.sort((a, b) => b.rating - a.rating);
  }

  return results;
}

export async function getGymById(id: string): Promise<GymDetail | null> {
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .eq('id', id)
    .eq('ativo', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  const [{ data: planRows, error: planErr }, { data: ratingRows, error: ratingErr }] =
    await Promise.all([
      supabase.from('gym_plans').select('*').eq('gym_id', id).eq('ativo', true).order('preco'),
      supabase
        .from('gym_ratings')
        .select('*, profiles(name, avatar_url)')
        .eq('gym_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

  if (planErr) throw new Error(planErr.message);
  if (ratingErr) throw new Error(ratingErr.message);

  const plans = (planRows ?? []).map((p) => mapPlan(p as Record<string, unknown>));
  const ratings = (ratingRows ?? []).map((r) => mapRating(r as Record<string, unknown>));

  const ratingSum = ratings.reduce((s, r) => s + r.rating, 0);
  const rating = ratings.length ? Math.round((ratingSum / ratings.length) * 10) / 10 : 0;
  const precoMinimo = plans.length ? Math.min(...plans.map((p) => p.preco)) : undefined;

  const row = data as Record<string, unknown>;
  return {
    ...mapGymRow(row, rating, ratings.length, precoMinimo),
    horarios: (row.horarios as GymSchedule) ?? {},
    plans,
    ratings,
  };
}

export async function getGymPlans(gymId: string): Promise<GymPlan[]> {
  const { data, error } = await supabase
    .from('gym_plans')
    .select('*')
    .eq('gym_id', gymId)
    .eq('ativo', true)
    .order('preco');
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => mapPlan(p as Record<string, unknown>));
}