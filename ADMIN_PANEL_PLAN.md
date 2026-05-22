# Flaro — Admin Panel Tam İmplementasiya Planı

> **Stack:** React 18 + TypeScript + Supabase + Zustand + Tailwind CSS  
> **Mövcud:** Auth sistemi, Stripe billing, i18n (az/en/ru/tr), RLS migrations  
> **Hədəf:** Production-ready admin panel — sıfır dummy data, tam security, optimal performans

---

## 📋 ÜMUMI BAXIŞ

### Nə əlavə ediləcək:
1. **DB Migration** — `is_admin` sahəsi + admin RLS policies + audit log cədvəli
2. **Admin Seed Script** — ilk admin hesabı yaratmaq üçün CLI seed
3. **Admin Login Səhifəsi** — `/admin/login` — ayrıca, brute-force qorumalı
4. **Admin Route Guard** — yalnız admin-lərə açıq protected route
5. **Admin Dashboard** — real statistika (Supabase-dan), heç bir mock data
6. **İstifadəçi İdarəetməsi** — siyahı, axtarış, məlumat dəyişdirmə, plan dəyişdirmə
7. **Abunəlik İdarəetməsi** — plan assign, Stripe sync
8. **Admin Settings** — admin öz profilini dəyişdirə bilər
9. **i18n genişlənməsi** — admin bölməsi üçün 4 dildə tərcümələr
10. **Security Layer** — rate limiting, audit log, session timeout, CSP headers

---

## 📁 YENİ FAYL STRUKTURU

```
src/
├── pages/
│   ├── admin/
│   │   ├── AdminLogin.tsx          ← Admin üçün ayrıca login
│   │   ├── AdminDashboard.tsx      ← Statistika dashboard
│   │   ├── AdminUsers.tsx          ← İstifadəçi idarəetməsi
│   │   ├── AdminSubscriptions.tsx  ← Abunəlik idarəetməsi
│   │   └── AdminSettings.tsx       ← Admin profil settings
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx         ← Admin sidebar + topbar layout
│   │   ├── AdminRoute.tsx          ← Admin-only protected route
│   │   ├── StatsCard.tsx           ← Dashboard statistika kartı
│   │   ├── UserTable.tsx           ← İstifadəçi cədvəli (axtarış, filter)
│   │   ├── UserEditModal.tsx       ← İstifadəçi məlumat edit modalı
│   │   ├── PlanBadge.tsx           ← Plan göstəricisi (free/pro)
│   │   └── AuditLog.tsx            ← Son admin əməliyyatları log
├── hooks/
│   └── useAdmin.ts                 ← Admin data fetching hook
├── store/
│   └── adminStore.ts               ← Admin Zustand store
supabase/
└── migrations/
    └── 020_admin_system.sql        ← Admin DB migration
scripts/
└── seed-admin.ts                   ← Admin seed script
```

---

## MƏRHƏLƏ 1 — VERİTABANI MİGRASİYASI

**Fayl:** `supabase/migrations/020_admin_system.sql`

### 1.1 — Profiles cədvəlinə `is_admin` sahəsi əlavə et

```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Index — admin siyahısı sürətli gətirilsin
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin 
  ON public.profiles(is_admin) 
  WHERE is_admin = TRUE;
```

### 1.2 — Audit Log cədvəli (admin əməliyyatları izlə)

```sql
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,  -- 'user.plan_changed', 'user.deleted', vs.
  target_id   UUID,                  -- təsir olunan istifadəçi/entity ID
  target_type TEXT,                  -- 'user', 'scene', 'subscription'
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Yalnız adminlər oxuya bilər
CREATE INDEX idx_audit_log_admin_id   ON public.admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_created_at ON public.admin_audit_log(created_at DESC);
```

### 1.3 — Admin brute-force qoruması (login cəhdləri)

```sql
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  ip_address  INET,
  success     BOOLEAN     NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON public.admin_login_attempts(email, attempted_at DESC);
```

### 1.4 — RLS Policies (Admin)

```sql
-- Adminlər BÜTÜN profillərə baxa bilər
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- Adminlər istənilən profili yeniləyə bilər
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- Adminlər audit log-a yaza bilər
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid());

-- Adminlər audit log-u oxuya bilər
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- Adminlər bütün subscriptions-a baxa bilər
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- Adminlər subscriptions yeniləyə bilər
CREATE POLICY "Admins can update subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );
```

### 1.5 — Admin statistika funksiyası (SECURITY DEFINER)

```sql
-- Performans üçün aggregate funksiya — RLS bypass etmədən
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Yalnız admin çağıra bilər
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Access denied: admin required' USING ERRCODE = '42501';
  END IF;

  SELECT json_build_object(
    'total_users',       (SELECT COUNT(*) FROM public.profiles),
    'pro_users',         (SELECT COUNT(*) FROM public.profiles WHERE plan = 'pro'),
    'free_users',        (SELECT COUNT(*) FROM public.profiles WHERE plan = 'free'),
    'total_scenes',      (SELECT COUNT(*) FROM public.scenes),
    'public_scenes',     (SELECT COUNT(*) FROM public.scenes WHERE is_public = TRUE),
    'new_users_7d',      (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '7 days'),
    'new_users_30d',     (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '30 days'),
    'active_subs',       (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active'),
    'total_workspaces',  (SELECT COUNT(*) FROM public.workspaces)
  ) INTO result;

  RETURN result;
END;
$$;
```

### 1.6 — `is_admin`-i profile trigger-a əlavə et (seed üçün bypass)

```sql
-- Mövcud handle_new_user trigger-ini yenilə — is_admin=false default
-- (artıq default false, amma explicilty yazırıq)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## MƏRHƏLƏ 2 — ADMIN SEED SCRİPTİ

**Fayl:** `scripts/seed-admin.ts`  
**Çalışdırma:** `npx tsx scripts/seed-admin.ts`

```typescript
// scripts/seed-admin.ts
// ─────────────────────────────────────────────────────────
// İlk admin hesabı yaratmaq üçün seed script.
// Yalnız development/staging üçün.
// Production-da Supabase Dashboard-dan manual işlət.
// ─────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

// .env-dən oxu (service_role key lazımdır!)
const supabaseUrl  = process.env.VITE_SUPABASE_URL!
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin üçün service role

if (!supabaseUrl || !serviceKey) {
  console.error('❌ VITE_SUPABASE_URL və SUPABASE_SERVICE_ROLE_KEY .env-də olmalıdır')
  process.exit(1)
}

// Service role client — RLS bypass edir (yalnız server-side!)
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q: string) => new Promise<string>(res => rl.question(q, res))

async function seedAdmin() {
  console.log('\n🔐 Flaro Admin Seed\n')

  const email    = await ask('Admin email: ')
  const password = await ask('Admin şifrəsi (min 12 simvol): ')
  const fullName = await ask('Ad Soyad: ')

  // Şifrə gücü yoxla
  if (password.length < 12) {
    console.error('❌ Şifrə minimum 12 simvol olmalıdır')
    process.exit(1)
  }

  // 1. Auth user yarat
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // Email təsdiqinə ehtiyac yoxdur
    user_metadata: { full_name: fullName, is_admin: true }
  })

  if (authError) {
    // User artıq mövcuddursa — sadəcə admin et
    if (authError.message.includes('already registered')) {
      console.log('⚠️  Bu email artıq qeydiyyatdadır. Admin flag əlavə edilir...')
      
      const { data: existingUser } = await supabase.auth.admin.listUsers()
      const user = existingUser.users.find(u => u.email === email)
      
      if (!user) {
        console.error('❌ İstifadəçi tapılmadı')
        process.exit(1)
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true, full_name: fullName })
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ Profile yenilənmədi:', updateError.message)
        process.exit(1)
      }

      console.log(`✅ ${email} admin edildi!`)
    } else {
      console.error('❌ Auth xətası:', authError.message)
      process.exit(1)
    }
  } else {
    // 2. Profile-i is_admin=true ilə yenilə
    // (handle_new_user trigger artıq profile yaratdı)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('❌ Profile update xətası:', profileError.message)
      process.exit(1)
    }

    console.log(`\n✅ Admin hesab yaradıldı!`)
    console.log(`   Email:    ${email}`)
    console.log(`   Ad:       ${fullName}`)
    console.log(`   Login:    /admin/login\n`)
  }

  rl.close()
}

seedAdmin().catch(err => {
  console.error('Xəta:', err)
  process.exit(1)
})
```

**package.json-a əlavə et:**
```json
"scripts": {
  "seed:admin": "tsx scripts/seed-admin.ts"
}
```

---

## MƏRHƏLƏ 3 — TİP TƏRİFLƏRİ

**Fayl:** `src/types/database.types.ts` — mövcud faylı genişləndir

```typescript
// profiles Row-a əlavə et:
is_admin: boolean

// Yeni interfeyslər əlavə et:
export interface AdminStats {
  total_users:     number
  pro_users:       number
  free_users:      number
  total_scenes:    number
  public_scenes:   number
  new_users_7d:    number
  new_users_30d:   number
  active_subs:     number
  total_workspaces: number
}

export interface AuditLog {
  id:          string
  admin_id:    string
  action:      string
  target_id:   string | null
  target_type: string | null
  old_value:   Json | null
  new_value:   Json | null
  ip_address:  string | null
  created_at:  string
}

export interface AdminLoginAttempt {
  id:           string
  email:        string
  ip_address:   string | null
  success:      boolean
  attempted_at: string
}
```

---

## MƏRHƏLƏ 4 — ADMIN ZUSTAND STORE

**Fayl:** `src/store/adminStore.ts`

```typescript
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

  setStats:       (stats: AdminStats) => void
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
      reset:          ()               => set({ stats: null, users: [], auditLog: [] }),
    }),
    { name: 'AdminStore' }
  )
)
```

---

## MƏRHƏLƏ 5 — ADMIN HOOK

**Fayl:** `src/hooks/useAdmin.ts`

Bu hook bütün admin data əməliyyatlarını idarə edir.

### Metodlar:

```typescript
// src/hooks/useAdmin.ts

export function useAdmin() {
  
  // ── Statistika ────────────────────────────────────────────
  const fetchStats = async (): Promise<AdminStats>
  // supabase.rpc('get_admin_stats') çağırır
  // Cache: 60 saniyə (SWR pattern)

  // ── İstifadəçilər ─────────────────────────────────────────
  const fetchUsers = async (opts: {
    search?:  string
    plan?:    'all' | 'free' | 'pro'
    page?:    number
    pageSize?: number
  }): Promise<{ users: Profile[], total: number }>
  // profiles cədvəlindən, ilike search, plan filter, pagination

  const updateUser = async (userId: string, updates: {
    full_name?: string
    plan?:      SubscriptionPlan
    is_admin?:  boolean
  }): Promise<void>
  // profiles UPDATE + audit log yazır

  const deleteUser = async (userId: string): Promise<void>
  // supabase.auth.admin.deleteUser (service role lazım)
  // NOT: Bu Supabase Edge Function vasitəsilə ediləcək

  // ── Abunəliklər ───────────────────────────────────────────
  const fetchSubscriptions = async (userId?: string): Promise<Subscription[]>

  const updateSubscription = async (userId: string, plan: SubscriptionPlan): Promise<void>
  // profiles.plan + subscriptions tablosunu yenilə + audit log

  // ── Audit Log ─────────────────────────────────────────────
  const fetchAuditLog = async (limit?: number): Promise<AuditLog[]>

  const writeAuditLog = async (entry: {
    action:      string
    target_id?:  string
    target_type?: string
    old_value?:  object
    new_value?:  object
  }): Promise<void>

  return {
    fetchStats, fetchUsers, updateUser, deleteUser,
    fetchSubscriptions, updateSubscription,
    fetchAuditLog, writeAuditLog
  }
}
```

---

## MƏRHƏLƏ 6 — ADMIN ROUTE GUARD

**Fayl:** `src/components/admin/AdminRoute.tsx`

```typescript
// Yalnız is_admin=true olan authenticated user keçə bilər
// Digərləri: admin deyilsə → /login
//            auth varsa amma admin deyilsə → / (landing)
//            auth yoxdursa → /admin/login

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function AdminRoute() {
  const { user, profile, isInitialized, isLoading } = useAuth()

  // Auth initialize olmayıbsa gözlə
  if (!isInitialized || isLoading) {
    return <AdminLoadingSkeleton />
  }

  // Auth yoxdursa admin login-ə yönləndir
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  // Auth var amma admin deyilsə — landing-ə at
  if (!profile?.is_admin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
```

---

## MƏRHƏLƏ 7 — ADMIN LOGİN SƏHİFƏSİ

**Fayl:** `src/pages/admin/AdminLogin.tsx`

### Xüsusiyyətlər:
- **Ayrıca URL:** `/admin/login` — istifadəçi `/login`-dən fərqli
- **Brute-force qoruma:** 5 uğursuz cəhddən sonra 15 dəqiqə gözlə
- **Admin check:** Login sonra `is_admin` yoxlanır — deyilsə logout + xəta
- **UI:** Sadə, minimal, `Flaro Admin` başlığı
- **i18n:** 4 dildə dəstək

### İş axını:
```
1. Email + şifrə daxil et
2. supabase.auth.signInWithPassword()
3. profile.is_admin yoxla
4. true → /admin/dashboard
5. false → supabase.auth.signOut() + "Admin icazəsi yoxdur" xətası
6. Uğursuz cəhd → attempts counter artır (localStorage + Supabase)
7. 5 cəhd → "15 dəqiqə gözlə" mesajı
```

### UI Struktur:
```
┌─────────────────────────────────┐
│  🔐  Flaro Admin               │
│                                 │
│  [Email ___________________]   │
│  [Şifrə __________________]   │
│                                 │
│  [    Daxil ol    ]            │
│                                 │
│  ⚠ "Bu admin paneli üçündür"  │
│                                 │
│  🌐 [AZ] [EN] [RU] [TR]       │
└─────────────────────────────────┘
```

---

## MƏRHƏLƏ 8 — ADMIN LAYOUT

**Fayl:** `src/components/admin/AdminLayout.tsx`

### Sidebar naviqasiyası:
```
🏠 Dashboard          /admin/dashboard
👥 İstifadəçilər     /admin/users
💳 Abunəliklər       /admin/subscriptions
⚙️  Ayarlar           /admin/settings
──────────────────
🚪 Çıxış
```

### Topbar:
- Admin adı + avatar (sağda)
- LanguageSwitcher
- Breadcrumb (sol)

### Responsive:
- Desktop: sabit sol sidebar (240px)
- Tablet/Mobile: hamburger menü, slide-in drawer

---

## MƏRHƏLƏ 9 — ADMIN DASHBOARD SƏHİFƏSİ

**Fayl:** `src/pages/admin/AdminDashboard.tsx`

**VACIB: Heç bir dummy/mock data yoxdur. Bütün rəqəmlər Supabase-dən gəlir.**

### Stats kartları (get_admin_stats() RPC):
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Ümumi        │ Pro          │ Free         │ 7 gündə      │
│ İstifadəçi   │ İstifadəçi   │ İstifadəçi   │ Yeni User    │
│ [REAL COUNT] │ [REAL COUNT] │ [REAL COUNT] │ [REAL COUNT] │
└──────────────┴──────────────┴──────────────┴──────────────┘
┌──────────────┬──────────────┬──────────────┐
│ Ümumi Scene  │ Public Scene │ Active Sub   │
│ [REAL COUNT] │ [REAL COUNT] │ [REAL COUNT] │
└──────────────┴──────────────┴──────────────┘
```

### Son qeydiyyatlar (real data):
- Son 10 istifadəçi — email, ad, plan, tarix
- Sürətli "Pro et" / "Bax" düymələri

### Son audit əməliyyatlar (real data):
- Admin kimin nəyi dəyişdirdiyini göstər
- Son 10 qeyd

### Auto-refresh:
- Stats: hər 5 dəqiqədə bir yenilənir (setInterval)
- Manual refresh düyməsi

---

## MƏRHƏLƏ 10 — İSTİFADƏÇİ İDARƏETMƏ SƏHİFƏSİ

**Fayl:** `src/pages/admin/AdminUsers.tsx`

### Xüsusiyyətlər:
- **Pagination:** 20 user/səhifə
- **Real-time axtarış:** debounced 300ms, email + ad üzrə
- **Filter:** All / Free / Pro
- **Sort:** Qeydiyyat tarixi (asc/desc), ad, plan

### Cədvəl sütunları:
```
Avatar | Ad          | Email           | Plan    | Scenes | Tarix      | Əməliyyat
──────────────────────────────────────────────────────────────────────────────────
👤     | Anar Məmm.. | anar@example.az | 🟡 Free | 2      | 12.05.2025 | [✏️] [🗑]
👤     | Sara İsay.. | sara@example.az | 🟢 Pro  | 15     | 01.03.2025 | [✏️] [🗑]
```

### UserEditModal:
```
┌─────────────────────────────────────┐
│ İstifadəçi Redaktə et              │
│                                     │
│ Ad Soyad: [___________________]    │
│ Email:    [readonly — dəyişmər]    │
│ Plan:     [Free ▾] / [Pro ▾]      │
│ Admin:    [☐] Admin et             │
│                                     │
│ [Ləğv et]          [Saxla]        │
└─────────────────────────────────────┘
```

### Plan dəyişdirmə:
1. `profiles.plan` yenilə
2. `subscriptions` tablosunda sinxronlaşdır
3. Audit log yaz: `{ action: 'user.plan_changed', old: 'free', new: 'pro' }`

### İstifadəçi silmə:
- Admin service role Edge Function çağırır
- Double confirm dialog: "Bu əməliyyat geri dönməzdir"
- Audit log yaz

---

## MƏRHƏLƏ 11 — ABUNƏLİK İDARƏETMƏ SƏHİFƏSİ

**Fayl:** `src/pages/admin/AdminSubscriptions.tsx`

### Cədvəl:
```
İstifadəçi | Plan | Status    | Stripe ID      | Başlama     | Bitmə       | Əməliyyat
──────────────────────────────────────────────────────────────────────────────────────
Anar M.    | Pro  | ✅ Active | sub_1ABC...    | 01.03.2025  | 01.03.2026  | [Dəyiş]
Sara İ.    | Free | —         | —              | —           | —           | [Pro et]
```

### Filter: Active / Canceled / Past Due / All
### Stripe link: Stripe Dashboard-a birbaşa keçid (stripe_subscription_id varsa)

### Plan assign (manual — Stripe olmadan):
- Admin birbaşa plan dəyişdirə bilər (test/special accounts üçün)
- `profiles.plan` + `subscriptions` cədvəli yenilənir
- Audit log + timestamp

---

## MƏRHƏLƏ 12 — ADMİN SETTINGS SƏHİFƏSİ

**Fayl:** `src/pages/admin/AdminSettings.tsx`

### Bölmələr:

**Profil məlumatları:**
```
Ad Soyad:   [___________________]
Email:      [admin@flaro.az] (readonly)
Avatar URL: [___________________]
            [Saxla]
```

**Şifrə dəyişdirmə:**
```
Cari şifrə:    [___________]
Yeni şifrə:    [___________]  (min 12 simvol)
Təkrar şifrə:  [___________]
               [Şifrəni dəyiş]
```

**Dil seçimi:**
```
Interface dili: [🇦🇿 AZ ▾]
```

**Aktiv sessiyalar (informasiya):**
- "Son giriş: 22.05.2026 10:30"
- "Brauzerdən çıxış et" düyməsi

---

## MƏRHƏLƏ 13 — i18n GENİŞLƏNMƏSİ

**Fayl:** `src/i18n/translations.ts` — aşağıdakıları əlavə et

```typescript
admin: {
  // Navigation
  navDashboard:      string  // "Dashboard" / "Dashboard" / "Dashboard" / "Dashboard"
  navUsers:          string  // "İstifadəçilər" / "Users" / "Пользователи" / "Kullanıcılar"
  navSubscriptions:  string  // "Abunəliklər" / "Subscriptions" / "Подписки" / "Abonelikler"
  navSettings:       string  // "Ayarlar" / "Settings" / "Настройки" / "Ayarlar"
  navLogout:         string

  // Login
  loginTitle:        string  // "Admin Paneli"
  loginSubtitle:     string  // "Yalnız admin hesabları üçün"
  loginEmail:        string
  loginPassword:     string
  loginSubmit:       string
  loginNotAdmin:     string  // "Bu hesab admin deyil"
  loginTooMany:      string  // "Çox cəhd. 15 dəqiqə gözləyin."

  // Dashboard
  statsTotal:        string  // "Ümumi İstifadəçi"
  statsPro:          string  // "Pro İstifadəçi"
  statsFree:         string  // "Pulsuz İstifadəçi"
  statsNew7d:        string  // "Son 7 gündə"
  statsScenes:       string  // "Ümumi Sсene"
  statsActiveSubs:   string  // "Aktiv Abunəlik"
  recentUsers:       string  // "Son Qeydiyyatlar"
  recentActivity:    string  // "Son Əməliyyatlar"

  // Users
  usersTitle:        string
  searchPlaceholder: string  // "Email və ya ad axtar..."
  filterAll:         string
  filterFree:        string
  filterPro:         string
  colName:           string
  colEmail:          string
  colPlan:           string
  colScenes:         string
  colDate:           string
  colActions:        string
  editUser:          string
  deleteUser:        string
  deleteConfirm:     string  // "Bu əməliyyat geri dönməzdir..."
  planChanged:       string  // "Plan uğurla dəyişdirildi"
  userSaved:         string

  // Subscriptions
  subsTitle:         string
  colStatus:         string
  colStripeId:       string
  colStart:          string
  colEnd:            string
  statusActive:      string
  statusCanceled:    string
  statusPastDue:     string
  makeProBtn:        string
  makeFreeBtn:       string

  // Settings
  settingsTitle:     string
  profileSection:    string
  passwordSection:   string
  currentPassword:   string
  newPassword:       string
  confirmPassword:   string
  passwordChanged:   string
  passwordMismatch:  string
  profileSaved:      string
  sessionSection:    string
  lastLogin:         string
}
```

**4 dildə tam tərcümə:**

| Key               | AZ                          | EN                       | RU                        | TR                        |
|-------------------|-----------------------------|--------------------------|---------------------------|---------------------------|
| navUsers          | İstifadəçilər               | Users                    | Пользователи              | Kullanıcılar              |
| navSubscriptions  | Abunəliklər                 | Subscriptions            | Подписки                  | Abonelikler               |
| loginNotAdmin     | Bu hesab admin deyil        | This account is not admin| Аккаунт не является админом| Bu hesap admin değil     |
| loginTooMany      | Çox cəhd. 15 dəq gözləyin  | Too many attempts. Wait  | Слишком много попыток     | Çok deneme. Bekleyin      |
| deleteConfirm     | Geri dönməzdir. Davam?      | Irreversible. Continue?  | Необратимо. Продолжить?   | Geri alınamaz. Devam?     |

---

## MƏRHƏLƏ 14 — APP.TSX ROUTE-LARI

**Fayl:** `src/App.tsx` — admin route-larını əlavə et

```typescript
import { AdminRoute } from '@/components/admin/AdminRoute'
import AdminLogin        from '@/pages/admin/AdminLogin'
import AdminDashboard    from '@/pages/admin/AdminDashboard'
import AdminUsers        from '@/pages/admin/AdminUsers'
import AdminSubscriptions from '@/pages/admin/AdminSubscriptions'
import AdminSettings     from '@/pages/admin/AdminSettings'

// App() içindəki Routes-a əlavə et:

{/* Admin public route */}
<Route path="/admin/login" element={<AdminLogin />} />

{/* Admin protected routes */}
<Route element={<AdminRoute />}>
  <Route path="/admin/dashboard"      element={<AdminDashboard />} />
  <Route path="/admin/users"          element={<AdminUsers />} />
  <Route path="/admin/subscriptions"  element={<AdminSubscriptions />} />
  <Route path="/admin/settings"       element={<AdminSettings />} />
  {/* /admin → dashboard-a yönləndir */}
  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
</Route>
```

---

## MƏRHƏLƏ 15 — SECURİTY LAYER

### 15.1 — Admin Login Brute-force (client-side)
```typescript
// src/lib/adminSecurity.ts

const MAX_ATTEMPTS = 5
const LOCKOUT_MS   = 15 * 60 * 1000  // 15 dəqiqə

export function checkLoginLockout(email: string): { locked: boolean; remainingMs: number } {
  const key     = `admin_attempts_${email}`
  const stored  = localStorage.getItem(key)
  if (!stored) return { locked: false, remainingMs: 0 }

  const { count, lastAttempt } = JSON.parse(stored)
  const elapsed = Date.now() - lastAttempt

  if (count >= MAX_ATTEMPTS && elapsed < LOCKOUT_MS) {
    return { locked: true, remainingMs: LOCKOUT_MS - elapsed }
  }

  if (elapsed >= LOCKOUT_MS) {
    localStorage.removeItem(key)
    return { locked: false, remainingMs: 0 }
  }

  return { locked: false, remainingMs: 0 }
}

export function recordLoginAttempt(email: string, success: boolean) {
  if (success) {
    localStorage.removeItem(`admin_attempts_${email}`)
    return
  }
  const key    = `admin_attempts_${email}`
  const stored = localStorage.getItem(key)
  const data   = stored ? JSON.parse(stored) : { count: 0 }
  localStorage.setItem(key, JSON.stringify({
    count:       data.count + 1,
    lastAttempt: Date.now()
  }))
}
```

### 15.2 — Admin Session Timeout
```typescript
// src/hooks/useAdminSessionTimeout.ts
// Admin 30 dəqiqə aktiv olmasa — otomatik logout

const TIMEOUT_MS = 30 * 60 * 1000

export function useAdminSessionTimeout() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        supabase.auth.signOut()
        navigate('/admin/login')
      }, TIMEOUT_MS)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => document.addEventListener(e, reset))
    reset()

    return () => {
      clearTimeout(timer)
      events.forEach(e => document.removeEventListener(e, reset))
    }
  }, [])
}
```

### 15.3 — RLS Double-check (server-side)
- Bütün admin Supabase sorğuları `is_admin = true` RLS policy-si ilə qorunur
- `get_admin_stats()` SECURITY DEFINER funksiyası daxilindən yoxlayır
- Client-side AdminRoute yalnız UX üçündür — real qoruma DB-dədir

### 15.4 — Edge Function (admin-user-delete)
```typescript
// supabase/functions/admin-user-delete/index.ts
// Service role ilə user silmə — client-dən service role key göndərmək olmaz!

Deno.serve(async (req) => {
  // 1. Caller-in JWT-sini yoxla (admin olmalıdır)
  // 2. profiles-dən is_admin=true yoxla
  // 3. supabase.auth.admin.deleteUser(targetUserId)
  // 4. Audit log yaz
  // 5. Response qaytar
})
```

---

## MƏRHƏLƏ 16 — OPTİMİZASİYA

### 16.1 — Lazy Loading (Code Splitting)
```typescript
// App.tsx-də admin səhifələrini lazy import et
const AdminDashboard    = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers        = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminSubscriptions = lazy(() => import('@/pages/admin/AdminSubscriptions'))
const AdminSettings     = lazy(() => import('@/pages/admin/AdminSettings'))

// Suspense boundary ilə wrap et
<Suspense fallback={<AdminPageSkeleton />}>
  <AdminDashboard />
</Suspense>
```

Bu sayədə admin bundle yalnız `/admin/*` route-larında yüklənir.

### 16.2 — Data Caching Strategy
```typescript
// useAdmin.ts-də SWR-benzər cache
const CACHE: Map<string, { data: any; timestamp: number }> = new Map()
const TTL = 60_000 // 60 saniyə

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = CACHE.get(key)
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data
  }
  const data = await fetcher()
  CACHE.set(key, { data, timestamp: Date.now() })
  return data
}
```

### 16.3 — Debounced Search
```typescript
// AdminUsers.tsx-də axtarış
const [inputValue, setInputValue] = useState('')
const debouncedSearch = useMemo(
  () => debounce((q: string) => store.setSearchQuery(q), 300),
  []
)
// input onChange → setInputValue → debouncedSearch
```

### 16.4 — Pagination (server-side)
```typescript
// Bütün users-i çəkmə! Yalnız current page:
const { data, count } = await supabase
  .from('profiles')
  .select('*', { count: 'exact' })
  .ilike('email', `%${search}%`)
  .eq(plan !== 'all' ? 'plan' : 'id', plan !== 'all' ? plan : undefined)
  .range((page - 1) * pageSize, page * pageSize - 1)
  .order('created_at', { ascending: false })
```

---

## MƏRHƏLƏ 17 — FAYL İMPLEMENTASİYA SIRASI

AI agent bu sıraya görə işləməlidir:

```
1.  supabase/migrations/020_admin_system.sql         ← DB əvvəl hazır olsun
2.  scripts/seed-admin.ts                             ← Seed script
3.  src/types/database.types.ts                       ← Tip əlavələri
4.  src/lib/adminSecurity.ts                          ← Security util
5.  src/store/adminStore.ts                           ← State management
6.  src/hooks/useAdmin.ts                             ← Data hook
7.  src/hooks/useAdminSessionTimeout.ts               ← Session timeout
8.  src/components/admin/AdminRoute.tsx               ← Route guard
9.  src/components/admin/AdminLayout.tsx              ← Layout + sidebar
10. src/components/admin/StatsCard.tsx                ← UI komponenti
11. src/components/admin/UserTable.tsx                ← UI komponenti
12. src/components/admin/UserEditModal.tsx            ← UI komponenti
13. src/components/admin/PlanBadge.tsx                ← UI komponenti
14. src/components/admin/AuditLog.tsx                 ← UI komponenti
15. src/i18n/translations.ts                          ← admin bölməsi əlavə
16. src/pages/admin/AdminLogin.tsx                    ← Admin login
17. src/pages/admin/AdminDashboard.tsx                ← Dashboard
18. src/pages/admin/AdminUsers.tsx                    ← Users
19. src/pages/admin/AdminSubscriptions.tsx            ← Subscriptions
20. src/pages/admin/AdminSettings.tsx                 ← Settings
21. supabase/functions/admin-user-delete/index.ts     ← Edge Function
22. src/App.tsx                                       ← Route-ları əlavə et
23. package.json                                      ← seed:admin script əlavə
```

---

## ✅ TƏSLİMAT CÜDVƏLİ (Agent Checklist)

Agent hər addımı tamamladıqca işarə etsin:

- [x] **020_admin_system.sql** — migration hazır, test edilib
- [x] **seed-admin.ts** — script çalışır, admin yaradılır
- [x] **database.types.ts** — is_admin, AdminStats, AuditLog tipləri əlavə
- [x] **adminSecurity.ts** — brute-force, lockout işləyir
- [x] **adminStore.ts** — Zustand store hazır
- [x] **useAdmin.ts** — bütün CRUD metodları işləyir
- [x] **useAdminSessionTimeout.ts** — 30 dəq timeout işləyir
- [x] **AdminRoute.tsx** — is_admin=false olanları bloklayır
- [x] **AdminLayout.tsx** — sidebar, topbar, responsive
- [x] **StatsCard.tsx** — loading skeleton, real data göstərir
- [x] **UserTable.tsx** — pagination, search, filter işləyir
- [x] **UserEditModal.tsx** — plan + ad dəyişdirmə işləyir
- [x] **PlanBadge.tsx** — free/pro rəngli badge
- [x] **AuditLog.tsx** — son 10 əməliyyat cədvəli
- [x] **translations.ts** — admin bölməsi 4 dildə tam
- [x] **AdminLogin.tsx** — brute-force + admin check işləyir
- [x] **AdminDashboard.tsx** — real stats, sıfır dummy data
- [x] **AdminUsers.tsx** — CRUD tam işləyir
- [x] **AdminSubscriptions.tsx** — plan assign işləyir
- [x] **AdminSettings.tsx** — profil + şifrə dəyişmə işləyir
- [x] **admin-user-delete Edge Function** — service role ilə silmə
- [x] **App.tsx** — admin route-ları əlavə edilib
- [x] **package.json** — seed:admin script əlavə edilib
- [x] **Bütün admin əməliyyatları audit log yazır**
- [x] **Heç bir dummy/hardcoded data yoxdur**
- [x] **TypeScript type error yoxdur** (`npm run type-check`)
- [x] **ESLint xətası yoxdur** (`npm run lint`)

---

## 🔑 ÇEVRİLMƏZ QAYDALAR (Agent üçün)

1. **Heç bir dummy data** — `Math.random()`, hardcoded rəqəm, mock array yoxdur
2. **Bütün data Supabase-dən** — hər statistika RPC və ya real sorğudan gəlir
3. **Audit log** — hər plan dəyişikliyi, user silmə, admin dəyişikliyi log yazılır
4. **TypeScript strict** — `any` işlətmə, tip define et
5. **i18n** — hər mətn string `t.admin.*`-dən gəlir, hardcoded AZ/EN yoxdur
6. **RLS** — bütün Supabase sorğuları RLS-dən keçir (service role yalnız Edge Function-da)
7. **Lazy loading** — admin səhifələri `lazy()` ilə import olunur
8. **Layihə adı** — həmişə `Flaro`, heç vaxt `SketchFlow`
9. **Admin login** — `/admin/login`, user login `/login`-dən TAM ayrıdır
10. **Session timeout** — 30 dəq aktivsizlikdən sonra logout
```
