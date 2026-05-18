import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const navigate  = useNavigate()
  const store     = useAuthStore()

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
  }, [store])

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
  }, [navigate, fetchProfile]) // removed store from dependency to avoid dependency loops if initAuth re-runs. Store values are mutated inside actions.

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
  }, [store])

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
