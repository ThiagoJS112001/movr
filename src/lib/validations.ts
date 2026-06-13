import { z } from 'zod';

// ─── Reusable primitives ──────────────────────────────────────────────────────

const emailField = z
  .string()
  .min(1, 'E-mail é obrigatório.')
  .email('Digite um e-mail válido.')
  .transform((v) => v.trim().toLowerCase());

const passwordField = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.');

const nameField = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres.')
  .max(100, 'Nome muito longo.')
  .transform((v) => v.trim());

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Senha é obrigatória.'),
});

export const registerSchema = z
  .object({
    role: z.enum(['personal', 'aluno', 'academia']),
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    birthdate: z.string().optional(),
    phone: z.string().optional(),
    terms: z.literal(true).refine((val) => val === true, { message: 'Você precisa aceitar os Termos de Uso.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirm: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As senhas não coincidem.',
    path: ['confirm'],
  });

// ─── Inferred types ───────────────────────────────────────────────────────────

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
