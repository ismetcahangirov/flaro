# SketchFlow — Deploy və CI/CD

> **Vercel** (Frontend) + **Supabase** (Backend) — Production deployment
> GitHub Actions CI/CD pipeline, staging/production mühitləri

---

## 🏗️ İnfrastruktur Xəritəsi

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION INFRASTRUCTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   GitHub Repo                                                   │
│       │                                                         │
│       ├── push: main  ──→  Vercel (Production)                  │
│       │                    sketchflow.app                       │
│       │                         │                               │
│       └── push: staging ──→ Vercel (Preview)                    │
│                               staging.sketchflow.app            │
│                                                                 │
│   Vercel (Frontend)          Supabase (Backend)                 │
│   ─────────────────          ────────────────────               │
│   React + Vite build    ←──→ PostgreSQL (RLS)                   │
│   Edge CDN              ←──→ Auth (JWT)                         │
│   SSL/TLS auto          ←──→ Storage (S3-compatible)            │
│                         ←──→ Realtime (WebSocket)               │
│                         ←──→ Edge Functions (Deno)              │
│                              │                                  │
│                         ←──→ Stripe (Webhooks)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Supabase Production Qurulumu

### 1.1 Yeni Supabase Layihəsi

```bash
# Supabase CLI quraşdır
npm install -g supabase

# Giriş et
supabase login

# Yeni layihə yarat (dashboard.supabase.com-da)
# Layihə adı: sketchflow-production
# Region: Ən yaxın (məs: eu-central-1)
# Database şifrəsi: güclü şifrə seç → saxla!

# Local konfiqurasiya
supabase init
supabase link --project-ref YOUR_PROJECT_REF
```

### 1.2 Database Migration-ları Tətbiq Et

```bash
# Bütün migration-ları sıraya görə icra et
supabase db push

# Yoxla
supabase db diff

# Migration statusunu gör
supabase migration list
```

### 1.3 TypeScript Tiplərini Generate Et

```bash
supabase gen types typescript \
  --project-id YOUR_PROJECT_REF \
  --schema public \
  > src/types/database.types.ts

echo "✅ Types generated"
```

### 1.4 Storage Bucket-lərini Yarat

```bash
# supabase/storage-setup.sql faylını icra et
supabase db execute --file supabase/storage-setup.sql
```

### 1.5 Auth Konfiqurasiyası (Dashboard)

```
Supabase Dashboard → Authentication → Providers:

✅ Email/Password
   - Enable email confirmations: ON
   - Secure email change: ON
   - Min password length: 8

✅ Google OAuth
   - Client ID: (Google Cloud Console-dan)
   - Client Secret: (Google Cloud Console-dan)

✅ GitHub OAuth
   - Client ID: (GitHub Developer Settings-dən)
   - Client Secret: (GitHub Developer Settings-dən)

URL Configuration:
   Site URL: https://sketchflow.app
   Redirect URLs:
     https://sketchflow.app/auth/callback
     https://staging.sketchflow.app/auth/callback
     http://localhost:5173/auth/callback
```

### 1.6 Edge Functions Deploy

```bash
# Bütün Edge Functions-ları deploy et
supabase functions deploy stripe-webhook        --no-verify-jwt
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy scene-save
supabase functions deploy scene-export
supabase functions deploy ai-generate

# Secrets set et
supabase secrets set \
  STRIPE_SECRET_KEY="sk_live_xxx" \
  STRIPE_WEBHOOK_SECRET="whsec_xxx" \
  STRIPE_PRO_PRICE_ID="price_xxx" \
  ANTHROPIC_API_KEY="sk-ant-xxx" \
  APP_URL="https://sketchflow.app"

# Secrets yoxla
supabase secrets list
```

### 1.7 Stripe Webhook Endpoint

```
Stripe Dashboard → Webhooks → Add endpoint:

URL: https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook

Events to listen:
  ✅ checkout.session.completed
  ✅ customer.subscription.created
  ✅ customer.subscription.updated
  ✅ customer.subscription.deleted
  ✅ invoice.payment_failed
  ✅ invoice.payment_succeeded

Webhook Signing Secret → kopyala → supabase secrets set STRIPE_WEBHOOK_SECRET=...
```

---

## 2️⃣ Vercel Deploy

### 2.1 Vercel CLI Qurulumu

```bash
npm install -g vercel

# Login
vercel login

# Layihəni Vercel-ə qoş
vercel link
```

### 2.2 `vercel.json` Konfiqurasiyası

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options",    "value": "nosniff" },
        { "key": "X-Frame-Options",           "value": "DENY" },
        { "key": "X-XSS-Protection",          "value": "1; mode=block" },
        { "key": "Referrer-Policy",           "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",        "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.stripe.com; frame-src https://js.stripe.com;"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "env": {
    "VITE_APP_VERSION": "1.0.0"
  }
}
```

### 2.3 Vercel Environment Variables

```bash
# Production
vercel env add VITE_SUPABASE_URL          production
vercel env add VITE_SUPABASE_ANON_KEY     production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
vercel env add VITE_APP_URL               production

# Preview (staging)
vercel env add VITE_SUPABASE_URL          preview
vercel env add VITE_SUPABASE_ANON_KEY     preview
vercel env add VITE_STRIPE_PUBLISHABLE_KEY preview
vercel env add VITE_APP_URL               preview

# Development
vercel env add VITE_SUPABASE_URL          development
vercel env add VITE_SUPABASE_ANON_KEY     development
vercel env add VITE_STRIPE_PUBLISHABLE_KEY development
vercel env add VITE_APP_URL               development

# Yoxla
vercel env ls
```

### 2.4 İlk Deploy

```bash
# Production deploy
vercel --prod

# Preview deploy (staging)
vercel

# Deploy log-larını izlə
vercel logs --follow
```

---

## 3️⃣ `vite.config.ts` Konfiqurasiyası

```typescript
import { defineConfig, loadEnv } from 'vite'
import react    from '@vitejs/plugin-react'
import path     from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    build: {
      target:          'es2020',
      sourcemap:       mode !== 'production',
      minify:          'esbuild',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Böyük kitabxanaları ayrı chunk-lara böl
            'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-rough':  ['roughjs'],
            'vendor-zustand': ['zustand'],
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'roughjs', 'zustand'],
    },

    server: {
      port: 5173,
      host: true,
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  }
})
```

---

## 4️⃣ GitHub Actions CI/CD Pipeline

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

env:
  NODE_VERSION: '20'

jobs:
  # ── Lint & Type check ──────────────────────────────────────────────────────
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript type check
        run: npm run type-check

      - name: ESLint
        run: npm run lint

  # ── Build test ────────────────────────────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_SUPABASE_URL:           ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY:      ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
          VITE_APP_URL:                ${{ secrets.VITE_APP_URL }}
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  # ── Supabase Migration check ───────────────────────────────────────────────
  db-check:
    name: DB Migration Check
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Check migration diff
        run: |
          supabase db diff --schema public
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  # ── Deploy to Staging ──────────────────────────────────────────────────────
  deploy-staging:
    name: Deploy → Staging
    runs-on: ubuntu-latest
    needs: [build, db-check]
    if: github.ref == 'refs/heads/staging'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel (Preview)
        run: vercel deploy --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID:     ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy Supabase Functions (Staging)
        run: |
          supabase functions deploy --project-ref ${{ secrets.SUPABASE_STAGING_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  # ── Deploy to Production ───────────────────────────────────────────────────
  deploy-production:
    name: Deploy → Production
    runs-on: ubuntu-latest
    needs: [build, db-check]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel (Production)
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID:     ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Run DB migrations (Production)
        run: |
          supabase db push --project-ref ${{ secrets.SUPABASE_PRODUCTION_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy Supabase Functions (Production)
        run: |
          supabase functions deploy \
            stripe-webhook \
            create-checkout-session \
            create-portal-session \
            scene-save \
            scene-export \
            ai-generate \
            --project-ref ${{ secrets.SUPABASE_PRODUCTION_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Notify deployment
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ SketchFlow production-a deploy edildi! v${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        continue-on-error: true
```

---

## 5️⃣ `package.json` Skriptlər

```json
{
  "name": "sketchflow",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev":          "vite",
    "build":        "tsc -b && vite build",
    "preview":      "vite preview",
    "type-check":   "tsc --noEmit",
    "lint":         "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix":     "eslint src --ext ts,tsx --fix",
    "format":       "prettier --write 'src/**/*.{ts,tsx,css}'",

    "db:types":     "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.types.ts",
    "db:push":      "supabase db push",
    "db:diff":      "supabase db diff",
    "db:reset":     "supabase db reset",

    "functions:deploy": "supabase functions deploy",
    "functions:serve":  "supabase functions serve",

    "supabase:start":   "supabase start",
    "supabase:stop":    "supabase stop",
    "supabase:status":  "supabase status"
  },
  "dependencies": {
    "@stripe/stripe-js":         "^4.0.0",
    "@supabase/auth-ui-react":   "^0.4.7",
    "@supabase/supabase-js":     "^2.43.0",
    "lucide-react":              "^0.383.0",
    "nanoid":                    "^5.0.7",
    "react":                     "^18.3.0",
    "react-dom":                 "^18.3.0",
    "react-router-dom":          "^6.23.0",
    "roughjs":                   "^4.6.6",
    "zustand":                   "^4.5.2"
  },
  "devDependencies": {
    "@types/react":              "^18.3.0",
    "@types/react-dom":          "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react":      "^4.3.0",
    "autoprefixer":              "^10.4.19",
    "eslint":                    "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "immer":                     "^10.1.1",
    "postcss":                   "^8.4.38",
    "prettier":                  "^3.2.5",
    "tailwindcss":               "^3.4.3",
    "typescript":                "^5.4.5",
    "vite":                      "^5.2.11"
  }
}
```

---

## 6️⃣ TypeScript Konfiqurasiyası

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target":              "ES2020",
    "useDefineForClassFields": true,
    "lib":                 ["ES2020", "DOM", "DOM.Iterable"],
    "module":              "ESNext",
    "skipLibCheck":        true,
    "moduleResolution":    "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule":   true,
    "isolatedModules":     true,
    "noEmit":              true,
    "jsx":                 "react-jsx",

    "strict":              true,
    "noUnusedLocals":      true,
    "noUnusedParameters":  true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess":   true,

    "baseUrl":             ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "target":           "ES2022",
    "lib":              ["ES2023"],
    "module":           "ESNext",
    "skipLibCheck":     true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit":           true,
    "strict":           true
  },
  "include": ["vite.config.ts", "tailwind.config.ts"]
}
```

---

## 7️⃣ Local Development

### `.env.local` (gitignore-da olmalıdır!)

```bash
# Supabase Local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # supabase status-dan al

# Stripe Test
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# App
VITE_APP_URL=http://localhost:5173
VITE_APP_VERSION=dev
```

### Local Supabase Başlatma

```bash
# Docker işləyir olmalıdır
supabase start

# Status yoxla (local URL və keys)
supabase status

# Supabase Studio: http://localhost:54323
# Inbucket (email test): http://localhost:54324
# API: http://localhost:54321

# Migration-ları tətbiq et
supabase db push

# Edge Functions local serve
supabase functions serve --env-file .env.local

# App-ı başlat
npm run dev
```

### Stripe Local Testing

```bash
# Stripe CLI quraşdır
# https://stripe.com/docs/stripe-cli

# Local webhook dinləmə
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Test event göndər
stripe trigger checkout.session.completed

# Test kart nömrəsi: 4242 4242 4242 4242
# Exp: istənilən gələcək tarix | CVV: istənilən 3 rəqəm
```

---

## 8️⃣ Monitoring və Logging

### Supabase Dashboard

```
Supabase Dashboard → Logs:
  - API logs (bütün request-lər)
  - Database logs (slow queries)
  - Edge Function logs
  - Auth logs

Supabase Dashboard → Reports:
  - Database size
  - API requests/day
  - Realtime connections
  - Storage usage
```

### Vercel Analytics

```
Vercel Dashboard → Analytics:
  - Web Vitals (LCP, FID, CLS)
  - Page views
  - Error tracking

vercel.json-a əlavə et:
{
  "analytics": true
}
```

### Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error:    Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Production-da Sentry və ya digər error tracking-ə göndər
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-orange-50">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center
                            justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Bir şey səhv getdi
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {this.state.error?.message ?? 'Gözlənilməz xəta baş verdi'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-brand-500 text-white font-semibold
                         rounded-xl hover:bg-brand-600 transition-colors"
            >
              Yenidən cəhd et
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## 9️⃣ Production Checklist

```
PRE-DEPLOY:
  □ supabase db push — bütün migration-lar tətbiq edilib
  □ supabase functions deploy — bütün Edge Functions deploy edilib
  □ supabase secrets set — bütün secrets set edilib
  □ Stripe webhook endpoint qeydiyyatdan keçib
  □ Stripe live keys Vercel env-ə əlavə edilib
  □ Google/GitHub OAuth production redirect URL-ləri əlavə edilib
  □ Supabase Auth → Site URL production URL-ə dəyişdirilib
  □ npm run type-check — TypeScript xəta yoxdur
  □ npm run build — build uğurla tamamlanır
  □ vercel.json CSP header-ləri yoxlanılıb

POST-DEPLOY:
  □ https://sketchflow.app açılır
  □ Qeydiyyat → email confirmation işləyir
  □ Google OAuth işləyir
  □ Yeni scene yaratmaq olur
  □ Canvas-da çizim işləyir
  □ Scene saxlanılır (autosave)
  □ Stripe checkout işləyir (test mode)
  □ Webhook events Supabase logs-da görünür
  □ Realtime collaboration işləyir (2 tab)
  □ Share link işləyir
  □ Mobile-da açılır (responsive)

MONITORING:
  □ Supabase alerts qurulub (storage, API limits)
  □ Vercel alerts qurulub (error rate)
  □ Stripe webhook retry policy yoxlanılıb
```

---

## ✅ Deploy Xülasəsi

| Komponent | Servis | URL | Plan |
|-----------|--------|-----|------|
| **Frontend** | Vercel | sketchflow.app | Pro ($20/ay) |
| **Database** | Supabase | *.supabase.co | Pro ($25/ay) |
| **Storage** | Supabase | *.supabase.co | Pro (daxil) |
| **Realtime** | Supabase | wss://*.supabase.co | Pro (daxil) |
| **Edge Functions** | Supabase | *.supabase.co | Pro (daxil) |
| **Payments** | Stripe | — | 2.9% + 30¢ |
| **AI** | Anthropic | api.anthropic.com | Pay-per-use |

**Aylıq xərc (başlanğıc):**
- Vercel Pro: $20
- Supabase Pro: $25
- Anthropic Claude: ~$10-50 (istifadəyə görə)
- Stripe: tranzaksiyadan faiz
- **Cəmi: ~$55-95/ay**

---

*Növbəti: `10_ENV_AND_CONFIG.md` — Bütün environment dəyişənləri, konfiqurasiya sənədi*
