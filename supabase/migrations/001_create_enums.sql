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
