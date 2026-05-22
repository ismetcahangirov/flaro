import { Edit2, Trash2, Calendar, FolderOpen, Mail } from 'lucide-react'
import { useI18n } from '@/i18n/I18nContext'
import { Avatar } from '@/components/ui/Avatar'
import { PlanBadge } from '@/components/admin/PlanBadge'
import type { Profile } from '@/types/database.types'

interface UserTableProps {
  users: Profile[]
  loading: boolean
  onEdit: (user: Profile) => void
  onDelete: (user: Profile) => void
}

export function UserTable({ users, loading, onEdit, onDelete }: UserTableProps) {
  const { t, locale } = useI18n()

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(locale === 'az' ? 'az-AZ' : locale === 'tr' ? 'tr-TR' : locale === 'en' ? 'en-US' : 'ru-RU')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 shadow-sm text-center">
        <p className="text-slate-400 font-semibold text-base">
          Heç bir istifadəçi tapılmadı.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider text-left border-b border-slate-100">
              <th className="py-4 px-6">{t.admin.colName}</th>
              <th className="py-4 px-6">{t.admin.colEmail}</th>
              <th className="py-4 px-6">{t.admin.colPlan}</th>
              <th className="py-4 px-6">{t.admin.colScenes}</th>
              <th className="py-4 px-6">{t.admin.colDate}</th>
              <th className="py-4 px-6 text-right">{t.admin.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70 text-slate-700 text-sm">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                {/* Avatar + Full Name */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.full_name || 'User'} url={user.avatar_url} size="sm" />
                    <div className="font-semibold text-slate-900 leading-tight">
                      {user.full_name || '—'}
                      {user.is_admin && (
                        <span className="ml-1.5 inline-block text-[9px] font-extrabold bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="py-4 px-6 text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                </td>

                {/* Plan */}
                <td className="py-4 px-6">
                  <PlanBadge plan={user.plan} />
                </td>

                {/* Scenes Count */}
                <td className="py-4 px-6 text-slate-600 font-bold">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen size={14} className="text-slate-400 stroke-[2.2]" />
                    <span>{user.scenes_count}</span>
                  </div>
                </td>

                {/* Created At */}
                <td className="py-4 px-6 text-slate-400 font-semibold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-6 text-right space-x-1.5">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all inline-flex items-center justify-center focus:outline-none"
                    title={t.admin.editUser}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all inline-flex items-center justify-center focus:outline-none"
                    title={t.admin.deleteUser}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
