import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function AdminRoute() {
  const { user, profile, isInitialized, isLoading } = useAuth()

  // Auth initialize olmayıbsa gözlə
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Auth yoxdursa admin login-ə yönləndir
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  // Auth var amma admin deyilsə — landing-ə at
  if (!profile?.is_admin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
