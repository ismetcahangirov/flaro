-- ============================================================
-- 007_create_scene_collaborators.sql
-- Flaro — Scene Collaborators Cədvəli
-- ============================================================

CREATE TABLE public.scene_collaborators (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id    UUID        NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission  public.collab_permission NOT NULL DEFAULT 'view',
  invited_by  UUID        REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(scene_id, user_id)
);

CREATE INDEX idx_scene_collabs_scene ON public.scene_collaborators(scene_id);
CREATE INDEX idx_scene_collabs_user  ON public.scene_collaborators(user_id);
