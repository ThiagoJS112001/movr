# 🚀 DEPLOYMENT GUIDE - MOVR

Guia completo para implantar o MOVR em produção com segurança e escalabilidade.

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migrations](#database-migrations)
4. [Vercel Deployment](#vercel-deployment)
5. [Alternative: Docker + PM2](#alternative-docker--pm2)
6. [Security Verification](#security-verification)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality (Pre-Commit)
```bash
# 1. Verify no sensitive data is committed
grep -r "SUPABASE_SERVICE_ROLE_KEY" .
grep -r "STRIPE_SECRET_KEY" .
grep -r "password" .env 2>/dev/null

# 2. Run linter
npm run lint

# 3. Build test (TypeScript check + Vite build)
npm run build

# 4. Check for console.error in production code
grep -r "console\." src/ | grep -v "DEV" | head -10
```

### Environment Variables
```bash
# Get from Supabase Dashboard (Team Settings → Billing Settings)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Get from Sentry Project Settings
VITE_SENTRY_DSN=https://public@sentry.io/project-id

# Get from Stripe Dashboard
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# EmailJS (from emailjs.com dashboard)
VITE_EMAILJS_SERVICE_ID=service_...
VITE_EMAILJS_TEMPLATE_ID=template_...
VITE_EMAILJS_PUBLIC_KEY=public_...

# Application
VITE_APP_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com  # If needed
```

---

## Environment Setup

### 1. Supabase Database Preparation

#### Create a Production Database
```bash
# 1. Go to Supabase Dashboard
# 2. Team Settings → Billing → Create New Project
# 3. Set up with PostgreSQL 16+
# 4. Wait for initialization (5-10 minutes)
```

#### Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations to production
supabase migration list
supabase push

# Verify RLS is enabled
supabase inspect --column auth.users
```

#### Verify RLS Policies
```sql
-- Run in Supabase Dashboard → SQL Editor
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- All should return 't' (true)
```

### 2. API Keys Security

#### Rotate Keys in Supabase
```bash
# 1. Go to Project Settings → API
# 2. Note current keys in a secure location (1Password, LastPass)
# 3. Click "Rotate Key" next to anon_key
# 4. Copy new key and update env vars
# 5. Do NOT rotate service_role_key (internal use only)
```

#### Store Secrets in CI/CD
```bash
# GitHub Actions
# 1. Go to Repository Settings → Secrets and Variables → Actions
# 2. Click "New repository secret"
# 3. Add each VITE_* variable
# 4. Name examples:
#    - VITE_SUPABASE_URL
#    - VITE_SUPABASE_ANON_KEY
#    - VITE_SENTRY_DSN
#    - etc.

# Vercel
# 1. Go to Project Settings → Environment Variables
# 2. Add same variables with "Production" scope
# 3. Redeploy to apply
```

### 3. Email Configuration

#### EmailJS Setup
```bash
# 1. Go to emailjs.com → Account
# 2. Create a Gmail service connection
# 3. Create email template with variables:
#    - {{user_name}}
#    - {{confirmation_link}}
#    - {{token}}

# 2. Get credentials:
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=public_key_here

# 3. Update in .env.production and CI/CD secrets
```

### 4. Monitoring Setup

#### Sentry Configuration
```bash
# 1. Create Sentry account: https://sentry.io
# 2. Create new project → React
# 3. Get DSN from Settings
# 4. Update VITE_SENTRY_DSN

# 5. Configure allowed domains:
#    Settings → Error Tracking → Allowed Domains
#    Add: yourdomain.com, *.yourdomain.com

# 6. Configure performance monitoring:
#    Settings → Performance → Enable
#    Set tracesSampleRate in lib/sentry.ts
```

#### Database Backups (Supabase)
```bash
# Supabase Pro Plan includes hourly backups
# 1. Settings → Backups
# 2. Enable Point-in-Time Recovery (Pro+)
# 3. Schedule weekly exports

# Manual backup
pg_dump postgresql://user:password@db.supabase.co:5432/postgres > backup.sql
```

---

## Database Migrations

### Development to Production Flow
```bash
# 1. Test locally
supabase start
npm run dev

# 2. Create migration
supabase migration new add_new_table

# 3. Write SQL in supabase/migrations/YYYYMMDDHHMMSS_add_new_table.sql

# 4. Test migration
supabase migration up

# 5. Push to production
supabase push

# 6. Verify on production
# Go to Supabase Dashboard → SQL Editor
# Run: SELECT * FROM your_new_table LIMIT 1;
```

### Rollback Strategy
```bash
# If migration fails in production:
# 1. DO NOT manually delete data
# 2. Create new migration to fix schema
# 3. Verify in staging first
# 4. Deploy fix

# Check migration history
supabase migration list --remote
```

---

## Vercel Deployment

### Recommended Setup (Best for Movr)

#### Step 1: Push to GitHub
```bash
git remote add origin https://github.com/yourusername/movr.git
git branch -M main
git push -u origin main
```

#### Step 2: Import in Vercel
```bash
# 1. Go to vercel.com/dashboard
# 2. Click "Add New..." → Project
# 3. Select "Import Git Repository"
# 4. Search for "movr"
# 5. Select repository
```

#### Step 3: Configure Environment
```bash
# In Vercel Dashboard:
# 1. Go to Settings → Environment Variables
# 2. Add for Production:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SENTRY_DSN=...
VITE_STRIPE_PUBLISHABLE_KEY=...
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
VITE_APP_URL=https://yourdomain.com

# 3. Click "Save"
```

#### Step 4: Deploy
```bash
# Option A: Manual
# Click "Deploy" in Vercel Dashboard

# Option B: Git Push
git push origin main  # Automatically deploys

# Option C: CLI
npm i -g vercel
vercel
```

#### Step 5: Domain Configuration
```bash
# 1. In Vercel: Project Settings → Domains
# 2. Add domain: yourdomain.com
# 3. Follow DNS configuration instructions
# 4. Point CNAME to cname.vercel-dns.com

# 5. Configure in Supabase:
#    Settings → API → Allowed Redirect URLs
#    Add: https://yourdomain.com/auth/callback
```

#### Step 6: Verify Deployment
```bash
# Test in browser
curl https://yourdomain.com
# Should return index.html

# Check build logs
vercel logs yourdomain.com --follow

# Test API calls
curl https://yourdomain.com/api/health
```

### Vercel Best Practices
```bash
# 1. Enable automatic deploys on main
vercel env pull  # Get production env vars locally (for testing)

# 2. Preview deploys on PR
# Automatically enabled - every PR gets a preview URL

# 3. Monitor performance
vercel analytics

# 4. Enable error tracking
# Already integrated with Sentry

# 5. Setup custom domain with SSL
# Automatic - no additional steps
```

---

## Alternative: Docker + PM2

### Docker Setup

#### Create Dockerfile
```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 5173

# Start server
CMD ["npm", "run", "preview"]
```

#### Create docker-compose.yml
```yaml
version: '3.8'

services:
  movr:
    build: .
    ports:
      - "5173:5173"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
      - VITE_APP_URL=https://yourdomain.com
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5173"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Build & Run
```bash
# Build image
docker build -t movr:latest .

# Run container
docker run -d \
  -p 5173:5173 \
  --env-file .env.production \
  --name movr \
  movr:latest

# Or with compose
docker-compose -f docker-compose.yml up -d
```

### PM2 Setup (Node.js Process Manager)

#### Install PM2
```bash
npm install -g pm2
```

#### Create ecosystem.config.js
```javascript
module.exports = {
  apps: [
    {
      name: 'movr',
      script: 'npm',
      args: 'run preview',
      watch: false,
      env: {
        NODE_ENV: 'production',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
        VITE_SENTRY_DSN: process.env.VITE_SENTRY_DSN,
      },
      error_file: '/var/log/movr/error.log',
      out_file: '/var/log/movr/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
    },
  ],
};
```

#### Deploy with PM2
```bash
# Start
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs movr

# Restart
pm2 restart movr

# Stop
pm2 stop movr

# Setup auto-start on reboot
pm2 startup
pm2 save
```

---

## Security Verification

### Pre-Deployment Audit
```bash
#!/bin/bash
# security-check.sh

echo "🔒 Running security checks..."

# 1. No secrets in code
echo "✓ Checking for hardcoded secrets..."
grep -r "password" src/ && echo "❌ Found 'password' in src/" || echo "✅ No password found"
grep -r "secret" src/ && echo "❌ Found 'secret' in src/" || echo "✅ No secret found"
grep -r "key.*=" src/ | grep -v "VITE_" && echo "⚠️  Check keys manually" || true

# 2. No console.log in production
echo "✓ Checking for console.log in production..."
grep -r "console\." src/ | grep -v "DEV" | grep -v "test" && echo "⚠️  Check console calls" || echo "✅ No console calls in production"

# 3. Build succeeds
echo "✓ Verifying build..."
npm run build > /dev/null 2>&1 && echo "✅ Build successful" || echo "❌ Build failed"

# 4. Lint passes
echo "✓ Running linter..."
npm run lint > /dev/null 2>&1 && echo "✅ Linting passed" || echo "❌ Linting failed"

# 5. Dependencies OK
echo "✓ Checking dependencies..."
npm audit --production 2>/dev/null | grep -E "vulnerabilities|audit" || echo "✅ No vulnerabilities"

echo "✅ Security checks complete!"
```

#### Run checks
```bash
chmod +x security-check.sh
./security-check.sh
```

### Post-Deployment Tests
```bash
#!/bin/bash
# smoke-tests.sh

DOMAIN="https://yourdomain.com"

echo "🧪 Running smoke tests..."

# 1. Server is responding
echo "✓ Checking server..."
curl -f $DOMAIN > /dev/null && echo "✅ Server responding" || echo "❌ Server not responding"

# 2. SSL/TLS working
echo "✓ Checking SSL..."
curl -I https://$DOMAIN 2>/dev/null | grep -E "HTTP.*200|301" && echo "✅ SSL working" || echo "❌ SSL issue"

# 3. Static files loading
echo "✓ Checking assets..."
curl -f $DOMAIN/index.html > /dev/null && echo "✅ Index loading" || echo "❌ Index not loading"

# 4. API responding
echo "✓ Checking Supabase connectivity..."
curl -f "$DOMAIN" | grep -q "React" && echo "✅ Frontend loaded" || echo "❌ Frontend not loading"

# 5. CSP Headers
echo "✓ Checking security headers..."
curl -I $DOMAIN | grep -i "content-security-policy" && echo "✅ CSP header present" || echo "⚠️  No CSP header"

echo "✅ Smoke tests complete!"
```

---

## Monitoring & Logging

### Sentry Dashboard
```bash
# Monitor errors in real-time:
# 1. Go to sentry.io → your-project
# 2. View recent issues
# 3. Set up alerts:
#    Settings → Alerts → Create Alert Rule

# Alert rule example:
# Event: Error
# Condition: Frequency > 10 in 5 minutes
# Action: Send email + Slack webhook
```

### Application Logs
```bash
# View application logs
npm run build
npm run preview

# Or in production (Vercel)
vercel logs yourdomain.com --follow

# Or Docker
docker logs -f movr

# Or PM2
pm2 logs movr
```

### Database Monitoring
```bash
# Supabase Dashboard → Database → Logs
# Monitor:
# - Slow queries
# - Connection errors
# - RLS policy violations

# Check active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
```

### Performance Monitoring
```bash
# Sentry Dashboard → Performance
# Monitor:
# - Page load time
# - API response time
# - Database query time

# Web Vitals:
# - LCP: Largest Contentful Paint < 2.5s
# - FID: First Input Delay < 100ms
# - CLS: Cumulative Layout Shift < 0.1
```

---

## Troubleshooting

### Build Fails
```bash
# 1. Clear cache
rm -rf node_modules dist .vite
npm install

# 2. Check TypeScript errors
npm run build

# 3. Check ESLint errors
npm run lint

# 4. Try clean build
npm ci && npm run build
```

### Deployment Fails
```bash
# Vercel
vercel logs yourdomain.com --follow
# Look for error messages

# Check environment variables
vercel env list

# Redeploy
vercel redeploy
```

### Runtime Errors
```bash
# Check Sentry dashboard for stack traces
# Sentry → Issues → [Error Name]

# Enable debug logging locally
# Modify lib/sentry.ts: debug: true

# Check browser console
# F12 → Console tab for JavaScript errors
```

### Slow Performance
```bash
# Check bundle size
npm run build  # Look for warnings
# Analyze with: npm install -g vite-bundle-visualizer
# Then: vite-bundle-visualizer --input dist

# Check database queries
# Supabase Dashboard → Database → Logs
# Look for slow queries (> 1s)

# Check Sentry Performance tab
# Look for slow transactions
```

### CORS Issues
```bash
# Vercel includes necessary CORS headers by default
# If issues persist:

# 1. Check Supabase CORS settings
# Settings → API → Allowed Redirect URLs

# 2. Check browser console for CORS error

# 3. Check Sentry for specific error
```

### Database Connection Issues
```bash
# 1. Verify credentials
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# 2. Test Supabase connection
supabase status

# 3. Check Supabase Dashboard → Status
# Look for incidents

# 4. Verify RLS policies aren't blocking
# Supabase Dashboard → SQL Editor
# SELECT * FROM your_table LIMIT 1;
```

---

## Monitoring Checklist

- [ ] Sentry is sending errors
- [ ] Database backups are working
- [ ] SSL/TLS certificates are valid (auto-renewed by Vercel)
- [ ] Performance is acceptable (< 2s page load)
- [ ] No 404 errors on assets
- [ ] API calls complete successfully
- [ ] User authentication works
- [ ] Payments process correctly (test with Stripe test mode)

---

## Post-Launch

### First Week
- Monitor Sentry daily
- Check analytics (Vercel, Supabase)
- Respond to user reports
- Monitor performance metrics

### First Month
- Review database performance
- Analyze user behavior
- Plan next features
- Document any issues

### Ongoing
- Weekly: Check error rates
- Monthly: Review performance metrics
- Quarterly: Plan scaling
- Annually: Full security audit

---

**Version:** 1.0
**Last Updated:** 2026-06-12
**Project:** MOVR v0.0.0
