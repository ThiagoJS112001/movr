import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPayments,
  createPayment,
  markPaymentPaid,
  updatePaymentStatus,
  deletePayment,
} from '../services/payments';
import { useAuth } from '../contexts/AuthContext';
import type { PaymentStatus } from '../types';

export const paymentsKey = (personalId: string) => ['payments', personalId] as const;

export function usePayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: paymentsKey(user?.id ?? ''),
    queryFn: () => fetchPayments(user!.id),
    enabled: !!user?.id && user.role === 'personal',
  });
}

export function useCreatePayment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      studentId: string;
      amount: number;
      description: string;
      dueDate: string;
      paymentMethod?: string;
      notes?: string;
    }) => createPayment({ ...params, personalId: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKey(user?.id ?? '') });
    },
  });
}

export function useMarkPaymentPaid() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markPaymentPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKey(user?.id ?? '') });
    },
  });
}

export function useUpdatePaymentStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      updatePaymentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKey(user?.id ?? '') });
    },
  });
}

export function useDeletePayment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentsKey(user?.id ?? '') });
    },
  });
}
