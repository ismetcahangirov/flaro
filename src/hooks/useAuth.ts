import { useCallback } from 'react'
import type { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

/**
 * useAuth — yalnız Zustand store-u oxuyur + auth aksiyaları qaytarır.
 * Auth initialization / listener AuthProvider-də tək bir yerdə idarə olunur.
 */
export function useAuth() {
  const store = useAuthStore()

  // ── Email / Password qeydiyyat ─────────────────────────────────────────────
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
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
    const userId = useAuthStore.getState().user?.id
    if (!userId) throw new Error('Not authenticated')

    const { data, error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    useAuthStore.getState().setProfile(data)
    return data
  }, [])

  // ── Profil oxu (lazım olduqda) ────────────────────────────────────────────
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

    useAuthStore.getState().setProfile(data)
  }, [])

  return {
    // State
    user:            store.user,
    session:         store.session,
    profile:         store.profile,
    isLoading:       store.isLoading,
    isInitialized:   store.isInitialized,
    isAuthenticated: !!store.user,
    isPro:           store.isPro(),
    plan:            store.plan(),

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
