import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCanvas } from '@/hooks/useCanvas'
import { useCanvasStore } from '@/store/canvasStore'
import { ZoomControls } from '@/components/canvas/ZoomControls'
import { ElementInspector } from '@/components/canvas/ElementInspector'
import { TextEditor } from '@/components/canvas/TextEditor'
import { Sparkles, Eye, ShieldAlert } from 'lucide-react'
import type { Scene } from '@/types/database.types'

export default function SharedView() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const store = useCanvasStore()

  // Initialize canvas hook
  useCanvas(canvasRef)

  const [scene, setScene] = useState<Scene | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSharedScene() {
      if (!shareToken) return
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: dbError } = await (supabase
          .from('scenes')
          .select('*')
          .eq('share_token', shareToken)
          .single() as any)

        if (dbError || !data) {
          throw new Error('Scene tapılmadı və ya ictimai paylaşım dayandırılıb.')
        }

        if (!data.is_public) {
          throw new Error('Bu scene artıq ictimai deyil.')
        }

        setScene(data)
        store.setReadOnly(true)
        // Read-only modda default alət 'select' — element xüsusiyyətlərinə baxmaq üçün
        store.setTool('select')
        store.loadScene(
          (data.elements as any) ?? [],
          (data.app_state as any) ?? {
            zoom: 1, scrollX: 0, scrollY: 0,
            backgroundColor: '#ffffff',
            gridEnabled: false, gridSize: 20, theme: 'light',
          }
        )

      } catch (err: any) {
        console.error('[SharedView] Error:', err)
        setError(err.message || 'Scene yüklənərkən xəta baş verdi.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSharedScene()

    return () => {
      store.setReadOnly(false)
    }
  }, [shareToken]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Scene Yüklənir...</p>
        </div>
      </div>
    )
  }

  if (error || !scene) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <img
              src="/flaro-logo.png"
              alt="Flaro"
              className="h-[35px] md:h-[50px] w-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
            <span className="text-xs md:text-sm font-semibold text-slate-500">İctimai Baxış</span>
          </div>
        </header>
        <main className="flex-1 bg-slate-50 relative flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-2xl z-10 text-center max-w-md space-y-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto border border-red-100">
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-950 tracking-tight">
              Baxış Mümkün Deyil
            </h3>
            <p className="text-slate-600 font-sans leading-relaxed text-sm">
              {error || 'Axtardığınız scene mövcud deyil və ya paylaşım sahibi tərəfindən silinib.'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all"
            >
              Dashboard-a Qayıt
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-50 overflow-hidden flex flex-col font-sans text-slate-800">
      {/* Top Header — mobil responsive */}
      <header className="bg-white border-b border-slate-100 px-3 md:px-6 py-2 md:py-4 flex items-center justify-between shadow-sm z-10 gap-2">
        <div className="flex items-center gap-1.5 md:gap-3 min-w-0 flex-1">
          <img
            src="/flaro-logo.png"
            alt="Flaro"
            className="h-[32px] md:h-[50px] w-auto flex-shrink-0 cursor-pointer"
            onClick={() => navigate('/')}
          />
          <div className="min-w-0 flex-1">
            <span className="font-bold md:font-extrabold text-slate-900 text-sm md:text-base block truncate">
              {scene.title}
            </span>
            <span className="text-[9px] md:text-[10px] bg-slate-100 text-slate-400 px-1.5 md:px-2 py-0.5 rounded-md font-mono hidden sm:inline-block">
              {shareToken?.slice(0, 8)}...
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-bold text-slate-500 bg-slate-100 px-2 md:px-3 py-1 md:py-1.5 rounded-xl border border-slate-200/40">
            <Eye size={12} className="text-slate-400 flex-shrink-0" />
            <span className="hidden sm:inline">Oxuma Rejimi</span>
          </div>
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-4 py-1 md:py-1.5 bg-gradient-to-r from-orange-500 to-amber-500
                       text-white text-[10px] md:text-xs font-extrabold rounded-xl hover:shadow-lg transition-all shadow-md whitespace-nowrap"
          >
            <Sparkles size={11} className="fill-white flex-shrink-0" />
            <span className="hidden sm:inline">Özün Yarat</span>
            <span className="sm:hidden">Yarat</span>
          </button>
        </div>
      </header>

      {/* Əsas sahə: Canvas + Sağ Panel */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-white">
          <canvas
            id="main-canvas"
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            style={{ touchAction: 'none' }}
          />
          {/* TextEditor — shared view-də də text elementlərin mətnini göstərmək üçün */}
          <TextEditor />
        </div>

        {/* Element Xüsusiyyətləri Panel (read-only) */}
        <ElementInspector />
      </div>

      {/* Zoom Controls — mobil responsive */}
      <ZoomControls />
    </div>
  )
}
