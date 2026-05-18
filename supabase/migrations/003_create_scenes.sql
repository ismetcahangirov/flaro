-- ============================================================
-- 003_create_scenes.sql
-- Flaro — Scenes Cədvəli
-- ============================================================

CREATE TABLE public.scenes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id  UUID        REFERENCES public.workspaces(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL DEFAULT 'Untitled Scene',
  thumbnail_url TEXT,
  is_public     BOOLEAN     NOT NULL DEFAULT FALSE,
  share_token   TEXT        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  elements      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  app_state     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  version       INT         NOT NULL DEFAULT 1,
  last_edited_by UUID       REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenes_owner_id     ON public.scenes(owner_id);
CREATE INDEX idx_scenes_workspace_id ON public.scenes(workspace_id);
CREATE INDEX idx_scenes_share_token  ON public.scenes(share_token);
CREATE INDEX idx_scenes_is_public    ON public.scenes(is_public);

CREATE TRIGGER scenes_updated_at
  BEFORE UPDATE ON public.scenes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Scenes count sayacı (Free plan limiti üçün)
CREATE OR REPLACE FUNCTION public.update_scenes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET scenes_count = scenes_count + 1
    WHERE id = NEW.owner_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET scenes_count = GREATEST(scenes_count - 1, 0)
    WHERE id = OLD.owner_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER scenes_count_trigger
  AFTER INSERT OR DELETE ON public.scenes
  FOR EACH ROW EXECUTE FUNCTION public.update_scenes_count();

-- Free plan: maksimum 3 scene
CREATE OR REPLACE FUNCTION public.check_scenes_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan   public.subscription_plan;
  user_count  INT;
BEGIN
  SELECT plan, scenes_count
  INTO user_plan, user_count
  FROM public.profiles
  WHERE id = NEW.owner_id;

  IF user_plan = 'free' AND user_count >= 3 THEN
    RAISE EXCEPTION 'FREE_PLAN_LIMIT: Free plan allows maximum 3 scenes. Upgrade to Pro for unlimited scenes.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_scenes_limit
  BEFORE INSERT ON public.scenes
  FOR EACH ROW EXECUTE FUNCTION public.check_scenes_limit();
