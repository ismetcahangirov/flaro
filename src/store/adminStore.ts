import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Profile, AdminStats, AuditLog } from '@/types/database.types'

interface AdminState {
  stats:        AdminStats | null
  users:        Profile[]
  totalUsers:   number
  auditLog:     AuditLog[]
  isLoading:    boolean
  searchQuery:  string
  planFilter:   'all' | 'free' | 'pro'
  currentPage:  number
  pageSize:     number

  setStats:       (stats: AdminStats | null) => void
  setUsers:       (users: Profile[], total: number) => void
  setAuditLog:    (log: AuditLog[]) => void
  setLoading:     (v: boolean) => void
  setSearchQuery: (q: string) => void
  setPlanFilter:  (f: 'all' | 'free' | 'pro') => void
  setPage:        (page: number) => void
  reset:          () => void
}

export const useAdminStore = create<AdminState>()(
  devtools(
    (set) => ({
      stats:       null,
      users:       [],
      totalUsers:  0,
      auditLog:    [],
      isLoading:   false,
      searchQuery: '',
      planFilter:  'all',
      currentPage: 1,
      pageSize:    20,

      setStats:       (stats)          => set({ stats }),
      setUsers:       (users, total)   => set({ users, totalUsers: total }),
      setAuditLog:    (auditLog)       => set({ auditLog }),
      setLoading:     (isLoading)      => set({ isLoading }),
      setSearchQuery: (searchQuery)    => set({ searchQuery, currentPage: 1 }),
      setPlanFilter:  (planFilter)     => set({ planFilter, currentPage: 1 }),
      setPage:        (currentPage)    => set({ currentPage }),
      reset:          ()               => set({ stats: null, users: [], auditLog: [], currentPage: 1, searchQuery: '', planFilter: 'all' }),
    }),
    { name: 'AdminStore' }
  )
)
