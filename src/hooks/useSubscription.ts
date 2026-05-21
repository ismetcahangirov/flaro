import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'

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

const dict: Record<'az' | 'tr' | 'ru' | 'en', {
  proRequired: string
  freeLimitReached: string
}> = {
  az: {
    proRequired: 'Bu xüsusiyyət Pro plan tələb edir',
    freeLimitReached: 'Free planda maksimum 3 scene yarada bilərsiniz ({count}/3)'
  },
  tr: {
    proRequired: 'Bu özellik Pro plan gerektirir',
    freeLimitReached: 'Ücretsiz planda en fazla 3 sahne oluşturabilirsiniz ({count}/3)'
  },
  ru: {
    proRequired: 'Эта функция требует тарифа Pro',
    freeLimitReached: 'На бесплатном тарифе можно создать не более 3 сцен ({count}/3)'
  },
  en: {
    proRequired: 'This feature requires the Pro plan',
    freeLimitReached: 'You can create a maximum of 3 scenes on the Free plan ({count}/3)'
  }
}

export function useSubscription() {
  const navigate = useNavigate()
  const { isPro, plan, profile } = useAuth()
  const { locale } = useI18n()

  const currentDict = dict[locale as 'az' | 'tr' | 'ru' | 'en'] || dict['en']

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
        reason:   currentDict.proRequired,
        upgrade:  upgradeToPro,
      }
    }

    return { allowed: true }
  }, [isPro, upgradeToPro, currentDict])

  // Free plan: max 3 scene
  const canCreateScene = useCallback((): FeatureGateResult => {
    if (isPro) return { allowed: true }

    const count = profile?.scenes_count ?? 0
    if (count >= 3) {
      return {
        allowed:  false,
        reason:   currentDict.freeLimitReached.replace('{count}', count.toString()),
        upgrade:  upgradeToPro,
      }
    }

    return { allowed: true }
  }, [isPro, profile?.scenes_count, upgradeToPro, currentDict])

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
