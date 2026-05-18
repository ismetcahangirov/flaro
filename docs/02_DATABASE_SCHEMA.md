# Flaro — Verilənlər Bazası Sxemi

> **Supabase PostgreSQL** — RLS Policies, Triggers, TypeScript Types
> Fayl: `supabase/migrations/`

---

## 📐 Cədvəl Diaqramı

```
profiles ──────────────────────────────────────────────────┐
    │                                                       │
    ├──< scenes (owner_id)                                  │
    │       │                                               │
    │       ├──< scene_collaborators                        │
    │       └──< scene_versions                             │
    │                                                       │
    ├──< workspace_members (user_id) >── workspaces ────────┤
    │                                       │               │
    │                                       └──< workspace_scenes
    │
    └──< subscriptions
            │
            └── subscription_plan (free | pro)
```

---

## 🗄️ Migration Faylları

### `001_create_enums.sql`

```sql
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
```

---

### `002_create_profiles.sql`

```sql
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
```

---

### `003_create_scenes.sql`

```sql
CREATE TABLE public.scenes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id  UUID        REFERENCES public.workspaces(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL DEFAULT 'Untitled Scene',
  thumbnail_url TEXT,
  is_public     BOOLEAN     NOT NULL DEFAULT FALSE,
  share_token   TEXT        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  elements      JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- Canvas data
  app_state     JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- Zoom, pan, bg
  version       INT         NOT NULL DEFAULT 1,
  last_edited_by UUID       REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenes_owner_id    ON public.scenes(owner_id);
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
```

---

### `004_create_scene_versions.sql`

```sql
-- Versiya tarixi (Pro plan)
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
```

---

### `005_create_workspaces.sql`

```sql
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
```

---

### `006_create_workspace_members.sql`

```sql
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
```

---

### `007_create_scene_collaborators.sql`

```sql
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
```

---

### `008_create_subscriptions.sql`

```sql
CREATE TABLE public.subscriptions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id   TEXT        UNIQUE,
  stripe_subscription_id TEXT      UNIQUE,
  plan                 public.subscription_plan   NOT NULL DEFAULT 'free',
  status               public.subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id             ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id  ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub_id       ON public.subscriptions(stripe_subscription_id);

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
```

---

### `009_create_comments.sql`

```sql
-- Şərhlər (Pro plan)
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
```

---

## 🔐 Row Level Security (RLS) Policies

### `010_rls_profiles.sql`

```sql
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
```

---

### `011_rls_scenes.sql`

```sql
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

-- Yalnız sahibi yeniləyə bilər
-- Əməkdaş (edit icazəsi) yeniləyə bilər
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
```

---

### `012_rls_workspaces.sql`

```sql
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
```

---

### `013_rls_subscriptions.sql`

```sql
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
```

---

### `014_rls_comments.sql`

```sql
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
```

---

## 🏷️ TypeScript Tipləri

### `src/types/database.types.ts`

```typescript
// Supabase CLI ilə avtomatik generate etmək üçün:
// supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriptionPlan   = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
export type WorkspaceRole      = 'owner' | 'admin' | 'editor' | 'viewer'
export type CollabPermission   = 'edit' | 'view'
export type ElementType        = 'rectangle' | 'ellipse' | 'diamond' | 'line' | 'arrow' | 'text' | 'image' | 'freedraw'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:           string
          email:        string
          full_name:    string | null
          avatar_url:   string | null
          plan:         SubscriptionPlan
          scenes_count: number
          created_at:   string
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at' | 'scenes_count'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      scenes: {
        Row: {
          id:             string
          owner_id:       string
          workspace_id:   string | null
          title:          string
          thumbnail_url:  string | null
          is_public:      boolean
          share_token:    string
          elements:       Json
          app_state:      Json
          version:        number
          last_edited_by: string | null
          created_at:     string
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['scenes']['Row'],
          'id' | 'share_token' | 'version' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['scenes']['Insert']>
      }

      workspaces: {
        Row: {
          id:         string
          owner_id:   string
          name:       string
          slug:       string
          logo_url:   string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
      }

      workspace_members: {
        Row: {
          id:           string
          workspace_id: string
          user_id:      string
          role:         WorkspaceRole
          invited_by:   string | null
          joined_at:    string
        }
        Insert: Omit<Database['public']['Tables']['workspace_members']['Row'], 'id' | 'joined_at'>
        Update: Partial<Pick<Database['public']['Tables']['workspace_members']['Row'], 'role'>>
      }

      scene_collaborators: {
        Row: {
          id:         string
          scene_id:   string
          user_id:    string
          permission: CollabPermission
          invited_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['scene_collaborators']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['scene_collaborators']['Row'], 'permission'>>
      }

      subscriptions: {
        Row: {
          id:                     string
          user_id:                string
          stripe_customer_id:     string | null
          stripe_subscription_id: string | null
          plan:                   SubscriptionPlan
          status:                 SubscriptionStatus
          current_period_start:   string | null
          current_period_end:     string | null
          cancel_at_period_end:   boolean
          created_at:             string
          updated_at:             string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }

      comments: {
        Row: {
          id:         string
          scene_id:   string
          user_id:    string
          content:    string
          x:          number | null
          y:          number | null
          resolved:   boolean
          parent_id:  string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'resolved' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<Database['public']['Tables']['comments']['Row'], 'content' | 'resolved'>>
      }
    }
  }
}

// Convenience type aliases
export type Profile             = Database['public']['Tables']['profiles']['Row']
export type Scene               = Database['public']['Tables']['scenes']['Row']
export type Workspace           = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember     = Database['public']['Tables']['workspace_members']['Row']
export type SceneCollaborator   = Database['public']['Tables']['scene_collaborators']['Row']
export type Subscription        = Database['public']['Tables']['subscriptions']['Row']
export type Comment             = Database['public']['Tables']['comments']['Row']
```

---

### `src/types/canvas.types.ts`

```typescript
export type ToolType =
  | 'select' | 'hand' | 'rectangle' | 'ellipse'
  | 'diamond' | 'line' | 'arrow' | 'text'
  | 'image' | 'freedraw' | 'eraser'

export type FillStyle = 'solid' | 'hachure' | 'cross-hatch' | 'none'
export type StrokeStyle = 'solid' | 'dashed' | 'dotted'
export type TextAlign = 'left' | 'center' | 'right'
export type FontFamily = 'hand' | 'normal' | 'code'

export interface Point {
  x: number
  y: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasElement {
  id:          string
  type:        ElementType
  x:           number
  y:           number
  width:       number
  height:      number
  angle:       number           // Dönmə bucağı (radian)
  strokeColor: string
  fillColor:   string
  fillStyle:   FillStyle
  strokeWidth: number
  strokeStyle: StrokeStyle
  opacity:     number           // 0-100
  roughness:   number           // 0-3 (el çizimi səviyyəsi)
  seed:        number           // Rough.js üçün sabit seed
  version:     number
  isDeleted:   boolean
  // Text spesifik
  text?:       string
  fontSize?:   number
  fontFamily?: FontFamily
  textAlign?:  TextAlign
  // Arrow/Line spesifik
  points?:     Point[]
  startArrowhead?: 'arrow' | 'dot' | 'bar' | null
  endArrowhead?:   'arrow' | 'dot' | 'bar' | null
  // Image spesifik
  fileId?:     string
}

export interface AppState {
  zoom:              number
  scrollX:           number
  scrollY:           number
  backgroundColor:   string
  gridEnabled:       boolean
  gridSize:          number
  theme:             'light' | 'dark'
}

export interface SceneData {
  elements:  CanvasElement[]
  appState:  AppState
}
```

---

## 🗂️ Supabase Storage Bucket-ləri

```sql
-- supabase/storage.sql

-- Scene thumbnail-ları
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true);

-- İstifadəçi avatar-ları
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Canvas image element-ləri
INSERT INTO storage.buckets (id, name, public)
VALUES ('scene-assets', 'scene-assets', false);

-- Storage RLS
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
```

---

## ✅ Migration İcra Sırası

```bash
# Supabase local development
supabase start

# Migration-ları tətbiq et
supabase db push

# Və ya fərdi fayl
supabase migration up

# TypeScript tiplərini yenilə
supabase gen types typescript \
  --project-id $SUPABASE_PROJECT_ID \
  > src/types/database.types.ts
```

---

## 🔒 Təhlükəsizlik Xülasəsi

| Cədvəl | RLS | Trigger | Limit |
|--------|-----|---------|-------|
| `profiles` | ✅ | `handle_new_user`, `handle_updated_at` | — |
| `scenes` | ✅ | `check_scenes_limit`, `update_scenes_count` | Free: max 3 |
| `workspaces` | ✅ | `check_workspace_plan` | Pro only |
| `workspace_members` | ✅ | — | Pro only |
| `subscriptions` | ✅ | `sync_user_plan` | Service role only write |
| `comments` | ✅ | — | Pro only |
| `scene_collaborators` | ✅ | — | — |

---

*Növbəti: `03_AUTH_AND_SECURITY.md` — Autentifikasiya axını və təhlükəsizlik*
