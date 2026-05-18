import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useBilling() {
  const [isLoading, setIsLoading] = useState(false)

  const openBillingPortal = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Oturum açılmayıb')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Portal açmaq alınmadı')
      
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { openBillingPortal, isLoading }
}
