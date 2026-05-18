-- ============================================================
-- 014_rls_comments.sql
-- Flaro — Comments Row Level Security (Pro plan)
-- ============================================================

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_scene_access"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scenes s
      WHERE s.id = comments.scene_id
        AND (
          s.owner_id = auth.uid()
          OR s.is_public = TRUE
          OR EXISTS (
            SELECT 1 FROM public.scene_collaborators sc
            WHERE sc.scene_id = s.id AND sc.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "comments_insert_pro_collaborator"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND plan = 'pro'
    )
  );

CREATE POLICY "comments_update_own"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own_or_scene_owner"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.scenes
      WHERE id = comments.scene_id AND owner_id = auth.uid()
    )
  );
