import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate }   from 'react-router-dom'
import { supabase }          from '@/lib/supabase'
import { useCanvas }          from '@/hooks/useCanvas'
import { useCanvasStore }    from '@/store/canvasStore'
import { ZoomControls }       from '@/components/canvas/ZoomControls'
import { Sparkles, Eye, ShieldAlert } from 'lucide-react'
import type { Scene }        from '@/types/database.types'

export default function SharedView() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const navigate       = useNavigate()
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const store          = useCanvasStore()
  
  // Initialize read-only canvas hook
  useCanvas(canvasRef)

  const [scene, setScene]         = useState<Scene | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

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

    // Cleanup: read-only rejimi sıfırla
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
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div
              onClick={() => navigate('/')}
              className="bg-orange-500 text-white font-bold text-xl px-4 py-1.5 rounded-xl shadow-md rotate-1 cursor-pointer"
            >
              Flaro
            </div>
            <span className="font-semibold text-slate-900">İctimai Baxış</span>
          </div>
        </header>
        <main className="flex-1 bg-slate-50 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-2xl z-10 text-center max-w-md space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto border border-red-100">
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">
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
      {/* Top Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-white font-bold text-xl px-4 py-1.5 rounded-xl shadow-md rotate-1">
            Flaro
          </div>
          <span className="font-extrabold text-slate-900">{scene.title}</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">
            {shareToken?.slice(0, 8)}...
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/40">
            <Eye size={14} className="text-slate-400" /> Oxuma Rejimi
          </div>
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500
                       text-white text-xs font-extrabold rounded-xl hover:shadow-lg transition-all shadow-md"
          >
            <Sparkles size={12} className="fill-white" /> Özün Yarat
          </button>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <canvas
          id="main-canvas"
          ref={canvasRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Zoom Controls */}
      <ZoomControls />
    </div>
  )
}
