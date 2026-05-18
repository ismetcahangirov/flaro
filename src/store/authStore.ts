import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, SubscriptionPlan } from '@/types/database.types'

interface AuthState {
  user:          User    | null
  session:       Session | null
  profile:       Profile | null
  isLoading:     boolean
  isInitialized: boolean

  // Actions
  setUser:        (user: User | null) => void
  setSession:     (session: Session | null) => void
  setProfile:     (profile: Profile | null) => void
  setLoading:     (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset:          () => void

  // Computed
  isPro: () => boolean
  plan:  () => SubscriptionPlan
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user:          null,
        session:       null,
        profile:       null,
        isLoading:     false,
        isInitialized: false,

        setUser:        (user)          => set({ user }),
        setSession:     (session)       => set({ session }),
        setProfile:     (profile)       => set({ profile }),
        setLoading:     (isLoading)     => set({ isLoading }),
        setInitialized: (isInitialized) => set({ isInitialized }),

        // isInitialized-i true saxla — auth sistem initialize olub, sadəcə user yoxdur
        reset: () => set({
          user:      null,
          session:   null,
          profile:   null,
          isLoading: false,
          isInitialized: true,
        }),

        isPro: () => get().profile?.plan === 'pro',
        plan:  () => get().profile?.plan ?? 'free',
      }),
      {
        name: 'flaro-user-profile',
        // Yalnız profile persist et — session Supabase öz idarə edir
        partialize: (state) => ({ profile: state.profile }),
      }
    ),
    { name: 'AuthStore' }
  )
)
