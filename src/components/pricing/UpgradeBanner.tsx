import { useNavigate } from 'react-router-dom'
import { Crown, Sparkles } from 'lucide-react'

interface UpgradeBannerProps {
  feature?: string
  message?: string
}

export function UpgradeBanner({ feature = 'unlimited_scenes', message }: UpgradeBannerProps) {
  const navigate = useNavigate()
  console.log('Nudging upgrade for feature:', feature)

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Decorative stars */}
      <div className="absolute top-0 right-0 p-3 opacity-20">
        <Sparkles size={120} />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Crown size={24} className="fill-white" />
        </div>
        <div>
          <h4 className="font-bold text-lg">Pro-ya Keçin!</h4>
          <p className="text-sm opacity-90">
            {message || 'Bütün premium funksiyaları, limitsiz səhnələri və AI çizim gücünü əldə edin.'}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/pricing')}
        className="px-6 py-3 bg-white text-orange-600 font-bold text-sm rounded-2xl hover:bg-orange-50 active:scale-98 transition-all relative z-10 flex-shrink-0"
      >
        Planları İncele →
      </button>
    </div>
  )
}
