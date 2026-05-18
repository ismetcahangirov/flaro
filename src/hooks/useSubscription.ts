import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface FeatureGateResult {
  allowed:  boolean
  reason?:  string
  upgrade?: () => void
}

// Pro plan tələb edən xüsusiyyətlər
const PRO_FEATURES = [
  'unlimited_scenes',
  'auto_sync',
  'dashboard_access',
  'presentations',
  'view_only_access',
  'voice_hangout',
  'comments',
  'live_presentations',
  'user_accounts',
  'cloud_save',
  'workspace_teams',
  'user_management',
  'collections',
  'embeddable_links',
  'presentations_as_slides',
  'pdf_pptx_export',
  'personal_library_server',
] as const

export type ProFeature = typeof PRO_FEATURES[number]

export function useSubscription() {
  const navigate = useNavigate()
  const { isPro, plan, profile } = useAuth()

  const upgradeToPro = useCallback(() => {
    navigate('/pricing')
  }, [navigate])

  // Xüsusiyyətin istifadəsinə icazə var mı?
  const canUse = useCallback((feature: ProFeature): FeatureGateResult => {
    if (isPro) return { allowed: true }

    const isProFeature = PRO_FEATURES.includes(feature)

    if (isProFeature) {
      return {
        allowed:  false,
        reason:   'Bu xüsusiyyət Pro plan tələb edir',
        upgrade:  upgradeToPro,
      }
    }

    return { allowed: true }
  }, [isPro, upgradeToPro])

  // Free plan: max 3 scene
  const canCreateScene = useCallback((): FeatureGateResult => {
    if (isPro) return { allowed: true }

    const count = profile?.scenes_count ?? 0
    if (count >= 3) {
      return {
        allowed:  false,
        reason:   `Free planda maksimum 3 scene yarada bilərsiniz (${count}/3)`,
        upgrade:  upgradeToPro,
      }
    }

    return { allowed: true }
  }, [isPro, profile?.scenes_count, upgradeToPro])

  // AI xüsusiyyətləri
  const aiUsageLimit = isPro ? Infinity : 10  // Free: gündə 10 sorğu

  return {
    isPro,
    plan,
    canUse,
    canCreateScene,
    upgradeToPro,
    aiUsageLimit,
    scenesUsed:  profile?.scenes_count ?? 0,
    scenesLimit: isPro ? Infinity : 3,
  }
}
