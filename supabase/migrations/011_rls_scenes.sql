-- ============================================================
-- 011_rls_scenes.sql
-- Flaro — Scenes Row Level Security
-- ============================================================

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

-- Öz scene-lərini gör
CREATE POLICY "scenes_select_own"
  ON public.scenes FOR SELECT
  USING (auth.uid() = owner_id);

-- Public scene-ləri gör
CREATE POLICY "scenes_select_public"
  ON public.scenes FOR SELECT
  USING (is_public = TRUE);

-- Əməkdaş kimi əlavə edilmiş scene-ləri gör
CREATE POLICY "scenes_select_as_collaborator"
  ON public.scenes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scene_collaborators
      WHERE scene_id = scenes.id
        AND user_id = auth.uid()
    )
  );

-- Workspace üzvü olaraq gör
CREATE POLICY "scenes_select_workspace_member"
  ON public.scenes FOR SELECT
  USING (
    workspace_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = scenes.workspace_id
        AND user_id = auth.uid()
    )
  );

-- Yalnız authenticated user scene yarada bilər
CREATE POLICY "scenes_insert_authenticated"
  ON public.scenes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Sahibi və ya edit icazəli əməkdaş yeniləyə bilər
CREATE POLICY "scenes_update_owner_or_editor"
  ON public.scenes FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.scene_collaborators
      WHERE scene_id = scenes.id
        AND user_id = auth.uid()
        AND permission = 'edit'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = scenes.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.scene_collaborators
      WHERE scene_id = scenes.id
        AND user_id = auth.uid()
        AND permission = 'edit'
    )
  );

-- Yalnız sahibi silə bilər
CREATE POLICY "scenes_delete_own"
  ON public.scenes FOR DELETE
  USING (auth.uid() = owner_id);
