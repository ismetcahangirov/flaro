import { useState } from 'react'
import { Sparkles, AlertCircle, Zap, ShieldCheck } from 'lucide-react'
import { useAI } from '@/hooks/useAI'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/i18n/I18nContext'

const dict: Record<'az' | 'tr' | 'ru' | 'en', {
  aiDrawer: string
  smartDiagramsSub: string
  diagramType: string
  generalDiagram: string
  flowchart: string
  mindmap: string
  wireframe: string
  describePrompt: string
  placeholder: string
  limitPerDay: string
  upgradeProLimit: string
  drawDiagram: string
}> = {
  az: {
    aiDrawer: 'Flaro AI Çəkici',
    smartDiagramsSub: 'Saniyələr içində ağıllı diaqramlar',
    diagramType: 'Diaqram Növü',
    generalDiagram: 'Ümumi Diaqram',
    flowchart: 'Flowchart (Blok-Sxem)',
    mindmap: 'Ağıl Xəritəsi (Mindmap)',
    wireframe: 'Wireframe (Veb/Mobil)',
    describePrompt: 'Təsvir edin',
    placeholder: 'Məs. İstifadəçi qeydiyyat addımları, 3 mərhələli biznes planı...',
    limitPerDay: 'gün',
    upgradeProLimit: 'Pro-ya keç (100 limit)',
    drawDiagram: 'Diaqram Çək'
  },
  tr: {
    aiDrawer: 'Flaro Yapay Zeka Çizeri',
    smartDiagramsSub: 'Saniyeler içinde akıllı diyagramlar',
    diagramType: 'Diyagram Türü',
    generalDiagram: 'Genel Diyagram',
    flowchart: 'Akış Şeması (Flowchart)',
    mindmap: 'Zihin Haritası (Mindmap)',
    wireframe: 'Tel Kafes (Wireframe - Web/Mobil)',
    describePrompt: 'Tarif edin',
    placeholder: 'Örn. Kullanıcı kayıt adımları, 3 aşamalı iş planı...',
    limitPerDay: 'gün',
    upgradeProLimit: "Pro'ya geç (100 limit)",
    drawDiagram: 'Diyagram Çiz'
  },
  ru: {
    aiDrawer: 'Flaro AI Рисовальщик',
    smartDiagramsSub: 'Умные диаграммы за секунды',
    diagramType: 'Тип диаграммы',
    generalDiagram: 'Общая диаграмма',
    flowchart: 'Блок-схема (Flowchart)',
    mindmap: 'Карта мыслей (Mindmap)',
    wireframe: 'Вайрфрейм (Веб/Мобильный)',
    describePrompt: 'Опишите',
    placeholder: 'Например: шаги регистрации пользователя, 3-этапный бизнес-план...',
    limitPerDay: 'день',
    upgradeProLimit: 'Перейти на Pro (лимит 100)',
    drawDiagram: 'Нарисовать диаграмму'
  },
  en: {
    aiDrawer: 'Flaro AI Drawer',
    smartDiagramsSub: 'Smart diagrams in seconds',
    diagramType: 'Diagram Type',
    generalDiagram: 'General Diagram',
    flowchart: 'Flowchart',
    mindmap: 'Mindmap',
    wireframe: 'Wireframe (Web/Mobile)',
    describePrompt: 'Describe it',
    placeholder: 'e.g. User registration steps, 3-stage business plan...',
    limitPerDay: 'day',
    upgradeProLimit: 'Upgrade to Pro (100 limit)',
    drawDiagram: 'Draw Diagram'
  }
}

export function AIPanel() {
  const navigate = useNavigate()
  const { isPro } = useAuth()
  const { generate, isGenerating, error, remaining, limit } = useAI()
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState<'diagram' | 'flowchart' | 'mindmap' | 'wireframe'>('diagram')
  const [isOpen, setIsOpen] = useState(false)
  const { locale } = useI18n()

  const currentDict = dict[locale as 'az' | 'tr' | 'ru' | 'en'] || dict['en']

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    await generate(prompt.trim(), type)
    if (!error) {
      setPrompt('')
      setIsOpen(false)
    }
  }

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3 font-sans">
      {isOpen && (
        <div className="backdrop-blur-md bg-white/95 border border-slate-100/80 rounded-3xl p-5
                        shadow-2xl shadow-slate-200/80 w-85 animate-slide-up flex flex-col gap-4">
          
          {/* Header */}
          <div className="flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                <Sparkles size={16} className="text-orange-500 fill-orange-500 animate-pulse-soft" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{currentDict.aiDrawer}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{currentDict.smartDiagramsSub}</p>
              </div>
            </div>
            
            {/* Plan Badge */}
            {isPro ? (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500
                               to-amber-500 text-white rounded-full text-[9px] font-extrabold shadow-sm">
                <ShieldCheck size={10} /> PRO
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500
                               rounded-full text-[9px] font-bold">
                FREE
              </span>
            )}
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                {currentDict.diagramType}
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl
                           text-xs font-semibold outline-none focus:bg-white focus:border-orange-500
                           transition-all text-slate-700 cursor-pointer"
              >
                <option value="diagram">{currentDict.generalDiagram}</option>
                <option value="flowchart">{currentDict.flowchart}</option>
                <option value="mindmap">{currentDict.mindmap}</option>
                <option value="wireframe">{currentDict.wireframe}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                {currentDict.describePrompt}
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={currentDict.placeholder}
                rows={3}
                required
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl
                           text-xs outline-none focus:bg-white focus:border-orange-500 transition-all
                           placeholder:text-slate-400 text-slate-800 resize-none leading-relaxed"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-2xl border
                              border-red-100 text-[10px] font-semibold leading-relaxed">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Limit Göstərici & Pro Keçid Bəyannaməsi */}
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span>Limit: {remaining !== null ? `${remaining} / ${limit}` : `${isPro ? 100 : 10} / ${currentDict.limitPerDay}`}</span>
              {!isPro && (
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-extrabold"
                >
                  <Zap size={10} className="fill-orange-500" /> {currentDict.upgradeProLimit}
                </button>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isGenerating}
              disabled={!prompt.trim()}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-1.5 font-bold text-sm
                         bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-100
                         hover:shadow-xl hover:shadow-orange-200 border-none transition-all duration-300"
            >
              <Sparkles size={14} className="fill-white" />
              {currentDict.drawDiagram}
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl
                    hover:shadow-2xl active:scale-95 border duration-300 ${
          isOpen
            ? 'bg-slate-900 border-slate-900 text-white'
            : 'bg-white border-slate-100 text-orange-500 hover:text-orange-600 hover:scale-105'
        }`}
      >
        <Sparkles size={22} className={isOpen ? '' : 'fill-orange-100 animate-pulse-soft'} />
      </button>
    </div>
  )
}
