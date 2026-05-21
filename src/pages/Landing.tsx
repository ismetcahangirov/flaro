import { useNavigate } from 'react-router-dom'
import {
  Pencil, Zap, Users, Cloud,
  ArrowRight, Star,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { Navbar } from '@/components/ui/Navbar'

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { t, locale } = useI18n()

  const features = [
    {
      icon: <Pencil className="text-orange-500" size={24} />,
      title: t.landing.feat1Title,
      desc: t.landing.feat1Desc,
      color: 'bg-orange-50',
    },
    {
      icon: <Users className="text-blue-500" size={24} />,
      title: t.landing.feat2Title,
      desc: t.landing.feat2Desc,
      color: 'bg-blue-50',
    },
    {
      icon: <Zap className="text-purple-500" size={24} />,
      title: t.landing.feat3Title,
      desc: t.landing.feat3Desc,
      color: 'bg-purple-50',
    },
    {
      icon: <Cloud className="text-emerald-500" size={24} />,
      title: t.landing.feat4Title,
      desc: t.landing.feat4Desc,
      color: 'bg-emerald-50',
    },
  ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden text-slate-800 font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Arxa fon dekorasiya */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]
                          bg-[radial-gradient(circle_at_center,#ffedd5_0%,transparent_70%)] opacity-60 rounded-full blur-3xl" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50
                        border border-orange-200 rounded-full text-orange-700
                        text-sm font-semibold mb-8 animate-fade-in">
          <Zap size={14} className="fill-orange-500 text-orange-500" />
          {t.landing.badge}
        </div>

        {/* Başlıq */}
        <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900
                       tracking-tight mb-6 leading-[1.05] animate-slide-up">
          {t.landing.heroTitle1}{' '}
          <span className="relative inline-block">
            <span className="text-orange-500">{t.landing.heroHighlight}</span>
            {/* El çizimi alt xətt */}
            <svg
              className="absolute -bottom-2 left-0 w-full"
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8 Q50 2 100 7 Q150 12 198 6"
                stroke="#F97316"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
          {t.landing.heroTitle2}
        </h1>

        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.landing.heroSubtitle}
        </p>

        {/* CTA düymələri */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="flex items-center gap-2.5 px-8 py-4 bg-orange-500 text-white
                       font-bold text-lg rounded-2xl hover:bg-orange-600 transition-all
                       shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-200
                       hover:-translate-y-0.5 active:translate-y-0"
          >
            {t.landing.ctaStart}
            <ArrowRight size={20} />
          </button>

          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700
                       font-semibold text-lg rounded-2xl border border-slate-200
                       hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            {t.landing.ctaPricing}
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mt-12 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {['#F97316', '#3B82F6', '#10B981', '#8B5CF6'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white"
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>
              {locale === 'az' ? '10,000+ istifadəçi' : locale === 'tr' ? '10.000+ kullanıcı' : locale === 'ru' ? '10,000+ пользователей' : '10,000+ users'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-1">4.9/5</span>
          </div>
        </div>
      </section>

      {/* Feature bölməsi */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4 tracking-tight">
            {t.landing.featuresTitle}
          </h2>
          <p className="text-center text-slate-500 mb-16 max-w-xl mx-auto">
            {t.landing.featuresSubtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100 text-center text-sm text-slate-400">
        {t.landing.footerRights}
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm
                    hover:shadow-md transition-shadow group">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-5`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </div>
  )
}

