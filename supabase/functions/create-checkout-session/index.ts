import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, getCorsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rateLimiter.ts'
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
