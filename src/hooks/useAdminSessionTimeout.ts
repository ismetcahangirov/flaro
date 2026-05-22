import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export function useAdminSessionTimeout() {
  const navigate = useNavigate()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        try {
          await supabase.auth.signOut()
          navigate('/admin/login')
        } catch (err) {
          console.error('Session timeout signout failed:', err)
        }
      }, TIMEOUT_MS)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    
    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer)
    })

    // Initialize timer
    resetTimer()

    // Cleanup
    return () => {
      clearTimeout(timer)
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [navigate])
}
