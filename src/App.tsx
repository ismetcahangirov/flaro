import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Landing    from '@/pages/Landing'
import Login      from '@/pages/Login'
import Dashboard  from '@/pages/Dashboard'
import Editor     from '@/pages/Editor'
import Pricing    from '@/pages/Pricing'
import SharedView from '@/pages/SharedView'
import AuthCallback from '@/pages/AuthCallback'

// Admin pages with Lazy Loading (Code Splitting)
const AdminLogin         = lazy(() => import('@/pages/admin/AdminLogin'))
const AdminDashboard     = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers         = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminSubscriptions = lazy(() => import('@/pages/admin/AdminSubscriptions'))
const AdminSettings      = lazy(() => import('@/pages/admin/AdminSettings'))

// Admin Route & Layout
import { AdminRoute } from '@/components/admin/AdminRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'

// Admin loading fallback
function AdminFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"               element={<Landing />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/pricing"        element={<Pricing />} />
      <Route path="/auth/callback"  element={<AuthCallback />} />
      <Route path="/s/:shareToken"  element={<SharedView />} />

      {/* Admin Login (Public) */}
      <Route 
        path="/admin/login" 
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminLogin />
          </Suspense>
        } 
      />

      {/* Admin Protected Routes with layout */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route 
            path="/admin/dashboard" 
            element={
              <Suspense fallback={<AdminFallback />}>
                <AdminDashboard />
              </Suspense>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <Suspense fallback={<AdminFallback />}>
                <AdminUsers />
              </Suspense>
            } 
          />
          <Route 
            path="/admin/subscriptions" 
            element={
              <Suspense fallback={<AdminFallback />}>
                <AdminSubscriptions />
              </Suspense>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <Suspense fallback={<AdminFallback />}>
                <AdminSettings />
              </Suspense>
            } 
          />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      {/* Protected — giriş tələb olunur */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"    element={<Dashboard />} />
        {/* Editor — auth opsional olaraq ProtectedRoute daxilində deyil, lakin dashboard-dan keçid üçün */}
        <Route path="/editor/:sceneId" element={<Editor />} />
      </Route>

      {/* Protected — Pro plan tələb olunur */}
      <Route element={<ProtectedRoute requirePlan="pro" />}>
        <Route path="/workspace/:slug" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
