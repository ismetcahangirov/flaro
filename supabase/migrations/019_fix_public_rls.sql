-- ============================================================
-- 019_fix_public_rls.sql
-- Flaro — Fix public scene RLS for anonymous view
-- ============================================================

DROP POLICY IF EXISTS "scenes_select_public" ON public.scenes;

CREATE POLICY "scenes_select_public"
  ON public.scenes FOR SELECT
  USING (is_public = TRUE);
