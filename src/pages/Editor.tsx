import { useParams } from 'react-router-dom'

export default function Editor() {
  const { sceneId } = useParams()

  return (
    <div className="flex flex-col h-screen bg-white text-slate-800 font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="bg-orange-500 text-white font-bold text-xl px-4 py-1.5 rounded-xl shadow-md rotate-1">
            Flaro
          </a>
          <span className="font-semibold text-slate-900">Canvas Editor</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono">
            {sceneId === 'new' ? 'Unsaved Scene' : sceneId}
          </span>
        </div>
      </header>
      <main className="flex-1 bg-slate-50 relative flex items-center justify-center">
        {/* Sketchboard grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-float z-10 text-center max-w-md space-y-4">
          <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto">
            ✎
          </div>
          <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Sketchboard Canvas
          </h3>
          <p className="text-slate-600 font-sans leading-relaxed">
            The hand-drawn Rough.js engine is fully prepared for integration in Phase 3. Realtime collaboration presence is ready in Phase 5.
          </p>
        </div>
      </main>
    </div>
  )
}
