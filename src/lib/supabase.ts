import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const memoryLocks: Record<string, Promise<void>> = {}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: true,
    storageKey:         'flaro-supabase-session',
    storage:            window.localStorage,
    // Web Locks deadlock problemini (HMR/refresh zamanı) bypass etmək üçün
    // in-memory queue istifadə edirik. Boş "() => fn()" yazmaq concurrent
    // refresh-lər zamanı (tab-a qayıtdıqda) Supabase-i sonsuz dövrə salıb dondururdu.
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
      const prev = memoryLocks[name] || Promise.resolve()
      let resolveNext!: () => void
      memoryLocks[name] = new Promise((resolve) => { resolveNext = resolve })
      
      // Köhnə lock-u gözlə, amma ən çox 2 saniyə (deadlock olmasın deyə)
      await Promise.race([
        prev.catch(() => {}),
        new Promise(r => setTimeout(r, 2000))
      ])
      
      try {
        // fn() adətən Supabase token refresh-dir. Əgər şəbəkə donubsa, sonsuza qədər
        // gözləməsin deyə 5 saniyəlik timeout qoyuruq ki, xəta versin və növbəti cəhd təmiz başlasın.
        return await Promise.race([
          fn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Supabase lock fn timeout')), 5000)
          )
        ])
      } finally {
        resolveNext()
      }
    },
  },
  global: {
    headers: {
      'x-app-version': import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
