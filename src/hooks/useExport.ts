import { useCallback, useState } from 'react'
import { supabase }      from '@/lib/supabase'
import { useCanvasStore } from '@/store/canvasStore'
import { useAuth }       from '@/hooks/useAuth'

type ExportFormat = 'png' | 'svg' | 'json' | 'pdf' | 'pptx'

export function useExport(sceneId: string) {
  const canvas           = useCanvasStore()
  const { isPro, user }  = useAuth()
  const [isExporting, setIsExporting] = useState(false)

  const exportAsPNG = useCallback(async () => {
    const mainCanvas = document.querySelector<HTMLCanvasElement>('#main-canvas')
    if (!mainCanvas) return

    const scale   = 2  // 2x resolution
    const offscreen = document.createElement('canvas')
    offscreen.width  = mainCanvas.width  * scale
    offscreen.height = mainCanvas.height * scale
    const ctx     = offscreen.getContext('2d')!
    ctx.scale(scale, scale)
    ctx.drawImage(mainCanvas, 0, 0)

    const url = offscreen.toDataURL('image/png', 1.0)
    const a   = document.createElement('a')
    a.href    = url
    a.download = 'scene.png'
    a.click()
  }, [])

  const exportAsSVG = useCallback(() => {
    // Canvas elementlərini SVG-ə çevir
    const elements = canvas.elements.filter(e => !e.isDeleted)
    const minX = Math.min(...elements.map(e => e.x), 0)
    const minY = Math.min(...elements.map(e => e.y), 0)
    const maxX = Math.max(...elements.map(e => e.x + e.width), 800)
    const maxY = Math.max(...elements.map(e => e.y + e.height), 600)

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="${minX - 20} ${minY - 20} ${maxX - minX + 40} ${maxY - minY + 40}"
     width="${maxX - minX + 40}"
     height="${maxY - minY + 40}">
  <rect fill="${canvas.appState.backgroundColor}"
        x="${minX - 20}" y="${minY - 20}"
        width="${maxX - minX + 40}" height="${maxY - minY + 40}"/>
  ${elements.map(el => elementToSVG(el)).join('\n  ')}
</svg>`

    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'scene.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [canvas])

  const exportAsJSON = useCallback(() => {
    const data = JSON.stringify({
      type:     'flaro',
      version:  2,
      elements: canvas.elements,
      appState: canvas.appState,
    }, null, 2)

    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'scene.flaro.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [canvas])

  const exportScene = useCallback(async (format: ExportFormat) => {
    if (!user) return

    // Client-side formatlar
    if (format === 'png') {
      return exportAsPNG()
    }
    if (format === 'svg') {
      return exportAsSVG()
    }
    if (format === 'json') {
      return exportAsJSON()
    }

    // Server-side Pro formatlar
    if (!isPro && (format === 'pdf' || format === 'pptx')) {
      throw new Error('PRO_REQUIRED')
    }

    setIsExporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scene-export`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sceneId, format }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message ?? 'Export failed')
      }

      // 202 — async processing
      if (response.status === 202) {
        const data = await response.json()
        alert(data.message)  // Əsl app-da toast notification
        return
      }

      // Faylı endir
      const blob     = await response.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = `scene.${format}`
      a.click()
      URL.revokeObjectURL(url)

    } finally {
      setIsExporting(false)
    }
  }, [sceneId, isPro, user, canvas, exportAsPNG, exportAsSVG, exportAsJSON])

  return { exportScene, isExporting }
}

// Sadə SVG element çevirmə
function elementToSVG(el: any): string {
  switch (el.type) {
    case 'rectangle':
      return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"
                    stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}"
                    fill="${el.fillColor === 'transparent' ? 'none' : el.fillColor}"
                    opacity="${el.opacity / 100}"/>`
    case 'text':
      return `<text x="${el.x}" y="${el.y + (el.fontSize ?? 20)}"
                    font-size="${el.fontSize ?? 20}"
                    fill="${el.strokeColor}" opacity="${el.opacity / 100}">${el.text ?? ''}</text>`
    default:
      return ''
  }
}
