import { useState, useEffect } from 'react'
import { X, Save, ShieldCheck } from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'
import { useI18n } from '@/i18n/I18nContext'
import type { Profile, SubscriptionPlan } from '@/types/database.types'

interface UserEditModalProps {
  user: Profile | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function UserEditModal({ user, isOpen, onClose, onSave }: UserEditModalProps) {
  const { updateUser } = useAdmin()
  const { t } = useI18n()

  const [fullName, setFullName] = useState('')
  const [plan, setPlan] = useState<SubscriptionPlan>('free')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sync state with selected user
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setPlan(user.plan)
      setIsAdmin(user.is_admin || false)
      setError('')
    }
  }, [user])

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await updateUser(user.id, {
        full_name: fullName,
        plan,
        is_admin: isAdmin,
      })
      onSave()
      onClose()
    } catch (err: any) {
      setError(err.message || t.common.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6">
          <h3 className="font-extrabold text-slate-900 text-lg">
            {t.admin.editUser}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-all focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email (Read-only) */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                {t.admin.colEmail}
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="block w-full rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-slate-500 font-medium sm:text-sm cursor-not-allowed"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                {t.admin.colName}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                placeholder={t.login.fullNamePlaceholder}
              />
            </div>

            {/* Plan Selector */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                {t.admin.colPlan}
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}
                className="block w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 bg-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm font-semibold"
              >
                <option value="free">{t.admin.filterFree}</option>
                <option value="pro">{t.admin.filterPro}</option>
              </select>
            </div>

            {/* Admin Role Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all select-none">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={isAdmin ? 'text-orange-600' : 'text-slate-400'} />
                  <span className="text-sm font-bold text-slate-800">
                    Sistem Admini Et
                  </span>
                </div>
              </label>
              <p className="text-[10px] text-slate-400 ml-1.5 mt-1.5">
                ⚠ Bu seçim bu istifadəçiyə bütün idarəetmə panelinə, digər istifadəçilərə və audit loglarına tam giriş icazəsi verəcəkdir.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none transition-all disabled:opacity-50"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 focus:outline-none transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  <span>{t.common.save}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
