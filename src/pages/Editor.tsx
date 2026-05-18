import { useEffect, useRef } from 'react'
import { useParams }         from 'react-router-dom'
import { useCanvas }         from '@/hooks/useCanvas'
import { useScene }          from '@/hooks/useScene'
import { useCollaboration }  from '@/hooks/useCollaboration'
import { useAuth }           from '@/hooks/useAuth'
import { Toolbar }           from '@/components/canvas/Toolbar'
import { TopBar }            from '@/components/canvas/TopBar'
import { PropsPanel }        from '@/components/canvas/PropsPanel'
import { ZoomControls }      from '@/components/canvas/ZoomControls'
import { CursorOverlay }     from '@/components/collaboration/CursorOverlay'
import { CommentsLayer }     from '@/components/collaboration/Comments'
import { AIPanel }           from '@/components/canvas/AIPanel'

export default function Editor() {
  const { sceneId }  = useParams<{ sceneId: string }>()
  const canvasRef    = useRef<HTMLCanvasElement>(null)

  const { loadScene, saveScene, isSaving, lastSaved } = useScene(sceneId)
  const { isPro }              = useAuth()
  const { toCanvas }           = useCanvas(canvasRef)
  const collab                 = useCollaboration(sceneId ?? '')

  // Scene-i yüklə
  useEffect(() => {
    if (sceneId) loadScene(sceneId)
  }, [sceneId])

  // Cursor hərəkətini broadcast et
  useEffect(() => {
    if (!canvasRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const pt = toCanvas(e.clientX, e.clientY)
      collab.broadcastCursor(pt)
    }

    const handleMouseLeave = () => collab.broadcastCursor(null)

    canvasRef.current.addEventListener('mousemove',  handleMouseMove)
    canvasRef.current.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvasRef.current?.removeEventListener('mousemove',  handleMouseMove)
      canvasRef.current?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [toCanvas, collab.broadcastCursor])

  return (
    <div className="fixed inset-0 bg-slate-50 overflow-hidden flex flex-col font-sans text-slate-800">
      {/* Yuxarı panel */}
      <TopBar
        sceneId={sceneId ?? ''}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={() => saveScene(true)}
        activeUsers={collab.activeUsers}
      />

      {/* Əsas sahə */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Sol toolbar */}
        <Toolbar />

        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            id="main-canvas"
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            style={{ touchAction: 'none' }}
          />

          {/* Əməkdaşlıq layerləri */}
          <CursorOverlay />
          {isPro && sceneId && <CommentsLayer sceneId={sceneId} />}
        </div>

        {/* Sağ panel */}
        <PropsPanel />
      </div>

      {/* Zoom idarəetməsi */}
      <ZoomControls />

      {/* AI panel (floating) */}
      {isPro && <AIPanel />}
    </div>
  )
}
