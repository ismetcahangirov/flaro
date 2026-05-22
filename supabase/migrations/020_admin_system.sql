-- ============================================================
-- 020_admin_system.sql
-- Flaro — Admin Panel Tam İmplementasiya Migrasiyası
-- ============================================================

-- 1.1 — Profiles cədvəlinə is_admin sahəsi əlavə et
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Index — admin siyahısı sürətli gətirilsin
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin 
  ON public.profiles(is_admin) 
  WHERE is_admin = TRUE;

-- 1.2 — Audit Log cədvəli (admin əməliyyatları izlə)
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

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id   ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- 1.3 — Admin brute-force qoruması (login cəhdləri)
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  ip_address  INET,
  success     BOOLEAN     NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.admin_login_attempts(email, attempted_at DESC);

-- Helper function to check if current user is an admin without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS on new tables
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- 1.4 — RLS Policies (Admin)

-- Adminlər BÜTÜN profillərə baxa bilər
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Adminlər istənilən profili yeniləyə bilər
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Adminlər audit log-a yaza bilər
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid());

-- Adminlər audit log-u oxuya bilər
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admin-login attempts - allow inserting from anyone, but selecting only for admins
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.admin_login_attempts;
CREATE POLICY "Anyone can insert login attempts"
  ON public.admin_login_attempts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view login attempts" ON public.admin_login_attempts;
CREATE POLICY "Admins can view login attempts"
  ON public.admin_login_attempts FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Adminlər bütün subscriptions-a baxa bilər
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Adminlər subscriptions yeniləyə bilər
DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can update subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 1.5 — Admin statistika funksiyası (SECURITY DEFINER)
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

-- 1.6 — is_admin-i profile trigger-a əlavə et (seed üçün bypass)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
