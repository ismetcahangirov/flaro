import { useEffect, useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { useI18n } from '@/i18n/I18nContext'
import { Activity, Shield, User, CreditCard } from 'lucide-react'

export function AuditLog() {
  const { fetchAuditLog } = useAdmin()
  const { locale } = useI18n()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadLogs = async () => {
      try {
        const data = await fetchAuditLog(10)
        if (active) {
          setLogs(data)
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    loadLogs()
    return () => { active = false }
  }, [fetchAuditLog])

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'user.admin_changed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
            <Shield size={12} />
            Admin Dəyişdi
          </span>
        )
      case 'user.plan_changed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
            <CreditCard size={12} />
            Plan Dəyişdi
          </span>
        )
      case 'user.deleted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
            <User size={12} className="opacity-80" />
            İstifadəçi Silindi
          </span>
        )
      case 'user.updated':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
            <Activity size={12} />
            Redaktə Edildi
          </span>
        )
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString(locale === 'az' ? 'az-AZ' : locale === 'tr' ? 'tr-TR' : locale === 'en' ? 'en-US' : 'ru-RU')
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 w-full bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400 font-semibold">
        Heç bir əməliyyat logu tapılmadı.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead>
          <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider text-left border-b border-slate-100">
            <th className="pb-3 px-4">Admin</th>
            <th className="pb-3 px-4">Əməliyyat</th>
            <th className="pb-3 px-4">Hədəf ID</th>
            <th className="pb-3 px-4 text-right">Tarix</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/70 text-sm text-slate-700">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3.5 px-4 font-semibold text-slate-900">
                {log.profiles?.full_name || log.profiles?.email || 'Flaro Sistem'}
              </td>
              <td className="py-3.5 px-4">
                {getActionBadge(log.action)}
              </td>
              <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                {log.target_id ? log.target_id.substring(0, 8) + '...' : '—'}
              </td>
              <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-medium">
                {formatDate(log.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
