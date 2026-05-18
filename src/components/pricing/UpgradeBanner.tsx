import { Zap, X } from 'lucide-react'
import { useBilling }       from '@/hooks/useBilling'
import { useSubscription }  from '@/hooks/useSubscription'
import type { ProFeature }  from '@/hooks/useSubscription'

interface UpgradeBannerProps {
  feature?:   ProFeature
  message?:   string
  onDismiss?: () => void
  compact?:   boolean
}

export function UpgradeBanner({
  feature = 'unlimited_scenes',
  message,
  onDismiss,
  compact = false,
}: UpgradeBannerProps) {
  const { upgradeToPro, isRedirecting } = useBilling()
  const { canUse }                       = useSubscription()

  const gate = canUse(feature)
  if (gate.allowed) return null

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-orange-50
                      border border-orange-200 rounded-xl">
        <Zap size={14} className="text-orange-500 flex-shrink-0 fill-orange-500" />
        <span className="text-xs text-orange-700 font-medium flex-1">
          {message ?? gate.reason}
        </span>
        <button
          onClick={upgradeToPro}
          disabled={isRedirecting}
          className="text-xs font-bold text-orange-600 hover:text-orange-700
                     whitespace-nowrap disabled:opacity-60"
        >
          Pro-ya keç →
        </button>
      </div>
    )
  }

  return (
    <div className="relative p-6 bg-gradient-to-r from-orange-500 to-amber-500
                    rounded-3xl text-white shadow-xl shadow-orange-100 overflow-hidden">
      {/* Dekorativ qırılmaz çevrə */}
      <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
        <Zap size={120} />
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      )}

      <div className="flex items-start gap-4 relative z-10">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center
                        justify-center flex-shrink-0">
          <Zap size={22} className="fill-white text-white" />
        </div>
        <div className="flex-1">
          <p className="font-extrabold text-lg mb-1">Pro plan tələb olunur</p>
          <p className="text-sm text-orange-100 mb-5 leading-relaxed">
            {message ?? gate.reason}
          </p>
          <button
            onClick={upgradeToPro}
            disabled={isRedirecting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white
                       text-orange-600 font-bold text-sm rounded-2xl
                       hover:bg-orange-50 transition-colors shadow-md
                       disabled:opacity-70"
          >
            {isRedirecting ? 'Yönləndirilir...' : '7 gün pulsuz sına →'}
          </button>
        </div>
      </div>
    </div>
  )
}
