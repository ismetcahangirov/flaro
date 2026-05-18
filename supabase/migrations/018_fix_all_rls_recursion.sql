-- ============================================================
-- 018_fix_all_rls_recursion.sql
-- Flaro — Fix all mutual recursions in RLS policies
-- ============================================================

-- 1. Helper functions (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = ws_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_scene_owner(scn_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.scenes
    WHERE id = scn_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Fix Workspaces policies
DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_owner_admin" ON public.workspaces;

CREATE POLICY "workspaces_select_member"
  ON public.workspaces FOR SELECT
  USING (
    owner_id = auth.uid() OR
    public.is_workspace_member(id)
  );

CREATE POLICY "workspaces_update_owner_admin"
  ON public.workspaces FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    public.is_workspace_admin(id)
  );


-- 3. Fix Workspace_members policies
DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;

CREATE POLICY "workspace_members_insert"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    public.is_workspace_owner(workspace_id)
  );

CREATE POLICY "workspace_members_update"
  ON public.workspace_members FOR UPDATE
  USING (
    public.is_workspace_owner(workspace_id)
  );

CREATE POLICY "workspace_members_delete"
  ON public.workspace_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    public.is_workspace_owner(workspace_id)
  );


-- 4. Fix Scene Collaborators policies
DROP POLICY IF EXISTS "collaborators_select_own" ON public.scene_collaborators;
DROP POLICY IF EXISTS "collaborators_insert_owner" ON public.scene_collaborators;
DROP POLICY IF EXISTS "collaborators_update_owner" ON public.scene_collaborators;
DROP POLICY IF EXISTS "collaborators_delete_owner" ON public.scene_collaborators;

CREATE POLICY "collaborators_select_own"
  ON public.scene_collaborators FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_scene_owner(scene_id)
  );

CREATE POLICY "collaborators_insert_owner"
  ON public.scene_collaborators FOR INSERT
  WITH CHECK (
    public.is_scene_owner(scene_id)
  );

CREATE POLICY "collaborators_update_owner"
  ON public.scene_collaborators FOR UPDATE
  USING (
    public.is_scene_owner(scene_id)
  );

CREATE POLICY "collaborators_delete_owner"
  ON public.scene_collaborators FOR DELETE
  USING (
    public.is_scene_owner(scene_id)
  );


-- 5. Fix Scene Versions policies
DROP POLICY IF EXISTS "versions_select" ON public.scene_versions;
DROP POLICY IF EXISTS "versions_insert" ON public.scene_versions;

CREATE POLICY "versions_select"
  ON public.scene_versions FOR SELECT
  USING (
    public.is_scene_owner(scene_id) OR
    EXISTS (
      SELECT 1 FROM public.scenes
      WHERE id = scene_versions.scene_id AND is_public = TRUE
    ) OR
    EXISTS (
      SELECT 1 FROM public.scene_collaborators
      WHERE scene_id = scene_versions.scene_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "versions_insert"
  ON public.scene_versions FOR INSERT
  WITH CHECK (
    public.is_scene_owner(scene_id) OR
    EXISTS (
      SELECT 1 FROM public.scene_collaborators
      WHERE scene_id = scene_versions.scene_id AND user_id = auth.uid() AND permission = 'edit'
    )
  );
