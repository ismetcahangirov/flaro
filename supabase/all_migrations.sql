-- ============================================================
-- 001_create_enums.sql
-- Flaro — Enum Tipləri
-- ============================================================

-- Plan tipləri
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');

-- Subscription statusu
CREATE TYPE public.subscription_status AS ENUM (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete'
);

-- Workspace üzvlük rolu
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Əməkdaşlıq icazəsi
CREATE TYPE public.collab_permission AS ENUM ('edit', 'view');

-- Canvas element tipi
CREATE TYPE public.element_type AS ENUM (
  'rectangle', 'ellipse', 'diamond', 'line',
  'arrow', 'text', 'image', 'freedraw'
);
-- ============================================================
-- 002_create_profiles.sql
-- Flaro — Profiles Cədvəli
-- ============================================================

CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  plan          public.subscription_plan NOT NULL DEFAULT 'free',
  scenes_count  INT         NOT NULL DEFAULT 0,   -- Free: max 3
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at avtomatik yenilənməsi
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Yeni auth user qeydiyyatda avtomatik profile yarat
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
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
-- ============================================================
-- 008_create_subscriptions.sql
-- Flaro — Subscriptions Cədvəli (Stripe inteqrasiyası)
-- ============================================================

CREATE TABLE public.subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id     TEXT        UNIQUE,
  stripe_subscription_id TEXT        UNIQUE,
  plan                   public.subscription_plan   NOT NULL DEFAULT 'free',
  status                 public.subscription_status NOT NULL DEFAULT 'active',
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id            ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub_id      ON public.subscriptions(stripe_subscription_id);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Subscription dəyişəndə profiles.plan-ı sinxronlaşdır
CREATE OR REPLACE FUNCTION public.sync_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET plan = NEW.plan
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_plan_on_subscription_change
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_plan();
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
-- ============================================================
-- 010_rls_profiles.sql
-- Flaro — Profiles Row Level Security
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Hər kəs öz profilini görə bilər
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Workspace üzvlüyündə digər üzvlərin profilini gör
CREATE POLICY "profiles_select_workspace_members"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
        AND wm2.user_id = profiles.id
    )
  );

-- Yalnız öz profilini yeniləyə bilər
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
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
-- ============================================================
-- 012_rls_workspaces.sql
-- Flaro — Workspaces Row Level Security
-- ============================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select_member"
  ON public.workspaces FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "workspaces_insert_pro"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "workspaces_update_owner_admin"
  ON public.workspaces FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspaces_delete_owner"
  ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());
-- ============================================================
-- 013_rls_subscriptions.sql
-- Flaro — Subscriptions Row Level Security
-- ============================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Yalnız öz subscription-ını görə bilər
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Yalnız service_role (Stripe webhook) yaza bilər
-- İstifadəçilər birbaşa dəyişdirə bilməz
CREATE POLICY "subscriptions_insert_service"
  ON public.subscriptions FOR INSERT
  WITH CHECK (FALSE); -- Yalnız service_role bypass edir

CREATE POLICY "subscriptions_update_service"
  ON public.subscriptions FOR UPDATE
  USING (FALSE); -- Yalnız service_role bypass edir
-- ============================================================
-- 014_rls_comments.sql
-- Flaro — Comments Row Level Security (Pro plan)
-- ============================================================

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_scene_access"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scenes s
      WHERE s.id = comments.scene_id
        AND (
          s.owner_id = auth.uid()
          OR s.is_public = TRUE
          OR EXISTS (
            SELECT 1 FROM public.scene_collaborators sc
            WHERE sc.scene_id = s.id AND sc.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "comments_insert_pro_collaborator"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND plan = 'pro'
    )
  );

CREATE POLICY "comments_update_own"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own_or_scene_owner"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.scenes
      WHERE id = comments.scene_id AND owner_id = auth.uid()
    )
  );
-- ============================================================
-- 015_storage_and_rate_limit.sql
-- Flaro — Storage Buckets, RLS + Rate Limit Funksiyası
-- ============================================================

-- ── Storage Buckets ──────────────────────────────────────────

-- Scene thumbnail-ları (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true);

-- İstifadəçi avatar-ları (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Canvas image element-ləri (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('scene-assets', 'scene-assets', false);

-- ── Storage RLS Policies ─────────────────────────────────────

CREATE POLICY "thumbnails_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_owner_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "scene_assets_authenticated"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'scene-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "scene_assets_owner_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'scene-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Rate Limit ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', NOW()),
  request_count INT       NOT NULL DEFAULT 1,

  UNIQUE(user_id, action, window_start)
);

CREATE INDEX idx_rate_limit_user_action ON public.rate_limit_buckets(user_id, action, window_start);

-- Rate limit yoxlama funksiyası
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action  TEXT,
  p_limit   INT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_window_start TIMESTAMPTZ := date_trunc('hour', NOW());
  v_count INT;
BEGIN
  -- Upsert: bucket yarat və ya say artır
  INSERT INTO public.rate_limit_buckets (user_id, action, window_start, request_count)
  VALUES (p_user_id, p_action, v_window_start, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET request_count = rate_limit_buckets.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
