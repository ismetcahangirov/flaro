import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Landing    from '@/pages/Landing'
import Login      from '@/pages/Login'
import Dashboard  from '@/pages/Dashboard'
import Editor     from '@/pages/Editor'
import Pricing    from '@/pages/Pricing'
import SharedView from '@/pages/SharedView'
import AuthCallback from '@/pages/AuthCallback'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"               element={<Landing />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/pricing"        element={<Pricing />} />
      <Route path="/auth/callback"  element={<AuthCallback />} />
      <Route path="/s/:shareToken"  element={<SharedView />} />

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
