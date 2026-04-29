import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  read: boolean;
  sentAt: string;
}

export interface BasicProfile {
  id: string;
  name: string;
  avatarUrl?: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessage(row: any): Message {
  return {
    id:      row.id,
    fromId:  row.from_id,
    toId:    row.to_id,
    content: row.content,
    read:    row.read,
    sentAt:  row.sent_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: any): BasicProfile {
  return { id: row.id, name: row.name, avatarUrl: row.avatar_url ?? undefined };
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Fetch all messages where the user is sender or recipient, ordered by time. */
export async function fetchMyMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`from_id.eq.${userId},to_id.eq.${userId}`)
    .order('sent_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

/** For aluno: get the personal trainer's UUID via the SECURITY DEFINER helper. */
export async function fetchMyPersonalId(): Promise<string | null> {
  const { data, error } = await supabase.rpc('my_personal_id');
  if (error) return null;
  return (data as string | null) ?? null;
}

export async function fetchProfileById(id: string): Promise<BasicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .eq('id', id)
    .single();
  if (error) return null;
  return mapProfile(data);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function sendMessage(fromId: string, toId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({ from_id: fromId, to_id: toId, content });
  if (error) throw error;
}

/** Mark all unread messages FROM `fromId` TO `toId` (current user) as read. */
export async function markConversationRead(fromId: string, toId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('from_id', fromId)
    .eq('to_id', toId)
    .eq('read', false);
  if (error) throw error;
}
