import { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { Avatar } from '@/components/ui/Avatar'

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/admin/login')
    } catch (err) {
      console.error('Signout failed:', err)
    }
  }

  const menuItems = [
    {
      path: '/admin/dashboard',
      label: t.admin.navDashboard,
      icon: LayoutDashboard,
    },
    {
      path: '/admin/users',
      label: t.admin.navUsers,
      icon: Users,
    },
    {
      path: '/admin/subscriptions',
      label: t.admin.navSubscriptions,
      icon: CreditCard,
    },
    {
      path: '/admin/settings',
      label: t.admin.navSettings,
      icon: Settings,
    },
  ]

  const getPageTitle = () => {
    const activeItem = menuItems.find((item) => item.path === location.pathname)
    return activeItem ? activeItem.label : 'Admin'
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* ── DESKTOP SIDEBAR ────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="bg-orange-600 text-white font-bold text-lg px-3.5 py-1.5 rounded-lg shadow">
              Flaro
            </div>
            <span className="font-extrabold text-white text-base tracking-wider uppercase">
              Admin
            </span>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group
                  ${isActive 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-white/70" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Admin Footer */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <Avatar name={profile?.full_name || 'Admin'} url={profile?.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {profile?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-slate-500 truncate leading-tight">
                {profile?.email || 'admin@flaro.az'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-950/30 hover:text-red-400 rounded-xl text-sm font-semibold transition-all group border border-transparent hover:border-red-900/50"
          >
            <LogOut size={18} className="text-slate-400 group-hover:text-red-400 transition-colors" />
            <span>{t.admin.navLogout}</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE DRAWER ──────────────────────────────────────── */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        md:hidden fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 z-50 flex flex-col transform transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="bg-orange-600 text-white font-bold text-lg px-3.5 py-1.5 rounded-lg shadow">
              Flaro
            </div>
            <span className="font-extrabold text-white text-base tracking-wider uppercase">
              Admin
            </span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-400 hover:text-white focus:outline-none">
            <X size={20} />
          </button>
        </div>

        {/* Mobile Menu */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group
                  ${isActive 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-white/70" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Mobile Footer */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <Avatar name={profile?.full_name || 'Admin'} url={profile?.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {profile?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-slate-500 truncate leading-tight">
                {profile?.email || 'admin@flaro.az'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-950/30 hover:text-red-400 rounded-xl text-sm font-semibold transition-all group border border-transparent hover:border-red-900/50"
          >
            <LogOut size={18} className="text-slate-400 group-hover:text-red-400 transition-colors" />
            <span>{t.admin.navLogout}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTAINER ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)}
              className="p-1 text-slate-500 hover:text-slate-800 focus:outline-none md:hidden"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Lang Switcher (dark variant matches the slate/white background dropdown style) */}
            <LanguageSwitcher variant="dark" size="sm" />
            
            <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-4">
              <Avatar name={profile?.full_name || 'Admin'} url={profile?.avatar_url} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-800">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                  Süper Admin
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
