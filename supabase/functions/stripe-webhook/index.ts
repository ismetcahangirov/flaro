import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../../src/types/database.types.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id || session.client_reference_id
  if (!userId) {
    console.error('[Webhook] No user_id in session metadata')
    return
  }

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  const customerId     = typeof session.customer === 'string' ? session.customer : session.customer?.id

  let status: any = 'active'
  let currentPeriodStart = new Date().toISOString()
  let currentPeriodEnd   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    status = sub.status
    currentPeriodStart = new Date(sub.current_period_start * 1000).toISOString()
    currentPeriodEnd   = new Date(sub.current_period_end * 1000).toISOString()
  }

  // 1. Upsert subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id:                userId,
      stripe_customer_id:     customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      plan:                   'pro',
      status:                 status,
      current_period_start:   currentPeriodStart,
      current_period_end:     currentPeriodEnd,
      cancel_at_period_end:   false,
    }, { onConflict: 'user_id' })

  if (subError) {
    console.error('[Webhook] Error upserting subscription:', subError)
    throw subError
  }

  // 2. Update profile plan
  const { error: profError } = await supabase
    .from('profiles')
    .update({ plan: 'pro' })
    .eq('id', userId)

  if (profError) {
    console.error('[Webhook] Error updating profile plan:', profError)
    throw profError
  }

  console.log(`[Webhook] Successfully upgraded user ${userId} to Pro`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  // Find user by stripe_customer_id
  const { data: subData, error: findError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (findError || !subData) {
    console.error('[Webhook] Subscription updated but no local subscription found for customer:', customerId)
    return
  }

  const userId = subData.user_id
  const status = subscription.status
  const plan: any = status === 'active' || status === 'trialing' ? 'pro' : 'free'

  const { error: updateSubError } = await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      plan:                   plan,
      status:                 status as any,
      current_period_start:   new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end:     new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end:   subscription.cancel_at_period_end,
    })
    .eq('user_id', userId)

  if (updateSubError) {
    console.error('[Webhook] Error updating subscription:', updateSubError)
    throw updateSubError
  }

  const { error: updateProfError } = await supabase
    .from('profiles')
    .update({ plan: plan })
    .eq('id', userId)

  if (updateProfError) {
    console.error('[Webhook] Error updating profile plan:', updateProfError)
    throw updateProfError
  }

  console.log(`[Webhook] Successfully updated subscription for user ${userId} (status: ${status}, plan: ${plan})`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  const { data: subData, error: findError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (findError || !subData) {
    console.error('[Webhook] Subscription deleted but no local subscription found for customer:', customerId)
    return
  }

  const userId = subData.user_id

  const { error: updateSubError } = await supabase
    .from('subscriptions')
    .update({
      plan:   'free',
      status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('user_id', userId)

  if (updateSubError) {
    console.error('[Webhook] Error canceling subscription:', updateSubError)
    throw updateSubError
  }

  const { error: updateProfError } = await supabase
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', userId)

  if (updateProfError) {
    console.error('[Webhook] Error downgrading profile plan:', updateProfError)
    throw updateProfError
  }

  console.log(`[Webhook] Successfully canceled subscription for user ${userId}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const { data: subData, error: findError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (findError || !subData) return

  const userId = subData.user_id

  const { error: updateSubError } = await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('user_id', userId)

  if (updateSubError) {
    console.error('[Webhook] Error marking subscription past_due:', updateSubError)
    throw updateSubError
  }

  console.log(`[Webhook] Marked subscription past_due for user ${userId}`)
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No stripe-signature header', { status: 400 })
  }

  try {
    const body = await req.text()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err: any) {
      console.error(`[Webhook] Signature verification failed:`, err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[Webhook] Unhandled error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
