-- ============================================================
-- 017_fix_rls_recursion.sql
-- Flaro — Fix infinite recursion in workspace_members RLS
-- ============================================================

-- Function to safely check workspace membership bypassing RLS
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the recursive policy
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;

-- Recreate policy using the security definer function
CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_id = auth.uid()
    ) OR
    public.is_workspace_member(workspace_members.workspace_id)
  );
