// ─────────────────────────────────────────────────────────────────────────────
// src/i18n/I18nContext.tsx
// Global dil state-i — bütün layihəni əhatə edir
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, Translations, translations } from './translations'

// ── LocalStorage key ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'flaro_locale'

// ── Default locale detection ──────────────────────────────────────────────────
function detectLocale(): Locale {
  // 1. LocalStorage-dan yadda saxlanılan seçim
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  if (stored && ['az', 'en', 'ru', 'tr'].includes(stored)) return stored

  // 2. Brauzer dili
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('az')) return 'az'
  if (lang.startsWith('ru')) return 'ru'
  if (lang.startsWith('tr')) return 'tr'
  if (lang.startsWith('en')) return 'en'

  // 3. Default: az
  return 'az'
}

// ── Context shape ─────────────────────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Translations
}

const I18nContext = createContext<I18nContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    // HTML lang atributunu yenilə (accessibility + SEO)
    document.documentElement.lang = l
  }

  // İlk render-da HTML lang-ı set et
  useEffect(() => {
    document.documentElement.lang = locale
  }, [])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </I18nContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
