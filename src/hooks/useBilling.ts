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
