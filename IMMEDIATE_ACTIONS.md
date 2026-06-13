# 🎯 AÇÕES PRÁTICAS IMEDIATAS - MOVR

## ⚠️ CRÍTICO - Faça HOJE (Máximo 1 hora)

### 1️⃣ Remover Arquivos Sensíveis do Git

**Risco:** Suas credenciais Supabase estão públicas no Git!

#### Passo 1: Verificar o que foi commitado
```bash
cd d:\projetos_pessoais\projetos\movr
git log --oneline | head -5
git show HEAD:.env 2>/dev/null && echo "❌ .env está no Git" || echo "✅ .env não está commitado"
git show HEAD:.env.local 2>/dev/null && echo "❌ .env.local está no Git" || echo "✅ .env.local não está commitado"
```

#### Passo 2: Se .env está no Git, remova do histórico
```bash
# CUIDADO: Isto modifica o histórico. Coordene com sua equipe primeiro!

# Opção A: Remover último commit se .env foi adicionado ali
git reset HEAD~1  # Desfaz o último commit
rm .env .env.local
git commit -m "Remove sensitive files"

# Opção B: Remove de todo histórico (mais agressivo)
# Instale git-filter-repo
pip install git-filter-repo

# Remove .env do histórico
git filter-repo --invert-paths --path .env --path .env.local

# Force push (cuidado!)
git push origin --force-with-lease --all
```

#### Passo 3: Verificar supabase/.temp/
```bash
# Remova arquivos temporários
rm -rf supabase/.temp/*
git rm -r --cached supabase/.temp/
git add .gitignore
git commit -m "Remove temporary Supabase files"
git push
```

---

### 2️⃣ Atualizar .gitignore

#### Passo 1: Substituir .gitignore
```bash
# Backup do .gitignore atual
cp .gitignore .gitignore.backup

# Use o novo .gitignore robusto
cp .gitignore-production .gitignore

# Ou edite manualmente e adicione:
cat >> .gitignore << 'EOF'
# Ambiente
.env
.env.local
.env.*.local

# Supabase
supabase/.temp/

# Logs
*.log
npm-debug.log*
EOF

git add .gitignore
git commit -m "Update .gitignore for production safety"
git push
```

#### Passo 2: Validar .gitignore está correto
```bash
# Verificar se .env seria ignorado
git check-ignore .env && echo "✅ .env será ignorado" || echo "❌ .env não será ignorado"
git check-ignore supabase/.temp/file.sql && echo "✅ Temp será ignorado" || echo "❌ Temp não será ignorado"
```

---

### 3️⃣ Revogar Credenciais Comprometidas

**Tempo: 10-15 minutos por serviço**

#### Supabase
```bash
# 1. Acesse: https://app.supabase.com
# 2. Project Settings → API
# 3. Click "Rotate Key" next to anon_key
# 4. Copie nova chave
# 5. Atualize em .env.example e CI/CD secrets

# Local test (não commit!)
# echo "VITE_SUPABASE_ANON_KEY=nova_chave" >> .env.local
# npm run dev
```

#### EmailJS (Se usar)
```bash
# 1. Acesse: https://www.emailjs.com/dashboard
# 2. Account → Regenerate Public Key
# 3. Copie nova chave
# 4. Atualize VITE_EMAILJS_PUBLIC_KEY
```

#### Sentry (Se use)
```bash
# 1. Acesse: https://sentry.io
# 2. Project Settings → Client Keys
# 3. Regenerate Key
# 4. Copie novo DSN
# 5. Atualize VITE_SENTRY_DSN
```

#### Stripe (Se use)
```bash
# 1. Acesse: https://dashboard.stripe.com
# 2. Developers → API Keys
# 3. Click "Roll API Key" on Publishable Key
# 4. Copie chave
# 5. Atualize VITE_STRIPE_PUBLISHABLE_KEY
```

---

### 4️⃣ Atualizar .env.example

```bash
# Edite .env.example com comentários úteis
cat > .env.example << 'EOF'
# Supabase Configuration
# Get from: https://app.supabase.com → Project Settings → API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Sentry Error Tracking
# Get from: https://sentry.io → Project Settings → Client Keys
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# Stripe Payments
# Get from: https://dashboard.stripe.com → Developers → API Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# EmailJS
# Get from: https://www.emailjs.com/dashboard
VITE_EMAILJS_SERVICE_ID=service_...
VITE_EMAILJS_TEMPLATE_ID=template_...
VITE_EMAILJS_PUBLIC_KEY=public_...

# Application Settings
VITE_APP_URL=http://localhost:5173
EOF

git add .env.example
git commit -m "Update .env.example with helpful comments"
git push
```

---

## ⏰ IMPORTANTE - Faça Esta Semana (1-2 horas)

### 5️⃣ Remover `as any` Declarations (Type Safety)

**Por quê:** Erros em runtime que TypeScript não detecta

#### Localizar Problemas
```bash
grep -rn "as any" src/
grep -rn ": any" src/
grep -rn "@ts-ignore" src/
```

#### Exemplo 1: academia.ts linha 148
```typescript
// ❌ ANTES
const profile = data as any;

// ✅ DEPOIS
import type { Profile } from '../types';
const profile = data as Profile;
```

#### Exemplo 2: hooks/useAcademia.ts linha 62
```typescript
// ❌ ANTES
onError: (_err, _updates, context: any) => {

// ✅ DEPOIS
import type { Context } from '@tanstack/react-query';
onError: (_err, _updates, context: Context) => {
```

#### Checklist
```bash
# 1. Abra cada arquivo com grep
grep -n "as any" src/**/*.ts

# 2. Para cada linha:
#    - Importe tipo correto
#    - Substitua "as any" pelo tipo
#    - Verifique build passa
npm run build

# 3. Commit
git add .
git commit -m "Replace 'as any' with proper types"
git push
```

---

### 6️⃣ Criar Estrutura de Pastas (Feature-Based)

**Por quê:** Escalabilidade, menos imports circulares, melhor organização

#### Antes (Atual)
```
src/
├── components/      ← 18 arquivos mistos
├── hooks/          ← 16 hooks mistos
├── pages/          ← Apenas por rota
└── services/       ← 13 services planos
```

#### Depois (Proposta)
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   ├── workouts/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── diets/
│   └── payments/
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── lib/            ← Config central
└── types/          ← Tipos globais
```

#### Implementação (Gradual)
```bash
# Semana 1: Criar estrutura
mkdir -p src/features/{auth,workouts,diets,payments}
mkdir -p src/features/auth/{components,hooks,services}
mkdir -p src/shared/components
mkdir -p src/shared/hooks
mkdir -p src/shared/utils

# Semana 2: Mover arquivos (um feature por vez)
# Exemplo: Auth
mv src/components/LoginPage.tsx src/features/auth/pages/
mv src/pages/LoginPage.tsx src/features/auth/pages/
mv src/hooks/useAuth.ts src/features/auth/hooks/
mv src/services/auth.ts src/features/auth/services/

# Semana 3: Atualizar imports
# Search & Replace em IDE
# Substituir: import { LoginPage } from '@/pages'
# Por: import { LoginPage } from '@/features/auth/pages'

# Semana 4: Remover pastas antigas
# rm -rf src/pages src/components (depois de migração completa)
```

#### Verificar Circularidade
```bash
npm install -g madge
madge --circular src/
# Não deve retornar nada
```

---

### 7️⃣ Adicionar Logging Estruturado

**Por quê:** Debugging em produção, monitoramento

#### Criar Logger Utils
```typescript
// src/shared/utils/logger.ts
export const logger = {
  debug: (msg: string, data?: unknown) => {
    if (import.meta.env.DEV) console.log(`[DEBUG] ${msg}`, data);
  },
  info: (msg: string, data?: unknown) => {
    console.log(`[INFO] ${msg}`, data);
  },
  warn: (msg: string, data?: unknown) => {
    console.warn(`[WARN] ${msg}`, data);
  },
  error: (msg: string, error?: unknown) => {
    console.error(`[ERROR] ${msg}`, error);
    // Enviar para Sentry
    if (import.meta.env.PROD) {
      // Sentry.captureException(error);
    }
  },
};
```

#### Usar em lugar de console.log
```typescript
// ❌ ANTES
console.error('User fetch failed', error);

// ✅ DEPOIS
import { logger } from '@/shared/utils/logger';
logger.error('User fetch failed', error);
```

---

### 8️⃣ Criar GitHub Actions CI/CD

**Arquivo: .github/workflows/build.yml**

```bash
# 1. Criar pasta .github/workflows
mkdir -p .github/workflows

# 2. Criar arquivo build.yml
cat > .github/workflows/build.yml << 'EOF'
name: Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Security audit
        run: npm audit --production
EOF

# 3. Commit
git add .github/
git commit -m "Add CI/CD pipeline"
git push
```

---

## 📊 MÉDIO - Faça Este Mês (4-6 horas)

### 9️⃣ Melhorar Error Handling

#### Criar Error Boundary Melhorado
```typescript
// src/shared/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    
    // Sentry.captureException(error);
  }
}
```

#### Melhorar Try-Catch
```typescript
// ❌ ANTES
try {
  await api.fetchUser();
} catch (error) {
  console.error(error);
}

// ✅ DEPOIS
try {
  await api.fetchUser();
} catch (error) {
  logger.error('Failed to fetch user', error);
  toast.error('Failed to load user. Please try again.');
  // Sentry.captureException(error);
}
```

---

### 🔟 Adicionar Testes

```bash
# Install testing libraries
npm install --save-dev vitest @testing-library/react @testing-library/user-event

# Criar test file example
cat > src/components/ErrorBoundary.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    expect(getByText('Test content')).toBeDefined();
  });
});
EOF

# Run tests
npm run test
```

---

## 📋 Checklist Completo

### Crítico ⚠️
- [ ] Removido .env do Git
- [ ] Removido .env.local do Git
- [ ] Revogadas credenciais comprometidas
- [ ] .gitignore atualizado
- [ ] .env.example com comentários

### Alto 🔴
- [ ] Removed `as any` declarations (top priority)
- [ ] GitHub Actions CI/CD configurado
- [ ] Logging estruturado
- [ ] Error handling melhorado

### Médio 🟡
- [ ] Estrutura de pastas migrada
- [ ] Testes adicionados
- [ ] Documentação completada
- [ ] Performance auditada

### Baixo 🟢
- [ ] Refatoração de componentes
- [ ] Otimização de bundle
- [ ] PWA offline features
- [ ] Analytics avançado

---

## 📞 Contatos para Ajuda

| Problema | Recurso |
|----------|---------|
| Git recovery | https://github.com/newren/git-filter-repo |
| TypeScript errors | https://www.typescriptlang.org/docs/handbook/ |
| React Query | https://tanstack.com/query/latest |
| Supabase RLS | https://supabase.com/docs/guides/auth/row-level-security |
| Vercel Deploy | https://vercel.com/docs |
| Sentry Setup | https://docs.sentry.io/product/integrations/frontends/react/ |

---

**Tempo Total: ~5-8 horas para completar tudo**
**Recomendação: Fazer em 2-3 dias, não tudo de uma vez**

