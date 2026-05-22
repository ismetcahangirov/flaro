import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { checkLoginLockout, recordLoginAttempt } from '@/lib/adminSecurity'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutTime, setLockoutTime] = useState(0)

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime <= 0) return

    const timer = setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1000) {
          clearInterval(timer)
          setError('')
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [lockoutTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 1. Brute force check
    const lockout = checkLoginLockout(email)
    if (lockout.locked) {
      setLockoutTime(lockout.remainingMs)
      const minutes = Math.ceil(lockout.remainingMs / 60000)
      setError(`${t.admin.loginTooMany} (${minutes} m.)`)
      return
    }

    setLoading(true)

    try {
      // 2. Authenticate
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (!data.user) {
        throw new Error('Authentication failed')
      }

      // 3. Fetch profile to verify admin status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        await signOut()
        throw new Error(profileError?.message || t.admin.loginNotAdmin)
      }

      // 4. Check if admin
      if (!profile.is_admin) {
        await signOut()
        // Record failure (unauthorized admin access attempt)
        recordLoginAttempt(email, false)
        await supabase.from('admin_login_attempts').insert({ email, success: false })
        
        // Re-check lockout immediately
        const postCheck = checkLoginLockout(email)
        if (postCheck.locked) {
          setLockoutTime(postCheck.remainingMs)
        }
        
        throw new Error(t.admin.loginNotAdmin)
      }

      // 5. Success
      recordLoginAttempt(email, true)
      await supabase.from('admin_login_attempts').insert({ email, success: true })

      navigate('/admin/dashboard')
    } catch (err: any) {
      const errMsg = err.message || t.common.error
      setError(errMsg)
      
      // If it's a standard auth error (e.g. wrong password), record it for brute-force tracking
      if (err.status || errMsg.includes('Invalid login credentials') || errMsg.includes('Şifrə') || errMsg.includes('password')) {
        recordLoginAttempt(email, false)
        try {
          await supabase.from('admin_login_attempts').insert({ email, success: false })
        } catch (dbErr) {
          console.warn('DB logging failed:', dbErr)
        }
        
        // Check if now locked
        const postCheck = checkLoginLockout(email)
        if (postCheck.locked) {
          setLockoutTime(postCheck.remainingMs)
          const minutes = Math.ceil(postCheck.remainingMs / 60000)
          setError(`${t.admin.loginTooMany} (${minutes} m.)`)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const formatLockoutTime = (ms: number) => {
    const totalSecs = Math.ceil(ms / 1000)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="light" size="sm" />
      </div>

      <div className="w-full max-w-md space-y-8 bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700">
        <div className="text-center">
          <div className="inline-block bg-orange-600 text-white font-bold text-2xl px-5 py-2.5 rounded-xl shadow-md transform -rotate-1">
            Flaro
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white font-sans">
            {t.admin.loginTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {t.admin.loginSubtitle}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-950/50 border border-red-800 p-4 text-sm text-red-300">
              {error}
              {lockoutTime > 0 && (
                <div className="mt-1 font-semibold">
                  Saniyə: {formatLockoutTime(lockoutTime)}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                {t.admin.loginEmail}
              </label>
              <input
                type="email"
                required
                disabled={loading || lockoutTime > 0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/50 px-3.5 py-3 text-white placeholder-slate-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm disabled:opacity-50"
                placeholder="admin@flaro.az"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                {t.admin.loginPassword}
              </label>
              <input
                type="password"
                required
                disabled={loading || lockoutTime > 0}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/50 px-3.5 py-3 text-white placeholder-slate-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm disabled:opacity-50"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || lockoutTime > 0}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-orange-600 py-3.5 px-4 text-sm font-semibold text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Yüklenir...</span>
                </div>
              ) : (
                t.admin.loginSubmit
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-slate-500 border-t border-slate-700/50 pt-5 mt-2">
          ⚠ Bu səhifə yalnız səlahiyyətli Flaro adminləri üçündür. Giriş cəhdləri qeydə alınır və monitorinq olunur.
        </div>
      </div>
    </div>
  )
}
