import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

async function fetchProfile(userId: string) {
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
}

/**
 * AuthProvider — tətbiqdə BİR DƏFƏ mount olunur (main.tsx içindən).
 * onAuthStateChange INITIAL_SESSION eventi ilə auth initialize olur.
 * useAuth() hook-u yalnız Zustand store-dan oxuyur, listener qoşmur.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    // Açılışda mütləq bir dəfə session-u yoxlayırıq (refresh atılanda INITIAL_SESSION qaçırıla bilər)
    const initializeAuth = async () => {
      try {
        // HMR Web Locks deadlock problemindən qorunmaq üçün getSession-a timeout əlavə edirik.
        const getSessionWithTimeout = () => {
          return Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: any }, error: any }>((_, reject) => {
              setTimeout(() => reject(new Error('getSession timeout - deadlock bypass')), 1500)
            })
          ])
        }

        let session = null
        try {
          const res = await getSessionWithTimeout()
          session = res.data.session
        } catch (err: any) {
          console.warn('[Auth] Supabase getSession failed or timed out. Falling back to localStorage.', err.message)
          const stored = localStorage.getItem('flaro-supabase-session')
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              // Supabase storage formatı adətən: {"currentSession": {...}} və ya birbaşa session obyektidir.
              session = parsed.currentSession || parsed
            } catch (e) {
              // Parse error
            }
          }
        }

        if (session) {
          useAuthStore.getState().setSession(session)
          useAuthStore.getState().setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          // Əgər session yoxdursa (və ya vaxtı bitibsə), Zustand-ı təmizləyirik
          useAuthStore.getState().setSession(null)
          useAuthStore.getState().setUser(null)
          useAuthStore.getState().setProfile(null)
        }
      } catch (err) {
        console.error('[Auth] Initialization error:', err)
      } finally {
        if (mounted) {
          useAuthStore.getState().setLoading(false)
          useAuthStore.getState().setInitialized(true)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.debug('[Auth] Event:', event, session?.user?.email ?? 'no user')

        if (event === 'SIGNED_IN' && session) {
          useAuthStore.getState().setSession(session)
          useAuthStore.getState().setUser(session.user)
          await fetchProfile(session.user.id)
          useAuthStore.getState().setInitialized(true)
        }

        if (event === 'SIGNED_OUT') {
          useAuthStore.getState().reset()

          const publicPaths = ['/', '/login', '/pricing']
          const isPublicPath =
            publicPaths.includes(window.location.pathname) ||
            window.location.pathname.startsWith('/s/') ||
            window.location.pathname.startsWith('/auth/')

          if (!isPublicPath) {
            navigate('/login')
          }
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          useAuthStore.getState().setSession(session)
        }

        if (event === 'USER_UPDATED' && session) {
          useAuthStore.getState().setUser(session.user)
          await fetchProfile(session.user.id)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  return <>{children}</>
}
