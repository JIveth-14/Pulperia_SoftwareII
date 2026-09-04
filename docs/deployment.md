# Deployment Guide

## Overview

This guide covers deploying to **Vercel** with **Supabase** backend and **Redis** caching.

---

## Prerequisites

- GitHub account with repo pushed
- Vercel account (free tier OK)
- Supabase project created
- Redis (Vercel Redis or external)

---

## Step-by-Step Deployment

### 1. Push Code to GitHub

```bash
git checkout main
git merge testMigration  # Merge features into main
git push origin main
```

### 2. Connect to Vercel

#### First Time Setup

Go to https://vercel.com and:

1. Click "New Project"
2. Select your GitHub repository
3. Click "Import"

#### Configure Build Settings

**Framework:** Next.js  
**Build Command:** `npm run build`  
**Output Directory:** `.next`  
**Install Command:** `npm ci`  

### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

REDIS_URL=redis://default:password@host:port
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
CACHE_TTL_CLIENTS=1800
CACHE_TTL_PRODUCTS=3600
CACHE_TTL_FIADOS=300
CACHE_TTL_SALES=120
CACHE_TTL_DASHBOARD=60
```

**⚠️ Important:**
- `NEXT_PUBLIC_*` variables are public (safe to expose)
- Other variables are secrets (not exposed to client)
- Never commit `.env.local` to Git

### 4. Deploy

Click "Deploy"

Vercel will:
1. Pull code from GitHub
2. Run `npm ci`
3. Run `npm run build`
4. Deploy to edge network
5. Assign domain (e.g., `pulperia-web.vercel.app`)

---

## Database Setup

### Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Choose region (closest to users)
4. Create

### Get Connection Strings

**Supabase Dashboard** → Project Settings → API

Copy:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase@latest

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase migration push
```

Verify in Supabase Dashboard → SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show: clientes, detalle_venta, fiados, pagos, productos, ventas
```

---

## Redis Setup

### Option A: Vercel Redis (Recommended)

1. In Vercel Dashboard → Storage
2. Click "Create Database" → "Redis"
3. Choose region, create
4. Copy connection URL
5. Add to environment variables as `REDIS_URL`

### Option B: External Redis

Use Upstash, Redis Cloud, or self-hosted:

```env
REDIS_URL=redis://default:password@endpoint:6379
```

### Test Connection

```bash
# After deployment, check logs
vercel logs

# Should show: "[Cache] Redis connected"
```

---

## Custom Domain

### Add Domain

1. Vercel Dashboard → Domains
2. Add custom domain
3. Follow DNS instructions (depends on registrar)
4. Wait for propagation (24-48 hours)

### SSL Certificate

Vercel automatically provides Let's Encrypt certificate. Should appear within minutes.

---

## Continuous Deployment

Every push to `main` triggers automatic deployment:

```
git push origin main
  ↓
GitHub webhook
  ↓
Vercel builds & tests
  ↓
Deploys if successful
  ↓
Your domain updated
```

### Rollback to Previous Deployment

1. Vercel Dashboard → Deployments
2. Find previous deployment
3. Click ⋯ → Promote to Production

---

## Monitoring

### Vercel Dashboard

Check:
- **Deployments** — Build status, logs
- **Usage** — Compute time, bandwidth
- **Analytics** — Page performance
- **Logs** — Runtime errors

### Check Logs

```bash
vercel logs

# Real-time logs
vercel logs --follow
```

### Monitor Database

**Supabase Dashboard** → Logs → Postgres

See:
- Slow queries
- Errors
- Connections
- Memory usage

### Monitor Cache

```bash
# If using external Redis
redis-cli INFO stats

# In Vercel logs, look for:
# [Cache] Redis connected
# [Cache] Cache HIT/MISS
```

---

## Common Issues

### Build Fails: "Cannot find module"

```bash
# Verify dependencies
npm install

# Check package.json
cat package.json | grep "redis\|@supabase"

# Should have:
# "@supabase/ssr": "^0.5.2"
# "@supabase/supabase-js": "^2.108.1"
# "redis": "^4.6.14"
```

### "Not authenticated" errors

Check Supabase keys in `.env.local`:

```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Both must be set. If missing:

1. Go to Supabase Dashboard → API
2. Copy correct values
3. Update `.env.local`
4. Restart dev server: `npm run dev`

### Redis Connection Timeout

If `REDIS_URL` invalid or unreachable:

```
[Cache] Failed to connect to Redis: timeout
[Cache] Cache is disabled.
```

Check:
1. `REDIS_URL` environment variable is set
2. Redis endpoint is reachable
3. Password correct (if required)

Falls back to in-memory cache (less efficient but works).

### Database Migrations Failed

```bash
# Check migration status
supabase migration list

# Re-run migrations
supabase migration reset  # ⚠️ Destructive
supabase migration up
```

---

## Performance Tips

### 1. Enable Caching

```env
CACHE_ENABLED=true
REDIS_URL=redis://...
```

### 2. Adjust TTLs

```env
CACHE_TTL_CLIENTS=3600      # Increase if not updated often
CACHE_TTL_PRODUCTS=7200     # Longer for catalog
CACHE_TTL_FIADOS=300        # Keep short for accuracy
```

### 3. Use Supabase CDN

Enable in Supabase Dashboard → Settings → Edge Functions

### 4. Optimize Images

Images automatically optimized by Next.js.

### 5. Database Indexes

Already in migrations. Check:

```sql
SELECT * FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## Scaling

### Increase Vercel Compute

Default: Free tier (limited)

Upgrade to Pro:
- Vercel Dashboard → Settings → Billing
- Add payment method
- Upgrade plan

### Increase Supabase Compute

Supabase Dashboard → Project Settings → Billing

Choose tier based on:
- Connections (database pooling)
- Storage
- API rate limits

### Load Testing

```bash
# Using k6
npm install -g k6

# Create test file: load-test.js
# Run
k6 run load-test.js
```

---

## Backups

### Automatic Backups

Supabase keeps 7-day backups automatically.

### Manual Backup

```bash
supabase db dump > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Point-in-Time Recovery

Contact Supabase support for recovery from specific time.

---

## Security Checklist

- ✅ Environment variables set (not in `.env.local`)
- ✅ RLS enabled on all tables
- ✅ Service role key not exposed
- ✅ HTTPS enabled (automatic)
- ✅ CORS configured
- ✅ Rate limiting set (future)
- ✅ Audit logs enabled

---

## Troubleshooting Deployment

### Deploy Preview

Before merging to `main`, test with deployment preview:

```bash
# Create PR with feature branch
git checkout -b feature/my-feature
git push origin feature/my-feature
# Go to GitHub, create PR
# Vercel creates preview deployment
```

### Revert to Previous Version

```bash
git revert HEAD  # Creates new commit that undoes changes
git push origin main
# Vercel redeploys with reverted code
```

### Manual Redeploy

Vercel Dashboard → Deployments → Latest → Redeploy

---

## Post-Deployment Checklist

- [ ] Visit `your-domain.vercel.app`
- [ ] Test login
- [ ] Create test cliente
- [ ] Create test producto
- [ ] Create test venta
- [ ] Check Vercel logs for errors
- [ ] Check Supabase logs for errors
- [ ] Verify Redis is connected (check logs)
- [ ] Test on mobile
- [ ] Share with team

---

## Performance Monitoring

### Real User Metrics

Vercel Analytics → Real Experience

Shows:
- Page load times
- Web Vitals
- Error rates

### Database Metrics

Supabase Dashboard → Logs

Monitor:
- Query count
- Query duration
- Errors

### Cache Performance

```bash
# In production logs
grep "Cache" vercel logs

# Should see mostly HIT (good performance)
# MISS rate <20% is acceptable
```

---

## Support & Help

- **Vercel:** https://vercel.com/help
- **Supabase:** https://supabase.com/docs
- **Next.js:** https://nextjs.org/docs
- **Redis:** https://redis.io/docs

---

**Last Updated:** September 3, 2025
