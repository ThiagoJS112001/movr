import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TrainerModality = 'online' | 'presencial' | 'ambos';

export interface TrainerListItem {
  id: string;            // personal_profiles.id
  personalId: string;   // profiles.id
  name: string;
  avatarUrl?: string;
  cref?: string;
  crefVerified: boolean;
  specialties: string[];
  yearsExperience: number;
  modality: TrainerModality;
  city?: string;
  state?: string;
  pricePerSession?: number;
  photos: string[];
  rating: number;
  ratingCount: number;
  availableToday: boolean;
}

export interface TrainerAvailabilitySlot {
  id: string;
  personalId: string;
  dayOfWeek: number;    // 0 = Sunday … 6 = Saturday
  startTime: string;   // 'HH:MM'
  endTime: string;     // 'HH:MM'
  modality: TrainerModality;
}

export interface TrainerRating {
  id: string;
  personalId: string;
  alunoId: string;
  alunoNome: string;
  alunoAvatarUrl?: string;
  rating: number;
  comentario?: string;
  createdAt: string;
}

export interface TrainerDetail extends TrainerListItem {
  bio?: string;
  availability: TrainerAvailabilitySlot[];
  ratings: TrainerRating[];
}

export interface TrainerFilters {
  search?: string;
  especialidades?: string[];
  precoMax?: number;
  modality?: TrainerModality;
  availableDay?: number;   // 0-6 day of week
  orderBy?: 'relevancia' | 'menor_preco' | 'melhor_avaliacao';
  limit?: number;
  offset?: number;
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapTrainerRow(
  pp: Record<string, unknown>,
  profile: Record<string, unknown>,
  rating: number,
  ratingCount: number,
  availableToday: boolean,
): TrainerListItem {
  return {
    id: pp.id as string,
    personalId: pp.personal_id as string,
    name: profile.name as string,
    avatarUrl: (profile.avatar_url as string | null) ?? undefined,
    cref: (pp.cref as string | null) ?? undefined,
    crefVerified: pp.cref_verified as boolean,
    specialties: (pp.specialties as string[]) ?? [],
    yearsExperience: pp.years_experience as number,
    modality: pp.modality as TrainerModality,
    city: (pp.city as string | null) ?? (profile.city as string | null) ?? undefined,
    state: (pp.state as string | null) ?? (profile.state as string | null) ?? undefined,
    pricePerSession: pp.price_per_session != null ? Number(pp.price_per_session) : undefined,
    photos: (pp.photos as string[]) ?? [],
    rating,
    ratingCount,
    availableToday,
  };
}

function mapAvailability(row: Record<string, unknown>): TrainerAvailabilitySlot {
  return {
    id: row.id as string,
    personalId: row.personal_id as string,
    dayOfWeek: row.day_of_week as number,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    modality: row.modality as TrainerModality,
  };
}

function mapRating(row: Record<string, unknown>): TrainerRating {
  const profile = row.profiles as Record<string, unknown> | null | undefined;
  return {
    id: row.id as string,
    personalId: row.personal_id as string,
    alunoId: row.aluno_id as string,
    alunoNome: (profile?.name as string | null) ?? 'Usuário',
    alunoAvatarUrl: (profile?.avatar_url as string | null) ?? undefined,
    rating: row.rating as number,
    comentario: (row.comentario as string | null) ?? undefined,
    createdAt: row.created_at as string,
  };
}

// ── Service functions ──────────────────────────────────────────────────────────

export async function listTrainers(filters: TrainerFilters = {}): Promise<TrainerListItem[]> {
  const {
    search,
    especialidades,
    precoMax,
    modality,
    availableDay,
    orderBy = 'relevancia',
    limit = 20,
    offset = 0,
  } = filters;

  // Build query for personal_profiles + joined profiles
  let query = supabase
    .from('personal_profiles')
    .select('*, profiles!personal_profiles_personal_id_fkey(id, name, avatar_url, city, state)')
    .eq('ativo', true)
    .range(offset, offset + limit - 1);

  if (modality && modality !== 'ambos') {
    query = query.in('modality', [modality, 'ambos']);
  }

  if (especialidades && especialidades.length > 0) {
    query = query.overlaps('specialties', especialidades);
  }

  if (availableDay !== undefined) {
    const { data: availIds } = await supabase
      .from('personal_availability')
      .select('personal_id')
      .eq('day_of_week', availableDay);
    const ids = (availIds ?? []).map((r) => r.personal_id);
    if (ids.length === 0) return [];
    query = query.in('id', ids);
  }

  const { data: ppRows, error } = await query;
  if (error) throw new Error(error.message);
  if (!ppRows || ppRows.length === 0) return [];

  // Text search on trainer name (post-query filter, Supabase full-text is on profiles)
  let rows = ppRows as Array<Record<string, unknown>>;
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((pp) => {
      const profile = pp.profiles as Record<string, unknown> | null;
      const name = (profile?.name as string | null) ?? '';
      return name.toLowerCase().includes(q);
    });
  }

  if (rows.length === 0) return [];

  const ppIds = rows.map((pp) => pp.id as string);

  // Fetch ratings in parallel
  const { data: ratingData } = await supabase
    .from('personal_ratings')
    .select('personal_id, rating')
    .in('personal_id', ppIds);

  // Aggregate ratings per personal_profile
  const ratingMap: Record<string, { sum: number; count: number }> = {};
  for (const r of ratingData ?? []) {
    const ratingRecord = r as any;
    if (!ratingMap[ratingRecord.personal_id]) ratingMap[ratingRecord.personal_id] = { sum: 0, count: 0 };
    ratingMap[ratingRecord.personal_id].sum += ratingRecord.rating;
    ratingMap[ratingRecord.personal_id].count += 1;
  }

  // Determine today's day_of_week for "Disponível hoje" badge
  const todayDow = new Date().getDay(); // 0-6
  const { data: todayAvail } = await supabase
    .from('personal_availability')
    .select('personal_id')
    .in('personal_id', ppIds)
    .eq('day_of_week', todayDow);
  const availTodaySet = new Set((todayAvail ?? []).map((r) => r.personal_id));

  // Build list items, apply precoMax filter
  let results = rows
    .filter((pp) => {
      if (precoMax !== undefined && pp.price_per_session != null) {
        if (Number(pp.price_per_session) > precoMax) return false;
      }
      return true;
    })
    .map((pp) => {
      const profile = pp.profiles as Record<string, unknown>;
      const agg = ratingMap[pp.id as string];
      const rating = agg ? Math.round((agg.sum / agg.count) * 10) / 10 : 0;
      const ratingCount = agg ? agg.count : 0;
      return mapTrainerRow(pp, profile, rating, ratingCount, availTodaySet.has(pp.id as string));
    });

  // Sort
  if (orderBy === 'menor_preco') {
    results = results.sort(
      (a, b) => (a.pricePerSession ?? Infinity) - (b.pricePerSession ?? Infinity),
    );
  } else if (orderBy === 'melhor_avaliacao') {
    results = results.sort((a, b) => b.rating - a.rating);
  }

  return results;
}

export async function getTrainerById(id: string): Promise<TrainerDetail> {
  const [ppResult, availResult, ratingsResult] = await Promise.all([
    supabase
      .from('personal_profiles')
      .select('*, profiles!personal_profiles_personal_id_fkey(id, name, avatar_url, city, state)')
      .eq('id', id)
      .single(),
    supabase
      .from('personal_availability')
      .select('*')
      .eq('personal_id', id)
      .order('day_of_week')
      .order('start_time'),
    supabase
      .from('personal_ratings')
      .select('*, profiles!personal_ratings_aluno_id_fkey(name, avatar_url)')
      .eq('personal_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (ppResult.error) throw new Error(ppResult.error.message);

  const pp = ppResult.data as Record<string, unknown>;
  const profile = pp.profiles as Record<string, unknown>;

  const ratings = (ratingsResult.data ?? []).map((r) =>
    mapRating(r as Record<string, unknown>),
  );

  const ratingSum = ratings.reduce((s, r) => s + r.rating, 0);
  const rating = ratings.length > 0 ? Math.round((ratingSum / ratings.length) * 10) / 10 : 0;

  const todayDow = new Date().getDay();
  const availability = (availResult.data ?? []).map((r) =>
    mapAvailability(r as Record<string, unknown>),
  );
  const availableToday = availability.some((a) => a.dayOfWeek === todayDow);

  const base = mapTrainerRow(pp, profile, rating, ratings.length, availableToday);

  return {
    ...base,
    bio: (pp.bio as string | null) ?? undefined,
    availability,
    ratings,
  };
}

export async function getTrainerAvailability(
  personalProfileId: string,
): Promise<TrainerAvailabilitySlot[]> {
  const { data, error } = await supabase
    .from('personal_availability')
    .select('*')
    .eq('personal_id', personalProfileId)
    .order('day_of_week')
    .order('start_time');

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapAvailability(r as Record<string, unknown>));
}
