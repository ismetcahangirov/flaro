# SketchFlow — Auth və Təhlükəsizlik

> **Supabase Auth** — Email/Password + OAuth, JWT, Rate Limiting, Stripe Webhook
> TypeScript strict mode ilə tam tipləşdirilmiş

---

## 🔐 Auth Axını Diaqramı

```
┌─────────────────────────────────────────────────────────┐
│                    AUTH FLOWS                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Email/Password          OAuth (Google/GitHub)          │
│       │                         │                       │
│       ▼                         ▼                       │
│  [Supabase Auth]  ◄─────────────┘                       │
│       │                                                 │
│       ├── JWT Access Token  (1 saat)                    │
│       └── Refresh Token     (30 gün)                    │
│                │                                        │
│                ▼                                        │
│     [handle_new_user trigger]                           │
│                │                                        │
│                ▼                                        │
│         profiles cədvəli                               │
│         plan = 'free'                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  REQUEST FLOW                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Client  →  JWT Header  →  Supabase RLS  →  Data       │
│                │                                        │
│                └── Expire?  →  Refresh Token           │
│                                    │                   │
│                                    └── Invalid?        │
│                                         →  Logout      │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Supabase Auth Konfiqurasiyası

### `supabase/config.toml`

```toml
[auth]
enabled = true
site_url = "https://sketchflow.app"
additional_redirect_urls = [
  "http://localhost:5173",
  "https://sketchflow.app"
]
jwt_expiry = 3600           # 1 saat
refresh_token_rotation_enabled = true
security_update_password_require_reauthentication = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
min_password_length = 8

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "https://YOUR_PROJECT.supabase.co/auth/v1/callback"

[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_CLIENT_SECRET)"
redirect_uri = "https://YOUR_PROJECT.supabase.co/auth/v1/callback"

[auth.sessions]
timebox = "24h"
inactivity_timeout = "8h"
```

---

## 📦 Supabase Client

### `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
    storageKey:          'sketchflow-auth',
    storage:             window.localStorage,
  },
  global: {
    headers: {
      'x-app-version': import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Auth state dəyişikliklərini log et (yalnız dev)
if (import.meta.env.DEV) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Auth]', event, session?.user?.email)
  })
}
```

---

## 🗃️ Auth Store (Zustand)

### `src/store/authStore.ts`

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, SubscriptionPlan } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user:        User    | null
  session:     Session | null
  profile:     Profile | null
  isLoading:   boolean
  isInitialized: boolean

  // Actions
  setUser:       (user: User | null) => void
  setSession:    (session: Session | null) => void
  setProfile:    (profile: Profile | null) => void
  setLoading:    (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset:         () => void

  // Computed
  isPro:         () => boolean
  plan:          () => SubscriptionPlan
}

const initialState = {
  user:          null,
  session:       null,
  profile:       null,
  isLoading:     false,
  isInitialized: false,
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setUser:        (user)    => set({ user }),
        setSession:     (session) => set({ session }),
        setProfile:     (profile) => set({ profile }),
        setLoading:     (isLoading)     => set({ isLoading }),
        setInitialized: (isInitialized) => set({ isInitialized }),

        reset: () => set(initialState),

        isPro: () => get().profile?.plan === 'pro',
        plan:  () => get().profile?.plan ?? 'free',
      }),
      {
        name: 'sketchflow-auth',
        // Yalnız bu sahələri persist et — session-u etmə (Supabase öz idarə edir)
        partialize: (state) => ({ profile: state.profile }),
      }
    ),
    { name: 'AuthStore' }
  )
)
```

---

## 🪝 useAuth Hook

### `src/hooks/useAuth.ts`

```typescript
import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const navigate  = useNavigate()
  const store     = useAuthStore()

  // ── Session-u initialize et ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      store.setLoading(true)

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session) {
          store.setSession(session)
          store.setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error('[Auth] Init error:', err)
      } finally {
        if (mounted) {
          store.setLoading(false)
          store.setInitialized(true)
        }
      }
    }

    initAuth()

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session) {
          store.setSession(session)
          store.setUser(session.user)
          await fetchProfile(session.user.id)
        }

        if (event === 'SIGNED_OUT') {
          store.reset()
          navigate('/login')
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          store.setSession(session)
        }

        if (event === 'USER_UPDATED' && session) {
          store.setUser(session.user)
          await fetchProfile(session.user.id)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ── Profile yüklə ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Auth] Profile fetch error:', error)
      return
    }

    store.setProfile(data)
  }, [])

  // ── Email / Password qeydiyyat ─────────────────────────────────────────────
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  }, [])

  // ── Email / Password giriş ────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }, [])

  // ── OAuth ─────────────────────────────────────────────────────────────────
  const signInWithOAuth = useCallback(async (provider: Provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt:      'consent',
        },
      },
    })

    if (error) throw error
    return data
  }, [])

  // ── Şifrəni sıfırla ──────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
  }, [])

  // ── Şifrəni yenilə ───────────────────────────────────────────────────────
  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  }, [])

  // ── Çıxış ─────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  // ── Profil yenilə ────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates: {
    full_name?: string
    avatar_url?: string
  }) => {
    const userId = store.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    store.setProfile(data)
    return data
  }, [store.user])

  return {
    // State
    user:          store.user,
    session:       store.session,
    profile:       store.profile,
    isLoading:     store.isLoading,
    isInitialized: store.isInitialized,
    isAuthenticated: !!store.user,
    isPro:         store.isPro(),
    plan:          store.plan(),

    // Actions
    signUp,
    signIn,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    updateProfile,
    signOut,
    fetchProfile,
  }
}
```

---

## 🛡️ Protected Route

### `src/components/auth/ProtectedRoute.tsx`

```typescript
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { SubscriptionPlan } from '@/types/database.types'

interface ProtectedRouteProps {
  requirePlan?: SubscriptionPlan
  redirectTo?:  string
}

export function ProtectedRoute({
  requirePlan,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isInitialized, isPro } = useAuth()

  // Hələ initialize olmayıb
  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  // Giriş edilməyib
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Pro plan tələb olunur
  if (requirePlan === 'pro' && !isPro) {
    return <Navigate to="/pricing" state={{ from: location }} replace />
  }

  return <Outlet />
}
```

### `src/App.tsx` — Route konfiqurasiyası

```typescript
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Landing    from '@/pages/Landing'
import Dashboard  from '@/pages/Dashboard'
import Editor     from '@/pages/Editor'
import Pricing    from '@/pages/Pricing'
import SharedView from '@/pages/SharedView'
import AuthCallback from '@/pages/AuthCallback'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"               element={<Landing />} />
      <Route path="/pricing"        element={<Pricing />} />
      <Route path="/auth/callback"  element={<AuthCallback />} />
      <Route path="/s/:shareToken"  element={<SharedView />} />

      {/* Protected — giriş tələb olunur */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"    element={<Dashboard />} />
      </Route>

      {/* Protected — Pro plan tələb olunur */}
      <Route element={<ProtectedRoute requirePlan="pro" />}>
        <Route path="/workspace/:slug" element={<Dashboard />} />
      </Route>

      {/* Editor — auth opsional (shared view üçün) */}
      <Route path="/editor/:sceneId" element={<Editor />} />
    </Routes>
  )
}
```

---

## 🔒 useSubscription Hook — Plan Qapıları

### `src/hooks/useSubscription.ts`

```typescript
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface FeatureGateResult {
  allowed:  boolean
  reason?:  string
  upgrade?: () => void
}

// Pro plan tələb edən xüsusiyyətlər
const PRO_FEATURES = [
  'unlimited_scenes',
  'auto_sync',
  'dashboard_access',
  'presentations',
  'view_only_access',
  'voice_hangout',
  'comments',
  'live_presentations',
  'user_accounts',
  'cloud_save',
  'workspace_teams',
  'user_management',
  'collections',
  'embeddable_links',
  'presentations_as_slides',
  'pdf_pptx_export',
  'personal_library_server',
] as const

export type ProFeature = typeof PRO_FEATURES[number]

export function useSubscription() {
  const navigate = useNavigate()
  const { isPro, plan, profile } = useAuth()

  const upgradeToPro = useCallback(() => {
    navigate('/pricing')
  }, [navigate])

  // Xüsusiyyətin istifadəsinə icazə var mı?
  const canUse = useCallback((feature: ProFeature): FeatureGateResult => {
    if (isPro) return { allowed: true }

    const isProFeature = PRO_FEATURES.includes(feature)

    if (isProFeature) {
      return {
        allowed:  false,
        reason:   'Bu xüsusiyyət Pro plan tələb edir',
        upgrade:  upgradeToPro,
      }
    }

    return { allowed: true }
  }, [isPro, upgradeToPro])

  // Free plan: max 3 scene
  const canCreateScene = useCallback((): FeatureGateResult => {
    if (isPro) return { allowed: true }

    const count = profile?.scenes_count ?? 0
    if (count >= 3) {
      return {
        allowed:  false,
        reason:   `Free planda maksimum 3 scene yarada bilərsiniz (${count}/3)`,
        upgrade:  upgradeToPro,
      }
    }

    return { allowed: true }
  }, [isPro, profile?.scenes_count, upgradeToPro])

  // AI xüsusiyyətləri
  const aiUsageLimit = isPro ? Infinity : 10  // Free: gündə 10 sorğu

  return {
    isPro,
    plan,
    canUse,
    canCreateScene,
    upgradeToPro,
    aiUsageLimit,
    scenesUsed:  profile?.scenes_count ?? 0,
    scenesLimit: isPro ? Infinity : 3,
  }
}
```

---

## 🌐 OAuth Callback Səhifəsi

### `src/pages/AuthCallback.tsx`

```typescript
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('[AuthCallback] Error:', error)
        navigate('/login?error=oauth_failed')
        return
      }

      if (session) {
        // Gəldiyi səhifəyə qayıt
        const redirectTo = sessionStorage.getItem('auth_redirect') ?? '/dashboard'
        sessionStorage.removeItem('auth_redirect')
        navigate(redirectTo, { replace: true })
      } else {
        navigate('/login')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-screen bg-orange-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 font-medium">Giriş edilir...</p>
      </div>
    </div>
  )
}
```

---

## 🛡️ Stripe Webhook Təhlükəsizliyi

### `supabase/functions/stripe-webhook/index.ts`

```typescript
import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../../src/types/database.types.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // RLS bypass
)

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

Deno.serve(async (req: Request) => {
  // Yalnız POST qəbul et
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  // ── İmza yoxlaması ────────────────────────────────────────────────────────
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  // ── Event handler-lər ─────────────────────────────────────────────────────
  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(sub)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[Webhook] Handler error:', err)
    return new Response('Internal error', { status: 500 })
  }
})

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  if (!userId) throw new Error('Missing user_id in metadata')

  const stripeSubId = session.subscription as string
  const stripeCustomerId = session.customer as string

  // Stripe-dan subscription məlumatını al
  const sub = await stripe.subscriptions.retrieve(stripeSubId)

  await supabase.from('subscriptions').upsert({
    user_id:                userId,
    stripe_customer_id:     stripeCustomerId,
    stripe_subscription_id: stripeSubId,
    plan:                   'pro',
    status:                 'active',
    current_period_start:   new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end:     new Date(sub.current_period_end   * 1000).toISOString(),
    cancel_at_period_end:   sub.cancel_at_period_end,
  }, { onConflict: 'user_id' })
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', sub.id)
    .single()

  if (!existingSub) return

  const plan = sub.status === 'active' ? 'pro' : 'free'

  await supabase.from('subscriptions').update({
    plan,
    status:               sub.status as any,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
  }).eq('stripe_subscription_id', sub.id)
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await supabase.from('subscriptions').update({
    plan:   'free',
    status: 'canceled',
  }).eq('stripe_subscription_id', sub.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subId = invoice.subscription as string
  if (!subId) return

  await supabase.from('subscriptions').update({
    status: 'past_due',
  }).eq('stripe_subscription_id', subId)
}
```

---

## 🚦 Rate Limiting

### `supabase/functions/_shared/rateLimiter.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimitConfig {
  key:         string   // Unikal identifikator (IP, userId)
  maxRequests: number   // Maksimum sorğu sayı
  windowMs:    number   // Zaman pəncərəsi (millisaniyə)
}

interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  resetAt:    Date
}

// Supabase-i key-value store kimi istifadə et
export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now      = Date.now()
  const windowMs = config.windowMs
  const resetAt  = new Date(now + windowMs)

  // Sadə token bucket — production-da Redis tövsiyə olunur
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key:          config.key,
    p_max_requests: config.maxRequests,
    p_window_ms:    windowMs,
  })

  if (error) {
    // Rate limit xətası olsa belə sorğuya icazə ver (fail open)
    console.error('[RateLimit] Error:', error)
    return { allowed: true, remaining: config.maxRequests, resetAt }
  }

  return {
    allowed:   data.allowed,
    remaining: data.remaining,
    resetAt,
  }
}

// Rate limit limitləri
export const RATE_LIMITS = {
  auth:     { maxRequests: 5,   windowMs: 15 * 60 * 1000 }, // 5/15dəq
  api:      { maxRequests: 100, windowMs: 60 * 1000 },       // 100/dəq
  ai:       { maxRequests: 10,  windowMs: 24 * 60 * 60 * 1000 }, // 10/gün (free)
  export:   { maxRequests: 20,  windowMs: 60 * 60 * 1000 },  // 20/saat
} as const
```

### SQL: Rate limit funksiyası

```sql
-- supabase/migrations/015_rate_limit_function.sql

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key         TEXT        PRIMARY KEY,
  count       INT         NOT NULL DEFAULT 0,
  window_start BIGINT     NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key          TEXT,
  p_max_requests INT,
  p_window_ms    BIGINT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now         BIGINT := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
  v_bucket      public.rate_limit_buckets%ROWTYPE;
  v_new_count   INT;
  v_allowed     BOOLEAN;
BEGIN
  SELECT * INTO v_bucket
  FROM public.rate_limit_buckets
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND OR (v_now - v_bucket.window_start) >= p_window_ms THEN
    -- Yeni pəncərə başlat
    INSERT INTO public.rate_limit_buckets (key, count, window_start)
    VALUES (p_key, 1, v_now)
    ON CONFLICT (key) DO UPDATE
      SET count = 1, window_start = v_now, updated_at = NOW();

    RETURN json_build_object(
      'allowed',   true,
      'remaining', p_max_requests - 1
    );
  END IF;

  v_new_count := v_bucket.count + 1;
  v_allowed   := v_new_count <= p_max_requests;

  UPDATE public.rate_limit_buckets
  SET count = v_new_count, updated_at = NOW()
  WHERE key = p_key;

  RETURN json_build_object(
    'allowed',   v_allowed,
    'remaining', GREATEST(p_max_requests - v_new_count, 0)
  );
END;
$$;
```

---

## 🔑 CORS Konfiqurasiyası

### `supabase/functions/_shared/cors.ts`

```typescript
const ALLOWED_ORIGINS = [
  'https://sketchflow.app',
  'https://www.sketchflow.app',
  ...(Deno.env.get('DENO_ENV') === 'development'
    ? ['http://localhost:5173', 'http://localhost:3000']
    : []),
]

export function getCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin':      allowed,
    'Access-Control-Allow-Methods':     'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type, Authorization, x-app-version',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age':           '86400',
  }
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status:  204,
      headers: getCorsHeaders(req),
    })
  }
  return null
}
```

---

## 🔐 Input Sanitizasiya

### `src/lib/sanitize.ts`

```typescript
// XSS qorunması üçün HTML escape
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;')
}

// Scene title sanitizasiyası
export function sanitizeTitle(title: string): string {
  return escapeHtml(title.trim()).slice(0, 100)
}

// Comment məzmunu sanitizasiyası
export function sanitizeComment(content: string): string {
  return escapeHtml(content.trim()).slice(0, 2000)
}

// Email validasiya
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Şifrə gücü yoxlaması
export interface PasswordStrength {
  score:    0 | 1 | 2 | 3 | 4
  feedback: string[]
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score: 0 | 1 | 2 | 3 | 4 = 0

  if (password.length >= 8)  score++
  else feedback.push('Minimum 8 simvol olmalıdır')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Böyük hərf əlavə edin')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Rəqəm əlavə edin')

  if (/[^A-Za-z0-9]/.test(password)) score++
  else feedback.push('Xüsusi simvol əlavə edin (@, #, ! və s.)')

  return { score: score as 0 | 1 | 2 | 3 | 4, feedback }
}
```

---

## 📋 Mühit Dəyişənləri

### `.env.example`

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Stripe (client)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# App
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://sketchflow.app

# Supabase Edge Functions (server-side only — VITE_ prefix yoxdur)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

---

## ✅ Təhlükəsizlik Yoxlama Siyahısı

| Sahə | Tədbirlər | Status |
|------|-----------|--------|
| **Auth** | JWT rotation, refresh tokens, email confirm | ✅ |
| **Database** | RLS hər cədvəldə, service_role yalnız webhook | ✅ |
| **Payments** | Stripe imza yoxlaması, service_role ilə yazma | ✅ |
| **Rate Limiting** | Auth: 5/15dəq, API: 100/dəq, AI: 10/gün | ✅ |
| **CORS** | Yalnız allow-list origin-lər | ✅ |
| **Input** | HTML escape, uzunluq limitləri, email regex | ✅ |
| **Secrets** | VITE_ prefix yalnız public key-lər üçün | ✅ |
| **Sessions** | 8 saat inactivity timeout, 24 saat timebox | ✅ |
| **Storage** | Bucket RLS, owner-only write | ✅ |
| **Plan gates** | DB trigger + hook ikiqat yoxlama | ✅ |

---

*Növbəti: `04_CANVAS_ENGINE.md` — Canvas məntiqi, Rough.js el çizimi, Zustand store*
