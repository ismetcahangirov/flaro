import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('[AuthCallback] Error:', error)
        navigate('/login?error=oauth_failed')
        return
      }

      if (session) {
        // Gəldiyi səhifəyə qayıt
        const redirectTo = sessionStorage.getItem('auth_redirect') ?? '/dashboard'
        sessionStorage.removeItem('auth_redirect')
        navigate(redirectTo, { replace: true })
      } else {
        navigate('/login')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-screen bg-orange-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 font-medium font-sans">Giriş edilir...</p>
      </div>
    </div>
  )
}
