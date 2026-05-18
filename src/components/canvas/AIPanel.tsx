import { useState } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { useAI } from '@/hooks/useAI'
import { Button } from '@/components/ui/Button'

export function AIPanel() {
  const { generate, isGenerating, error, remaining, limit } = useAI()
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState<'diagram' | 'flowchart' | 'mindmap' | 'wireframe'>('diagram')
  const [isOpen, setIsOpen] = useState(false)

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
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xl w-80 animate-slide-up flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Sparkles size={18} className="text-orange-500 fill-orange-500 animate-pulse-soft" />
            <h4 className="font-bold text-sm">AI Fiqurlar Yarat</h4>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Diaqram Növü
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-orange-500 transition-all text-slate-700"
              >
                <option value="diagram">Ümumi Diaqram</option>
                <option value="flowchart">Flowchart (Blok-Sxem)</option>
                <option value="mindmap">Ağıl Xəritəsi (Mindmap)</option>
                <option value="wireframe">Wireframe (Veb/Mobil)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Təsvir edin
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Məs. İstirahət planı blok-sxemi, istifadəçi qeydiyyat addımları..."
                rows={3}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-slate-400 text-slate-800 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-600 p-2.5 rounded-xl border border-red-100 text-[10px] font-semibold leading-relaxed">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {remaining !== null && (
              <p className="text-[10px] font-bold text-slate-400 text-right">
                Qalan limit: {remaining} / {limit}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isGenerating}
              disabled={!prompt.trim()}
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} className="fill-white" />
              Diaqram Çək
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 border ${
          isOpen
            ? 'bg-slate-900 border-slate-900 text-white'
            : 'bg-white border-slate-100 text-orange-500 hover:text-orange-600 hover:shadow-xl'
        }`}
      >
        <Sparkles size={20} className={isOpen ? '' : 'fill-orange-100'} />
      </button>
    </div>
  )
}
