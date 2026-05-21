// ─────────────────────────────────────────────────────────────────────────────
// src/components/ui/LanguageSwitcher.tsx
// Hər səhifədə istifadə ediləcək dil seçici — dropdown stil
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useI18n } from '@/i18n/I18nContext'
import { LOCALES, Locale } from '@/i18n/translations'

interface LanguageSwitcherProps {
  /** Açıq mövzu üçün (Landing hero, Editor topbar) */
  variant?: 'light' | 'dark'
  /** Düymənin ölçüsü */
  size?: 'sm' | 'md'
}

export function LanguageSwitcher({
  variant = 'light',
  size = 'md',
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Kənara klik edildikdə bağla
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = LOCALES.find((l) => l.code === locale)!

  const isLight = variant === 'light'
  const isSm = size === 'sm'

  const btnBase = `
    flex items-center gap-1.5 rounded-xl font-semibold transition-all
    ${isSm ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
    ${isLight
      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}
  `

  const dropdownBase = `
    absolute right-0 mt-1.5 w-32 rounded-2xl shadow-xl border py-1 z-50
    ${isLight
      ? 'bg-slate-900 border-slate-700'
      : 'bg-white border-slate-200'}
  `

  const itemBase = (active: boolean) => `
    flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium transition-colors
    ${active
      ? isLight
        ? 'bg-orange-500/20 text-orange-300'
        : 'bg-orange-50 text-orange-600'
      : isLight
        ? 'text-slate-300 hover:bg-slate-800'
        : 'text-slate-700 hover:bg-slate-50'}
  `

  return (
    <div className="relative" ref={ref}>
      <button
        className={btnBase}
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe size={isSm ? 12 : 14} className="opacity-80" />
        <span>{current.flag}</span>
        <span>{current.label}</span>
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`transition-transform ${open ? 'rotate-180' : ''} opacity-60`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className={dropdownBase} role="listbox" aria-label="Select language">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === locale}
              className={itemBase(l.code === locale)}
              onClick={() => {
                setLocale(l.code as Locale)
                setOpen(false)
              }}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === locale && (
                <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
