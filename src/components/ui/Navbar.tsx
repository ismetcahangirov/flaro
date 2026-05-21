import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export function Navbar() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)

  const close = () => setMobileOpen(false)

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-md py-2 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
          <img src="/flaro-logo.png" alt="Flaro" className="h-[40px] md:h-[55px] lg:h-[70px] w-auto" />
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate('/pricing')}
            className="text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {t.nav.pricing}
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors hover:shadow-md hover:shadow-orange-500"
            >
              {t.nav.dashboard}
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {t.nav.login}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-100"
              >
                {t.nav.getStarted}
              </button>
            </>
          )}

          <div className="border-l border-white/15 pl-3">
            <LanguageSwitcher variant="light" size="sm" />
          </div>
        </div>

        {/* Mobile: language + burger */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher variant="light" size="sm" />
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-black/95 border-t border-slate-800 px-4 pb-4 pt-2 flex flex-col gap-1">
          <button
            onClick={() => { navigate('/pricing'); close() }}
            className="w-full text-left text-sm font-medium text-gray-300 hover:text-white px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            {t.nav.pricing}
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => { navigate('/dashboard'); close() }}
              className="w-full text-left px-4 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              {t.nav.dashboard}
            </button>
          ) : (
            <>
              <button
                onClick={() => { navigate('/login'); close() }}
                className="w-full text-left text-sm font-medium text-gray-300 hover:text-white px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                {t.nav.login}
              </button>
              <button
                onClick={() => { navigate('/login'); close() }}
                className="w-full text-left px-4 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                {t.nav.getStarted}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
