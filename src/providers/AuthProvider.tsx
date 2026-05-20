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
        let session = null

        // Development-da HMR Web Locks deadlock riski var, ona görə timeout əlavə edirik.
        // Production-da Promise.race lazım deyil — lock düzgün işləyir.
        if (import.meta.env.DEV) {
          const getSessionWithTimeout = () => {
            return Promise.race([
              supabase.auth.getSession(),
              new Promise<{ data: { session: any }, error: any }>((_, reject) => {
                setTimeout(() => reject(new Error('getSession timeout - deadlock bypass')), 1500)
              })
            ])
          }

          try {
            const res = await getSessionWithTimeout()
            session = res.data.session
          } catch (err: any) {
            console.warn('[Auth] Supabase getSession failed or timed out. Falling back to localStorage.', err.message)
            const stored = localStorage.getItem('flaro-supabase-session')
            if (stored) {
              try {
                const parsed = JSON.parse(stored)
                session = parsed.currentSession || parsed
              } catch (e) {
                // Parse error
              }
            }
          }
        } else {
          // Production: normal getSession, timeout yoxdur
          const { data } = await supabase.auth.getSession()
          session = data.session
        }

        if (session) {
          useAuthStore.getState().setAuth(session.user, session)
          await fetchProfile(session.user.id)
        } else {
          // Əgər session yoxdursa (və ya vaxtı bitibsə), Zustand-ı təmizləyirik
          useAuthStore.getState().setAuth(null, null)
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

        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
          useAuthStore.getState().setAuth(session.user, session)
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
          useAuthStore.getState().setAuth(session.user, session)
        }

        if (event === 'USER_UPDATED' && session) {
          useAuthStore.getState().setAuth(session.user, session)
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
