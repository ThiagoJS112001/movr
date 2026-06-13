# 📁 ESTRUTURA DE PASTAS - Recomendação Escalável

Proposta para reorganizar o projeto MOVR para melhor escalabilidade, manutenibilidade e separação de responsabilidades.

---

## 🎯 Comparação: Antes vs. Depois

### ANTES (Atual - Não Escalável)
```
src/
├── components/           ❌ 18+ componentes mistos
│   ├── AlunoPerfilModal.tsx
│   ├── NewWorkoutModal.tsx
│   ├── GymCard.tsx
│   ├── TrainerCard.tsx
│   └── ... (muitos arquivos)
├── contexts/             ✅ OK
├── hooks/                ❌ 16 hooks sem organização
├── pages/
│   ├── academia/
│   ├── aluno/
│   ├── personal/
│   └── auth/ (espalho)
├── services/             ❌ 13 services, difícil encontrar
├── types/                ✅ OK
└── lib/                  ✅ OK

PROBLEMAS:
- 30+ componentes em um único diretório
- Difícil encontrar código relacionado
- Imports complexos: '../../../hooks/useWorkout'
- Risco de código duplicado entre features
- Difícil testar features em isolamento
```

### DEPOIS (Proposta - Escalável)
```
src/
├── features/                       ✅ Feature-based organization
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── PasswordReset.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts              (Barrel export)
│   │
│   ├── workouts/
│   │   ├── pages/
│   │   │   ├── WorkoutsListPage.tsx
│   │   │   └── WorkoutDetailPage.tsx
│   │   ├── components/
│   │   │   ├── WorkoutCard.tsx
│   │   │   ├── NewWorkoutModal.tsx
│   │   │   ├── WorkoutEditModal.tsx
│   │   │   └── WorkoutViewModal.tsx
│   │   ├── hooks/
│   │   │   ├── useWorkouts.ts
│   │   │   └── useWorkoutForm.ts
│   │   ├── services/
│   │   │   └── workoutService.ts
│   │   ├── types/
│   │   │   └── workout.types.ts
│   │   └── index.ts
│   │
│   ├── diets/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── payments/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── trainers/
│   │   ├── components/
│   │   │   └── TrainerCard.tsx
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── gyms/
│   │   ├── components/
│   │   │   └── GymCard.tsx
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   └── messages/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── index.ts
│
├── shared/                        ✅ Compartilhado entre features
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AcademiaLayout.tsx
│   │   │   ├── AlunoLayout.tsx
│   │   │   ├── PersonalLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── modals/
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── LoadingModal.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── BrandLogo.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── PasswordStrengthBar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── index.ts
│   │   ├── ErrorBoundary.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── NotificationsBootstrap.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useNotifications.ts
│   │   ├── usePagination.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── common.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── routes.ts
│   │   ├── messages.ts
│   │   └── index.ts
│   └── index.ts
│
├── config/                        ✅ Configurações centralizadas
│   ├── routes.config.ts
│   ├── api.config.ts
│   ├── constants.ts
│   └── index.ts
│
├── lib/                           ✅ Já existe, mantém
│   ├── supabase.ts
│   ├── env.ts
│   ├── sentry.ts
│   ├── queryClient.ts
│   ├── validations.ts
│   ├── plans.ts
│   └── index.ts
│
├── contexts/                      ✅ Já existe, mantém
│   ├── AuthContext.tsx
│   ├── SettingsContext.tsx
│   ├── ThemeContext.tsx
│   └── index.ts
│
├── types/                         ✅ Já existe
│   ├── database.ts
│   └── index.ts
│
├── App.tsx
├── main.tsx
├── index.css
└── vite-env.d.ts

BENEFÍCIOS:
✅ Cada feature é independente e testável
✅ Imports claros: import { WorkoutCard } from '@/features/workouts'
✅ Menos risco de conflitos de nomes
✅ Fácil adicionar novo feature (copy template)
✅ Fácil encontrar código relacionado
✅ Shared code está claramente separado
```

---

## 🏗️ Template de Feature

Use este template ao criar um novo feature:

```
src/features/new-feature/
├── pages/
│   ├── NewFeaturePage.tsx       # Página principal
│   └── NewFeatureDetailPage.tsx # (Se aplicável)
│
├── components/
│   ├── NewFeatureCard.tsx       # Card component
│   ├── NewFeatureModal.tsx      # Modal (se aplicável)
│   ├── NewFeatureForm.tsx       # Form component
│   └── index.ts                 # Barrel export
│
├── hooks/
│   ├── useNewFeature.ts         # Data fetching hook
│   ├── useNewFeatureForm.ts     # Form logic hook
│   └── index.ts
│
├── services/
│   └── newFeatureService.ts     # API calls
│
├── types/
│   ├── newFeature.types.ts      # Feature-specific types
│   └── index.ts
│
├── constants/
│   └── newFeature.constants.ts  # (Se aplicável)
│
├── __tests__/                   # Tests (future)
│   └── NewFeatureCard.test.tsx
│
└── index.ts                     # Barrel export
    // export { default as NewFeatureCard } from './components/NewFeatureCard';
    // export { useNewFeature } from './hooks';
    // export type { NewFeature } from './types';
```

---

## 📋 Plano de Migração (Sem Quebra)

### Fase 1: Preparação (Dia 1 - 30 min)
```bash
# 1. Criar nova estrutura (paralelo, sem afetar código atual)
mkdir -p src/features/{auth,workouts,diets,payments,trainers,gyms,messages}
mkdir -p src/features/{auth,workouts,diets,payments,trainers,gyms,messages}/{components,hooks,services,types}
mkdir -p src/shared/{components,hooks,utils,types,constants}
mkdir -p src/config

# 2. Criar arquivo de roteamento new-to-old
# src/legacy/mappings.ts (para imports durante migração)

# 3. Update tsconfig.json com path aliases
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/config/*": ["./src/config/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/legacy/*": ["./src/legacy/*"]
    }
  }
}
```

### Fase 2: Migração por Feature (Semanas 1-3)

**Semana 1: Auth**
```bash
# 1. Move files
mv src/pages/{LoginPage,RegisterPage,ForgotPasswordPage,ResetPasswordPage,AuthCallbackPage}.tsx \
   src/features/auth/pages/

# 2. Move auth-related components
# (Se houver LoginForm, RegisterForm, etc.)

# 3. Move auth-related hooks (se houver)

# 4. Move auth service
# (Se não houver, criar novo com auth operations)

# 5. Update imports em todo projeto
# OLD: import { LoginPage } from '@/pages'
# NEW: import { LoginPage } from '@/features/auth/pages'

# 6. Criar barrel export
# src/features/auth/index.ts
export { LoginPage, RegisterPage } from './pages';
export { useAuth } from './hooks';
export type { AuthState } from './types';

# 7. Teste build
npm run build
```

**Semana 2: Workouts**
```bash
# Repeat pattern do Auth
# Move: components/NewWorkoutModal, WorkoutEditModal, WorkoutViewModal
# Move: pages/academia/WorkoutsPage, aluno/MyWorkoutsPage
# Move: hooks/useWorkouts.ts
# Move ou create: services/workouts.ts
```

**Semana 3: Diets, Payments, etc.**
```bash
# Continue o padrão...
```

### Fase 3: Cleanup (Semana 4)

```bash
# 1. Verificar que nenhum import aponta para antigpaths
grep -r "from '@/components/" src/features/
grep -r "from '@/pages/" src/features/
grep -r "from '@/hooks/" src/features/
grep -r "from '@/services/" src/features/

# 2. Remover pastas antigas (APÓS verificação)
# rm -rf src/components  (depois que tudo migrou)
# rm -rf src/pages/academia src/pages/aluno src/pages/personal
# Manter: src/pages/{LoginPage, RegisterPage, etc} OU mover para features/auth

# 3. Remover legacy mapping
# rm src/legacy/mappings.ts

# 4. Build final
npm run build
npm run lint
```

---

## 🛠️ Path Aliases (Imports Limpos)

### Configurar em tsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/config/*": ["./src/config/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/contexts/*": ["./src/contexts/*"]
    }
  }
}
```

### Resultado: Imports Limpos
```typescript
// ❌ ANTES
import { WorkoutCard } from '../../../components/WorkoutCard';
import { useWorkouts } from '../../../hooks/useWorkouts';
import { workoutService } from '../../../services/workouts';

// ✅ DEPOIS
import { WorkoutCard } from '@/features/workouts/components';
import { useWorkouts } from '@/features/workouts/hooks';
import { workoutService } from '@/features/workouts/services';

// ✅ Shared components
import { Button, Card } from '@/shared/components/ui';
import { useNotifications } from '@/shared/hooks';

// ✅ Utilities
import { logger } from '@/shared/utils';
import { ROLES } from '@/config/constants';
```

---

## 📦 Barrel Exports (index.ts)

Cada feature/shared deve ter `index.ts` para limpar imports:

### Exemplo: workouts/index.ts
```typescript
// Pages
export { default as WorkoutsPage } from './pages/WorkoutsPage';
export { default as WorkoutDetailPage } from './pages/WorkoutDetailPage';

// Components
export { WorkoutCard } from './components/WorkoutCard';
export { NewWorkoutModal } from './components/NewWorkoutModal';
export { WorkoutEditModal } from './components/WorkoutEditModal';

// Hooks
export { useWorkouts } from './hooks/useWorkouts';
export { useWorkoutForm } from './hooks/useWorkoutForm';

// Services
export { workoutService } from './services/workoutService';

// Types
export type { Workout, WorkoutFormData } from './types';
```

### Resultado
```typescript
// ✅ Limpo
import {
  WorkoutCard,
  NewWorkoutModal,
  useWorkouts,
  workoutService,
  type Workout
} from '@/features/workouts';

// ❌ Verboso (sem barrel export)
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard';
import { NewWorkoutModal } from '@/features/workouts/components/NewWorkoutModal';
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts';
```

---

## 🧪 Testing Structure

Com feature-based, testes ficam com o código:

```
src/features/workouts/
├── components/
│   ├── WorkoutCard.tsx
│   └── WorkoutCard.test.tsx       ← Test junto ao código
├── hooks/
│   ├── useWorkouts.ts
│   └── useWorkouts.test.ts
└── services/
    ├── workoutService.ts
    └── workoutService.test.ts
```

**Rodando testes:**
```bash
npm run test                        # Roda tudo
npm run test -- features/workouts  # Apenas workouts
npm run test:watch                 # Watch mode
```

---

## 📈 Escalabilidade Futura

Novo feature? Copie o template:

```bash
# 1. Copy template
cp -r src/features/_template src/features/new-feature

# 2. Rename files
# 3. Update exports in index.ts
# 4. Add to routing
# 5. Done! 🎉

# Time to add: 15 min
```

---

## ✅ Checklist de Migração

- [ ] Nova estrutura criada (paralelo)
- [ ] Path aliases configurados em tsconfig.json
- [ ] Migrada Feature: Auth
  - [ ] Pages movidos
  - [ ] Components movidos
  - [ ] Hooks movidos
  - [ ] Services movidos
  - [ ] Barrel export criado
  - [ ] Imports atualizados
  - [ ] Build sucede ✓
- [ ] Migrada Feature: Workouts
  - [ ] (mesmo checklist)
- [ ] Migrada Feature: Diets
  - [ ] (mesmo checklist)
- [ ] Migrada Feature: Payments
  - [ ] (mesmo checklist)
- [ ] Migrada Feature: Trainers
  - [ ] (mesmo checklist)
- [ ] Migrada Feature: Gyms
  - [ ] (mesmo checklist)
- [ ] Migrada Feature: Messages
  - [ ] (mesmo checklist)
- [ ] Componentes compartilhados movidos para shared/
- [ ] Pastas antigas removidas
- [ ] Nenhum import aponta para diretórios antigos
- [ ] Build sucede: `npm run build` ✓
- [ ] Lint passa: `npm run lint` ✓
- [ ] Testes passam (future): `npm run test` ✓

---

## 🎯 Benefícios Imediatos

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Tempo para adicionar feature | 2-3 horas | 30 min (template) |
| Linhas para importar | 5+ | 1 linha (barrel) |
| Encontrar arquivo relacionado | 5 min | 10 sec |
| Refatorar feature | Complexo | Isolado |
| Onboarding novo dev | Difícil | Fácil (copy template) |
| Risk de conflitos de nome | Alto | Baixo |

---

## 📚 Leitura Recomendada

- [Bulletproof React - Project Structure](https://github.com/alan2207/bulletproof-react#project-structure)
- [Feature-Based Architecture in React](https://www.patterns.dev/posts/module-pattern/)
- [Monorepos - Nx, Turborepo](https://monorepo.tools/)

---

**Versão:** 1.0
**Tempo Estimado de Migração:** 3-4 semanas
**Dificuldade:** Fácil (mecanismo, sem lógica)
**Valor Agregado:** Alto (manutenibilidade, escalabilidade)

