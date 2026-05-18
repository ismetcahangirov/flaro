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
