# 🔐 SECURITY BEST PRACTICES - MOVR

Guia de boas práticas de segurança específico para o projeto MOVR.

---

## 1. 🔑 Segurança de Chaves e Credenciais

### Princípio: Never Trust the Client

**O que é público (seguro):**
- `VITE_SUPABASE_URL` → URL do projeto
- `VITE_SUPABASE_ANON_KEY` → Chave anon (protegida por RLS)
- `VITE_STRIPE_PUBLISHABLE_KEY` → Chave pública Stripe
- `VITE_SENTRY_DSN` → DSN público

**O que NUNCA deve ser público:**
- `SUPABASE_SERVICE_ROLE_KEY` ❌
- `SUPABASE_JWT_SECRET` ❌
- `STRIPE_SECRET_KEY` ❌
- `EMAILJS_PRIVATE_KEY` ❌ (if exists)
- Database passwords ❌
- API keys de terceiros ❌

### Verificação
```bash
# Verificar se há secrets expostos
grep -r "SERVICE_ROLE_KEY" .
grep -r "SECRET_KEY" .
grep -r "sk_" .  # Stripe secret keys começam com sk_

# Resultado esperado:
# 0 matches

# Se encontrar algo, é um problema de segurança!
```

### Storage Seguro
```typescript
// ✅ BOM: Via Vercel Secrets (Production)
// 1. Go to Vercel Dashboard → Settings → Environment Variables
// 2. Add with Production scope only
// 3. Accessed via process.env in server

// ✅ BOM: Via .env.local (Development)
// 1. NEVER commit
// 2. Created locally, not in version control
// 3. Referenced in .gitignore

// ❌ RUIM: Hardcoded no código
const SECRET_KEY = "xyz123abc"; // NUNCA!

// ❌ RUIM: Em .env (se commitado)
// Resultado: Credenciais públicas no GitHub
```

---

## 2. 🛡️ Supabase - Row Level Security (RLS)

### Como Funciona

```
Usuário → Request → Middleware RLS → Policy Check → DB Response
                          ↓
                    Bloqueia dados não autorizados
```

### Verificar RLS Policies

```sql
-- Acessar: Supabase Dashboard → SQL Editor

-- 1. Verificar que RLS está ativado
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Resultado esperado: Todos com rowsecurity = TRUE (t)
```

### Policy Examples (No projeto)

#### Profiles Table
```sql
-- Qualquer pessoa autenticada pode ler profiles (para descobrir PTs)
CREATE POLICY "Read public profiles"
  ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Usuários podem atualizar apenas seus próprios perfis
CREATE POLICY "Update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

#### Workouts Table (Privado)
```sql
-- Aluno pode ler apenas seus próprios workouts
CREATE POLICY "Aluno reads own workouts"
  ON workouts
  FOR SELECT
  USING (student_id = auth.uid());

-- PT pode ler apenas de seus alunos
CREATE POLICY "PT reads student workouts"
  ON workouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = workouts.student_id
      AND students.personal_id = auth.uid()
    )
  );
```

### Testing RLS

```bash
# 1. Criar teste de RLS
cat > test-rls.sql << 'EOF'
-- Test 1: Aluno não pode ler workout de outro aluno
SELECT * FROM workouts 
WHERE student_id != auth.uid()
LIMIT 1;
-- Esperado: 0 rows

-- Test 2: PT pode ler workout de seus alunos
SELECT * FROM workouts
WHERE EXISTS (
  SELECT 1 FROM students
  WHERE students.id = workouts.student_id
  AND students.personal_id = auth.uid()
)
LIMIT 1;
-- Esperado: Rows return correctly
EOF

# 2. Executar teste
# No Supabase: SQL Editor → Cole o código acima
```

### Best Practices

✅ **Fazer:**
- Habilitar RLS em TODAS as tabelas de dados sensíveis
- Testar policies com diferentes users
- Revisar policies regularmente
- Logar RLS violations (Supabase Pro feature)
- Usar Row Level Functions para lógica complexa

❌ **NÃO fazer:**
- Usar `SECURITY INVOKER` sem saber o que faz
- Confiar APENAS em application-level checks
- Deixar `auth.uid()` sem tipo correto
- Criar policies muito complexas (performance)

---

## 3. 🔐 Autenticação e Autorização

### Authentication Flow (Já Implementado ✅)

```
User → Email + Password → Supabase.auth.signUp()
                              ↓
                      Email de confirmação
                              ↓
User clicks link → auth/callback?code=xyz
                              ↓
                      Token validado
                              ↓
              Session criada + localStorage JWT
                              ↓
                      User autenticado ✅
```

### Verificação de Implementação

```typescript
// src/contexts/AuthContext.tsx
// ✅ Checkpoints:

// 1. Email confirmation
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { 
    emailRedirectTo: `${env.app.url}/auth/callback`,
  },
});

// 2. OAuth redirect
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${env.app.url}/auth/callback`,
  },
});

// 3. Session persistence
const { data: { session } } = await supabase.auth.getSession();
```

### Best Practices

✅ **Fazer:**
```typescript
// Use Supabase SDK (já maneja tokens corretamente)
const user = await supabase.auth.getUser();

// Verificar auth antes de mostrar dados
if (!user) return <LoginPage />;

// Usar session tokens (não store aqui)
const { data: { session } } = await supabase.auth.getSession();
```

❌ **NÃO fazer:**
```typescript
// Não armazene senhas
localStorage.setItem('password', password); // ❌

// Não confie apenas em JWT no localStorage
// (XSS pode ler)
const token = localStorage.getItem('auth.token');
// Use sessionStorage ou HttpOnly cookies quando possível

// Não hardcode redirect URLs
redirectTo: 'http://localhost:5173/callback'; // ❌
// Use variáveis de ambiente
redirectTo: `${env.app.url}/callback`; // ✅
```

### Password Security

```typescript
// Supabase já maneja hash seguro
// Configuração em Supabase:
// - Hash algorithm: bcrypt
// - Hash cost: 12 rounds

// Seu código:
const { data, error } = await supabase.auth.signUp({
  email,
  password, // Supabase vai fazer hash
});
```

### Token Management

```typescript
// ✅ Tokens são gerenciados automaticamente
const { data: { session } } = await supabase.auth.getSession();

// Refresh token é automático
// Expiração padrão: 1 hora access token, 1 semana refresh

// Configurar em Supabase Dashboard:
// - Authentication → Settings
// - JWT Expiry: 3600 (1 hora)
// - Refresh token: 604800 (7 dias)
```

---

## 4. 🚨 Input Validation e Sanitization

### Zod Validation (Já Implementado ✅)

```typescript
// src/lib/validations.ts

// ✅ Validar emails
const emailSchema = z.string().email('Email inválido');

// ✅ Validar URLs
const urlSchema = z.string().url('URL inválida');

// ✅ Validar ranges
const ageSchema = z.number().min(18).max(120);

// ✅ Validar padrões
const phoneSchema = z.string().regex(/^\d{10,11}$/);
```

### Usage em Formulários

```typescript
// ❌ ANTES: Sem validação
const { data } = await supabase
  .from('workouts')
  .insert({ name: userInput.name });  // PERIGO!

// ✅ DEPOIS: Com validação
import { workoutSchema } from '@/lib/validations';

const validated = workoutSchema.parse(userInput);
const { data } = await supabase
  .from('workouts')
  .insert(validated);
```

### XSS Prevention

```typescript
// ✅ React sanitiza por padrão
<div>{userInput}</div>
// React escapa: <script> vira &lt;script&gt;

// ⚠️ CUIDADO com dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// NUNCA use isto com input de usuário!

// ✅ Se precisa HTML, use DOMPurify
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

### SQL Injection Prevention

```typescript
// ✅ SEGURO: Supabase maneja automaticamente
const { data } = await supabase
  .from('users')
  .select()
  .eq('email', userEmail);  // Parameterized automatically

// ❌ NUNCA faça string concatenation em SQL bruto!
// VOCÊ não escreve SQL raw em Supabase (bom!)
```

---

## 5. 🌐 CORS e Headers de Segurança

### CORS Setup (Vercel automático ✅)

```typescript
// Vercel automaticamente configura CORS para:
// - GET, POST, PUT, DELETE, PATCH
// - Domínio: seu site
// - Headers: Content-Type, Authorization

// Supabase CORS:
// - Allow-Origin: * (protegido por RLS)
// - Headers: Accept, Accept-Language, Content-Language, Content-Type
```

### Security Headers (Vercel automático ✅)

```
// Vercel fornece:
X-Content-Type-Options: nosniff         // Previne MIME sniffing
X-Frame-Options: SAMEORIGIN             // Previne clickjacking
X-XSS-Protection: 1; mode=block         // Legacy XSS filter
Referrer-Policy: strict-origin-when-cross-origin
```

### Adicional (Considere Implementar)

```javascript
// vercel.json (adicione)
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; img-src 'self' data: https:;"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

---

## 6. 🔒 Sensitive Data Protection

### PII (Personally Identifiable Information)

```typescript
// ❌ NUNCA log PII
console.log('User email:', user.email);  // NÃO!

// ✅ Log apenas hashes ou IDs
logger.info('User login', { userId: user.id });

// ✅ Sentry: Configure para não capturar PII
// lib/sentry.ts
Sentry.init({
  beforeSend(event) {
    // Remove email se presente
    if (event.user?.email) {
      delete event.user.email;
    }
    return event;
  },
});
```

### API Keys in Logs

```typescript
// ❌ NUNCA
console.log('API Response:', response); // Pode conter secrets

// ✅ SEMPRE sanitize
const sanitized = {
  ...response,
  apiKey: '***' + response.apiKey.slice(-4),
};
logger.info('API Response', sanitized);
```

### Database Backups

```sql
-- Supabase faz backup automático (Pro+)
-- Backups contêm todas as dados
-- NUNCA download para máquina local sem criptografia

-- Restaurar backup:
-- 1. Supabase Dashboard → Backups
-- 2. Click "Restore" next to backup
-- 3. Database estará readonline por 30 min
```

---

## 7. 📱 Mobile/Web Security

### Content Security Policy (CSP)

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;">
```

### Secure Cookie Flags

```typescript
// Supabase configura automaticamente:
// - HttpOnly: true (não acessível via JS)
// - Secure: true (apenas HTTPS)
// - SameSite: Lax (previne CSRF)
```

### localStorage vs sessionStorage

```typescript
// ✅ SEGURO: Session storage
sessionStorage.setItem('temp_data', data);
// Limpa quando fecha aba

// ⚠️ MODERADO: Local storage (XSS risk)
localStorage.setItem('user_preferences', data);
// Não limpa; XSS pode ler

// ❌ INSEGURO: Senhas
localStorage.setItem('password', password);
// NUNCA! Store tokens, not passwords
```

---

## 8. 🛡️ Third-Party Dependencies

### Regular Audits

```bash
# Check para vulnerabilidades
npm audit

# Resultado:
# 0 vulnerabilities = ✅
# Any critical = ❌ Fix immediately

# Atualizar automaticamente (minor/patch)
npm audit fix

# Update major version (check breaking changes first)
npm update package-name@latest
npm run build  # Verify build succeeds
```

### Lock File

```bash
# ✅ SEMPRE commit package-lock.json
git add package-lock.json
git commit

# Uso em CI/CD
npm ci  # Instead of npm install (uses lock file)
```

### Review Dependencies

```bash
# Lista todas as dependências
npm list

# Checar para packages não usadas
npm install -g depcheck
depcheck

# Remover não-usadas
npm uninstall unused-package
```

---

## 9. 📊 Monitoring & Incident Response

### Error Tracking (Sentry) ✅

```typescript
// Já configurado em lib/sentry.ts

// Capture manually:
import * as Sentry from '@sentry/react';
Sentry.captureException(error);

// Breadcrumbs (context)
Sentry.captureMessage('User action', 'info');

// Alerts (configure em Sentry Dashboard)
// - Critical errors → email
// - More than 10 errors → slack webhook
```

### Audit Logs

```sql
-- Supabase Pro: Audit logs
-- Dashboard → Logs → Event Logs
-- Mostra: Who, What, When, From Where

-- Exemplo:
SELECT * FROM auth.audit_log_entries 
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### Monitoring Checklist

- [ ] Sentry alerts configurados
- [ ] Daily error review
- [ ] Response time monitored
- [ ] Database performance checked
- [ ] API rate limits configured
- [ ] Backup verification weekly

---

## 10. 🚀 Production Deployment Security

### Pre-Deploy

```bash
# 1. Security scan
npm audit

# 2. Build test
npm run build

# 3. Lint check
npm run lint

# 4. No secrets in code
grep -r "SUPABASE_SERVICE" src/
grep -r "SECRET" src/
# Resultado esperado: 0 matches
```

### Deploy Config

```yaml
# vercel.json
{
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  },
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "public": false
}
```

### Post-Deploy Verification

```bash
# 1. SSL/TLS working
curl -I https://yourdomain.com | grep -i secure

# 2. Headers present
curl -I https://yourdomain.com | grep -E "X-Content|X-Frame"

# 3. App loading
curl https://yourdomain.com | grep -i react

# 4. Sentry receiving errors
# Go to sentry.io → check recent events
```

---

## Checklist de Segurança para Comercialização

- [ ] RLS habilitado em todas as tabelas
- [ ] Nenhuma credencial em .env commitado
- [ ] Validação Zod em todos os inputs
- [ ] Error boundaries implementado
- [ ] Sentry configurado
- [ ] HTTPS/SSL ativo
- [ ] CORS headers corretos
- [ ] Rate limiting implementado
- [ ] Audit logs configurados
- [ ] Backup strategy definida
- [ ] Disaster recovery plano
- [ ] Security headers ativo
- [ ] OWASP Top 10 reviewed
- [ ] Dependências auditadas

---

## 📚 Recursos

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase Security: https://supabase.com/docs/guides/auth
- Vercel Security: https://vercel.com/docs/security
- NPM Security: https://docs.npmjs.com/packages-and-modules/security

---

**Versão:** 1.0
**Última Atualização:** 2026-06-12
**Status:** Pronto para Comercialização

