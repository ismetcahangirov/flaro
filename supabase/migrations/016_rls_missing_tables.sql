-- ============================================================
-- 016_rls_missing_tables.sql
-- Flaro — RLS for remaining tables
-- ============================================================

-- 1. scene_collaborators
ALTER TABLE public.scene_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collaborators_select_own"
  ON public.scene_collaborators FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.scenes
      WHERE scenes.id = scene_collaborators.scene_id
        AND scenes.owner_id = auth.uid()
    )
  );

CREATE POLICY "collaborators_insert_owner"
  ON public.scene_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenes
      WHERE scenes.id = scene_collaborators.scene_id
        AND scenes.owner_id = auth.uid()
    )
  );

CREATE POLICY "collaborators_update_owner"
  ON public.scene_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.scenes
      WHERE scenes.id = scene_collaborators.scene_id
        AND scenes.owner_id = auth.uid()
    )
  );

CREATE POLICY "collaborators_delete_owner"
  ON public.scene_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.scenes
      WHERE scenes.id = scene_collaborators.scene_id
        AND scenes.owner_id = auth.uid()
    )
  );

-- 2. scene_versions
ALTER TABLE public.scene_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "versions_select"
  ON public.scene_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scenes
      WHERE scenes.id = scene_versions.scene_id
        AND (
          scenes.owner_id = auth.uid() OR
          scenes.is_public = TRUE OR
          EXISTS (
            SELECT 1 FROM public.scene_collaborators
            WHERE scene_id = scenes.id AND user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "versions_insert"
  ON public.scene_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenes
      WHERE scenes.id = scene_versions.scene_id
        AND (
          scenes.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.scene_collaborators
            WHERE scene_id = scenes.id AND user_id = auth.uid() AND permission = 'edit'
          )
        )
    )
  );

-- 3. workspace_members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_insert"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_update"
  ON public.workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_delete"
  ON public.workspace_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_id = auth.uid()
    )
  );

-- 4. rate_limit_buckets (Internal table, no direct user access needed)
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- No policies mean no access, which is correct since it's an internal rate limiter usually accessed by backend functions bypassing RLS.
