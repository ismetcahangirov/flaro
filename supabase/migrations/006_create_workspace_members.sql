-- ============================================================
-- 006_create_workspace_members.sql
-- Flaro — Workspace Members Cədvəli
-- ============================================================

CREATE TABLE public.workspace_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          public.workspace_role NOT NULL DEFAULT 'editor',
  invited_by    UUID        REFERENCES public.profiles(id),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user      ON public.workspace_members(user_id);
