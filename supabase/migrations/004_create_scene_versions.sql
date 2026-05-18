-- ============================================================
-- 004_create_scene_versions.sql
-- Flaro — Scene Versions Cədvəli (Pro plan)
-- ============================================================

CREATE TABLE public.scene_versions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id    UUID        NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  version     INT         NOT NULL,
  elements    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  app_state   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  saved_by    UUID        REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(scene_id, version)
);

CREATE INDEX idx_scene_versions_scene_id ON public.scene_versions(scene_id);
