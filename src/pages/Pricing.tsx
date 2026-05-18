import React, { useState } from 'react'
import { useNavigate }   from 'react-router-dom'
import {
  Check, X, Zap, Sparkles,
  Infinity, Users, Cloud,
  Presentation, MessageSquare,
  FileDown, Brain,
} from 'lucide-react'
import { useBilling }   from '@/hooks/useBilling'
import { useAuth }      from '@/hooks/useAuth'

// ── Plan məlumatları ─────────────────────────────────────────────────────────

interface PlanFeature {
  label:    string
  free:     boolean | string
  pro:      boolean | string
  icon:     React.ReactNode
  isNew?:   boolean
}

const FEATURES: { section: string; items: PlanFeature[] }[] = [
  {
    section: 'Yarat',
    items: [
      { label: 'Sonsuz canvas',          free: true,         pro: true,       icon: <Infinity  size={15}/> },
      { label: 'Tam redaktə alətləri',   free: true,         pro: true,       icon: <Sparkles  size={15}/> },
      { label: 'Limitsiz səhnələr',       free: false,        pro: true,       icon: <Cloud     size={15}/> },
      { label: 'Avtomatik sinxronizasiya',free: false,        pro: true,       icon: <Cloud     size={15}/> },
      { label: 'Sürətli dashboard',       free: false,        pro: true,       icon: <Zap       size={15}/> },
      { label: 'Generativ AI',            free: 'Məhdud',     pro: 'Genişləndirilmiş', icon: <Brain size={15}/> },
      { label: 'Təqdimatlar',             free: false,        pro: true,       icon: <Presentation size={15}/> },
    ],
  },
  {
    section: 'Əməkdaşlıq',
    items: [
      { label: 'Linkə dəvət',            free: true,         pro: true,       icon: <Users     size={15}/> },
      { label: 'Yalnız görüntü rejimi',  free: false,        pro: true,       icon: <Users     size={15}/> },
      { label: 'Səs & ekran paylaşımı',  free: false,        pro: true,       icon: <Users     size={15}/>, isNew: true },
      { label: 'Şərhlər',                free: false,        pro: true,       icon: <MessageSquare size={15}/> },
      { label: 'Canlı təqdimatlar',      free: false,        pro: true,       icon: <Presentation size={15}/> },
    ],
  },
  {
    section: 'Paylaş',
    items: [
      { label: 'PNG/SVG/JSON ixrac',     free: true,         pro: true,       icon: <FileDown  size={15}/> },
      { label: 'Embed/Readonly linklər', free: false,        pro: true,       icon: <FileDown  size={15}/> },
      { label: 'Slayd kimi təqdim',      free: false,        pro: true,       icon: <Presentation size={15}/> },
      { label: 'PDF & PPTX ixrac',       free: false,        pro: true,       icon: <FileDown  size={15}/>, isNew: true },
    ],
  },
  {
    section: 'Komanda',
    items: [
      { label: 'İstifadəçi hesabları',   free: false,        pro: true,       icon: <Users     size={15}/> },
      { label: 'Buludda saxla',          free: false,        pro: true,       icon: <Cloud     size={15}/> },
      { label: 'Workspace Komandaları',  free: false,        pro: true,       icon: <Users     size={15}/> },
      { label: 'İstifadəçi idarəetməsi', free: false,        pro: true,       icon: <Users     size={15}/> },
      { label: 'Kolleksiyalara sırala',  free: false,        pro: true,       icon: <Sparkles  size={15}/> },
    ],
  },
]

// ── Pricing Komponenti ───────────────────────────────────────────────────────

export default function Pricing() {
  const navigate           = useNavigate()
  const { isAuthenticated, isPro } = useAuth()
  const { upgradeToPro, isRedirecting } = useBilling()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const monthlyPrice = 6
  const yearlyPrice  = Math.floor(monthlyPrice * 12 * 0.8)  // %20 endirim

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/pricing')
      return
    }
    await upgradeToPro()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white font-sans text-slate-800">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100
                        text-orange-700 rounded-full text-sm font-semibold mb-6 shadow-sm">
          <Zap size={14} className="fill-orange-500" />
          7 günlük pulsuz sınaq
        </div>

        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight md:text-6xl">
          Sadə və şəffaf qiymət
        </h1>
        <p className="text-xl text-slate-500 max-w-xl mx-auto">
          Həmişəlik pulsuz başlayın. Böyüdükdə yüksəlin.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-medium transition-colors ${
            billing === 'monthly' ? 'text-slate-900 font-bold' : 'text-slate-400'
          }`}>
            Aylıq
          </span>
          <button
            onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billing === 'yearly' ? 'bg-orange-500' : 'bg-slate-200'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full
                              shadow-sm transition-transform duration-300 ${
              billing === 'yearly' ? 'translate-x-7' : ''
            }`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${
            billing === 'yearly' ? 'text-slate-900 font-bold' : 'text-slate-400'
          }`}>
            İllik
          </span>
          {billing === 'yearly' && (
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs
                             font-bold rounded-full animate-pulse-soft">
              20% endirim
            </span>
          )}
        </div>
      </div>

      {/* Plan kartları */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">

          {/* Free plan */}
          <PlanCard
            name="Free"
            price={0}
            period=""
            description="Həmişəlik pulsuz"
            features={[
              'Sonsuz canvas',
              'Tam redaktə alətləri',
              '3 aktiv səhnə',
              'PNG/SVG/JSON ixrac',
              'Ictimai kitabxanalar',
              'Linki paylaş (qonaqlar üçün)',
            ]}
            cta={isPro ? 'Cari plan' : (isAuthenticated ? 'Mövcud plan' : 'Başla')}
            ctaVariant="secondary"
            onCta={() => !isAuthenticated && navigate('/signup')}
            disabled={isAuthenticated && !isPro ? true : false}
          />

          {/* Pro plan */}
          <PlanCard
            name="Pro"
            price={billing === 'monthly' ? monthlyPrice : Math.round(yearlyPrice / 12)}
            period={billing === 'monthly' ? '/ay' : '/ay (illik ödənilir)'}
            description="Hər şeyin limitsizi"
            badge="Ən populyar"
            features={[
              'Hər şey Free-dən',
              'Limitsiz səhnələr',
              'Avtomatik bulud sinxronu',
              'Şərhlər & əməkdaşlıq',
              'Workspace komandaları',
              'PDF & PPTX ixrac',
              'Genişləndirilmiş AI',
              '7 günlük pulsuz sınaq',
            ]}
            cta={
              isPro          ? '✓ Aktiv plan' :
              isRedirecting  ? 'Yönləndirilir...' :
                               'Pro-ya keç'
            }
            ctaVariant="primary"
            onCta={handleUpgrade}
            disabled={isPro || isRedirecting}
            highlighted
          />
        </div>

        {/* Müqayisə cədvəli */}
        <ComparisonTable />
      </div>

      {/* FAQ */}
      <PricingFAQ />
    </div>
  )
}

// ── Plan Kartı ───────────────────────────────────────────────────────────────

interface PlanCardProps {
  name:        string
  price:       number
  period:      string
  description: string
  features:    string[]
  cta:         string
  ctaVariant:  'primary' | 'secondary'
  onCta:       () => void
  disabled?:   boolean
  badge?:      string
  highlighted?: boolean
}

function PlanCard({
  name, price, period, description, features,
  cta, ctaVariant, onCta, disabled, badge, highlighted,
}: PlanCardProps) {
  return (
    <div className={`relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
      highlighted
        ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-2xl shadow-orange-200 md:scale-105 border-2 border-orange-400'
        : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
    }`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1
                        bg-white text-orange-600 text-xs font-bold rounded-full
                        shadow-md border border-orange-100 uppercase tracking-wider">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-2xl font-bold mb-1 ${highlighted ? 'text-white' : 'text-slate-900'}`}>
          {name}
        </h3>
        <p className={`text-sm ${highlighted ? 'text-orange-100' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-end gap-1">
          <span className={`text-5xl font-extrabold ${highlighted ? 'text-white' : 'text-slate-900'}`}>
            ${price}
          </span>
          {period && (
            <span className={`text-sm mb-2 ${highlighted ? 'text-orange-200' : 'text-slate-400'}`}>
              {period}
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-3.5 flex-1 mb-8 pt-6 border-t border-slate-100/20">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm font-medium">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              highlighted ? 'bg-white/20' : 'bg-orange-50'
            }`}>
              <Check size={12} className={highlighted ? 'text-white' : 'text-orange-500'} />
            </div>
            <span className={highlighted ? 'text-white' : 'text-slate-700'}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        disabled={disabled}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-sm
                    transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${
          ctaVariant === 'primary'
            ? highlighted
              ? 'bg-white text-orange-600 hover:bg-orange-50 shadow-lg'
              : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-200'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {cta}
      </button>
    </div>
  )
}

// ── Müqayisə Cədvəli ─────────────────────────────────────────────────────────

function ComparisonTable() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-100/50 mt-12">
      {/* Başlıq */}
      <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/50 p-6">
        <div className="font-bold text-lg text-slate-900">Xüsusiyyətlərin müqayisəsi</div>
        <div className="text-center">
          <span className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">Free</span>
        </div>
        <div className="text-center">
          <span className="text-sm font-extrabold text-orange-600 uppercase tracking-wider">Pro</span>
        </div>
      </div>

      {/* Xüsusiyyətlər */}
      {FEATURES.map((section) => (
        <React.Fragment key={section.section}>
          {/* Bölmə başlığı */}
          <div className="grid grid-cols-3 bg-slate-100/60 border-y border-slate-200/60">
            <div className="p-4 col-span-3">
              <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider pl-2">
                {section.section}
              </span>
            </div>
          </div>

          {section.items.map((feature, idx) => (
            <div
              key={idx}
              className="grid grid-cols-3 border-b border-slate-100 hover:bg-slate-50/80
                         transition-colors items-center"
            >
              {/* Xüsusiyyət adı */}
              <div className="p-5 flex items-center gap-3 pl-6">
                <span className="text-slate-400">{feature.icon}</span>
                <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                {feature.isNew && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700
                                   text-[10px] font-bold rounded-full">
                    YENİ
                  </span>
                )}
              </div>

              {/* Free */}
              <div className="p-5 flex items-center justify-center border-l border-slate-100">
                <FeatureValue value={feature.free} />
              </div>

              {/* Pro */}
              <div className="p-5 flex items-center justify-center border-l border-slate-100 bg-orange-50/20">
                <FeatureValue value={feature.pro} isPro />
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  )
}

function FeatureValue({ value, isPro }: { value: boolean | string; isPro?: boolean }) {
  if (value === true) {
    return (
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
        isPro ? 'bg-orange-100' : 'bg-slate-100'
      }`}>
        <Check size={13} className={isPro ? 'text-orange-500 font-bold' : 'text-slate-500'} />
      </div>
    )
  }

  if (value === false) {
    return <X size={16} className="text-slate-300" />
  }

  // String dəyər (məs: "Məhdud", "Genişləndirilmiş")
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
      isPro ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-100 text-slate-600'
    }`}>
      {value}
    </span>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Kredit kartı olmadan sınaya bilərəm?',
    a: 'Bəli! Pro planı 7 günlük pulsuz sınaqla başlayır. Sınaq müddətindən əvvəl ləğv edə bilərsiniz.',
  },
  {
    q: 'İstənilən vaxt ləğv edə bilərəm?',
    a: 'Əlbəttə. Billing portalından istənilən vaxt ləğv edə bilərsiniz. Cari dövrün sonuna kimi Pro plan aktiv qalır.',
  },
  {
    q: 'Free planda yaratdığım fayllara nə olur?',
    a: 'Heç nə olmur. Məlumatlarınız həmişə sizindir. Pro-dan Free-ə keçsəniz fayllarınıza brauzer vasitəsilə daxil ola bilərsiniz.',
  },
  {
    q: 'Komanda üçün qiymət necədir?',
    a: 'Hər üzv üçün $6/ay. Workspace funksiyası Pro planın bir hissəsidir.',
  },
] as const

function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24 pt-16 w-full">
      <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-12 tracking-tight">
        Tez-tez verilən suallar
      </h2>
      <div className="space-y-4">
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden
                       shadow-md shadow-slate-100 hover:shadow-lg transition-all duration-300"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <span className="font-bold text-slate-800 text-base">{item.q}</span>
              <span className={`text-orange-500 text-2xl font-light transition-transform duration-300 ${
                open === i ? 'rotate-45' : ''
              }`}>
                +
              </span>
            </button>
            {open === i && (
              <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-50 animate-slide-down">
                <p className="pt-4">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
