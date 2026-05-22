import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile, AdminStats, AuditLog, SubscriptionPlan } from '@/types/database.types'

const CACHE: Map<string, { data: any; timestamp: number }> = new Map()
const TTL = 60_000 // 60 seconds

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = CACHE.get(key)
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data
  }
  const data = await fetcher()
  CACHE.set(key, { data, timestamp: Date.now() })
  return data
}

export function useAdmin() {
  // ── Audit Log Yaz ─────────────────────────────────────────
  const writeAuditLog = useCallback(async (entry: {
    action:      string
    target_id?:  string | null
    target_type?: string | null
    old_value?:  any
    new_value?:  any
  }) => {
    const adminId = useAuthStore.getState().user?.id
    if (!adminId) {
      console.warn('Cannot write audit log: User not authenticated')
      return
    }

    const { error } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: adminId,
        action: entry.action,
        target_id: entry.target_id || null,
        target_type: entry.target_type || null,
        old_value: entry.old_value || null,
        new_value: entry.new_value || null,
      })

    if (error) {
      console.error('Audit log write failed:', error.message)
    }
  }, [])

  // ── Statistika ────────────────────────────────────────────
  const fetchStats = useCallback(async (forceRefresh = false): Promise<AdminStats> => {
    const fetcher = async () => {
      const { data, error } = await supabase.rpc('get_admin_stats')
      if (error) throw error
      // The RPC returns standard JSON, parse or return as is
      return (typeof data === 'string' ? JSON.parse(data) : data) as AdminStats
    }

    if (forceRefresh) {
      const data = await fetcher()
      CACHE.set('admin_stats', { data, timestamp: Date.now() })
      return data
    }

    return fetchWithCache('admin_stats', fetcher)
  }, [])

  // ── İstifadəçilər ─────────────────────────────────────────
  const fetchUsers = useCallback(async (opts: {
    search?:  string
    plan?:    'all' | 'free' | 'pro'
    page?:    number
    pageSize?: number
  }) => {
    const search = opts.search || ''
    const plan = opts.plan || 'all'
    const page = opts.page || 1
    const pageSize = opts.pageSize || 20

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    if (plan !== 'all') {
      query = query.eq('plan', plan)
    }

    const start = (page - 1) * pageSize
    const end = page * pageSize - 1

    const { data, count, error } = await query
      .range(start, end)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { users: (data || []) as Profile[], total: count || 0 }
  }, [])

  const updateUser = useCallback(async (userId: string, updates: {
    full_name?: string
    plan?:      SubscriptionPlan
    is_admin?:  boolean
  }) => {
    // 1. Get old profile values for audit log
    const { data: oldUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError) throw fetchError

    // 2. Perform update
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (updateError) throw updateError

    // 3. Write Audit Log
    const action = updates.is_admin !== undefined && updates.is_admin !== oldUser.is_admin
      ? 'user.admin_changed'
      : updates.plan !== undefined && updates.plan !== oldUser.plan
      ? 'user.plan_changed'
      : 'user.updated'

    await writeAuditLog({
      action,
      target_id: userId,
      target_type: 'user',
      old_value: oldUser,
      new_value: { ...oldUser, ...updates },
    })
  }, [writeAuditLog])

  const deleteUser = useCallback(async (userId: string) => {
    // 1. Get old user data for audit log first
    const { data: oldUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // 2. Call Edge Function with user JWT
    const { error } = await supabase.functions.invoke('admin-user-delete', {
      body: { userId }
    })

    if (error) throw error

    // 3. Write Audit Log
    await writeAuditLog({
      action: 'user.deleted',
      target_id: userId,
      target_type: 'user',
      old_value: oldUser || null,
      new_value: null,
    })
  }, [writeAuditLog])

  // ── Abunəliklər ───────────────────────────────────────────
  const fetchSubscriptions = useCallback(async (userId?: string) => {
    let query = supabase
      .from('subscriptions')
      .select('*, profiles:user_id(email, full_name, avatar_url)')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data as any[]
  }, [])

  const updateSubscription = useCallback(async (userId: string, plan: SubscriptionPlan) => {
    // 1. Get old values
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const { data: oldSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // 2. Update profiles plan
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', userId)

    if (profileError) throw profileError

    // 3. Update subscription if exists, or insert a manual one
    if (oldSub) {
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          plan,
          status: plan === 'pro' ? 'active' : 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (subError) throw subError
    } else if (plan === 'pro') {
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'pro',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          cancel_at_period_end: false,
        })

      if (subError) throw subError
    }

    // 4. Write Audit Log
    await writeAuditLog({
      action: 'user.plan_changed',
      target_id: userId,
      target_type: 'subscription',
      old_value: { plan: oldProfile?.plan || 'free', subscription: oldSub || null },
      new_value: { plan, status: plan === 'pro' ? 'active' : 'canceled' }
    })
  }, [writeAuditLog])

  // ── Audit Log ─────────────────────────────────────────────
  const fetchAuditLog = useCallback(async (limitCount = 50): Promise<AuditLog[]> => {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*, profiles:admin_id(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(limitCount)

    if (error) throw error
    return data as any[]
  }, [])

  return {
    fetchStats,
    fetchUsers,
    updateUser,
    deleteUser,
    fetchSubscriptions,
    updateSubscription,
    fetchAuditLog,
    writeAuditLog,
  }
}
