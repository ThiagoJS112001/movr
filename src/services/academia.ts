import { supabase } from '../lib/supabase';
import type { GymHours, GymRating } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GymStats {
  activeMembers: number;
  monthlyRevenue: number;
  newMembersLast30Days: number;
  renewalRate: number; // 0-100
}

export interface GymProfileData {
  id: string;
  name: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  cnpj?: string;
  hasPersonal: boolean;
  hasNutrition: boolean;
  amenities: string[];
  photos: string[];
  openingHours?: GymHours;
  avatarUrl?: string;
}

export interface GymProfileUpdate {
  name?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  cnpj?: string;
  hasPersonal?: boolean;
  hasNutrition?: boolean;
  amenities?: string[];
  photos?: string[];
  openingHours?: GymHours;
}

export interface GymGroup {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
}

export interface GymGroupMember {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  joinedAt: string;
}

export interface GymGroupMessage {
  id: string;
  groupId: string;
  gymId: string;
  gymName: string;
  content: string;
  createdAt: string;
}

export interface StudentSearchResult {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export async function fetchGymStats(gymId: string): Promise<GymStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: activeMembers },
    { data: payments },
    { count: newMembers },
    { count: renewedCount },
    { count: expiredCount },
  ] = await Promise.all([
    supabase
      .from('gym_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'active'),
    supabase
      .from('gym_payments')
      .select('amount')
      .eq('gym_id', gymId)
      .gte('payment_date', startOfMonth),
    supabase
      .from('gym_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('gym_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'renewed'),
    supabase
      .from('gym_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'expired'),
  ]);

  const monthlyRevenue = (payments ?? []).reduce(
    (sum, p: any) => sum + Number(p.amount),
    0,
  );
  const total = (renewedCount ?? 0) + (expiredCount ?? 0);
  const renewalRate = total > 0 ? Math.round(((renewedCount ?? 0) / total) * 100) : 0;

  return {
    activeMembers: activeMembers ?? 0,
    monthlyRevenue,
    newMembersLast30Days: newMembers ?? 0,
    renewalRate,
  };
}

// ── Gym Profile ────────────────────────────────────────────────────────────────

export async function fetchGymProfile(gymId: string): Promise<GymProfileData> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, name, bio, address, city, state, phone, cnpj, has_personal, has_nutrition, amenities, photos, opening_hours, avatar_url',
    )
    .eq('id', gymId)
    .single();
  if (error) throw new Error(error.message);
  
  // Ajustado: Tipado como any para evitar erros de propriedade no retorno do método single()
  const profile = data as any;
  
  return {
    id: profile.id,
    name: profile.name,
    bio: profile.bio ?? undefined,
    address: profile.address ?? undefined,
    city: profile.city ?? undefined,
    state: profile.state ?? undefined,
    phone: profile.phone ?? undefined,
    cnpj: profile.cnpj ?? undefined,
    hasPersonal: profile.has_personal ?? false,
    hasNutrition: profile.has_nutrition ?? false,
    amenities: profile.amenities ?? [],
    photos: profile.photos ?? [],
    openingHours: (profile.opening_hours as GymHours | undefined) ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
  };
}

export async function updateGymProfile(
  gymId: string,
  updates: GymProfileUpdate,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.bio !== undefined) payload.bio = updates.bio || null;
  if (updates.address !== undefined) payload.address = updates.address || null;
  if (updates.city !== undefined) payload.city = updates.city || null;
  if (updates.state !== undefined) payload.state = updates.state || null;
  if (updates.phone !== undefined) payload.phone = updates.phone || null;
  if (updates.cnpj !== undefined) payload.cnpj = updates.cnpj || null;
  if (updates.hasPersonal !== undefined) payload.has_personal = updates.hasPersonal;
  if (updates.hasNutrition !== undefined) payload.has_nutrition = updates.hasNutrition;
  if (updates.amenities !== undefined) payload.amenities = updates.amenities;
  if (updates.photos !== undefined) payload.photos = updates.photos;
  if (updates.openingHours !== undefined) payload.opening_hours = updates.openingHours;

  const { error } = await supabase.from('profiles').update(payload).eq('id', gymId);
  if (error) throw new Error(error.message);
}

export async function uploadGymLogo(gymId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${gymId}/logo.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('gym-photos')
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);
  const {
    data: { publicUrl },
  } = supabase.storage.from('gym-photos').getPublicUrl(path);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', gymId);
  if (updateError) throw new Error(updateError.message);
  return publicUrl;
}

export async function uploadGymPhoto(gymId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${gymId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('gym-photos')
    .upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const {
    data: { publicUrl },
  } = supabase.storage.from('gym-photos').getPublicUrl(path);
  return publicUrl;
}

// ── Gym Ratings ────────────────────────────────────────────────────────────────

export async function fetchGymRatings(gymId: string): Promise<GymRating[]> {
  const { data, error } = await supabase
    .from('gym_ratings')
    .select('id, gym_id, user_id, rating, comment, created_at, profiles(name)')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    gymId: r.gym_id,
    userId: r.user_id,
    userName: r.profiles?.name ?? 'Usuário',
    rating: r.rating,
    comment: r.comment ?? undefined,
    createdAt: r.created_at,
  }));
}

// ── Gym Groups ─────────────────────────────────────────────────────────────────

export async function fetchGymGroups(gymId: string): Promise<GymGroup[]> {
  const { data, error } = await supabase
    .from('gym_groups')
    .select('id, gym_id, name, description, created_at, gym_group_members(student_id)')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    gymId: r.gym_id,
    name: r.name,
    description: r.description,
    memberCount: (r.gym_group_members ?? []).length,
    createdAt: r.created_at,
  }));
}

export async function createGymGroup(
  gymId: string,
  name: string,
  description?: string,
): Promise<GymGroup> {
  const { data, error } = await supabase
    .from('gym_groups')
    .insert({ gym_id: gymId, name, description: description || null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  
  // Ajustado: Convertido para any para assegurar a leitura das colunas
  const group = data as any;

  return {
    id: group.id,
    gymId: group.gym_id,
    name: group.name,
    description: group.description,
    memberCount: 0,
    createdAt: group.created_at,
  };
}

export async function updateGymGroup(
  groupId: string,
  name: string,
  description?: string,
): Promise<void> {
  const { error } = await supabase
    .from('gym_groups')
    .update({ name, description: description || null })
    .eq('id', groupId);
  if (error) throw new Error(error.message);
}

export async function deleteGymGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from('gym_groups').delete().eq('id', groupId);
  if (error) throw new Error(error.message);
}

export async function fetchGymGroupMembers(groupId: string): Promise<GymGroupMember[]> {
  const { data, error } = await supabase
    .from('gym_group_members')
    .select('student_id, joined_at, profiles(name, avatar_url)')
    .eq('group_id', groupId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    studentId: r.student_id,
    studentName: r.profiles?.name ?? 'Aluno',
    studentAvatar: r.profiles?.avatar_url ?? undefined,
    joinedAt: r.joined_at,
  }));
}

export async function addGymGroupMember(
  groupId: string,
  studentId: string,
): Promise<void> {
  const { error } = await supabase
    .from('gym_group_members')
    .insert({ group_id: groupId, student_id: studentId });
  if (error) throw new Error(error.message);
}

export async function removeGymGroupMember(
  groupId: string,
  studentId: string,
): Promise<void> {
  const { error } = await supabase
    .from('gym_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('student_id', studentId);
  if (error) throw new Error(error.message);
}

export async function searchStudentsForGroup(
  query: string,
): Promise<StudentSearchResult[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url')
    .eq('role', 'aluno')
    .or(`name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`)
    .limit(10);
  if (error) throw new Error(error.message);
  
  // Corrigido: Mapeamento de 'r' adicionando o tipo explicitamente como 'any'
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatar_url ?? undefined,
  }));
}

// ── Gym Group Messages ─────────────────────────────────────────────────────────

export async function fetchGymGroupMessages(groupId: string): Promise<GymGroupMessage[]> {
  const { data, error } = await supabase
    .from('gym_group_messages')
    .select('id, group_id, gym_id, gym_name, content, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  
  // Corrigido: Mapeamento de 'r' adicionando o tipo explicitamente como 'any'
  return (data ?? []).map((r: any) => ({
    id: r.id,
    groupId: r.group_id,
    gymId: r.gym_id,
    gymName: r.gym_name,
    content: r.content,
    createdAt: r.created_at,
  }));
}

export async function sendGymGroupMessage(
  gymId: string,
  groupId: string,
  content: string,
  gymName: string,
): Promise<void> {
  const { error } = await supabase
    .from('gym_group_messages')
    .insert({ gym_id: gymId, group_id: groupId, content, gym_name: gymName });
  if (error) throw new Error(error.message);
}