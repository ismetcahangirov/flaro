# Flaro — Abunəlik və Ödəniş

> **Stripe** — Checkout, Customer Portal, Webhook, Plan UI
> TypeScript strict mode ilə tam tipləşdirilmiş

---

## 💳 Ödəniş Axını Diaqramı

```
┌─────────────────────────────────────────────────────────────────┐
│                    BILLING FLOWS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FREE → PRO (Upgrade)                                           │
│  ─────────────────────────────────────────────────────────────  │
│  User clicks "Upgrade"                                          │
│       │                                                         │
│       ▼                                                         │
│  Edge Function: create-checkout-session                         │
│       │  (user_id metadata əlavə et)                           │
│       ▼                                                         │
│  Stripe Checkout Page (hosted)                                  │
│       │                                                         │
│       ├── Success → /dashboard?upgraded=true                    │
│       └── Cancel  → /pricing                                    │
│                │                                                │
│                ▼                                                │
│  Stripe Webhook → stripe-webhook Edge Function                  │
│       │  (imza yoxla → checkout.session.completed)             │
│       ▼                                                         │
│  subscriptions cədvəli yenilənir (plan = 'pro')                 │
│       │                                                         │
│       ▼ (trigger)                                               │
│  profiles.plan = 'pro'                                          │
│                                                                 │
│  PRO → FREE (Cancel)                                            │
│  ─────────────────────────────────────────────────────────────  │
│  User → Customer Portal → Cancel subscription                   │
│       │                                                         │
│       ▼                                                         │
│  customer.subscription.deleted webhook                          │
│       │                                                         │
│       ▼                                                         │
│  plan = 'free' (period sonunda)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Stripe Client

### `src/lib/stripe.ts`

```typescript
import { loadStripe, type Stripe } from '@stripe/stripe-js'

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY')
}

// Singleton — yalnız bir dəfə yüklə
let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(PUBLISHABLE_KEY)
  }
  return stripePromise
}
```

---

## ⚡ Edge Functions

### `supabase/functions/create-checkout-session/index.ts`

```typescript
import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, getCorsHeaders } from '../_shared/cors.ts'
import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts'
import type { Database } from '../../../src/types/database.types.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const PRO_PRICE_ID = Deno.env.get('STRIPE_PRO_PRICE_ID')!
const APP_URL      = Deno.env.get('APP_URL') ?? 'https://flaro.app'

Deno.serve(async (req: Request) => {
  // CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const corsHeaders = getCorsHeaders(req)

  try {
    // ── Auth yoxla ────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Rate limit ────────────────────────────────────────────────────────
    const rateResult = await checkRateLimit(supabase, {
      key:         `checkout:${user.id}`,
      maxRequests: 5,
      windowMs:    60 * 60 * 1000,  // Saatda 5 cəhd
    })

    if (!rateResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Profili yoxla ─────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, email')
      .eq('id', user.id)
      .single()

    if (profile?.plan === 'pro') {
      return new Response(
        JSON.stringify({ error: 'Already subscribed to Pro plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Mövcud Stripe customer var mı? ────────────────────────────────────
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = existingSub?.stripe_customer_id

    // Yoxdursa yarat
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    profile?.email ?? user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
    }

    // ── Checkout session yarat ────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price:    PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: { user_id: user.id },
        trial_period_days: 7,   // 7 günlük trial
      },
      success_url: `${APP_URL}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/pricing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },
    })

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[Checkout] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

### `supabase/functions/create-portal-session/index.ts`

```typescript
import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, getCorsHeaders } from '../_shared/cors.ts'
import type { Database } from '../../../src/types/database.types.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const APP_URL = Deno.env.get('APP_URL') ?? 'https://flaro.app'

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const corsHeaders = getCorsHeaders(req)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Stripe customer ID-ni tap
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!sub?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Billing portal session yarat
    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   sub.stripe_customer_id,
      return_url: `${APP_URL}/dashboard?tab=billing`,
    })

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[Portal] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 🪝 useSubscription Hook (genişləndirilmiş)

### `src/hooks/useBilling.ts`

```typescript
import { useState, useCallback } from 'react'
import { useNavigate }   from 'react-router-dom'
import { supabase }      from '@/lib/supabase'
import { useAuth }       from '@/hooks/useAuth'
import type { Subscription } from '@/types/database.types'

interface BillingState {
  subscription:     Subscription | null
  isLoading:        boolean
  isRedirecting:    boolean
  error:            string | null
}

export function useBilling() {
  const navigate = useNavigate()
  const { user, isPro } = useAuth()

  const [state, setState] = useState<BillingState>({
    subscription:  null,
    isLoading:     false,
    isRedirecting: false,
    error:         null,
  })

  // ── Subscription məlumatını yüklə ────────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    if (!user) return

    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error  // PGRST116 = not found
      setState(s => ({ ...s, subscription: data ?? null }))
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message }))
    } finally {
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [user])

  // ── Pro-ya keç ───────────────────────────────────────────────────────────
  const upgradeToPro = useCallback(async () => {
    if (!user) {
      navigate('/login?redirect=/pricing')
      return
    }

    setState(s => ({ ...s, isRedirecting: true, error: null }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error ?? 'Checkout yaratmaq mümkün olmadı')
      }

      const { url } = await response.json()
      window.location.href = url

    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, isRedirecting: false }))
    }
  }, [user, navigate])

  // ── Billing portal-ı aç ──────────────────────────────────────────────────
  const openBillingPortal = useCallback(async () => {
    if (!user || !isPro) return

    setState(s => ({ ...s, isRedirecting: true, error: null }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error ?? 'Portal açmaq mümkün olmadı')
      }

      const { url } = await response.json()
      window.location.href = url

    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, isRedirecting: false }))
    }
  }, [user, isPro])

  // ── Plan dəyişikliyini yoxla (URL parametrindən) ──────────────────────────
  const checkUpgradeSuccess = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('upgraded') === 'true'
  }, [])

  return {
    ...state,
    isPro,
    fetchSubscription,
    upgradeToPro,
    openBillingPortal,
    checkUpgradeSuccess,
  }
}
```

---

## 🎨 Pricing Səhifəsi

### `src/pages/Pricing.tsx`

```typescript
import React, { useState } from 'react'
import { useNavigate }   from 'react-router-dom'
import {
  Check, X, Zap, Sparkles,
  Infinity, Users, Cloud,
  Presentation, MessageSquare,
  FileDown, Brain,
} from 'lucide-react'
import { useBilling }   from '@/hooks/useBilling'
import { useAuth }      from '@/hooks/useAuth'

// ── Plan məlumatları ─────────────────────────────────────────────────────────

interface PlanFeature {
  label:    string
  free:     boolean | string
  pro:      boolean | string
  icon:     React.ReactNode
  isNew?:   boolean
}

const FEATURES: { section: string; items: PlanFeature[] }[] = [
  {
    section: 'Yarat',
    items: [
      { label: 'Sonsuz canvas',          free: true,         pro: true,       icon: <Infinity  size={15}/> },
      { label: 'Tam redaktə alətləri',   free: true,         pro: true,       icon: <Sparkles  size={15}/> },
      { label: 'Limitsiz səhnələr',       free: false,        pro: true,       icon: <Cloud     size={15}/> },
      { label: 'Avtomatik sinxronizasiya',free: false,        pro: true,       icon: <Cloud     size={15}/> },
      { label: 'Sürətli dashboard',       free: false,        pro: true,       icon: <Zap       size={15}/> },
      { label: 'Generativ AI',            free: 'Məhdud',     pro: 'Genişləndirilmiş', icon: <Brain size={15}/> },
      { label: 'Təqdimatlar',             free: false,        pro: true,       icon: <Presentation size={15}/> },
    ],
  },
  {
    section: 'Əməkdaşlıq',
    items: [
      { label: 'Linkə dəvət',            free: true,         pro: true,       icon: <Users     size={15}/> },
      { label: 'Yalnız görüntü rejimi',  free: false,        pro: true,       icon: <Users     size={15}/> },
      { label: 'Səs & ekran paylaşımı',  free: false,        pro: true,       icon: <Users     size={15}/>, isNew: true },
      { label: 'Şərhlər',                free: false,        pro: true,       icon: <MessageSquare size={15}/> },
      { label: 'Canlı təqdimatlar',      free: false,        pro: true,       icon: <Presentation size={15}/> },
    ],
  },
  {
    section: 'Paylaş',
    items: [
      { label: 'PNG/SVG/JSON ixrac',     free: true,         pro: true,       icon: <FileDown  size={15}/> },
      { label: 'Embed/Readonly linklər', free: false,        pro: true,       icon: <FileDown  size={15}/> },
      { label: 'Slayd kimi təqdim',      free: false,        pro: true,       icon: <Presentation size={15}/> },
      { label: 'PDF & PPTX ixrac',       free: false,        pro: true,       icon: <FileDown  size={15}/>, isNew: true },
    ],
  },
  {
    section: 'Komanda',
    items: [
      { label: 'İstifadəçi hesabları',   free: false,        pro: true,       icon: <Users     size={15}/> },
      { label: 'Buludda saxla',          free: false,        pro: true,       icon: <Cloud     size={15}/> },
      { label: 'Workspace Komandaları',  free: false,        pro: true,       icon: <Users     size={15}/> },
      { label: 'İstifadəçi idarəetməsi', free: false,        pro: true,       icon: <Users     size={15}/> },
      { label: 'Kolleksiyalara sırala',  free: false,        pro: true,       icon: <Sparkles  size={15}/> },
    ],
  },
]

// ── Pricing Komponenti ───────────────────────────────────────────────────────

export default function Pricing() {
  const navigate           = useNavigate()
  const { isAuthenticated, isPro } = useAuth()
  const { upgradeToPro, isRedirecting } = useBilling()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const monthlyPrice = 6
  const yearlyPrice  = Math.floor(monthlyPrice * 12 * 0.8)  // %20 endirim

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/pricing')
      return
    }
    await upgradeToPro()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100
                        text-orange-700 rounded-full text-sm font-semibold mb-6">
          <Zap size={14} className="fill-orange-500" />
          7 günlük pulsuz sınaq
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Sadə və şəffaf qiymət
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto">
          Həmişəlik pulsuz başlayın. Böyüdükdə yüksəlin.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-medium transition-colors ${
            billing === 'monthly' ? 'text-gray-900' : 'text-gray-400'
          }`}>
            Aylıq
          </span>
          <button
            onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billing === 'yearly' ? 'bg-brand-500' : 'bg-gray-200'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full
                              shadow-sm transition-transform ${
              billing === 'yearly' ? 'translate-x-7' : ''
            }`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${
            billing === 'yearly' ? 'text-gray-900' : 'text-gray-400'
          }`}>
            İllik
          </span>
          {billing === 'yearly' && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs
                             font-bold rounded-full">
              20% endirim
            </span>
          )}
        </div>
      </div>

      {/* Plan kartları */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

          {/* Free plan */}
          <PlanCard
            name="Free"
            price={0}
            period=""
            description="Həmişəlik pulsuz"
            features={[
              'Sonsuz canvas',
              'Tam redaktə alətləri',
              '3 aktiv səhnə',
              'PNG/SVG/JSON ixrac',
              'Ictimai kitabxanalar',
              'Linki paylaş (qonaqlar üçün)',
            ]}
            cta={isPro ? 'Cari plan' : (isAuthenticated ? 'Mövcud plan' : 'Başla')}
            ctaVariant="secondary"
            onCta={() => !isAuthenticated && navigate('/signup')}
            disabled={isAuthenticated && !isPro ? true : false}
          />

          {/* Pro plan */}
          <PlanCard
            name="Pro"
            price={billing === 'monthly' ? monthlyPrice : Math.round(yearlyPrice / 12)}
            period={billing === 'monthly' ? '/ay' : '/ay (illik ödənilir)'}
            description="Hər şeyin limitsizi"
            badge="Ən populyar"
            features={[
              'Hər şey Free-dən',
              'Limitsiz səhnələr',
              'Avtomatik bulud sinxronu',
              'Şərhlər & əməkdaşlıq',
              'Workspace komandaları',
              'PDF & PPTX ixrac',
              'Genişləndirilmiş AI',
              '7 günlük pulsuz sınaq',
            ]}
            cta={
              isPro          ? '✓ Aktiv plan' :
              isRedirecting  ? 'Yönləndirilir...' :
                               'Pro-ya keç'
            }
            ctaVariant="primary"
            onCta={handleUpgrade}
            disabled={isPro || isRedirecting}
            highlighted
          />
        </div>

        {/* Müqayisə cədvəli */}
        <ComparisonTable />
      </div>

      {/* FAQ */}
      <PricingFAQ />
    </div>
  )
}

// ── Plan Kartı ───────────────────────────────────────────────────────────────

interface PlanCardProps {
  name:        string
  price:       number
  period:      string
  description: string
  features:    string[]
  cta:         string
  ctaVariant:  'primary' | 'secondary'
  onCta:       () => void
  disabled?:   boolean
  badge?:      string
  highlighted?: boolean
}

function PlanCard({
  name, price, period, description, features,
  cta, ctaVariant, onCta, disabled, badge, highlighted,
}: PlanCardProps) {
  return (
    <div className={`relative rounded-2xl p-8 flex flex-col transition-all ${
      highlighted
        ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-2xl shadow-orange-200 scale-[1.02]'
        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
    }`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1
                        bg-white text-orange-600 text-xs font-bold rounded-full
                        shadow-md border border-orange-100">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-xl font-bold mb-1 ${highlighted ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
        <p className={`text-sm ${highlighted ? 'text-orange-100' : 'text-gray-500'}`}>
          {description}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-end gap-1">
          <span className={`text-5xl font-extrabold ${highlighted ? 'text-white' : 'text-gray-900'}`}>
            ${price}
          </span>
          {period && (
            <span className={`text-sm mb-2 ${highlighted ? 'text-orange-200' : 'text-gray-400'}`}>
              {period}
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              highlighted ? 'bg-white/20' : 'bg-orange-50'
            }`}>
              <Check size={12} className={highlighted ? 'text-white' : 'text-orange-500'} />
            </div>
            <span className={highlighted ? 'text-white' : 'text-gray-700'}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        disabled={disabled}
        className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm
                    transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          ctaVariant === 'primary'
            ? highlighted
              ? 'bg-white text-orange-600 hover:bg-orange-50 shadow-lg'
              : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {cta}
      </button>
    </div>
  )
}

// ── Müqayisə Cədvəli ─────────────────────────────────────────────────────────

function ComparisonTable() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Başlıq */}
      <div className="grid grid-cols-3 border-b border-gray-100">
        <div className="p-5" />
        <div className="p-5 text-center border-l border-gray-100">
          <span className="text-sm font-bold text-gray-500">Free</span>
        </div>
        <div className="p-5 text-center border-l border-gray-100 bg-orange-50">
          <span className="text-sm font-bold text-orange-600">Pro</span>
        </div>
      </div>

      {/* Xüsusiyyətlər */}
      {FEATURES.map((section) => (
        <React.Fragment key={section.section}>
          {/* Bölmə başlığı */}
          <div className="grid grid-cols-3 bg-gray-50 border-y border-gray-100">
            <div className="p-4 col-span-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {section.section}
              </span>
            </div>
          </div>

          {section.items.map((feature, idx) => (
            <div
              key={idx}
              className="grid grid-cols-3 border-b border-gray-50 hover:bg-gray-50/50
                         transition-colors"
            >
              {/* Xüsusiyyət adı */}
              <div className="p-4 flex items-center gap-2.5">
                <span className="text-gray-400">{feature.icon}</span>
                <span className="text-sm text-gray-700">{feature.label}</span>
                {feature.isNew && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700
                                   text-[10px] font-bold rounded-full">
                    YENİ
                  </span>
                )}
              </div>

              {/* Free */}
              <div className="p-4 flex items-center justify-center border-l border-gray-100">
                <FeatureValue value={feature.free} />
              </div>

              {/* Pro */}
              <div className="p-4 flex items-center justify-center border-l border-gray-100 bg-orange-50/30">
                <FeatureValue value={feature.pro} isPro />
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  )
}

function FeatureValue({ value, isPro }: { value: boolean | string; isPro?: boolean }) {
  if (value === true) {
    return (
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        isPro ? 'bg-orange-100' : 'bg-gray-100'
      }`}>
        <Check size={13} className={isPro ? 'text-orange-500' : 'text-gray-500'} />
      </div>
    )
  }

  if (value === false) {
    return <X size={15} className="text-gray-300" />
  }

  // String dəyər (məs: "Məhdud", "Genişləndirilmiş")
  return (
    <span className={`text-xs font-semibold ${
      isPro ? 'text-orange-600' : 'text-gray-500'
    }`}>
      {value}
    </span>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Kredit kartı olmadan sınaya bilərəm?',
    a: 'Bəli! Pro planı 7 günlük pulsuz sınaqla başlayır. Sınaq müddətindən əvvəl ləğv edə bilərsiniz.',
  },
  {
    q: 'İstənilən vaxt ləğv edə bilərəm?',
    a: 'Əlbəttə. Billing portalından istənilən vaxt ləğv edə bilərsiniz. Cari dövrün sonuna kimi Pro plan aktiv qalır.',
  },
  {
    q: 'Free planda yaratdığım fayllara nə olur?',
    a: 'Heç nə olmur. Məlumatlarınız həmişə sizindir. Pro-dan Free-ə keçsəniz fayllarınıza brauzer vasitəsilə daxil ola bilərsiniz.',
  },
  {
    q: 'Komanda üçün qiymət necədir?',
    a: 'Hər üzv üçün $6/ay. Workspace funksiyası Pro planın bir hissəsidir.',
  },
] as const

function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
        Tez-tez verilən suallar
      </h2>
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden
                       shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="font-semibold text-gray-800 text-sm">{item.q}</span>
              <span className={`text-orange-500 text-lg transition-transform ${
                open === i ? 'rotate-45' : ''
              }`}>
                +
              </span>
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                <p className="pt-4">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 🔔 Upgrade Banner Komponenti

### `src/components/pricing/UpgradeBanner.tsx`

```typescript
import React from 'react'
import { Zap, X } from 'lucide-react'
import { useBilling }       from '@/hooks/useBilling'
import { useSubscription }  from '@/hooks/useSubscription'
import type { ProFeature }  from '@/hooks/useSubscription'

interface UpgradeBannerProps {
  feature:    ProFeature
  message?:   string
  onDismiss?: () => void
  compact?:   boolean
}

export function UpgradeBanner({
  feature,
  message,
  onDismiss,
  compact = false,
}: UpgradeBannerProps) {
  const { upgradeToPro, isRedirecting } = useBilling()
  const { canUse }                       = useSubscription()

  const gate = canUse(feature)
  if (gate.allowed) return null

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-orange-50
                      border border-orange-200 rounded-xl">
        <Zap size={14} className="text-orange-500 flex-shrink-0 fill-orange-500" />
        <span className="text-xs text-orange-700 font-medium flex-1">
          {message ?? gate.reason}
        </span>
        <button
          onClick={upgradeToPro}
          disabled={isRedirecting}
          className="text-xs font-bold text-orange-600 hover:text-orange-700
                     whitespace-nowrap"
        >
          Pro-ya keç →
        </button>
      </div>
    )
  }

  return (
    <div className="relative p-5 bg-gradient-to-r from-orange-500 to-amber-500
                    rounded-2xl text-white shadow-lg shadow-orange-200">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center
                        justify-center flex-shrink-0">
          <Zap size={20} className="fill-white text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base mb-0.5">Pro plan tələb olunur</p>
          <p className="text-sm text-orange-100 mb-4">
            {message ?? gate.reason}
          </p>
          <button
            onClick={upgradeToPro}
            disabled={isRedirecting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white
                       text-orange-600 font-bold text-sm rounded-xl
                       hover:bg-orange-50 transition-colors shadow-sm
                       disabled:opacity-70"
          >
            {isRedirecting ? 'Yönləndirilir...' : '7 gün pulsuz sına →'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## ✅ Billing Xülasəsi

| Modul | Fayl | Məzmun |
|-------|------|--------|
| **Stripe Client** | `stripe.ts` | Singleton loadStripe |
| **Checkout** | `create-checkout-session` | Edge Function, trial 7 gün, imza |
| **Portal** | `create-portal-session` | Billing idarəetmə, ləğv |
| **Webhook** | `stripe-webhook` | *(03-cü faylda)* LWW sync |
| **Hook** | `useBilling.ts` | `upgradeToPro`, `openBillingPortal` |
| **Pricing UI** | `Pricing.tsx` | Plan kartları, müqayisə cədvəli, FAQ |
| **Banner** | `UpgradeBanner.tsx` | Compact və tam variant |

**Stripe konfiqurasiyası (Dashboard):**
- Product: "Flaro Pro"
- Price: `$6/month` (recurring) + `$57.60/year` (%20 endirim)
- Webhook endpoints: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
- Trial: 7 gün (kredit kartı tələb olunur)

---

*Növbəti: `07_API_AND_EDGE_FUNCTIONS.md` — Scene CRUD, AI integration, export Edge Functions*
