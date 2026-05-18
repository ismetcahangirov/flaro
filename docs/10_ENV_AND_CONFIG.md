# Flaro — Mühit Dəyişənləri və Konfiqurasiya

> Bütün `.env` dəyişənləri, xarici servis konfiqurasiyaları, təhlükəsizlik qaydaları
> **ÖNƏMLİ:** Heç bir real key-i repoya commit etməyin!

---

## 📁 Fayl Strukturu

```
flaro/
├── .env.example          ← Şablon (repoda olur)
├── .env.local            ← Local dev (gitignore!)
├── .env.staging          ← Staging (gitignore!)
├── .env.production       ← Production (gitignore!)
└── .gitignore
```

---

## 🔒 `.gitignore` (mühüm hissə)

```gitignore
# Environment files — HEÇ VAXT COMMIT ETMƏ
.env
.env.local
.env.staging
.env.production
.env.*.local

# Supabase local
supabase/.branches
supabase/.temp

# Build
dist/
dist-ssr/

# Dependencies
node_modules/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Logs
*.log
npm-debug.log*
```

---

## 📋 `.env.example` — Tam Şablon

```bash
# ═══════════════════════════════════════════════════════════════
# FLARO — Environment Variables Template
# Kopyala: cp .env.example .env.local
# Real dəyərləri doldur
# ═══════════════════════════════════════════════════════════════

# ──────────────────────────────────────────────────────────────
# SUPABASE (Frontend — public, VITE_ prefix ilə)
# https://app.supabase.com → Settings → API
# ──────────────────────────────────────────────────────────────
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ──────────────────────────────────────────────────────────────
# STRIPE (Frontend — publishable key, public)
# https://dashboard.stripe.com → Developers → API Keys
# ──────────────────────────────────────────────────────────────
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
# Test üçün: pk_test_...

# ──────────────────────────────────────────────────────────────
# APP CONFIG
# ──────────────────────────────────────────────────────────────
VITE_APP_URL=https://flaro.app
VITE_APP_VERSION=1.0.0

# ──────────────────────────────────────────────────────────────
# SUPABASE (Edge Functions — server-side, VITE_ prefix yoxdur)
# Bu dəyərlər Supabase secrets-ə set edilir, .env-də deyil
# supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
# ──────────────────────────────────────────────────────────────
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← SAXLA, commit etmə!
# SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# ──────────────────────────────────────────────────────────────
# STRIPE (Edge Functions — server-side)
# supabase secrets set STRIPE_SECRET_KEY=...
# ──────────────────────────────────────────────────────────────
# STRIPE_SECRET_KEY=sk_live_...                    ← SAXLA!
# STRIPE_WEBHOOK_SECRET=whsec_...                  ← SAXLA!
# STRIPE_PRO_PRICE_ID=price_...

# ──────────────────────────────────────────────────────────────
# ANTHROPIC (Edge Functions — server-side)
# supabase secrets set ANTHROPIC_API_KEY=...
# ──────────────────────────────────────────────────────────────
# ANTHROPIC_API_KEY=sk-ant-api03-...               ← SAXLA!

# ──────────────────────────────────────────────────────────────
# OAUTH — Google (Supabase Dashboard-da set edilir)
# https://console.cloud.google.com → APIs → Credentials
# ──────────────────────────────────────────────────────────────
# GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com  ← Supabase Dashboard-da
# GOOGLE_CLIENT_SECRET=GOCSPX-xxx                  ← Supabase Dashboard-da

# ──────────────────────────────────────────────────────────────
# OAUTH — GitHub (Supabase Dashboard-da set edilir)
# https://github.com → Settings → Developer settings → OAuth Apps
# ──────────────────────────────────────────────────────────────
# GITHUB_CLIENT_ID=xxx                             ← Supabase Dashboard-da
# GITHUB_CLIENT_SECRET=xxx                         ← Supabase Dashboard-da

# ──────────────────────────────────────────────────────────────
# GITHUB ACTIONS SECRETS (repo → Settings → Secrets → Actions)
# ──────────────────────────────────────────────────────────────
# VERCEL_TOKEN=xxx
# VERCEL_ORG_ID=team_xxx
# VERCEL_PROJECT_ID=prj_xxx
# SUPABASE_ACCESS_TOKEN=sbp_xxx
# SUPABASE_PRODUCTION_REF=abcdefghijkl
# SUPABASE_STAGING_REF=mnopqrstuvwx
# SLACK_WEBHOOK_URL=https://hooks.slack.com/...    ← Optional
```

---

## 🌍 Mühit Dəyişənlərini Əldə Etmə Bələdçisi

### Supabase Keys

```bash
# 1. https://app.supabase.com → layihəni seç
# 2. Sol menyu → Settings → API

# Tapacaqsan:
#   Project URL:  VITE_SUPABASE_URL
#   anon/public:  VITE_SUPABASE_ANON_KEY
#   service_role: SUPABASE_SERVICE_ROLE_KEY (yalnız Edge Functions üçün!)

# Project Reference (migration və deploy üçün):
# Settings → General → Reference ID
```

### Stripe Keys

```bash
# 1. https://dashboard.stripe.com
# 2. Developers → API Keys

# Tapacaqsan:
#   Publishable key: VITE_STRIPE_PUBLISHABLE_KEY  (pk_live_ və ya pk_test_)
#   Secret key:      STRIPE_SECRET_KEY             (sk_live_ və ya sk_test_)

# Webhook Secret:
# Developers → Webhooks → endpoint seç → Signing secret → STRIPE_WEBHOOK_SECRET

# Price ID:
# Products → Flaro Pro → Price ID → STRIPE_PRO_PRICE_ID (price_xxx)
```

### Anthropic API Key

```bash
# 1. https://console.anthropic.com
# 2. API Keys → Create Key

# ANTHROPIC_API_KEY=sk-ant-api03-...

# Tövsiyə: ayrıca production key yarat, rate limit set et
# Console → API Keys → Edit → Spending limit: $50/ay
```

### Vercel Tokens

```bash
# VERCEL_TOKEN:
# https://vercel.com/account/tokens → Create Token

# VERCEL_ORG_ID:
# vercel whoami --scope (və ya Settings → General → Team ID)

# VERCEL_PROJECT_ID:
# vercel link → .vercel/project.json → projectId
cat .vercel/project.json
```

### Supabase Access Token (CI/CD üçün)

```bash
# https://app.supabase.com/account/tokens
# → Generate new token
# SUPABASE_ACCESS_TOKEN=sbp_xxx
```

### Google OAuth

```bash
# 1. https://console.cloud.google.com
# 2. Yeni layihə yarat: Flaro
# 3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
# 4. Application type: Web application
# 5. Authorized redirect URIs əlavə et:
#    https://YOUR_PROJECT.supabase.co/auth/v1/callback
# 6. Client ID və Secret → Supabase Dashboard → Auth → Providers → Google

# Supabase Dashboard-da set et (env faylında deyil):
# Authentication → Providers → Google → Client ID / Client Secret
```

### GitHub OAuth

```bash
# 1. https://github.com → Settings → Developer settings → OAuth Apps
# 2. New OAuth App:
#    Application name: Flaro
#    Homepage URL: https://flaro.app
#    Callback URL: https://YOUR_PROJECT.supabase.co/auth/v1/callback
# 3. Client ID və Secret → Supabase Dashboard → Auth → Providers → GitHub
```

---

## 🔐 Təhlükəsizlik Qaydaları

### ✅ Nə etmək lazımdır

```bash
# 1. VITE_ prefix — yalnız PUBLIC məlumatlar üçün
#    (Supabase anon key, Stripe publishable key — bunlar public ola bilər)
VITE_SUPABASE_ANON_KEY=eyJ...      ✅ — RLS ilə qorunur
VITE_STRIPE_PUBLISHABLE_KEY=pk_... ✅ — frontend üçün təhlükəsizdir

# 2. Həssas key-ləri supabase secrets-ə set et
supabase secrets set STRIPE_SECRET_KEY=sk_live_...      ✅
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...       ✅
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...   ✅

# 3. .gitignore-da .env.local əlavə et
echo ".env.local" >> .gitignore    ✅

# 4. GitHub Secrets-dən CI/CD key-lərini idarə et
# Repo → Settings → Secrets → Actions                  ✅
```

### ❌ Nə etmək olmaz

```bash
# ❌ Service role key-i frontend-ə əlavə etmə
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...    ← YANLIŞDIR! RLS-i keçir!

# ❌ Secret key-ləri repoya commit etmə
git add .env.local                        ← YANLIŞDIR!

# ❌ console.log ilə key-ləri çap etmə
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)  ← Pis təcrübə

# ❌ Stripe secret key-i clientdə istifadə etmə
const stripe = new Stripe(sk_live_xxx)   ← Yalnız server-side!
```

---

## 🔄 Mühit Dəyişənlərinin Axını

```
┌─────────────────────────────────────────────────────────────┐
│                KEY SECURITY FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PUBLIC (Browser-da görünür):                               │
│  ┌─────────────────────────────────────┐                    │
│  │ VITE_SUPABASE_URL                   │                    │
│  │ VITE_SUPABASE_ANON_KEY  ──→ RLS     │ ← Supabase qoruyur│
│  │ VITE_STRIPE_PUBLISHABLE_KEY         │ ← Stripe qoruyur  │
│  │ VITE_APP_URL                        │                    │
│  └─────────────────────────────────────┘                    │
│                                                             │
│  PRIVATE (Yalnız server/Edge Functions):                    │
│  ┌─────────────────────────────────────┐                    │
│  │ STRIPE_SECRET_KEY        ─────────→ supabase secrets    │
│  │ STRIPE_WEBHOOK_SECRET    ─────────→ supabase secrets    │
│  │ ANTHROPIC_API_KEY        ─────────→ supabase secrets    │
│  │ SUPABASE_SERVICE_ROLE_KEY ────────→ supabase secrets    │
│  └─────────────────────────────────────┘                    │
│                                                             │
│  CI/CD (GitHub Actions secrets):                            │
│  ┌─────────────────────────────────────┐                    │
│  │ VERCEL_TOKEN                        │                    │
│  │ SUPABASE_ACCESS_TOKEN               │                    │
│  │ VITE_* (build time)                 │                    │
│  └─────────────────────────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Sürətli Başlanğıc

```bash
# 1. Repo klonla
git clone https://github.com/YOUR_USERNAME/flaro.git
cd flaro

# 2. Dependencies quraşdır
npm install

# 3. Env faylını hazırla
cp .env.example .env.local
# .env.local-i öz dəyərlərinlə doldur

# 4. Supabase local başlat
supabase start
supabase db push

# 5. DB type-larını generate et
npm run db:types

# 6. Edge Functions local serve
supabase functions serve --env-file .env.local &

# 7. Stripe webhook dinlə (ayrı terminal)
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook &

# 8. App-ı başlat
npm run dev

# ✅ http://localhost:5173 açılır
```

---

## 📊 Bütün Dəyişənlərin Cədvəli

| Dəyişən | Prefix | Yer | Məqsəd | Mühit |
|---------|--------|-----|--------|-------|
| `VITE_SUPABASE_URL` | `VITE_` | `.env.local` | DB URL | Hamısı |
| `VITE_SUPABASE_ANON_KEY` | `VITE_` | `.env.local` | Public auth | Hamısı |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `VITE_` | `.env.local` | Stripe frontend | Hamısı |
| `VITE_APP_URL` | `VITE_` | `.env.local` | Redirect URL | Hamısı |
| `VITE_APP_VERSION` | `VITE_` | `vercel.json` | App version | Hamısı |
| `STRIPE_SECRET_KEY` | — | `supabase secrets` | Stripe API | Edge Functions |
| `STRIPE_WEBHOOK_SECRET` | — | `supabase secrets` | Webhook imza | Edge Functions |
| `STRIPE_PRO_PRICE_ID` | — | `supabase secrets` | Pro plan price | Edge Functions |
| `ANTHROPIC_API_KEY` | — | `supabase secrets` | Claude API | Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | — | `supabase secrets` | DB admin | Edge Functions |
| `SUPABASE_URL` | — | `supabase secrets` | DB URL (server) | Edge Functions |
| `APP_URL` | — | `supabase secrets` | Redirect (server) | Edge Functions |
| `VERCEL_TOKEN` | — | GitHub Secrets | Deploy | CI/CD |
| `VERCEL_ORG_ID` | — | GitHub Secrets | Vercel org | CI/CD |
| `VERCEL_PROJECT_ID` | — | GitHub Secrets | Vercel project | CI/CD |
| `SUPABASE_ACCESS_TOKEN` | — | GitHub Secrets | CLI auth | CI/CD |
| `SUPABASE_PRODUCTION_REF` | — | GitHub Secrets | Prod project ref | CI/CD |
| `SUPABASE_STAGING_REF` | — | GitHub Secrets | Staging project ref | CI/CD |

---

## ✅ Bütün MD Faylların Xülasəsi

| # | Fayl | Məzmun |
|---|------|--------|
| ✅ | `01_PROJECT_OVERVIEW.md` | Arxitektura, stack, qovluq strukturu |
| ✅ | `02_DATABASE_SCHEMA.md` | SQL migrations, RLS, TypeScript types |
| ✅ | `03_AUTH_AND_SECURITY.md` | Auth axını, JWT, rate limit, CORS |
| ✅ | `04_CANVAS_ENGINE.md` | Rough.js, Zustand store, render loop |
| ✅ | `05_COLLABORATION.md` | Realtime, cursors, LWW conflict |
| ✅ | `06_SUBSCRIPTION_BILLING.md` | Stripe checkout, portal, pricing UI |
| ✅ | `07_API_AND_EDGE_FUNCTIONS.md` | Scene CRUD, AI generate, export |
| ✅ | `08_FRONTEND_COMPONENTS.md` | Landing, Dashboard, Editor, Toolbar |
| ✅ | `09_DEPLOYMENT.md` | Vercel, Supabase, CI/CD pipeline |
| ✅ | `10_ENV_AND_CONFIG.md` | **Bu fayl** — Bütün env dəyişənləri |

---

*🎉 Bütün sənədlər tamamlandı! Flaro layihəsi üçün tam texniki sənədləşmə hazırdır.*
