import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react'
import { useAdmin } from '@/hooks/useAdmin'
import { useI18n } from '@/i18n/I18nContext'
import { UserTable } from '@/components/admin/UserTable'
import { UserEditModal } from '@/components/admin/UserEditModal'
import type { Profile } from '@/types/database.types'

export default function AdminUsers() {
  const { fetchUsers, deleteUser } = useAdmin()
  const { t } = useI18n()

  // Search & Filter State
  const [searchVal, setSearchVal] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all')
  
  // Pagination State
  const [page, setPage] = useState(1)
  const pageSize = 15
  const [totalCount, setTotalCount] = useState(0)

  // Data State
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  
  // Custom Delete Modal State
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Debounce Search Value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setPage(1) // Reset to page 1 on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchVal])

  // Fetch Users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const { users: data, total } = await fetchUsers({
        search: debouncedSearch,
        plan: planFilter,
        page,
        pageSize,
      })
      setUsers(data)
      setTotalCount(total)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, planFilter, page, fetchUsers])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleEdit = (user: Profile) => {
    setEditingUser(user)
    setEditOpen(true)
  }

  const handleDeleteRequest = (user: Profile) => {
    setDeletingUser(user)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return
    setDeleteLoading(true)

    try {
      await deleteUser(deletingUser.id)
      setDeletingUser(null)
      loadUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert(t.common.error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Search and Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="block w-full rounded-2xl border border-slate-200/90 pl-11 pr-4 py-2.5 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm font-medium transition-all"
            placeholder={t.admin.searchPlaceholder}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/50">
            {(['all', 'free', 'pro'] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => {
                  setPlanFilter(plan)
                  setPage(1)
                }}
                className={`
                  px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${planFilter === plan
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'}
                `}
              >
                {plan === 'all' 
                  ? t.admin.filterAll 
                  : plan === 'pro' 
                  ? 'PRO' 
                  : 'FREE'}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadUsers()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 disabled:opacity-50 transition-all focus:outline-none"
            title="Yenilə"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <UserTable 
        users={users} 
        loading={loading} 
        onEdit={handleEdit} 
        onDelete={handleDeleteRequest} 
      />

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Səhifə {page} / {totalPages} (Ümumi {totalCount} istifadəçi)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-all focus:outline-none"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-all focus:outline-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <UserEditModal
        isOpen={editOpen}
        user={editingUser}
        onClose={() => {
          setEditOpen(false)
          setEditingUser(null)
        }}
        onSave={() => loadUsers()}
      />

      {/* Custom Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-6 relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                <AlertTriangle size={32} className="stroke-[2.2]" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                İstifadəçini silmək istəyirsiniz?
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                <strong className="text-slate-900">{deletingUser.full_name || deletingUser.email}</strong> adlı istifadəçi və ona aid bütün məlumatlar sistemdən tamamilə silinəcəkdir.
              </p>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5 text-xs text-amber-800 font-bold leading-relaxed text-left w-full">
                ⚠ {t.admin.deleteConfirm}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={deleteLoading}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none transition-all disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 focus:outline-none transition-all shadow-md shadow-red-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Sil</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
