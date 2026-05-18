import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, SubscriptionPlan } from '@/types/database.types'

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
        name: 'flaro-auth',
        // Yalnız bu sahələri persist et — session-u etmə (Supabase öz idarə edir)
        partialize: (state) => ({ profile: state.profile }),
      }
    ),
    { name: 'AuthStore' }
  )
)
