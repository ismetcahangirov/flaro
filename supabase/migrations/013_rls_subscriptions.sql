-- ============================================================
-- 013_rls_subscriptions.sql
-- Flaro — Subscriptions Row Level Security
-- ============================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Yalnız öz subscription-ını görə bilər
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Yalnız service_role (Stripe webhook) yaza bilər
-- İstifadəçilər birbaşa dəyişdirə bilməz
CREATE POLICY "subscriptions_insert_service"
  ON public.subscriptions FOR INSERT
  WITH CHECK (FALSE); -- Yalnız service_role bypass edir

CREATE POLICY "subscriptions_update_service"
  ON public.subscriptions FOR UPDATE
  USING (FALSE); -- Yalnız service_role bypass edir
