import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: true,
    // 'flaro-auth' artıq Zustand tərəfindən istifadə olunur!
    // Fərqli açar — localStorage key konflikti aradan qaldırıldı
    storageKey:         'flaro-supabase-session',
    storage:            window.localStorage,
    // Web Locks deadlock problemini (HMR/refresh zamanı) bypass etmək üçün
    // @ts-ignore
    lock: (name, acquireTimeout, fn) => fn(),
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
