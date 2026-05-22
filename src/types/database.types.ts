// ============================================================
// src/types/database.types.ts
// Flaro — Supabase Database TypeScript Tipləri
// ============================================================
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
          is_admin:     boolean
          created_at:   string
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at' | 'scenes_count' | 'is_admin'> & { is_admin?: boolean }
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

      scene_versions: {
        Row: {
          id:         string
          scene_id:   string
          version:    number
          elements:   Json
          app_state:  Json
          saved_by:   string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['scene_versions']['Row'], 'id' | 'created_at'>
        Update: never
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

      rate_limit_buckets: {
        Row: {
          id:            string
          user_id:       string
          action:        string
          window_start:  string
          request_count: number
        }
        Insert: Omit<Database['public']['Tables']['rate_limit_buckets']['Row'], 'id'>
        Update: Partial<Pick<Database['public']['Tables']['rate_limit_buckets']['Row'], 'request_count'>>
      }

      admin_audit_log: {
        Row: {
          id:          string
          admin_id:    string
          action:      string
          target_id:   string | null
          target_type: string | null
          old_value:   Json | null
          new_value:   Json | null
          ip_address:  string | null
          created_at:  string
        }
        Insert: Omit<Database['public']['Tables']['admin_audit_log']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admin_audit_log']['Row']>
      }

      admin_login_attempts: {
        Row: {
          id:           string
          email:        string
          ip_address:   string | null
          success:      boolean
          attempted_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_login_attempts']['Row'], 'id' | 'attempted_at'>
        Update: Partial<Database['public']['Tables']['admin_login_attempts']['Row']>
      }
    }

    Functions: {
      check_rate_limit: {
        Args: { p_user_id: string; p_action: string; p_limit: number }
        Returns: boolean
      }
      get_admin_stats: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
  }
}

// ── Convenience type aliases ──────────────────────────────────
export type Profile             = Database['public']['Tables']['profiles']['Row']
export type Scene               = Database['public']['Tables']['scenes']['Row']
export type SceneVersion        = Database['public']['Tables']['scene_versions']['Row']
export type Workspace           = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember     = Database['public']['Tables']['workspace_members']['Row']
export type SceneCollaborator   = Database['public']['Tables']['scene_collaborators']['Row']
export type Subscription        = Database['public']['Tables']['subscriptions']['Row']
export type Comment             = Database['public']['Tables']['comments']['Row']

export interface AdminStats {
  total_users:      number
  pro_users:        number
  free_users:       number
  total_scenes:     number
  public_scenes:    number
  new_users_7d:     number
  new_users_30d:    number
  active_subs:      number
  total_workspaces: number
}

export interface AuditLog {
  id:          string
  admin_id:    string
  action:      string
  target_id:   string | null
  target_type: string | null
  old_value:   Json | null
  new_value:   Json | null
  ip_address:  string | null
  created_at:  string
}

export interface AdminLoginAttempt {
  id:           string
  email:        string
  ip_address:   string | null
  success:      boolean
  attempted_at: string
}
