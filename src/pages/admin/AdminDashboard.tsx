import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  User, 
  UserPlus, 
  Folder, 
  CreditCard, 
  Activity, 
  RefreshCw,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'
import { useI18n } from '@/i18n/I18nContext'
import { supabase } from '@/lib/supabase'
import { StatsCard } from '@/components/admin/StatsCard'
import { AuditLog } from '@/components/admin/AuditLog'
import type { AdminStats, Profile } from '@/types/database.types'

export default function AdminDashboard() {
  const { fetchStats } = useAdmin()
  const { t, locale } = useI18n()
  
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<Profile[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Load stats
  const loadStats = useCallback(async (force = false) => {
    try {
      if (force) setRefreshing(true)
      const data = await fetchStats(force)
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch admin stats:', err)
    } finally {
      setLoadingStats(false)
      setRefreshing(false)
    }
  }, [fetchStats])

  // Load recent 10 users
  const loadRecentUsers = useCallback(async () => {
    try {
      setLoadingUsers(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentUsers(data || [])
    } catch (err) {
      console.error('Failed to fetch recent users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const loadAll = useCallback(async (force = false) => {
    await Promise.all([
      loadStats(force),
      loadRecentUsers()
    ])
  }, [loadStats, loadRecentUsers])

  // Initial load
  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Auto-refresh stats every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats(true)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [loadStats])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(locale === 'az' ? 'az-AZ' : locale === 'tr' ? 'tr-TR' : locale === 'en' ? 'en-US' : 'ru-RU')
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-orange-400 animate-pulse" />
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Flaro Yönetim</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Xoş gəlmisiniz, Admin!
          </h2>
          <p className="text-sm text-slate-400">
            Flaro platformasındakı fəaliyyəti, abunəlikləri və istifadəçiləri buradan izləyin və idarə edin.
          </p>
        </div>

        <button
          onClick={() => loadAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700/80 rounded-xl text-sm font-semibold transition-all shadow-md self-start sm:self-center disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-orange-500' : 'text-slate-400'} />
          <span>Yenilə</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <StatsCard 
          title={t.admin.statsTotal} 
          value={stats?.total_users} 
          icon={Users} 
          loading={loadingStats} 
          color="blue"
        />
        <StatsCard 
          title={t.admin.statsPro} 
          value={stats?.pro_users} 
          icon={CreditCard} 
          loading={loadingStats} 
          color="green"
        />
        <StatsCard 
          title={t.admin.statsFree} 
          value={stats?.free_users} 
          icon={User} 
          loading={loadingStats} 
          color="amber"
        />
        <StatsCard 
          title={t.admin.statsNew7d} 
          value={stats?.new_users_7d} 
          icon={UserPlus} 
          loading={loadingStats} 
          color="indigo"
        />
        <StatsCard 
          title={t.admin.statsScenes} 
          value={stats?.total_scenes} 
          icon={Folder} 
          loading={loadingStats} 
          color="purple"
        />
        <StatsCard 
          title={t.admin.statsActiveSubs} 
          value={stats?.active_subs} 
          icon={CreditCard} 
          loading={loadingStats} 
          color="rose"
        />
      </div>

      {/* Recent Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Recent Registrations Table */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                <Users size={18} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                {t.admin.recentUsers}
              </h3>
            </div>
            <Link 
              to="/admin/users" 
              className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors group"
            >
              <span>Hamısına bax</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loadingUsers ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 w-full bg-slate-50 animate-pulse rounded-xl border border-slate-100" />
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 font-semibold">
                Yeni istifadəçi tapılmadı.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider text-left pb-3 border-b border-slate-100">
                    <th className="pb-3 px-3">Adı</th>
                    <th className="pb-3 px-3">Email</th>
                    <th className="pb-3 px-3">Plan</th>
                    <th className="pb-3 px-3 text-right">Tarix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-slate-700 text-sm">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 truncate max-w-[150px]">
                        {user.full_name || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 truncate max-w-[180px]">
                        {user.email}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`
                          inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border
                          ${user.plan === 'pro' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'}
                        `}>
                          {user.plan === 'pro' ? 'Pro' : 'Free'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-slate-400 font-medium">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activities (Audit Logs) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                <Activity size={18} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                {t.admin.recentActivity}
              </h3>
            </div>
          </div>

          <AuditLog />
        </div>
      </div>
    </div>
  )
}
