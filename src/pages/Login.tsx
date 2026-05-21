import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const { t } = useI18n()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password, fullName)
        alert(t.login.emailConfirm)
      } else {
        await signIn(email, password)
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || t.common.error)
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="dark" size="sm" />
      </div>

      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="inline-block bg-orange-500 text-white font-bold text-2xl px-5 py-2.5 rounded-xl shadow-md transform -rotate-1">
            Flaro
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            {isSignUp ? t.login.signUpTitle : t.login.signInTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-orange-600 hover:text-orange-500 focus:outline-none"
            >
              {isSignUp ? t.login.orSignIn : t.login.orSignUp}
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-4 rounded-md">
            {isSignUp && (
              <div>
                <label className="sr-only">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="relative block w-full appearance-none rounded-xl border border-slate-200 px-3 py-3 text-slate-900 placeholder-slate-400 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                  placeholder={t.login.fullNamePlaceholder}
                />
              </div>
            )}
            <div>
              <label className="sr-only">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full appearance-none rounded-xl border border-slate-200 px-3 py-3 text-slate-900 placeholder-slate-400 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                placeholder={t.login.emailPlaceholder}
              />
            </div>
            <div>
              <label className="sr-only">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-xl border border-slate-200 px-3 py-3 text-slate-900 placeholder-slate-400 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                placeholder={t.login.passwordPlaceholder}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-orange-500 py-3 px-4 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? t.login.processing : isSignUp ? t.login.submitSignUp : t.login.submitSignIn}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
