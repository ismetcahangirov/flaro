-- ============================================================
-- 009_create_comments.sql
-- Flaro — Comments Cədvəli (Pro plan)
-- ============================================================

CREATE TABLE public.comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id    UUID        NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK(length(content) > 0 AND length(content) <= 2000),
  x           FLOAT,      -- Canvas koordinatı
  y           FLOAT,
  resolved    BOOLEAN     NOT NULL DEFAULT FALSE,
  parent_id   UUID        REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_scene_id ON public.comments(scene_id);
CREATE INDEX idx_comments_user_id  ON public.comments(user_id);

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
