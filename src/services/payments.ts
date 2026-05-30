import { supabase } from '../lib/supabase';
import type { StudentPayment, PaymentStatus } from '../types';

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapPayment(row: Record<string, unknown>): StudentPayment {
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as string,
    personalId: row.personal_id as string,
    studentId: row.student_id as string,
    studentName: (profile?.name as string) ?? undefined,
    amount: Number(row.amount),
    description: row.description as string,
    dueDate: row.due_date as string,
    paidAt: (row.paid_at as string | null) ?? undefined,
    status: row.status as PaymentStatus,
    paymentMethod: (row.payment_method as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    createdAt: row.created_at as string,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchPayments(personalId: string): Promise<StudentPayment[]> {
  const { data, error } = await supabase
    .from('student_payments')
    .select('*, profiles!student_payments_student_id_fkey(name)')
    .eq('personal_id', personalId)
    .order('due_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapPayment(r as Record<string, unknown>));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createPayment(params: {
  personalId: string;
  studentId: string;
  amount: number;
  description: string;
  dueDate: string;
  paymentMethod?: string;
  notes?: string;
}): Promise<StudentPayment> {
  const { data, error } = await supabase
    .from('student_payments')
    .insert({
      personal_id: params.personalId,
      student_id: params.studentId,
      amount: params.amount,
      description: params.description,
      due_date: params.dueDate,
      payment_method: params.paymentMethod ?? null,
      notes: params.notes ?? null,
    })
    .select('*, profiles!student_payments_student_id_fkey(name)')
    .single();

  if (error) throw new Error(error.message);
  return mapPayment(data as Record<string, unknown>);
}

export async function markPaymentPaid(id: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('student_payments')
    .update({ status: 'pago', paid_at: today })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updatePaymentStatus(id: string, status: PaymentStatus): Promise<void> {
  const { error } = await supabase
    .from('student_payments')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase
    .from('student_payments')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
