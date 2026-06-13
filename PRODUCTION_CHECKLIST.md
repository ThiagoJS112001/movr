# 🚀 Checklist de Produção - MOVR

> Análise completa e recomendações para deixar o projeto pronto para comercialização e uso em produção.

---

## 📋 Sumário Executivo

| Categoria | Status | Prioridade | Risco |
|-----------|--------|-----------|-------|
| Segurança | ⚠️ CRÍTICO | P0 | ALTO |
| Arquivo de Controle | ⚠️ ERROS | P0 | ALTO |
| Configuração | ⚠️ INCOMPLETO | P1 | MÉDIO |
| Estrutura | 📋 MELHORÁVEL | P2 | BAIXO |
| Documentação | ❌ AUSENTE | P1 | MÉDIO |

---

## 🔴 PROBLEMAS CRÍTICOS (Fix Now!)

### 1. Arquivos Sensíveis Commitados ⚠️ CRÍTICO

**ENCONTRADO:**
- ✗ `.env` - Contém credenciais reais de produção
- ✗ `.env.local` - Arquivo local com dados sensíveis

**RISCO:** Suas chaves Supabase/API estão públicas no Git!

**AÇÃO IMEDIATA:**
```bash
# 1. Remova do histórico do Git
git filter-branch --tree-filter 'rm -f .env .env.local' -f -- --all
git filter-branch --tree-filter 'rm -f supabase/.temp/*' -f -- --all

# 2. Force push (cuidado: afeta colaboradores)
git push origin --all --force

# 3. Revogue TODAS as chaves comprometidas em:
# - Supabase Dashboard → Settings → API
# - EmailJS
# - Sentry
# - Stripe
# - Gere novas chaves
```

**Credenciais Comprometidas:** ⚠️ **REVOGUE IMEDIATAMENTE**

---

## 📁 Arquivos/Pastas para Remover

| Item | Localização | Razão |
|------|-----------|-------|
| `.env` | Raiz | Nunca commit credenciais |
| `.env.local` | Raiz | Arquivo local pessoal |
| `supabase/.temp/` | supabase/ | Arquivos temporários |
| `dist/` | Raiz | Build gerado (gitignored) |
| `node_modules/` | Raiz | Deps gerenciadas por npm |

```bash
# Remover do Git
git rm --cached .env .env.local
git rm -r --cached supabase/.temp/
git commit -m "Remove sensitive files from version control"
```

---

## 🔐 RISCOS DE SEGURANÇA IDENTIFICADOS

### 1. **Supabase - Chaves Públicas Expostas**

**Status:** ⚠️ CRÍTICO

**Problema:**
```typescript
// ❌ INSEGURO - Chave anon está pública (esperado no Vite)
export const supabase = createClient<Database>(
  env.supabase.url,
  env.supabase.anonKey  // ← Visível no JS do cliente
);
```

**Solução (Row Level Security - RLS):**
✅ **Já implementado** - Verifique `/supabase/rls.sql`

**Verificação necessária:**
```sql
-- No Supabase Console, confirme RLS está ativado
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

### 2. **Variáveis de Ambiente em Vite**

**Status:** ⚠️ MÉDIO

**Problema:**
- Todas as vars com `VITE_` ficam públicas no JS
- Nunca coloque secrets do servidor em `VITE_*`

**Seguro (público no cliente):**
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅ (protegido por RLS)
- `VITE_STRIPE_PUBLISHABLE_KEY` ✅
- `VITE_SENTRY_DSN` ✅

**Inseguro (nunca use `VITE_` para isso):**
- ❌ `VITE_SUPABASE_SERVICE_KEY` 
- ❌ `VITE_DATABASE_PASSWORD`
- ❌ `VITE_API_SECRET_KEY`

---

### 3. **TypeScript - Many `as any` Warnings**

**Status:** ⚠️ MÉDIO

**Encontrado:**
```typescript
// ❌ Perigoso em produção
const profile = data as any;  // src/services/academia.ts:148
} as any);  // Multiple locations

// ❌ Falta tipagem
onError: (_err, _updates, context: any) => { ... }  // hooks/useAcademia.ts
```

**Impacto:** Erros em runtime que o TypeScript não detecta

**Ação:** Ver seção "Melhorias de Tipagem" abaixo

---

### 4. **Supabase - RLS Policy Risks**

**Status:** 🟡 MÉDIO

**Verificar:**
```sql
-- Confirme que cada tabela tem policies ativas
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
```

**Recomendações:**
- ✅ `profiles` - RLS ativo (verificado)
- ✅ `workouts` - RLS ativo
- ⚠️ Verificar: `gyms`, `payments`, `messages`

---

### 5. **Mensagens de Erro - Information Disclosure**

**Status:** 🟡 MÉDIO

**Risco:**
```typescript
// ❌ Expõe detalhes internos ao usuário
if (error) throw new Error(error.message);  // Pode revelar schema do DB

// ❌ Console em produção
if (import.meta.env.DEV) console.error(...);  // OK, mas verificar em build
```

**Solução:**
```typescript
// ✅ Mensagens genéricas para usuário
if (error) {
  console.error('[internal]', error);  // Log interno
  throw new Error('Falha ao carregar dados. Tente novamente.');
}
```

---

### 6. **Email com EmailJS**

**Status:** 🟡 MÉDIO

**Risco:** Chave pública no cliente

**Verificação:**
- Chave `VITE_EMAILJS_PUBLIC_KEY` deve estar restrita no Dashboard
- Configurar "Authorized Domains"

---

### 7. **Sentry - PII Exposure**

**Status:** 🟡 MÉDIO

**Verificar config:**
```typescript
// supabase/.env.production
VITE_SENTRY_DSN=https://...

// Sentry settings:
// - Antes de enviar: stripPersonalData = true ✅
// - denyUrls: filtre vendors/CDNs
// - allowUrls: apenas seu domínio
```

---

### 8. **OAuth - Callback URL Hardcoding**

**Status:** 🟡 MÉDIO

```typescript
// ❌ Potencial problema
const GOOGLE_CALLBACK = 'http://localhost:5173/auth/callback';

// ✅ Use variável de ambiente
const GOOGLE_CALLBACK = env.app.url + '/auth/callback';
```

---

## ✅ APROVADO (Práticas Corretas)

| Área | Status | Detalhes |
|------|--------|----------|
| Env Validation | ✅ | `lib/env.ts` valida vars na startup |
| Error Boundaries | ✅ | `components/ErrorBoundary.tsx` implementado |
| React Query | ✅ | Caching e refetch strategies |
| Responsive Design | ✅ | Tailwind + mobile-first |
| Dark Mode | ✅ | ThemeContext implementado |
| PWA | ✅ | Manifest + Service Worker |
| Build Optimization | ✅ | Rollup visualizer configurado |

---

## 📊 Problemas Identificados por Categoria

### TypeScript & Type Safety

**Encontrado: 20+ `as any` declarations**

```typescript
// ❌ Crítico - sem tipagem
const data = row as any;
const items = (response ?? []).map((r: any) => r.field);
```

**Prioridade:** P2 (Médio)

**Impacto:** Erros em runtime, IDE sem autocompletar

---

### Documentação

**Status:** ❌ FALTANDO

**Ausências críticas:**
- [ ] Guia de Deploy (Vercel, Docker, PM2)
- [ ] Documentação de Segurança
- [ ] Variáveis de Ambiente Produção
- [ ] Scripts de Database
- [ ] Procedure para On-boarding
- [ ] Disaster Recovery

---

### Logs & Debugging

**Status:** 🟡 INCOMPLETO

**Encontrado:**
```typescript
if (import.meta.env.DEV) console.error(...);  // Apenas dev
```

**Problema:**
- Sem logs estruturados em produção
- Sem correlação de erros
- Sentry está configurado (bom!)

---

## 🎯 ESTRUTURA RECOMENDADA PARA PRODUÇÃO

### Atual
```
movr/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   └── types/
└── supabase/
```

### Proposta (Escalável)
```
movr/
├── src/
│   ├── components/
│   │   ├── common/           # ← Componentes reutilizáveis
│   │   ├── layout/
│   │   ├── forms/
│   │   └── ui/
│   ├── features/             # ← Por feature
│   │   ├── auth/
│   │   ├── workouts/
│   │   ├── diets/
│   │   └── payments/
│   ├── shared/               # ← Código compartilhado
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types/
│   ├── config/               # ← Configurações centralizadas
│   ├── services/             # ← API calls
│   ├── lib/                  # ← Utilities (env, sentry, etc)
│   └── pages/                # ← Page routes (se não usar feature-based)
├── scripts/                  # ← Scripts de automação
├── supabase/
├── docs/                     # ← Documentação
└── .github/workflows/        # ← CI/CD
```

---

## 🛡️ HARDENING CHECKLIST

### Supabase

- [ ] RLS habilitado em todas as tabelas
- [ ] `service_role_key` nunca em `.env`
- [ ] Chaves rotacionadas em ambiente novo
- [ ] Backup strategy definida
- [ ] Database versioning (migrations)
- [ ] Audit logs ativados (Pro plan)

### Node / Build

- [ ] Dependências sem vulnerabilidades: `npm audit`
- [ ] Lock file no Git (`package-lock.json`)
- [ ] Build determinístico: `npm ci`
- [ ] Source maps não expostos em produção
- [ ] Compression habilitado (gzip)

### Secrets Management

- [ ] `.env` nunca commitado
- [ ] `.env.example` como template
- [ ] Secrets gerenciados via CI/CD (GitHub Secrets, Vercel)
- [ ] Rotação de chaves periodicamente
- [ ] Auditoria de acesso a secrets

### Deployment

- [ ] Staging environment 1:1 com produção
- [ ] Preview deploys automáticos
- [ ] Health checks implementados
- [ ] Monitoring/Alerting
- [ ] Rollback strategy
- [ ] Database backups diários

---

## 📝 .gitignore ROBUSTO

Veja arquivo separado: `.gitignore-production`

---

## 🚀 DEPLOY CHECKLIST

### Pré-Deploy
- [ ] Código revisado (code review)
- [ ] Testes passam (`npm run build`)
- [ ] Lint passa (`npm run lint`)
- [ ] Secrets atualizados em staging
- [ ] Database migrations testadas
- [ ] Rollback plan documentado

### Deploy
- [ ] Usar CI/CD (não manual)
- [ ] Blue-green deployment
- [ ] Canary release (1-5% users)
- [ ] Monitor erros em tempo real

### Pós-Deploy
- [ ] Smoke tests
- [ ] Verificar logs
- [ ] Testes de usuário real
- [ ] Performance profiling

---

## 📞 CONTATOS E RECURSOS

| Serviço | Documentação | Checklist |
|---------|-------------|----------|
| Supabase | https://supabase.com/docs | Security Guide |
| Vercel | https://vercel.com/docs | Env Vars Best Practices |
| Sentry | https://docs.sentry.io | Error Tracking Setup |
| Stripe | https://stripe.com/docs | PCI Compliance |

---

## 🎓 Próximos Passos (Ordenados por Prioridade)

### P0 - CRÍTICO (Faça HOJE)
1. ✅ Revogue chaves expostas no Git
2. ✅ Remove `.env` do histórico
3. ✅ Genere novas credenciais
4. ✅ Atualize `.env.example`

### P1 - ALTO (Esta Semana)
1. Implementar logging estruturado
2. Adicionar rate limiting
3. Implementar CORS corretamente
4. Adicionar health check endpoint

### P2 - MÉDIO (Este Mês)
1. Remover `as any` declarations
2. Melhorar error handling
3. Adicionar testes E2E
4. Implementar CI/CD completo

### P3 - BAIXO (Próximo Sprint)
1. Refatorar estrutura (feature-based)
2. Adicionar documentação completa
3. Otimizar bundle size
4. Implementar PWA offline features

---

**Última Atualização:** 2026-06-12
**Versão do Projeto:** 0.0.0
**Status:** 🟡 Em Desenvolvimento
