import { useEffect, useState, useCallback } from 'react'
import { 
  CreditCard, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'
import { useI18n } from '@/i18n/I18nContext'
import { Avatar } from '@/components/ui/Avatar'
import { PlanBadge } from '@/components/admin/PlanBadge'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/database.types'

export default function AdminSubscriptions() {
  const { fetchSubscriptions, updateSubscription } = useAdmin()
  const { t, locale } = useI18n()

  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Status filter state
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all')

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchSubscriptions()
      setSubscriptions(data || [])
    } catch (err) {
      console.error('Failed to load subscriptions:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchSubscriptions])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  const handlePlanChange = async (userId: string, targetPlan: SubscriptionPlan) => {
    setUpdatingId(userId)
    try {
      await updateSubscription(userId, targetPlan)
      await loadSubscriptions()
    } catch (err) {
      console.error('Failed to update subscription:', err)
      alert(t.common.error)
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 size={12} className="stroke-[2.5]" />
            <span>{t.admin.statusActive}</span>
          </span>
        )
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle size={12} className="stroke-[2.5]" />
            <span>{t.admin.statusCanceled}</span>
          </span>
        )
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <AlertCircle size={12} className="stroke-[2.5]" />
            <span>{t.admin.statusPastDue}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span>{status}</span>
          </span>
        )
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString(locale === 'az' ? 'az-AZ' : locale === 'tr' ? 'tr-TR' : locale === 'en' ? 'en-US' : 'ru-RU')
  }

  // Filter subscriptions
  const filteredSubs = subscriptions.filter((sub) => {
    if (statusFilter === 'all') return true
    return sub.status === statusFilter
  })

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Filters bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title / Description */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-600">
            <TrendingUp size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
              {t.admin.subsTitle}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Stripe abunəliklərini izləyin və ya istifadəçilərə manual plan təyin edin.
            </p>
          </div>
        </div>

        {/* Filter / Actions */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/50">
            {(['all', 'active', 'canceled', 'past_due'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`
                  px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${statusFilter === status
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'}
                `}
              >
                {status === 'all' 
                  ? t.admin.filterAll 
                  : status === 'active' 
                  ? t.admin.statusActive 
                  : status === 'canceled' 
                  ? t.admin.statusCanceled 
                  : t.admin.statusPastDue}
              </button>
            ))}
          </div>

          <button
            onClick={loadSubscriptions}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 disabled:opacity-50 transition-all focus:outline-none"
            title="Yenilə"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main subscriptions grid/table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
          ))}
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 shadow-sm text-center">
          <p className="text-slate-400 font-semibold text-base">
            Heç bir abunəlik tapılmadı.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider text-left border-b border-slate-100">
                  <th className="py-4 px-6">İstifadəçi</th>
                  <th className="py-4 px-6">Mövcud Plan</th>
                  <th className="py-4 px-6">Abunəlik Statusu</th>
                  <th className="py-4 px-6">Stripe ID</th>
                  <th className="py-4 px-6">Başlama Tarixi</th>
                  <th className="py-4 px-6">Bitmə Tarixi</th>
                  <th className="py-4 px-6 text-right">Fəaliyyət</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-slate-700 text-sm">
                {filteredSubs.map((sub) => {
                  const userName = sub.profiles?.full_name || '—'
                  const userEmail = sub.profiles?.email || '—'
                  const isPro = sub.plan === 'pro'
                  const updating = updatingId === sub.user_id

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* User Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar name={userName} url={sub.profiles?.avatar_url} size="sm" />
                          <div className="leading-tight">
                            <p className="font-semibold text-slate-900 truncate max-w-[150px]">{userName}</p>
                            <p className="text-xs text-slate-400 font-medium truncate max-w-[180px] mt-0.5">{userEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan Column */}
                      <td className="py-4 px-6">
                        <PlanBadge plan={sub.plan} />
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6">
                        {getStatusBadge(sub.status)}
                      </td>

                      {/* Stripe ID Column */}
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {sub.stripe_subscription_id ? (
                          <a
                            href={`https://dashboard.stripe.com/test/subscriptions/${sub.stripe_subscription_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-bold hover:underline"
                          >
                            <span className="truncate max-w-[120px]">{sub.stripe_subscription_id}</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-slate-300 font-semibold font-sans">Manuel Plan</span>
                        )}
                      </td>

                      {/* Start period */}
                      <td className="py-4 px-6 text-slate-500 font-semibold text-xs">
                        {formatDate(sub.current_period_start)}
                      </td>

                      {/* End period */}
                      <td className="py-4 px-6 text-slate-500 font-semibold text-xs">
                        {formatDate(sub.current_period_end)}
                      </td>

                      {/* Action Column */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handlePlanChange(sub.user_id, isPro ? 'free' : 'pro')}
                          disabled={updating}
                          className={`
                            px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ml-auto disabled:opacity-50
                            ${isPro 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/10'}
                          `}
                        >
                          {updating ? (
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : isPro ? (
                            <span>{t.admin.makeFreeBtn}</span>
                          ) : (
                            <>
                              <CreditCard size={12} />
                              <span>{t.admin.makeProBtn}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
