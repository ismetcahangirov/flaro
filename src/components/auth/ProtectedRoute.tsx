import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { SubscriptionPlan } from '@/types/database.types'

interface ProtectedRouteProps {
  requirePlan?: SubscriptionPlan
  redirectTo?:  string
}

export function ProtectedRoute({
  requirePlan,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isInitialized, isPro } = useAuth()

  // Hələ initialize olmayıb
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Giriş edilməyib
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Pro plan tələb olunur
  if (requirePlan === 'pro' && !isPro) {
    return <Navigate to="/pricing" state={{ from: location }} replace />
  }

  return <Outlet />
}
