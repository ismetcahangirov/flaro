-- ============================================================
-- 005_create_workspaces.sql
-- Flaro — Workspaces Cədvəli (Pro only)
-- ============================================================

CREATE TABLE public.workspaces (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX idx_workspaces_slug     ON public.workspaces(slug);

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Workspace yalnız Pro plan üçün
CREATE OR REPLACE FUNCTION public.check_workspace_plan()
RETURNS TRIGGER AS $$
DECLARE
  user_plan public.subscription_plan;
BEGIN
  SELECT plan INTO user_plan
  FROM public.profiles
  WHERE id = NEW.owner_id;

  IF user_plan != 'pro' THEN
    RAISE EXCEPTION 'PRO_REQUIRED: Workspaces require a Pro subscription.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_workspace_plan
  BEFORE INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.check_workspace_plan();
